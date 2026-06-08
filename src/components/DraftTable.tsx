import { Link } from 'react-router-dom';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DraftStatusBadge } from './DraftStatusBadge';
import { extractRuleSummary } from '@/lib/draft-helpers';
import { formatRelativeTime } from '@/lib/format';
import type { AiDraftResponse } from '@/types/ai-draft';

interface DraftTableProps {
  drafts: AiDraftResponse[];
}

export function DraftTable({ drafts }: DraftTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment Type</TableHead>
            <TableHead>Fee Type</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drafts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                No drafts to display
              </TableCell>
            </TableRow>
          ) : (
            drafts.map(draft => {
              const { paymentType, feeType, currency } = extractRuleSummary(draft.ruleJson);
              return (
                <TableRow key={draft.id}>
                  <TableCell>
                    <Badge variant="outline">{draft.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <DraftStatusBadge status={draft.status} />
                  </TableCell>
                  <TableCell className="font-mono">{paymentType ?? '—'}</TableCell>
                  <TableCell className="font-mono">{feeType ?? '—'}</TableCell>
                  <TableCell className="font-mono">{currency ?? '—'}</TableCell>
                  <TableCell>{formatRelativeTime(draft.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/ai-drafts/${draft.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
