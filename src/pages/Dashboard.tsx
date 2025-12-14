import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ForecastChart } from '@/components/dashboard/ForecastChart';
import { RecommendationCard } from '@/components/dashboard/RecommendationCard';
import { IslandSelector } from '@/components/dashboard/IslandSelector';
import { AlertBanner } from '@/components/dashboard/AlertBanner';
import { MBARulesTable } from '@/components/dashboard/MBARulesTable';
import { AlertTriangle, Package, Gift, Target, Loader2 } from 'lucide-react';
import { useDashboardSummary, useRecommendations, useIslands, useProducts, useMBARules } from '@/hooks/useApi';
import api from '@/lib/api';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
};

export default function Dashboard() {
  const { data: islands = [] } = useIslands();
  const [selectedIsland, setSelectedIsland] = useState<string>(islands[0] ?? 'JAWA, BALI, & NT');
  const { data: products = [] } = useProducts(selectedIsland);
  const [userName, setUserName] = useState<string>('');
  
  // API Hooks (no mock fallback)
  const { data: apiSummary, isLoading: summaryLoading } = useDashboardSummary(selectedIsland);
  const { data: apiRecommendations } = useRecommendations(selectedIsland);
  const { data: mbaRules = [] } = useMBARules(selectedIsland);

  // Promo suggestions count: same logic as Promo.tsx (declining products + MBA rules)
  const [promoSuggestionsCount, setPromoSuggestionsCount] = useState<number>(0);

  useEffect(() => {
    let mounted = true;

    async function computePromoCount() {
      let count = 0;
      const list = (products || []).slice(0, 24);

      const promises = list.map((p) => api.getForecast(selectedIsland, p).catch(() => null));
      const results = await Promise.all(promises);

      for (let i = 0; i < list.length; i++) {
        const product = list[i];
        const res = results[i] || null;
        const rows = (res && res.forecast_data) ? res.forecast_data : (res || []);
        if (!rows || !rows.length) continue;

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
            count++;
          }
        }
      }

      if (mounted) setPromoSuggestionsCount(count);
    }

    computePromoCount();

    return () => {
      mounted = false;
    };
  }, [selectedIsland, products, mbaRules]);
  
  const metrics = useMemo(() => {
    if (!apiSummary) return null;
    return {
      totalProducts: apiSummary.total_products,
      totalIslands: apiSummary.total_islands,
      stockoutRisks: apiSummary.stockout_risks,
      bundlingOpportunities: apiSummary.opportunities,
      accuracyScore: apiSummary.forecast_accuracy,
    } as const;
  }, [apiSummary]);

  useEffect(() => {
    const stored = localStorage.getItem('dataniaga_user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setUserName(user?.name || '');
      } catch (err) {
        // Corrupted localStorage entry — remove it to avoid repeated errors
        console.warn('Failed to parse dataniaga_user from localStorage, clearing value.', err);
        localStorage.removeItem('dataniaga_user');
        setUserName('');
      }
    }
  }, []);

  // Use only API recommendations (no mock fallback)
  const filteredRecommendations = useMemo(() => {
    if (!apiRecommendations || apiRecommendations.length === 0) return [];

    const priorityWeight: Record<'high' | 'medium' | 'low', number> = {
      high: 3,
      medium: 2,
      low: 1,
    };

    const types: Array<'derived_demand' | 'dead_stock'> = ['derived_demand', 'dead_stock'];

    const byType = types.flatMap((t) => {
      return apiRecommendations
        .filter((r) => r.type === t)
        .sort((a, b) => priorityWeight[(b.priority as any) || 'low'] - priorityWeight[(a.priority as any) || 'low'])
        .slice(0, 5) // top 5 per category
        .map((r, idx) => ({
          id: `api-${t}-${idx}`,
          type: r.type as 'derived_demand' | 'dead_stock',
          product: r.product,
          related_product: r.related_product,
          title: r.product,
          description: r.action,
          anchorProduct: r.product,
          targetProduct: r.related_product,
          action: r.action,
          priority: (r.priority as 'high' | 'medium' | 'low') || 'medium',
          confidence: (r as any).confidence || 0.85,
          expectedImpact: 'Direkomendasikan',
        } as any));
    });

    return byType;
  }, [apiRecommendations, selectedIsland]);

  const topCategories = products.slice(0, 4);

  // No client-side computations; metrics strictly come from backend summary

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {userName ? `Selamat datang, ${userName}` : 'Sistem Pendukung Keputusan Ritel'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Prediksi dan rekomendasi berbasis AI untuk operasi ritel
            </p>
          </div>
          <IslandSelector selected={selectedIsland} onChange={setSelectedIsland} />
        </div>

        {/* Alert Banner */}
        <AlertBanner island={selectedIsland} />

        {/* Metrics Grid (backend-only) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="Total Produk"
            value={summaryLoading || !metrics ? '...' : String(metrics.totalProducts)}
            subtitle="SKU terlacak"
            icon={<Loader2 className="w-5 h-5" />}
            variant="primary"
          />
          <MetricCard
            title="Risiko Kehabisan Stok"
            value={summaryLoading || !metrics ? '...' : metrics.stockoutRisks}
            subtitle="Item yang berisiko"
            icon={<AlertTriangle className="w-5 h-5" />}
            variant="danger"
          />
          <MetricCard
            title="Peluang Bundel"
            value={summaryLoading || !metrics ? '...' : metrics.bundlingOpportunities}
            subtitle="Pasangan dengan lift tinggi"
            icon={<Package className="w-5 h-5" />}
            variant="success"
          />
          <MetricCard
            title="Saran Promosi"
            value={summaryLoading || !metrics ? '...' : promoSuggestionsCount}
            subtitle="Item stok mati"
            icon={<Gift className="w-5 h-5" />}
            variant="warning"
          />
          <MetricCard
            title="Akurasi Model"
            value={summaryLoading || !metrics ? '...' : `${metrics.accuracyScore}%`}
            subtitle="Skor MAPE rata-rata"
            icon={<Target className="w-5 h-5" />}
            variant="default"
          />
        </div>

        <div className="text-xs text-muted-foreground mt-2">
          Sumber data: {apiSummary ? 'API Langsung' : 'Menunggu data API'}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {topCategories.map((category) => (
            <ForecastChart
              key={category}
              island={selectedIsland}
              category={category}
              showLast={8}
            />
          ))}
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recommendations */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Rekomendasi Cerdas
            </h2>
            <div className="space-y-3">
              {filteredRecommendations.length > 0 ? (
                filteredRecommendations.map((rec) => (
                  <RecommendationCard key={rec.id} recommendation={rec} />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Tidak ada rekomendasi untuk wilayah ini
                </div>
              )}
            </div>
          </div>

          {/* MBA Rules */}
          <MBARulesTable island={selectedIsland} limit={6} />
        </div>
      </div>
    </DashboardLayout>
  );
}
