import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { IslandSelector } from '@/components/dashboard/IslandSelector';
import { ProductCategory } from '@/lib/mockData';
import { useProducts, useForecast, useMBARules } from '@/hooks/useApi';
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

// Reusable trend icon component at module scope
function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <TrendingUp className="w-4 h-4 text-success" />;
  if (trend === 'down') return <TrendingDown className="w-4 h-4 text-destructive" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
}

export default function Inventory() {
  const { data: products = [] } = useProducts();
  const [selectedIsland, setSelectedIsland] = useState<string>('JAWA, BALI, & NT');
  const { data: mbaRules = [] } = useMBARules(selectedIsland);

  // Only show top N products to avoid making too many queries at once
  const topProducts = (products || []).slice(0, 24);

  const inventoryData = useMemo(() => {
    return topProducts.map((category): InventoryItem => {
      // We'll fetch forecasts per-row in the UI component to avoid blocking this map
      return {
        category: category as ProductCategory,
        currentWeekForecast: 0,
        nextWeekForecast: 0,
        trend: 'stable',
        trendPercent: 0,
        derivedDemand: (mbaRules || [])
          .filter((r: any) => (Array.isArray(r.consequents) ? r.consequents.includes(category) : r.consequents === category))
          .map((r: any) => (Array.isArray(r.antecedents) ? r.antecedents[0] : r.antecedent || ''))
          .filter(Boolean),
      };
    });
  }, [topProducts, mbaRules]);

  const spikingItems = inventoryData.filter((item) => item.trend === 'up');
  const decliningItems = inventoryData.filter((item) => item.trend === 'down');


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
                  <ProductInventoryRow
                    key={item.category}
                    island={selectedIsland}
                    item={item}
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

// Separate row component to fetch per-product forecast data
function ProductInventoryRow({ island, item }: { island: string; item: InventoryItem }) {
  const { data: forecast = [], isLoading } = useForecast(island, item.category as string) as any;

  const current = forecast.slice(-1)[0];
  const next = forecast.find((f: any) => f.is_forecast) || null;

  const currentVal = current ? Math.round(current.predicted) : 0;
  const nextVal = next ? Math.round(next.predicted) : 0;

  const trendPercent = currentVal > 0 ? Math.abs(((nextVal - currentVal) / (currentVal || 1)) * 100) : 0;
  const trend: 'up' | 'down' | 'stable' = nextVal - currentVal > 5 ? 'up' : nextVal - currentVal < -5 ? 'down' : 'stable';

  return (
    <TableRow key={item.category}>
      <TableCell>
        <Badge variant="outline" className="font-medium">
          {item.category}
        </Badge>
      </TableCell>
      <TableCell className="text-right font-mono">
        {isLoading ? '—' : currentVal.toLocaleString()}
      </TableCell>
      <TableCell className="text-right font-mono">
        {isLoading ? '—' : nextVal.toLocaleString()}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-center gap-1">
          <TrendIcon trend={trend} />
          <span
            className={cn(
              'text-xs font-medium',
              trend === 'up' && 'text-success',
              trend === 'down' && 'text-destructive',
              trend === 'stable' && 'text-muted-foreground'
            )}
          >
            {trendPercent.toFixed(1)}%
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
  );
}
