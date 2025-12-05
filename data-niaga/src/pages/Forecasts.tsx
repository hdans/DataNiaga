import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ForecastChart } from '@/components/dashboard/ForecastChart';
import { IslandSelector } from '@/components/dashboard/IslandSelector';
import { Island, PRODUCT_CATEGORIES } from '@/lib/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';

export default function Forecasts() {
  const [selectedIsland, setSelectedIsland] = useState<Island>('JAWA, BALI, & NT');

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sales Forecasts</h1>
            <p className="text-sm text-muted-foreground mt-1">
              10-week demand predictions using LightGBM (Tweedie) model
            </p>
          </div>
          <IslandSelector selected={selectedIsland} onChange={setSelectedIsland} />
        </div>

        {/* Model Info */}
        <Card className="bg-accent/50 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm text-foreground">Model Information</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Forecasts generated using LightGBM with Tweedie objective (variance power: 1.5).
                  Segregated models per region for better accuracy. Features include: 4-week lookback,
                  statistical features (mean, std), payday indicator, and category encoding.
                </p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">Tweedie Regression</Badge>
                  <Badge variant="secondary" className="text-xs">10-Week Horizon</Badge>
                  <Badge variant="secondary" className="text-xs">Per-Region Models</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {PRODUCT_CATEGORIES.map((category) => (
            <ForecastChart
              key={category}
              island={selectedIsland}
              category={category}
              showLast={12}
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
