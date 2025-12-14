import { cn, toTitleCase } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Gift, MapPin, TrendingUp, ArrowRight } from 'lucide-react';
import { Recommendation } from '@/lib/mockData';

interface RecommendationCardProps {
  recommendation: Recommendation;
  className?: string;
}

const typeConfig = {
  stockup: {
    icon: TrendingUp,
    label: 'Tambah Stok',
    color: 'bg-success/10 text-success border-success/20',
  },
  bundling: {
    icon: Package,
    label: 'Bundel',
    color: 'bg-primary/10 text-primary border-primary/20',
  },
  promo: {
    icon: Gift,
    label: 'Promosi',
    color: 'bg-warning/10 text-warning border-warning/20',
  },
  layout: {
    icon: MapPin,
    label: 'Tata Letak',
    color: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  },
  derived_demand: {
    icon: TrendingUp,
    label: 'Tambah Stok',
    color: 'bg-success/10 text-success border-success/20',
  },
  dead_stock: {
    icon: Gift,
    label: 'Promosi',
    color: 'bg-warning/10 text-warning border-warning/20',
  },
};

const defaultTypeConfig = {
  icon: Package,
  label: 'Rekomendasi',
  color: 'bg-primary/10 text-primary border-primary/20',
};

const priorityConfig = {
  high: 'bg-destructive text-destructive-foreground',
  medium: 'bg-warning text-warning-foreground',
  low: 'bg-muted text-muted-foreground',
}; // Priority labels are used as-is; values are 'high', 'medium', 'low'

export function RecommendationCard({ recommendation, className }: RecommendationCardProps) {
  const config = typeConfig[recommendation.type as keyof typeof typeConfig] || defaultTypeConfig;
  const { icon: Icon, label, color } = config;

  return (
    <Card className={cn('overflow-hidden hover:shadow-md transition-all', className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn('p-2 rounded-lg border', color)}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-sm text-foreground truncate">
                {toTitleCase((recommendation as any).title || (recommendation as any).product || 'Recommendation')}
              </h4>
              <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', priorityConfig[recommendation.priority])}>
                {recommendation.priority === 'high' ? 'Prioritas Tinggi' : recommendation.priority === 'medium' ? 'Prioritas Sedang' : 'Prioritas Rendah'}
              </Badge>
            </div>
            
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {(recommendation as any).description || (recommendation as any).action || 'Rekomendasi cerdas'}
            </p>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="secondary" className="text-[10px]">
                {toTitleCase((recommendation as any).anchorProduct || (recommendation as any).product || 'Produk')}
              </Badge>
              {((recommendation as any).targetProduct || (recommendation as any).related_product) && (
                <>
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  <Badge variant="secondary" className="text-[10px]">
                    {toTitleCase((recommendation as any).targetProduct || (recommendation as any).related_product)}
                  </Badge>
                </>
              )}
            </div>

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
              <span className="text-xs font-medium text-success">
                {(recommendation as any).expectedImpact || 'Direkomendasikan'}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {(recommendation as any).confidence ? Math.round((recommendation as any).confidence * 100) : 85}% keyakinan
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

