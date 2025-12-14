import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ForecastChart } from '@/components/dashboard/ForecastChart';
import { IslandSelector } from '@/components/dashboard/IslandSelector';
import { useProducts, useIslands } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';

export default function Forecasts() {
  const { data: islands = [] } = useIslands();
  const { data: products = [] } = useProducts();

  const [selectedIsland, setSelectedIsland] = useState<string>(islands[0] ?? 'JAWA, BALI, & NT');

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Perkiraan Penjualan</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Prediksi penjualan mingguan
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
                <h3 className="font-semibold text-sm text-foreground">Informasi Model</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Perkiraan dihasilkan menggunakan LightGBM dengan tujuan Tweedie (kekuatan varians: 1.5).
                  Model terpisah per wilayah untuk akurasi yang lebih baik. Fitur termasuk: lookback 4 minggu,
                  fitur statistik (rata-rata, std), indikator hari gajian, dan penyandian kategori.
                </p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">Regresi Tweedie</Badge>
                  <Badge variant="secondary" className="text-xs">Horison 10 Minggu</Badge>
                  <Badge variant="secondary" className="text-xs">Model Per-Wilayah</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map((category) => (
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
