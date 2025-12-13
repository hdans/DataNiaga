import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { IslandSelector } from '@/components/dashboard/IslandSelector';
import { useProducts, useIslands, useForecast } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Target, CheckCircle2, AlertCircle, XCircle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

const qualityConfig: Record<string, any> = {
  'Highly Accurate': {
    icon: Star,
    color: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/30',
  },
  'Good': {
    icon: CheckCircle2,
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/30',
  },
  'Reasonable': {
    icon: AlertCircle,
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/30',
  },
  'Inaccurate': {
    icon: XCircle,
    color: 'text-destructive',
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
  },
};

const CHART_COLORS = [
  'hsl(142, 76%, 36%)', // success - Highly Accurate
  'hsl(265, 89%, 55%)', // primary - Good
  'hsl(38, 92%, 50%)',  // warning - Reasonable
  'hsl(0, 84%, 60%)',   // destructive - Inaccurate
];

// Map quality category names to their HSL colors
const getQualityColor = (qualityName: string): string => {
  const colorMap: Record<string, string> = {
    'Highly Accurate': 'hsl(142, 76%, 36%)',  // success green
    'Good': 'hsl(265, 89%, 55%)',              // primary purple
    'Reasonable': 'hsl(38, 92%, 50%)',         // warning orange
    'Inaccurate': 'hsl(0, 84%, 60%)',          // destructive red
  };
  return colorMap[qualityName] || 'hsl(200, 14%, 97%)'; // fallback to neutral
};

