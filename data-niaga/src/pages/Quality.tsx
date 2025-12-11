import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
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

const qualityConfig = {
  Excellent: {
    icon: Star,
    color: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/30',
  },
  Good: {
    icon: CheckCircle2,
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/30',
  },
  Fair: {
    icon: AlertCircle,
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/30',
  },
  Poor: {
    icon: XCircle,
    color: 'text-destructive',
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
  },
};

const CHART_COLORS = [
  'hsl(142, 76%, 36%)', // success - Excellent
  'hsl(265, 89%, 55%)', // primary - Good
  'hsl(38, 92%, 50%)',  // warning - Fair
  'hsl(0, 84%, 60%)',   // destructive - Poor
];

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
        <div>
          <h1 className="text-2xl font-bold text-foreground">Model Quality</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Forecasting accuracy metrics and performance evaluation
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(['Excellent', 'Good', 'Fair', 'Poor'] as const).map((quality) => {
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
              <CardTitle className="text-base">Quality Distribution</CardTitle>
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
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
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
                Key Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Average MAPE</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {avgMape.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Mean Absolute Percentage Error across all models
                </p>
              </div>

                <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                  <p className="text-xs text-success font-medium">Best Performer</p>
                    <p className="text-sm font-semibold text-foreground mt-1">
                      {Object.values(metricsMap).length
                        ? Object.entries(metricsMap).reduce((best, [prod, curr]: any) => {
                            return curr.mape < best[1].mape ? [prod, curr] : best;
                          }, ['', { mape: Infinity }])[0]
                        : '-'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      MAPE: {Object.values(metricsMap).length ? Math.min(...Object.values(metricsMap).map((f) => f.mape)).toFixed(1) : '-'}%
                    </p>
                </div>

                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <p className="text-xs text-destructive font-medium">Needs Attention</p>
                    <p className="text-sm font-semibold text-foreground mt-1">
                      {Object.values(metricsMap).length
                        ? Object.entries(metricsMap).reduce((worst, [prod, curr]: any) => {
                            return curr.mape > worst[1].mape ? [prod, curr] : worst;
                          }, ['', { mape: -Infinity }])[0]
                        : '-'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      MAPE: {Object.values(metricsMap).length ? Math.max(...Object.values(metricsMap).map((f) => f.mape)).toFixed(1) : '-'}%
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
                  <TableHead>Category</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead className="text-right">MAE</TableHead>
                  <TableHead className="text-right">MAPE</TableHead>
                  <TableHead className="text-center">Quality</TableHead>
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
  if (mape <= 10) return 'Excellent';
  if (mape <= 20) return 'Good';
  if (mape <= 30) return 'Fair';
  return 'Poor';
}

function ProductQualityRow({ island, product, onMetric }: { island: string; product: string; onMetric: (m: { mae: number; mape: number; quality: string }) => void }) {
  const { data: rows = [], isLoading } = useForecast(island, product) as any;

  React.useEffect(() => {
    if (!rows || rows.length === 0) return;
    const historical = rows.filter((r: any) => !r.is_forecast && r.actual != null);
    if (historical.length === 0) return onMetric({ mae: 0, mape: 0, quality: 'Poor' });

    const errors = historical.map((h: any) => Math.abs(h.actual - h.predicted));
    const maes = errors.reduce((a: number, b: number) => a + b, 0) / errors.length;
    const mapes = historical
      .map((h: any) => (h.actual > 0 ? Math.abs((h.actual - h.predicted) / h.actual) * 100 : 0));
    const mape = mapes.reduce((a: number, b: number) => a + b, 0) / mapes.length;

    onMetric({ mae: maes, mape, quality: mapMapeToQuality(mape) });
  }, [rows]);

  const config = { color: 'text-muted-foreground' } as any;

  return (
    <TableRow>
      <TableCell>
        <Badge variant="outline">{product}</Badge>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{island}</TableCell>
      <TableCell className="text-right font-mono text-sm">{isLoading ? '—' : '-'}</TableCell>
      <TableCell className="text-right font-mono text-sm">{isLoading ? '—' : '-'}</TableCell>
      <TableCell>
        <div className="text-xs text-muted-foreground">{isLoading ? 'Loading…' : '-'}</div>
      </TableCell>
    </TableRow>
  );
}
