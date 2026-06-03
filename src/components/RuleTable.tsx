import { useNavigate } from 'react-router-dom';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './StatusBadge';
import { useToggleFeeRuleStatus } from '@/api/fee-rules';
import type { FeeRulePageResponse } from '@/types/fee-rule';

interface RuleTableProps {
  data: FeeRulePageResponse;
  page: number;
  onPageChange: (page: number) => void;
}

export function RuleTable({ data, page, onPageChange }: RuleTableProps) {
  const navigate = useNavigate();
  const toggle = useToggleFeeRuleStatus();

  return (
    <div className="space-y-3">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment Type</TableHead>
              <TableHead>Scheme</TableHead>
              <TableHead>Charge Bearer</TableHead>
              <TableHead>Fee Type</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.content.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  No fee rules found
                </TableCell>
              </TableRow>
            ) : (
              data.content.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>{rule.paymentType}</TableCell>
                  <TableCell>{rule.scheme}</TableCell>
                  <TableCell>{rule.chargeBearer}</TableCell>
                  <TableCell>{rule.feeType}</TableCell>
                  <TableCell>{rule.currency}</TableCell>
                  <TableCell>{rule.accountIdentification ?? '—'}</TableCell>
                  <TableCell><StatusBadge active={rule.active} /></TableCell>
                  <TableCell>{new Date(rule.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/rules/${rule.id}`)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggle.mutate({ id: rule.id, active: !rule.active, version: rule.version })}
                      disabled={toggle.isPending}
                    >
                      {rule.active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {data.page.totalElements} total · page {data.page.number + 1} of {data.page.totalPages || 1}
        </span>
        <div className="space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= data.page.totalPages - 1}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
