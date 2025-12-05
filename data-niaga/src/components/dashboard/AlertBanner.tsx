import { cn } from '@/lib/utils';
import { AlertTriangle, TrendingUp, Package, X } from 'lucide-react';
import { useState } from 'react';

interface Alert {
  id: string;
  type: 'warning' | 'success' | 'info';
  title: string;
  message: string;
}

const alerts: Alert[] = [
  {
    id: '1',
    type: 'warning',
    title: 'Stockout Risk',
    message: 'KOSMETIK inventory in JAWA region may run out in 2 weeks based on current forecast.',
  },
  {
    id: '2',
    type: 'success',
    title: 'Opportunity Detected',
    message: 'High demand predicted for SKINCARE next month. Consider increasing purchase orders.',
  },
];

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

export function AlertBanner() {
  const [visibleAlerts, setVisibleAlerts] = useState(alerts);

  const dismissAlert = (id: string) => {
    setVisibleAlerts(prev => prev.filter(a => a.id !== id));
  };

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
