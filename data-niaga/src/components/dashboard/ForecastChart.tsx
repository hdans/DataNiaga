import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import React from 'react';
import { useForecast } from '@/hooks/useApi';

interface ForecastChartProps {
  island: string;
  category: string;
  showLast?: number;
}

// Lightweight sparkline renderer to avoid adding heavy runtime deps
function Sparkline({ values }: { values: number[] }) {
  const width = 240;
  const height = 64;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1 || 1)) * width;
      const y = height - ((v - min) / (max - min || 1)) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="w-full h-16">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        points={points}
        className="text-primary/80"
      />
    </svg>
  );
}

export function ForecastChart({ island, category, showLast = 8 }: ForecastChartProps) {
  const { data, isLoading, isError } = useForecast(island, category);

  const values = (data || []).slice(-showLast).map((d) => Math.round(d.predicted));

  return (
    <Card className="h-40">
      <CardHeader>
        <CardTitle className="text-sm">{category}</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <div className="text-xs text-muted-foreground mb-2">{island}</div>
        <div className="w-full">
          {isLoading ? (
            <div className="h-16 flex items-center justify-center text-sm text-muted-foreground">Loading...</div>
          ) : isError ? (
            <div className="h-16 flex items-center justify-center text-sm text-destructive">Error loading forecast</div>
          ) : values.length ? (
            <Sparkline values={values} />
          ) : (
            <div className="h-16 flex items-center justify-center text-sm text-muted-foreground">No forecast data</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ForecastChart;
