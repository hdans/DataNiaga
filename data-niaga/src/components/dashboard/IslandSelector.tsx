import { cn, toTitleCase } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { useIslands } from '@/hooks/useApi';

interface IslandSelectorProps {
  selected: string;
  onChange: (island: string) => void;
  className?: string;
}

export function IslandSelector({ selected, onChange, className }: IslandSelectorProps) {
  const { data: islands = [] } = useIslands();

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mr-2">
        <MapPin className="w-4 h-4" />
        <span className="font-medium">Wilayah:</span>
      </div>
      {islands.map((island) => (
        <Button
          key={island}
          variant={selected === island ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(island)}
          className={cn(
            'text-xs h-8',
            selected === island && 'shadow-glow'
          )}
        >
          {toTitleCase(island)}
        </Button>
      ))}
    </div>
  );
}
