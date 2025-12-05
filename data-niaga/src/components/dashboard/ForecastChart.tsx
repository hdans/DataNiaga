import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateHistoricalData, generateForecastData, Island, ProductCategory } from '@/lib/mockData';

interface ForecastChartProps {
  island: Island;
  category: ProductCategory;
  showLast?: number;
}

export function ForecastChart({ island, category, showLast = 12 }: ForecastChartProps) {
  const chartData = useMemo(() => {
    const historical = generateHistoricalData(island, category).slice(-showLast);
    const forecast = generateForecastData(island, category);
    
    // Mark the transition point
    const lastHistorical = historical[historical.length - 1];
    
    return {
      data: [
        ...historical.map(d => ({
          date: d.date,
          actual: d.quantity,
          forecast: null as number | null,
        })),
        // Bridge point
        {
          date: lastHistorical.date,
          actual: lastHistorical.quantity,
          forecast: lastHistorical.quantity,
        },
        ...forecast.map(d => ({
          date: d.date,
          actual: null as number | null,
          forecast: d.quantity,
        })),
      ],
      cutoffDate: lastHistorical.date,
    };
  }, [island, category, showLast]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <span>{category}</span>
          <span className="text-xs font-normal text-muted-foreground">{island}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData.data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelFormatter={formatDate}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              />
              <ReferenceLine
                x={chartData.cutoffDate}
                stroke="hsl(var(--primary))"
                strokeDasharray="5 5"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="hsl(var(--chart-4))"
                strokeWidth={2}
                dot={{ r: 3, fill: 'hsl(var(--chart-4))' }}
                activeDot={{ r: 5 }}
                name="Actual"
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                activeDot={{ r: 5 }}
                name="Forecast"
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
