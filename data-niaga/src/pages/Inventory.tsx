import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { IslandSelector } from '@/components/dashboard/IslandSelector';
import {
  Island,
  PRODUCT_CATEGORIES,
  ProductCategory,
  generateForecastData,
  mbaRules,
} from '@/lib/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Package, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InventoryItem {
  category: ProductCategory;
  currentWeekForecast: number;
  nextWeekForecast: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
  derivedDemand: ProductCategory[];
}

export default function Inventory() {
  const [selectedIsland, setSelectedIsland] = useState<Island>('JAWA, BALI, & NT');

  const inventoryData = useMemo(() => {
    return PRODUCT_CATEGORIES.map((category): InventoryItem => {
      const forecast = generateForecastData(selectedIsland, category);
      const currentWeek = forecast[0]?.quantity || 0;
      const nextWeek = forecast[1]?.quantity || 0;
      const trendPercent = currentWeek > 0 ? ((nextWeek - currentWeek) / currentWeek) * 100 : 0;

      // Find derived demand from MBA rules
      const derivedProducts = mbaRules
        .filter((r) => r.pulau === selectedIsland && r.antecedent === category)
        .map((r) => r.consequent);

      return {
        category,
        currentWeekForecast: currentWeek,
        nextWeekForecast: nextWeek,
        trend: trendPercent > 5 ? 'up' : trendPercent < -5 ? 'down' : 'stable',
        trendPercent: Math.abs(trendPercent),
        derivedDemand: derivedProducts,
      };
    }).sort((a, b) => b.trendPercent - a.trendPercent);
  }, [selectedIsland]);

  const spikingItems = inventoryData.filter((item) => item.trend === 'up');
  const decliningItems = inventoryData.filter((item) => item.trend === 'down');

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-success" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Smart Inventory</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Derived demand analysis based on forecasts + MBA associations
            </p>
          </div>
          <IslandSelector selected={selectedIsland} onChange={setSelectedIsland} />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-success/30 bg-success/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-success flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Demand Spike Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{spikingItems.length}</p>
              <p className="text-xs text-muted-foreground">Categories with rising demand</p>
            </CardContent>
          </Card>

          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-destructive flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Declining Demand
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{decliningItems.length}</p>
              <p className="text-xs text-muted-foreground">Categories with falling demand</p>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-5 h-5" />
              Inventory Planning Table
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">This Week</TableHead>
                  <TableHead className="text-right">Next Week</TableHead>
                  <TableHead className="text-center">Trend</TableHead>
                  <TableHead>Derived Demand (Stock These Too)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryData.map((item) => (
                  <TableRow key={item.category}>
                    <TableCell>
                      <Badge variant="outline" className="font-medium">
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {item.currentWeekForecast.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {item.nextWeekForecast.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <TrendIcon trend={item.trend} />
                        <span
                          className={cn(
                            'text-xs font-medium',
                            item.trend === 'up' && 'text-success',
                            item.trend === 'down' && 'text-destructive',
                            item.trend === 'stable' && 'text-muted-foreground'
                          )}
                        >
                          {item.trendPercent.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.derivedDemand.length > 0 ? (
                        <div className="flex items-center gap-1 flex-wrap">
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          {item.derivedDemand.map((d) => (
                            <Badge key={d} variant="secondary" className="text-[10px]">
                              {d}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