export default function Quality() {
  const { data: products = [] } = useProducts();
  const { data: islands = [] } = useIslands();
  const [selectedIsland, setSelectedIsland] = React.useState<string>(islands[0] ?? 'JAWA, BALI, & NT');

  const [metricsMap, setMetricsMap] = React.useState<Record<string, { mae: number; mape: number; quality: string }>>({});

  const updateMetric = (product: string, data: { mae: number; mape: number; quality: string }) => {
    setMetricsMap((prev) => ({ ...prev, [product]: data }));
  };

  const qualityCounts = Object.values(metricsMap).reduce((acc: Record<string, number>, item) => {
    acc[item.quality] = (acc[item.quality] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(qualityCounts).map(([name, value]) => ({ name, value }));

  const avgMape = Object.values(metricsMap).length
    ? Object.values(metricsMap).reduce((sum, item) => sum + item.mape, 0) / Object.values(metricsMap).length
    : 0;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Kualitas Model</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Metrik akurasi peramalan dan evaluasi kinerja model
            </p>
          </div>
          <div className="ml-auto">
            <IslandSelector
              selected={selectedIsland}
              onChange={(val) => {
                setSelectedIsland(val);
                setMetricsMap({}); // reset metrics when region changes
              }}
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(Object.keys(qualityConfig) as string[]).map((quality) => {
            const config = qualityConfig[quality];
            const Icon = config.icon;
            const count = qualityCounts[quality] || 0;

            return (
              <Card key={quality} className={cn('border', config.border, config.bg)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={cn('text-sm font-medium', config.color)}>{quality}</p>
                      <p className="text-2xl font-bold text-foreground">{count}</p>
                    </div>
                    <Icon className={cn('w-8 h-8', config.color)} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Chart and Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <Card>
            <CardHeader>
                <CardTitle className="text-base">Distribusi Kualitas</CardTitle>
              </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {pieData.map((entry) => (
                        <Cell
                          key={`cell-${entry.name}`}
                          fill={getQualityColor(entry.name)}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-5 h-5" />
                Metrik Utama
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Rata-rata MAPE</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {avgMape.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Mean Absolute Percentage Error (MAPE) dari seluruh model
                </p>
              </div>

                <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                  <p className="text-xs text-success font-medium">Best Performer</p>
                    <p className="text-sm font-semibold text-foreground mt-1">
                                {(() => {
                                  const entries = Object.entries(metricsMap) as [string, { mae: number; mape: number; quality: string }][];
                                  if (entries.length === 0) return '-';
                                  let best = entries[0];
                                  for (const e of entries) {
                                    if (e[1].mape < best[1].mape) best = e;
                                  }
                                  return best[0];
                                })()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                                MAPE: {(() => {
                                  const vals = Object.values(metricsMap).map((f) => f.mape);
                                  return vals.length ? Math.min(...vals).toFixed(1) : '-';
                                })()}%
                    </p>
                </div>

                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <p className="text-xs text-destructive font-medium">Needs Attention</p>
                    <p className="text-sm font-semibold text-foreground mt-1">
                                {(() => {
                                  const entries = Object.entries(metricsMap) as [string, { mae: number; mape: number; quality: string }][];
                                  if (entries.length === 0) return '-';
                                  let worst = entries[0];
                                  for (const e of entries) {
                                    if (e[1].mape > worst[1].mape) worst = e;
                                  }
                                  return worst[0];
                                })()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                                MAPE: {(() => {
                                  const vals = Object.values(metricsMap).map((f) => f.mape);
                                  return vals.length ? Math.max(...vals).toFixed(1) : '-';
                                })()}%
                    </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detailed Performance by Category</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Wilayah</TableHead>
                  <TableHead className="text-right">MAE</TableHead>
                  <TableHead className="text-right">MAPE</TableHead>
                  <TableHead className="text-center">Kualitas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(products || []).slice(0, 24).map((product) => (
                  <ProductQualityRow
                    key={product}
                    island={selectedIsland}
                    product={product}
                    onMetric={(m) => updateMetric(product, m)}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function mapMapeToQuality(mape: number) {
  // Use English labels as requested:
  // <10% => Highly Accurate
  // 10% - 20% => Good
  // 20% - 50% => Reasonable
  // >50% => Inaccurate
  if (mape < 10) return 'Highly Accurate';
  if (mape >= 10 && mape <= 20) return 'Good';
  if (mape > 20 && mape <= 50) return 'Reasonable';
  return 'Inaccurate';
}

function ProductQualityRow({ island, product, onMetric }: { island: string; product: string; onMetric: (m: { mae: number; mape: number; quality: string }) => void }) {
  const { data, isLoading } = useForecast(island, product) as any;
  const rows = (data && data.forecast_data) ? data.forecast_data : (data || []);
  const metrics = (data && data.model_metrics) ? data.model_metrics : [];

  // Local state to display values
  const [maeDisplay, setMaeDisplay] = React.useState<number | string>(isLoading ? '—' : '-');
  const [mapeDisplay, setMapeDisplay] = React.useState<number | string>(isLoading ? '—' : '-');
  const [qualityDisplay, setQualityDisplay] = React.useState<string>(isLoading ? 'Loading…' : '-');

  React.useEffect(() => {
    // Try to find a matching metric from the backend first
    const normalize = (s: any) => (s || '').toString().toLowerCase().trim();
    const cat = normalize(product);
    const isl = normalize(island);

    let matched: any = undefined;
    if (Array.isArray(metrics) && metrics.length) {
      matched = metrics.find((m: any) => {
        const mp = normalize(m.product_category || m.product);
        const pul = normalize(m.pulau || m.region);
        return (mp === cat && pul === isl) || mp === cat || mp.includes(cat) || cat.includes(mp);
      });
    }

    if (matched) {
      const mape = typeof matched.mape === 'number' ? matched.mape : parseFloat(matched.mape) || 0;
      const mae = matched.mae ?? matched.MAE ?? 0;
      const quality = mapMapeToQuality(mape);
      setMaeDisplay(typeof mae === 'number' ? mae.toFixed(2) : String(mae));
      setMapeDisplay(Number(mape).toFixed(1));
      setQualityDisplay(quality);
      onMetric({ mae: Number(mae), mape: Number(mape), quality });
      return;
    }

    // Fallback: compute from historical rows
    if (!rows || rows.length === 0) {
      setMaeDisplay('-');
      setMapeDisplay('-');
  setQualityDisplay('Inaccurate');
  onMetric({ mae: 0, mape: 0, quality: 'Inaccurate' });
      return;
    }

    const historical = rows.filter((r: any) => !r.is_forecast && r.actual != null);
    if (!historical || historical.length === 0) {
      setMaeDisplay('-');
      setMapeDisplay('-');
  setQualityDisplay('Inaccurate');
  onMetric({ mae: 0, mape: 0, quality: 'Inaccurate' });
      return;
    }

    const errors = historical.map((h: any) => Math.abs(h.actual - h.predicted));
    const maes = errors.reduce((a: number, b: number) => a + b, 0) / errors.length;
    const mapes = historical
      .map((h: any) => (h.actual > 0 ? Math.abs((h.actual - h.predicted) / h.actual) * 100 : 0));
    const mape = mapes.reduce((a: number, b: number) => a + b, 0) / mapes.length;

    setMaeDisplay(maes.toFixed(2));
    setMapeDisplay(mape.toFixed(1));
    const quality = mapMapeToQuality(mape);
    setQualityDisplay(quality);
    onMetric({ mae: maes, mape, quality });
  }, [data, rows, metrics, isLoading, product, island]);

  return (
    <TableRow>
      <TableCell>
        <Badge variant="outline">{product}</Badge>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{island}</TableCell>
      <TableCell className="text-right font-mono text-sm">{isLoading ? '—' : maeDisplay}</TableCell>
      <TableCell className="text-right font-mono text-sm">{isLoading ? '—' : mapeDisplay}</TableCell>
      <TableCell>
        <div className="text-xs text-muted-foreground">{isLoading ? 'Loading…' : qualityDisplay}</div>
      </TableCell>
    </TableRow>
  );
}
