import { cn } from '@/lib/utils';
import type { DraftStatus } from '@/types/ai-draft';

const CONFIG: Record<DraftStatus, { label: string; bg: string; text: string; dot: string }> = {
  PENDING: {
    label: 'Pending',
    bg: 'bg-[#fdf6e3]',
    text: 'text-[#92600f]',
    dot: 'bg-[#b7791f]',
  },
  DRY_RUN_PASSED: {
    label: 'Dry Run Passed',
    bg: 'bg-[#e9f7ee]',
    text: 'text-[#0f6b3a]',
    dot: 'bg-[#16864a]',
  },
  DRY_RUN_FAILED: {
    label: 'Dry Run Failed',
    bg: 'bg-[#fdecec]',
    text: 'text-[#a31f1c]',
    dot: 'bg-[#c8332f]',
  },
  APPROVED: {
    label: 'Approved',
    bg: 'bg-[#eef4fe]',
    text: 'text-[#163f8c]',
    dot: 'bg-[#1d5fd6]',
  },
  REJECTED: {
    label: 'Rejected',
    bg: 'bg-[#eef2f7]',
    text: 'text-[#64748b]',
    dot: 'bg-[#94a3b8]',
  },
};

export function DraftStatusBadge({ status }: { status: DraftStatus }) {
  const { label, bg, text, dot } = CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        bg,
        text
      )}
    >
      <span className={cn('inline-block h-1.5 w-1.5 rounded-full', dot)} />
      {label}
    </span>
  );
}
