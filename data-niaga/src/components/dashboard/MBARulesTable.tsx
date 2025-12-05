import { mbaRules, Island } from '@/lib/mockData';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MBARulesTableProps {
  island?: Island;
  limit?: number;
}

export function MBARulesTable({ island, limit = 10 }: MBARulesTableProps) {
  const filteredRules = island
    ? mbaRules.filter((r) => r.pulau === island).slice(0, limit)
    : mbaRules.slice(0, limit);

  const getLiftColor = (lift: number) => {
    if (lift >= 3.5) return 'text-success font-semibold';
    if (lift >= 2.5) return 'text-primary font-medium';
    return 'text-muted-foreground';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          Association Rules (MBA)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">If Customer Buys</TableHead>
              <TableHead className="text-xs"></TableHead>
              <TableHead className="text-xs">They Also Buy</TableHead>
              <TableHead className="text-xs text-right">Confidence</TableHead>
              <TableHead className="text-xs text-right">Lift</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {rule.antecedent}
                  </Badge>
                </TableCell>
                <TableCell>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {rule.consequent}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-xs">
                  {(rule.confidence * 100).toFixed(0)}%
                </TableCell>
                <TableCell className={cn('text-right text-xs', getLiftColor(rule.lift))}>
                  {rule.lift.toFixed(2)}x
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
