import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { forecastQuality } from '@/lib/mockData';
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
  // Calculate summary stats
  const qualityCounts = forecastQuality.reduce(
    (acc, item) => {
      acc[item.quality] = (acc[item.quality] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const pieData = Object.entries(qualityCounts).map(([name, value]) => ({
    name,
    value,
  }));

  const avgMape =
    forecastQuality.reduce((sum, item) => sum + item.mape, 0) / forecastQuality.length;

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
                    {forecastQuality.reduce((best, curr) =>
                      curr.mape < best.mape ? curr : best
                    ).category}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    MAPE: {Math.min(...forecastQuality.map((f) => f.mape)).toFixed(1)}%
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <p className="text-xs text-destructive font-medium">Needs Attention</p>
                  <p className="text-sm font-semibold text-foreground mt-1">
                    {forecastQuality.reduce((worst, curr) =>
                      curr.mape > worst.mape ? curr : worst
                    ).category}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    MAPE: {Math.max(...forecastQuality.map((f) => f.mape)).toFixed(1)}%
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
                {forecastQuality.map((item, idx) => {
                  const config = qualityConfig[item.quality];
                  const Icon = config.icon;

                  return (
                    <TableRow key={idx}>
                      <TableCell>
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.pulau}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {item.mae.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {item.mape.toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Icon className={cn('w-4 h-4', config.color)} />
                          <span className={cn('text-xs font-medium', config.color)}>
                            {item.quality}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
