import { cn } from '@/lib/utils';
import { AlertTriangle, TrendingUp, Package, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useDashboardSummary, useRecommendations } from '@/hooks/useApi';

interface Alert {
  id: string;
  type: 'warning' | 'success' | 'info';
  title: string;
  message: string;
}

const typeStyles = {
  warning: {
    bg: 'bg-warning/10 border-warning/30',
    icon: AlertTriangle,
    iconColor: 'text-warning',
  },
  success: {
    bg: 'bg-success/10 border-success/30',
    icon: TrendingUp,
    iconColor: 'text-success',
  },
  info: {
    bg: 'bg-primary/10 border-primary/30',
    icon: Package,
    iconColor: 'text-primary',
  },
};

interface AlertBannerProps {
  island?: string;
}

export function AlertBanner({ island }: AlertBannerProps) {
  const { data: summary } = useDashboardSummary();
  const { data: recommendations } = useRecommendations(island);

  const [visibleAlerts, setVisibleAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const next: Alert[] = [];

    // Priority: explicit recommendations from API
    if (recommendations && recommendations.length > 0) {
      // Map top 3 recommendations to alerts
      recommendations.slice(0, 3).forEach((r: any, idx: number) => {
        next.push({
          id: `rec-${idx}`,
          type: r.type === 'derived_demand' ? 'warning' : 'info',
          title: r.type === 'derived_demand' ? 'Derived Demand' : 'Recommendation',
          message: r.action || `${r.product} -> ${r.related_product || ''}`,
        });
      });
    }

    // Add summary-based alerts
    if (summary) {
      if (summary.stockout_risks && summary.stockout_risks > 0) {
        next.unshift({
          id: 'stockout-risk',
          type: 'warning',
          title: 'Stockout Risk',
          message: `${summary.stockout_risks} items at risk of stockout. Review replenishment plans.`,
        });
      }

      if (summary.opportunities && summary.opportunities > 0) {
        next.push({
          id: 'opps',
          type: 'success',
          title: 'Opportunities Detected',
          message: `${summary.opportunities} bundling/promo opportunities identified.`,
        });
      }
    }

    // If nothing from API, show a conservative static hint
    if (next.length === 0) {
      next.push({
        id: 'static-1',
        type: 'info',
        title: 'No immediate alerts',
        message: 'No alerts detected. Upload a dataset to generate forecasts and recommendations.',
      });
    }

    setVisibleAlerts(next);
  }, [summary, recommendations]);

  const dismissAlert = (id: string) => setVisibleAlerts((prev) => prev.filter((a) => a.id !== id));

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {visibleAlerts.map((alert) => {
        const { bg, icon: Icon, iconColor } = typeStyles[alert.type];
        return (
          <div
            key={alert.id}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg border animate-fade-in',
              bg
            )}
          >
            <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', iconColor)} />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-foreground">{alert.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
            </div>
            <button
              onClick={() => dismissAlert(alert.id)}
              className="p-1 rounded hover:bg-background/50 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
