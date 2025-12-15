// dynamic island strings are used from API
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
import { cn, toTitleCase } from '@/lib/utils';
import { useMBARules } from '@/hooks/useApi';

interface MBARulesTableProps {
  island?: string;
  limit?: number;
}

export function MBARulesTable({ island, limit = 10 }: MBARulesTableProps) {
  const { data: rules, isLoading, isError } = useMBARules(island as any);

  const filteredRules = (rules || []).slice(0, limit);

  const getLiftColor = (lift: number) => {
    if (lift >= 3.5) return 'text-success font-semibold';
    if (lift >= 2.5) return 'text-primary font-medium';
    return 'text-muted-foreground';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          Aturan Asosiasi (MBA)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Jika Pelanggan Membeli</TableHead>
              <TableHead className="text-xs"></TableHead>
              <TableHead className="text-xs">Mereka Juga Membeli</TableHead>
              <TableHead className="text-xs text-right">Kepercayaan</TableHead>
              <TableHead className="text-xs text-right">Lift</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-xs py-4">
                  Memuat aturan...
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-xs py-4">
                  Gagal memuat aturan MBA
                </TableCell>
              </TableRow>
            ) : filteredRules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-xs py-4">
                  Tidak ada aturan yang tersedia
                </TableCell>
              </TableRow>
            ) : (
              filteredRules.map((rule: any, idx: number) => {
                const antecedent = Array.isArray(rule.antecedents)
                  ? rule.antecedents.join(', ')
                  : rule.antecedents ?? rule.antecedent ?? '';
                const consequent = Array.isArray(rule.consequents)
                  ? rule.consequents.join(', ')
                  : rule.consequents ?? rule.consequent ?? '';

                const confidence = typeof rule.confidence === 'number' ? rule.confidence : 0;
                const lift = typeof rule.lift === 'number' ? rule.lift : 0;

                return (
                  <TableRow key={rule.id ?? idx}>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {toTitleCase(antecedent)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {toTitleCase(consequent)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {(confidence * 100).toFixed(0)}%
                    </TableCell>
                    <TableCell className={cn('text-right text-xs', getLiftColor(lift))}>
                      {lift.toFixed(2)}x
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
