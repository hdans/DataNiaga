import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useForecast } from '@/hooks/useApi';
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

interface ForecastChartProps {
  island: string;
  category: string;
  showLast?: number;
}

// Lightweight sparkline renderer to avoid adding heavy runtime deps
// Map raw API rows to chart-friendly points
function buildSeries(rows: any[], showLast: number) {
  const slice = (rows || []).slice(-showLast);
  return slice.map((d: any, i: number) => {
    const actual = d.actual ?? d.sales ?? d.value ?? null;
    const predicted = d.predicted ?? d.forecast ?? null;
    const lower = d.lower ?? d.predicted_lower ?? null;
    const upper = d.upper ?? d.predicted_upper ?? null;
    const date = d.date ?? d.week_date ?? d.week ?? `T${i}`;
    return { date, actual, predicted, lower, upper };
  });
}

export function ForecastChart({ island, category, showLast = 8 }: ForecastChartProps) {
  const { data, isLoading, isError } = useForecast(island, category);
  const [open, setOpen] = useState(false);

  const series = useMemo(() => buildSeries(data || [], showLast), [data, showLast]);

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

  return (
    <>
      <Card className="h-64 cursor-pointer min-w-0 overflow-visible" onClick={() => setOpen(true)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{category}</CardTitle>
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
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Loading...</div>
            ) : isError ? (
              <div className="h-full flex items-center justify-center text-sm text-destructive">Error loading forecast</div>
            ) : series.length ? (
              <div className="w-full h-full min-w-0">
                {/* fixed mini-chart height so the plot doesn't get clipped; hide Y axis to center the plot */}
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={series} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
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
                  <Tooltip formatter={(v: any) => (v == null ? '-' : Math.round(v))} />
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
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No forecast data</div>
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
              <button className="text-sm text-muted-foreground" onClick={() => setOpen(false)}>Close</button>
            </div>

            {series.length ? (
              <div style={{ width: '100%', height: 360 }}>
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
                    <Tooltip formatter={(v: any) => (v == null ? '-' : Math.round(v))} />
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
