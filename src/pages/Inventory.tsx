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
import { cn, toTitleCase } from '@/lib/utils';

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

  const [productMetrics, setProductMetrics] = useState<Record<string, {
    current: number;
    next: number;
    trend: 'up' | 'down' | 'stable';
    trendPercent: number;
  }>>({});

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
        derivedDemand: Array.from(new Set(
          (mbaRules || [])
            .filter((r: any) => {
              const antecedent = Array.isArray(r.antecedents) ? r.antecedents.join(',') : (r.antecedents || '');
              const consequent = Array.isArray(r.consequents) ? r.consequents.join(',') : (r.consequents || '');
              // Show products bought together (in either direction)
              return antecedent.includes(category) || consequent.includes(category);
            })
            .flatMap((r: any) => {
              const antecedent = Array.isArray(r.antecedents) ? r.antecedents[0] : (r.antecedents || '');
              const consequent = Array.isArray(r.consequents) ? r.consequents[0] : (r.consequents || '');
              // Return the OTHER product in the relationship
              return antecedent === category ? consequent : antecedent;
            })
            .filter((p: string) => p && p !== category)
        )),
      };
    });
  }, [topProducts, mbaRules]);

  const spikingItems = Object.entries(productMetrics)
    .filter(([, m]) => m.trend === 'up')
    .map(([p]) => p);
  const decliningItems = Object.entries(productMetrics)
    .filter(([, m]) => m.trend === 'down')
    .map(([p]) => p);


  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inventori Cerdas</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Analisis permintaan turunan berdasarkan prakiraan + asosiasi MBA
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
                Peringatan Lonjakan Permintaan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{spikingItems.length}</p>
              <p className="text-xs text-muted-foreground">Kategori dengan permintaan naik</p>
            </CardContent>
          </Card>

          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-destructive flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Permintaan Menurun
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{decliningItems.length}</p>
              <p className="text-xs text-muted-foreground">Kategori dengan permintaan turun</p>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-5 h-5" />
              Tabel Perencanaan Inventori
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Minggu Ini</TableHead>
                  <TableHead className="text-right">Minggu Depan</TableHead>
                  <TableHead className="text-center">Tren</TableHead>
                  <TableHead>Status Stok</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryData.map((item) => (
                  <ProductInventoryRow
                    key={item.category}
                    island={selectedIsland}
                    item={item}
                    onMetricsUpdate={(product, metrics) =>
                      setProductMetrics((prev) => ({ ...prev, [product]: metrics }))
                    }
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
function ProductInventoryRow({ island, item, onMetricsUpdate }: { island: string; item: InventoryItem; onMetricsUpdate?: (product: string, metrics: { current: number; next: number; trend: 'up'|'down'|'stable'; trendPercent: number }) => void }) {
  const { data, isLoading } = useForecast(island, item.category as string) as any;
  const forecast = (data && data.forecast_data) ? data.forecast_data : (data || []);

  const current = forecast.slice(-1)[0];
  const next = forecast.find((f: any) => f.is_forecast) || null;

  const currentVal = current ? Math.round(current.predicted) : 0;
  const nextVal = next ? Math.round(next.predicted) : 0;

  const trendPercent = currentVal > 0 ? Math.abs(((nextVal - currentVal) / (currentVal || 1)) * 100) : 0;
  const trend: 'up' | 'down' | 'stable' = nextVal - currentVal > 5 ? 'up' : nextVal - currentVal < -5 ? 'down' : 'stable';

  // Report metrics back to parent so summary cards can use real data
  useMemo(() => {
    onMetricsUpdate?.(item.category as string, {
      current: currentVal,
      next: nextVal,
      trend,
      trendPercent,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVal, nextVal, trend, trendPercent]);

  return (
    <TableRow key={item.category}>
      <TableCell>
        <Badge variant="outline" className="font-medium">
          {toTitleCase(item.category)}
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
        <StockHealthBadge current={currentVal} next={nextVal} />
      </TableCell>
    </TableRow>
  );
}

// Stock Health Badge Component
function StockHealthBadge({ current, next }: { current: number; next: number }) {
  // Calculate average and determine health status
  const avg = current > 0 ? current : 1;
  const ratio = next / avg;
  
  let status: 'aman' | 'kurang' | 'berlebih';
  let color: string;
  
  // Berlebih: forecast > 130% of current
  if (ratio > 1.3) {
    status = 'berlebih';
    color = 'bg-orange-100 text-orange-800 border-orange-300';
  }
  // Kurang: forecast < 70% of current  
  else if (ratio < 0.7) {
    status = 'kurang';
    color = 'bg-red-100 text-red-800 border-red-300';
  }
  // Aman: between 70% - 130%
  else {
    status = 'aman';
    color = 'bg-green-100 text-green-800 border-green-300';
  }
  
  const statusLabel = {
    aman: 'Aman',
    kurang: 'Kurang',
    berlebih: 'Berlebih'
  }[status];
  
  return (
    <Badge className={cn('font-medium', color)} variant="outline">
      {statusLabel}
    </Badge>
  );
}
