import { Badge } from '@/components/ui/badge';
import type { DraftStatus } from '@/types/ai-draft';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

const CONFIG: Record<DraftStatus, { variant: BadgeVariant; label: string; className?: string }> = {
  PENDING: { variant: 'outline', label: 'Pending', className: 'border-yellow-500 text-yellow-700' },
  DRY_RUN_PASSED: { variant: 'default', label: 'Dry Run Passed', className: 'bg-green-600 hover:bg-green-700' },
  DRY_RUN_FAILED: { variant: 'destructive', label: 'Dry Run Failed' },
  APPROVED: { variant: 'secondary', label: 'Approved', className: 'bg-blue-100 text-blue-800' },
  REJECTED: { variant: 'secondary', label: 'Rejected' },
};

export function DraftStatusBadge({ status }: { status: DraftStatus }) {
  const { variant, label, className } = CONFIG[status];
  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
