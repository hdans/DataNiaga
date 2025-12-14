import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ForecastChart } from '@/components/dashboard/ForecastChart';
import { RecommendationCard } from '@/components/dashboard/RecommendationCard';
import { IslandSelector } from '@/components/dashboard/IslandSelector';
import { AlertBanner } from '@/components/dashboard/AlertBanner';
import { MBARulesTable } from '@/components/dashboard/MBARulesTable';
import { getDashboardMetrics } from '@/lib/mockData';
import { TrendingUp, AlertTriangle, Package, Gift, Target, Loader2 } from 'lucide-react';
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
  
  // API Hooks with fallback to mock data
  const { data: apiSummary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: apiRecommendations } = useRecommendations(selectedIsland);
  const { data: mbaRules = [] } = useMBARules(selectedIsland);

  // Computed region-aware metrics (client-side, limited)
  const [computedLoading, setComputedLoading] = useState(false);
  const [computedMetrics, setComputedMetrics] = useState({
    stockoutRisks: 0,
    bundlingOpportunities: 0,
    promoSuggestions: 0,
    modelAccuracy: apiSummary?.forecast_accuracy ?? 0,
  });
  
  // Use API data or fallback to mock
  const metrics = useMemo(() => {
    if (apiSummary) {
      return {
        totalProducts: apiSummary.total_products,
        totalIslands: apiSummary.total_islands,
        stockoutRisks: apiSummary.stockout_risks,
        bundlingOpportunities: apiSummary.opportunities,
        promoSuggestions: Math.floor(apiSummary.opportunities * 0.6),
        accuracyScore: apiSummary.forecast_accuracy,
      } as const;
    }

    const fallback = getDashboardMetrics();
    return {
      totalProducts: (products && products.length > 0) ? products.length : (fallback.totalForecastRevenue ?? 0),
      totalIslands: (islands && islands.length > 0) ? islands.length : 1,
      stockoutRisks: fallback.stockoutRisks,
      bundlingOpportunities: fallback.bundlingOpportunities,
      promoSuggestions: fallback.promoSuggestions,
      accuracyScore: Number(fallback.accuracyScore) || 0,
    } as const;
  }, [apiSummary, products, islands]);

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
          pulau: selectedIsland,
          type: r.type as 'derived_demand' | 'dead_stock',
          product: r.product,
          relatedProduct: r.related_product,
          action: r.action,
          priority: r.priority as 'high' | 'medium' | 'low',
          confidence: (r as any).confidence,
        }));
    });

    return byType;
  }, [apiRecommendations, selectedIsland]);

  const topCategories = products.slice(0, 4);

  // Compute client-side metrics: limited to top N products to avoid too many requests
  useEffect(() => {
    let mounted = true;
    const N = 24;

    async function computeMetrics() {
      if (!selectedIsland || (products || []).length === 0) {
        return;
      }
      setComputedLoading(true);

      try {
  const list = (products || []).slice(0, N);
  // fetch forecasts in parallel (backend may return { forecast_data, model_metrics })
  const promises = list.map((p) => api.getForecast(selectedIsland, p).catch(() => null));
  const results = await Promise.all(promises);

        // stockout: next < current
        let stockout = 0;
        const perProductMAPEs: number[] = [];

        for (let i = 0; i < list.length; i++) {
          const res = results[i] || null;
          const rows = (res && res.forecast_data) ? res.forecast_data : (res || []);
          if (!rows.length) continue;

          const current = rows.slice(-2)[0] ?? rows[rows.length - 1];
          const next = rows[rows.length - 1];
          const currentVal = current ? (current.predicted ?? current.actual ?? 0) : 0;
          const nextVal = next ? (next.predicted ?? next.actual ?? 0) : 0;
          if (nextVal < currentVal) stockout += 1;

          // compute MAPE for product if actuals exist
          const pairs = rows.filter((r: any) => r.actual != null && r.predicted != null);
          if (pairs.length) {
            const mape = pairs.reduce((acc: number, r: any) => acc + Math.abs((r.actual - r.predicted) / Math.max(1, r.actual)), 0) / pairs.length * 100;
            if (!Number.isNaN(mape) && Number.isFinite(mape)) perProductMAPEs.push(mape);
          }
        }

        // bundling opportunities: count mba rules in region with lift >= 1.5
        const bundling = (mbaRules || []).filter((r: any) => (r.lift ?? 0) >= 1.5).length;

        // promo suggestions: prefer API recommendations if available otherwise derive from declines matched with mba rules
        let promoCount = 0;
        if (apiRecommendations && apiRecommendations.length > 0) {
          promoCount = apiRecommendations.length;
        } else {
          // derive: count of products where decline AND there exists an mba rule with the product as consequent
          const derived = new Set<string>();
          for (let i = 0; i < list.length; i++) {
            const product = list[i];
            const res = results[i] || null;
            const rows = (res && res.forecast_data) ? res.forecast_data : (res || []);
            if (!rows.length) continue;
            const current = rows.slice(-2)[0] ?? rows[rows.length - 1];
            const next = rows[rows.length - 1];
            const currentVal = current ? (current.predicted ?? current.actual ?? 0) : 0;
            const nextVal = next ? (next.predicted ?? next.actual ?? 0) : 0;
            if (nextVal < currentVal) {
              const rule = (mbaRules || []).find((r: any) => {
                const consequents = Array.isArray(r.consequents) ? r.consequents : [r.consequents];
                return consequents.includes(product);
              });
              if (rule) derived.add(product);
            }
          }
          promoCount = derived.size;
        }

        const modelAcc = apiSummary?.forecast_accuracy ?? (perProductMAPEs.length ? Math.round(perProductMAPEs.reduce((a, b) => a + b, 0) / perProductMAPEs.length) : 0);

        if (mounted) {
          setComputedMetrics({ stockoutRisks: stockout, bundlingOpportunities: bundling, promoSuggestions: promoCount, modelAccuracy: modelAcc });
        }
      } catch (err) {
        console.warn('Failed computing metrics', err);
      } finally {
        if (mounted) setComputedLoading(false);
      }
    }

    computeMetrics();
    return () => {
      mounted = false;
    };
  }, [selectedIsland, products, mbaRules, apiRecommendations, apiSummary]);

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

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard
              title="Total Produk"
              value={summaryLoading ? '...' : String(metrics.totalProducts)}
              subtitle="SKU terlacak"
              icon={<Loader2 className="w-5 h-5" />}
              variant="primary"
            />
          <MetricCard
            title="Risiko Kehabisan Stok"
            value={summaryLoading ? '...' : (apiSummary?.stockout_risks ?? computedMetrics.stockoutRisks)}
            subtitle="Item yang berisiko"
            icon={<AlertTriangle className="w-5 h-5" />}
            variant="danger"
          />
          <MetricCard
            title="Peluang Bundel"
            value={summaryLoading ? '...' : (apiSummary?.opportunities ?? computedMetrics.bundlingOpportunities)}
            subtitle="Pasangan dengan lift tinggi"
            icon={<Package className="w-5 h-5" />}
            variant="success"
          />
          <MetricCard
            title="Saran Promosi"
            value={summaryLoading || computedLoading ? '...' : computedMetrics.promoSuggestions}
            subtitle="Item stok mati"
            icon={<Gift className="w-5 h-5" />}
            variant="warning"
          />
          <MetricCard
            title="Akurasi Model"
            value={summaryLoading || computedLoading ? '...' : `${computedMetrics.modelAccuracy}%`}
            subtitle="Skor MAPE rata-rata"
            icon={<Target className="w-5 h-5" />}
            variant="default"
          />
        </div>

        <div className="text-xs text-muted-foreground mt-2">
          Sumber data: {apiSummary ? 'API Langsung' : 'Data simulasi / tidak ada respons API'}
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
