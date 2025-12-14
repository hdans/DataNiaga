import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { IslandSelector } from '@/components/dashboard/IslandSelector';
import { ProductCategory } from '@/lib/mockData';
import { useProducts, useMBARules } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, ArrowRight, Sparkles, LayoutGrid } from 'lucide-react';
import { cn, toTitleCase } from '@/lib/utils';

interface LayoutSuggestion {
  product1: ProductCategory;
  product2: ProductCategory;
  lift: number;
  confidence: number;
  recommendation: string;
}

export default function StoreLayout() {
  const { data: products = [] } = useProducts();
  const [selectedIsland, setSelectedIsland] = useState<string>('JAWA, BALI, & NT');
  const { data: mbaRules = [] } = useMBARules(selectedIsland);

  const layoutSuggestions = useMemo(() => {
    const suggestions: LayoutSuggestion[] = (mbaRules || [])
      .filter((r: any) => (r.lift || 0) >= 2.0)
      .map((rule: any) => ({
        product1: Array.isArray(rule.antecedents) ? rule.antecedents[0] : rule.antecedents || '',
        product2: Array.isArray(rule.consequents) ? rule.consequents[0] : rule.consequents || '',
        lift: rule.lift || 0,
        confidence: rule.confidence || 0,
        recommendation:
          (rule.lift || 0) >= 3.5
            ? 'Tempatkan bersebelahan - Korelasi sangat kuat'
            : (rule.lift || 0) >= 2.5
            ? 'Tempatkan di dekat - Korelasi kuat'
            : 'Pertimbangkan kedekatan - Korelasi moderat',
      }))
      .sort((a, b) => b.lift - a.lift);

    return suggestions;
  }, [selectedIsland, mbaRules]);

  // Create a simple store layout visualization
  const layoutGrid = useMemo(() => {
    const categories = [...new Set(layoutSuggestions.flatMap((s) => [s.product1, s.product2]))];
    return categories.slice(0, 8);
  }, [layoutSuggestions]);

  const getLiftColor = (lift: number) => {
    if (lift >= 3.5) return 'border-success bg-success/10 text-success';
    if (lift >= 2.5) return 'border-primary bg-primary/10 text-primary';
    return 'border-warning bg-warning/10 text-warning';
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pengoptimal Tata Letak Toko</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Saran penempatan produk berdasarkan korelasi pembelian
            </p>
          </div>
          <IslandSelector selected={selectedIsland} onChange={setSelectedIsland} />
        </div>

        {/* Layout Visualization */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <LayoutGrid className="w-5 h-5" />
              Tata Letak Toko yang Disarankan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {layoutGrid.map((category, idx) => {
                const hasStrongPair = layoutSuggestions.some(
                  (s) =>
                    (s.product1 === category || s.product2 === category) &&
                    s.lift >= 3.0
                );
                return (
                  <div
                    key={category}
                    className={cn(
                      'p-4 rounded-xl border-2 text-center transition-all',
                      hasStrongPair
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-muted/30'
                    )}
                  >
                    <div className="text-xs text-muted-foreground mb-1">Zona {idx + 1}</div>
                    <div className="font-semibold text-sm text-foreground">{toTitleCase(category)}</div>
                    {hasStrongPair && (
                      <Sparkles className="w-4 h-4 text-primary mx-auto mt-2" />
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Produk dengan korelasi kuat harus ditempatkan di zona yang berdekatan
            </p>
          </CardContent>
        </Card>

        {/* Placement Suggestions */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Rekomendasi Penempatan
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {layoutSuggestions.map((suggestion, idx) => (
              <Card key={idx} className="hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-medium">
                        {toTitleCase(suggestion.product1)}
                      </Badge>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <Badge variant="secondary" className="font-medium">
                        {toTitleCase(suggestion.product2)}
                      </Badge>
                    </div>
                    <Badge className={cn('border', getLiftColor(suggestion.lift))}>
                      {suggestion.lift.toFixed(1)}x
                    </Badge>
                  </div>

                  <p className="text-sm text-foreground font-medium">
                    {suggestion.recommendation}
                  </p>

                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span>Kepercayaan: {(suggestion.confidence * 100).toFixed(0)}%</span>
                    <span>Lift: {suggestion.lift.toFixed(2)}x</span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {layoutSuggestions.length === 0 && (
              <div className="col-span-2 text-center py-12 text-muted-foreground">
                <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Tidak ada saran tata letak untuk wilayah ini</p>
                <p className="text-xs mt-1">Data korelasi tidak cukup tersedia</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
