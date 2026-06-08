import { cn } from '@/lib/utils';

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        active
          ? 'bg-[#e9f7ee] text-[#0f6b3a]'
          : 'bg-[#eef2f7] text-[#64748b]'
      )}
    >
      <span
        className={cn(
          'inline-block h-1.5 w-1.5 rounded-full',
          active ? 'bg-[#16864a]' : 'bg-[#94a3b8]'
        )}
      />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}
