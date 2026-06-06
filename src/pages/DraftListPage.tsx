import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { DraftTable } from '@/components/DraftTable';
import { useAiDrafts } from '@/api/ai-drafts';
import type { DraftStatus } from '@/types/ai-draft';

const STATUS_OPTIONS: { value: DraftStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'DRY_RUN_PASSED', label: 'Dry Run Passed' },
  { value: 'DRY_RUN_FAILED', label: 'Dry Run Failed' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

export function DraftListPage() {
  const [params, setParams] = useSearchParams();
  const statusParam = params.get('status') as DraftStatus | null;

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useAiDrafts(statusParam ? { status: statusParam } : {});

  const drafts = data?.pages.flat() ?? [];
  const hasStatus = !!statusParam;

  function handleStatusChange(value: string) {
    setParams(value === 'ALL' ? {} : { status: value });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">AI Drafts</h1>
        <Button asChild>
          <Link to="/ai-drafts/new">New AI Draft</Link>
        </Button>
      </div>

      <div className="w-48">
        <Select value={statusParam ?? 'ALL'} onValueChange={handleStatusChange}>
          <SelectTrigger aria-label="Status filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
      {isError && <p className="text-destructive text-sm">Failed to load AI drafts.</p>}

      {data && drafts.length === 0 ? (
        hasStatus ? (
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">No drafts match the selected status filter.</p>
            <Button variant="outline" size="sm" onClick={() => setParams({})}>
              Clear filter
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            No AI drafts yet.{' '}
            <Link to="/ai-drafts/new" className="underline">
              Create your first draft to get started.
            </Link>
          </p>
        )
      ) : (
        <DraftTable drafts={drafts} />
      )}

      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  );
}
