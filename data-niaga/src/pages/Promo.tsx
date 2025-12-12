import { useState, useMemo, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { IslandSelector } from '@/components/dashboard/IslandSelector';
import { ProductCategory } from '@/lib/mockData';
import { useProducts, useMBARules } from '@/hooks/useApi';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Gift, TrendingDown, Package, Sparkles, Calendar, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromoSuggestion {
  slowProduct: ProductCategory;
  forecastQty: number;
  anchorProduct: ProductCategory;
  lift: number;
  suggestedDiscount: number;
  reason: string;
}

export default function Promo() {
  const { data: products = [] } = useProducts();
  const [selectedIsland, setSelectedIsland] = useState<string>('JAWA, BALI, & NT');

  const { data: mbaRules = [] } = useMBARules(selectedIsland);

  const [promoSuggestions, setPromoSuggestions] = useState<PromoSuggestion[]>([]);

  // Build suggestions from declining products (based on per-product forecast trend) + MBA rules
  useEffect(() => {
    let mounted = true;

    async function buildSuggestions() {
      const suggestions: PromoSuggestion[] = [];
      const list = (products || []).slice(0, 24);

      // fetch forecasts in parallel
      const promises = list.map((p) => api.getForecast(selectedIsland, p).catch(() => []));
      const results = await Promise.all(promises);

      for (let i = 0; i < list.length; i++) {
        const product = list[i];
        const rows = results[i] || [];
        if (!rows.length) continue;

        const current = rows.slice(-1)[0];
        const next = rows.find((r: any) => r.is_forecast) || rows[rows.length - 1];

        const currentVal = current ? Math.round(current.predicted || 0) : 0;
        const nextVal = next ? Math.round(next.predicted || 0) : 0;

        const changePct = currentVal > 0 ? ((nextVal - currentVal) / currentVal) * 100 : 0;

        // consider declining if forecast drops by more than 5%
        if (changePct < -5) {
          // find MBA rule where this product is consequent
          const rule = (mbaRules || []).find((r: any) => {
            const consequents = Array.isArray(r.consequents) ? r.consequents : [r.consequents];
            return consequents.includes(product) && (r.lift || 0) > 2;
          });

          if (rule) {
            suggestions.push({
              slowProduct: product as ProductCategory,
              forecastQty: nextVal,
              anchorProduct: Array.isArray(rule.antecedents) ? rule.antecedents[0] : rule.antecedents || '',
              lift: rule.lift || 0,
              suggestedDiscount: Math.min(30, Math.round((1 - Math.min(1, Math.max(0, nextVal / Math.max(1, currentVal)))) * 30 + 10)),
              reason: `Bundle with ${Array.isArray(rule.antecedents) ? rule.antecedents[0] : rule.antecedents} — predicted drop ${Math.abs(changePct).toFixed(0)}%`,
            });
          }
        }
      }

      if (mounted) setPromoSuggestions(suggestions.sort((a, b) => b.lift - a.lift));
    }

    buildSuggestions();

    return () => {
      mounted = false;
    };
  }, [selectedIsland, products, mbaRules]);

  // Find weeks with predicted sales drop
  const weakWeeks = useMemo(() => {
    // Placeholder until forecasts for all products are fetched from API
    return [] as { week: number; total: number; date: string }[];
  }, [selectedIsland]);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Promo Planner</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Dead stock clearance and promotional timing suggestions
            </p>
          </div>
          <IslandSelector selected={selectedIsland} onChange={setSelectedIsland} />
        </div>

        {/* Weak Weeks Alert */}
        {weakWeeks.length > 0 && (
          <Card className="border-warning/30 bg-warning/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-warning flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Suggested Promo Weeks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                These weeks show lower-than-average predicted sales. Consider running promotions:
              </p>
              <div className="flex gap-2 flex-wrap">
                {weakWeeks.map((w) => (
                  <Badge key={w.week} variant="outline" className="bg-warning/10 border-warning/30">
                    Week {w.week} ({new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Promo Suggestions Grid */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Bundle & Discount Suggestions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {promoSuggestions.map((suggestion, idx) => (
              <Card key={idx} className="hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-destructive/10">
                        <TrendingDown className="w-4 h-4 text-destructive" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-sm">
                          {suggestion.slowProduct}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Avg forecast: {suggestion.forecastQty} units/week
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-0">
                      <Percent className="w-3 h-3 mr-1" />
                      {suggestion.suggestedDiscount}% off
                    </Badge>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">Bundle with:</span>
                      <Badge variant="secondary">{suggestion.anchorProduct}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {suggestion.lift.toFixed(1)}x purchase correlation
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground">{suggestion.reason}</p>

                  <Button variant="outline" size="sm" className="w-full mt-4">
                    Create Promo Campaign
                  </Button>
                </CardContent>
              </Card>
            ))}

            {promoSuggestions.length === 0 && (
              <div className="col-span-2 text-center py-12 text-muted-foreground">
                <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No promo suggestions for this region</p>
                <p className="text-xs mt-1">All products have healthy demand forecasts</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
