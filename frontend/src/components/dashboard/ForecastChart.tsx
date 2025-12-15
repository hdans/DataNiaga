import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useForecast } from '@/hooks/useApi';
import { toTitleCase } from '@/lib/utils';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

// Local props type for the forecast chart component
type ForecastChartProps = {
  island?: string;
  category: string;
  showLast?: number;
};
export function ForecastChart({ island, category, showLast = 8 }: ForecastChartProps) {
  // useForecast may now return an object { forecast_data, model_metrics }
  const { data, isLoading, isError } = useForecast(island, category) as any;
  const [open, setOpen] = useState(false);

  // Prefer new shape: data.forecast_data, but fall back to legacy array
  const rows = (data && data.forecast_data) ? data.forecast_data : (data || []);
  const series = useMemo(() => buildSeries(rows || [], showLast), [rows, showLast]);

  const current = series.length ? (series[series.length - 1].predicted ?? series[series.length - 1].actual ?? 0) : 0;
  const next = series.length > 1 ? (series[series.length - 1].predicted ?? series[series.length - 1].actual ?? 0) : current;
  const isDecline = next < current;

  // Use CSS color tokens so charts match the site's palette
  const colorActual = 'hsl(var(--chart-1))';
  const colorForecast = 'hsl(var(--chart-2))';
  const bandFill = 'hsl(var(--chart-2) / 0.12)';

  // Wrapper to avoid typing mismatches between different Recharts type versions
  // Some environments expect `width` as number, others as string — forward as `any`.
  const YAxisFlexible = (props: any) => {
    return <YAxis {...props} />;
  };

  // Helper: build series expected by recharts from API rows
  function buildSeries(rows: any[] = [], _showLast = 0) {
    if (!Array.isArray(rows)) return [];

    const mapped = rows.map((r) => {
      const dateVal = r.week ?? r.date ?? r.InvoiceDate ?? r["week"];
      let dateStr: any = dateVal;
      try {
        if (dateVal) {
          const d = new Date(dateVal);
          if (!isNaN(d.getTime())) {
            // Store as date-only ISO (YYYY-MM-DD) to avoid timezone/time parts in tooltips
            dateStr = d.toISOString().split('T')[0];
          }
        }
      } catch (e) {
        // leave as-is
      }

      return {
        date: dateStr,
        actual: r.actual == null ? null : Number(r.actual),
        predicted: r.predicted == null ? null : Number(r.predicted),
        lower: r.lower == null ? null : Number(r.lower),
        upper: r.upper == null ? null : Number(r.upper),
        is_forecast: r.is_forecast ?? r.isForecast ?? 0,
      };
    });

    // sort ascending by date
    mapped.sort((a: any, b: any) => {
      const ta = a.date ? new Date(a.date).getTime() : 0;
      const tb = b.date ? new Date(b.date).getTime() : 0;
      return ta - tb;
    });

    return mapped;
  }

  const formatDateLabel = (label: any) => {
    try {
      if (!label) return '';
      const d = new Date(label);
      if (!isNaN(d.getTime())) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {}
    // fallback: show first 10 chars (YYYY-MM-DD)
    return String(label).slice(0, 10);
  };

  return (
    <>
      <Card className="h-64 cursor-pointer min-w-0 overflow-visible" onClick={() => setOpen(true)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{toTitleCase(category)}</CardTitle>
            <Badge variant={isDecline ? 'destructive' : 'secondary'}>
              {isDecline ? (
                '↓ Decline'
              ) : (
                <button aria-label="Inspect" title="Inspect" className="inline-flex items-center justify-center p-0.5">
                  <Search className="w-4 h-4" />
                </button>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-2 h-full flex flex-col overflow-visible">
          <div className="w-full flex-1 min-w-0">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Memuat...</div>
            ) : isError ? (
              <div className="h-full flex items-center justify-center text-sm text-destructive">Gagal memuat prakiraan</div>
            ) : series.length ? (
              <div className="w-full h-full min-w-0">
                {/* fixed mini-chart height so the plot doesn't get clipped; hide Y axis to center the plot */}
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={series.slice(-showLast)} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.06} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => {
                      try {
                        if (typeof v === 'string' && v.includes('-')) {
                          return new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        }
                      } catch (e) {}
                      return String(v).slice(0, 6);
                    }}
                  />
                  {/* hide Y axis in preview to avoid left padding and center the plot */}
                  <YAxisFlexible hide width={0} />
                  <Tooltip labelFormatter={(l) => formatDateLabel(l)} formatter={(v: any) => (v == null ? '-' : Math.round(v))} />
                  <Line type="monotone" dataKey="actual" stroke={colorActual} strokeWidth={2} dot={false} />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke={colorForecast}
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Tidak ada data prakiraan</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Simple modal detail view */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-[90%] max-w-4xl bg-background rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">{category} — {island}</h3>
              <button className="text-sm text-muted-foreground" onClick={() => setOpen(false)}>Tutup</button>
            </div>

            {series.length ? (
              <div style={{ width: '100%', height: 360 }}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <ResponsiveContainer width="100%" height={360}>
                      <LineChart data={series} margin={{ top: 8, right: 24, left: 72, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.06} />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(v) => {
                            try {
                              if (typeof v === 'string' && v.includes('-')) {
                                return new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                              }
                            } catch (e) {}
                            return String(v).slice(0, 10);
                          }}
                        />
                        <YAxisFlexible tickFormatter={(v) => Math.round(Number(v))} width={64} />
                        <Tooltip labelFormatter={(l) => formatDateLabel(l)} formatter={(v: any) => (v == null ? '-' : Math.round(v))} />
                        <Legend verticalAlign="top" align="right" />
                        {/* optional confidence band */}
                        {series.some((s) => s.lower != null && s.upper != null) && (
                          <Area dataKey="upper" stroke="none" fill={bandFill} />
                        )}
                        <Line type="monotone" dataKey="actual" name="Actual" stroke={colorActual} strokeWidth={2} dot={{ r: 2 }} />
                        <Line
                          type="monotone"
                          dataKey="predicted"
                          name="Forecast"
                          stroke={colorForecast}
                          strokeWidth={2}
                          strokeDasharray="6 4"
                          dot={{ r: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Metrics column */}
                  <div className="col-span-1">
                    <div className="p-3 rounded-lg border bg-muted/5 h-full">
                        <h4 className="text-sm font-semibold mb-2">Metrik Model</h4>
                      {(() => {
                        const metrics = (data && data.model_metrics) ? data.model_metrics : [];

                        const normalize = (s: any) => (s || '').toString().toLowerCase().trim();
                        const cat = normalize(category);
                        const isl = normalize(island);

                        // Try robust matching sequence: exact product+pulau -> product only -> substring
                        let metric = metrics.find((m: any) => {
                          if (!m) return false;
                          const mp = normalize(m.product_category || m.product);
                          const pul = normalize(m.pulau || m.region);
                          return mp === cat && pul === isl;
                        });

                        if (!metric) {
                          metric = metrics.find((m: any) => normalize(m.product_category || m.product) === cat);
                        }

                        if (!metric) {
                          metric = metrics.find((m: any) => {
                            const mp = normalize(m.product_category || m.product);
                            return mp.includes(cat) || cat.includes(mp);
                          });
                        }

                        if (!metric) {
                          return <div className="text-sm text-muted-foreground">Tidak ada metrik untuk kategori ini (N/A)</div>;
                        }

                        const mape = typeof metric.mape === 'number' ? metric.mape : parseFloat(metric.mape) || 0;
                        const mae = metric.mae ?? metric.MAE ?? 'N/A';

                        const mapeColor = mape < 20 ? 'text-success' : mape <= 50 ? 'text-warning' : 'text-destructive';

                        return (
                          <div className="space-y-2">
                            <div className="text-xs text-muted-foreground">Sample Size: {metric.sample_size ?? '-'}</div>
                            <div className="text-sm">MAE</div>
                            <div className="text-2xl font-mono">{typeof mae === 'number' ? mae.toFixed(2) : mae}</div>
                            <div className="text-sm mt-2">MAPE</div>
                            <div className={`text-2xl font-mono ${mapeColor}`}>{mape.toFixed(1)}%</div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-muted-foreground">No forecast data to show</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default ForecastChart;
