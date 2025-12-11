import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ForecastChart } from '@/components/dashboard/ForecastChart';
import { RecommendationCard } from '@/components/dashboard/RecommendationCard';
import { IslandSelector } from '@/components/dashboard/IslandSelector';
import { AlertBanner } from '@/components/dashboard/AlertBanner';
import { MBARulesTable } from '@/components/dashboard/MBARulesTable';
import { getDashboardMetrics, recommendations as mockRecommendations } from '@/lib/mockData';
import { TrendingUp, AlertTriangle, Package, Gift, Target, Loader2 } from 'lucide-react';
import { useDashboardSummary, useRecommendations, useIslands, useProducts } from '@/hooks/useApi';

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
  
  // Use API data or fallback to mock
  const metrics = useMemo(() => {
    if (apiSummary) {
      return {
        totalForecastRevenue: apiSummary.total_products * 15000000,
        stockoutRisks: apiSummary.stockout_risks,
        bundlingOpportunities: apiSummary.opportunities,
        promoSuggestions: Math.floor(apiSummary.opportunities * 0.6),
        accuracyScore: apiSummary.forecast_accuracy,
      };
    }
    return getDashboardMetrics();
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

  // Use API recommendations or fallback to mock
  const filteredRecommendations = useMemo(() => {
    if (apiRecommendations && apiRecommendations.length > 0) {
      return apiRecommendations.map((r, idx) => ({
        id: `api-${idx}`,
        pulau: selectedIsland,
        type: r.type as 'derived_demand' | 'dead_stock',
        product: r.product,
        relatedProduct: r.related_product,
        action: r.action,
        priority: r.priority as 'high' | 'medium' | 'low',
      }));
    }
    return mockRecommendations.filter((r) => r.pulau === selectedIsland);
  }, [apiRecommendations, selectedIsland]);

  const topCategories = products.slice(0, 4);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {userName ? `Welcome back, ${userName}` : 'Retail Decision Support System'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              AI-powered forecasting and recommendations for retail operations
            </p>
          </div>
          <IslandSelector selected={selectedIsland} onChange={setSelectedIsland} />
        </div>

        {/* Alert Banner */}
        <AlertBanner />

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="Forecast Revenue"
            value={formatCurrency(metrics.totalForecastRevenue)}
            subtitle="Next 10 weeks"
            icon={<TrendingUp className="w-5 h-5" />}
            trend={{ value: 12.5, isPositive: true }}
            variant="primary"
          />
          <MetricCard
            title="Stockout Risks"
            value={metrics.stockoutRisks}
            subtitle="Items at risk"
            icon={<AlertTriangle className="w-5 h-5" />}
            variant="danger"
          />
          <MetricCard
            title="Bundle Opportunities"
            value={metrics.bundlingOpportunities}
            subtitle="High-lift pairs"
            icon={<Package className="w-5 h-5" />}
            variant="success"
          />
          <MetricCard
            title="Promo Suggestions"
            value={metrics.promoSuggestions}
            subtitle="Dead stock items"
            icon={<Gift className="w-5 h-5" />}
            variant="warning"
          />
          <MetricCard
            title="Model Accuracy"
            value={`${metrics.accuracyScore}%`}
            subtitle="Avg. MAPE score"
            icon={<Target className="w-5 h-5" />}
            variant="default"
          />
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
              Smart Recommendations
            </h2>
            <div className="space-y-3">
              {filteredRecommendations.length > 0 ? (
                filteredRecommendations.map((rec) => (
                  <RecommendationCard key={rec.id} recommendation={rec} />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No recommendations for this region
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
