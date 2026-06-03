import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FilterBar, filtersFromParams } from '@/components/FilterBar';
import { RuleTable } from '@/components/RuleTable';
import { useFeeRules } from '@/api/fee-rules';

export function RuleListPage() {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page') ?? '0');
  const filters = filtersFromParams(params);

  const { data, isLoading, isError } = useFeeRules(filters, page);

  function handlePageChange(nextPage: number) {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(nextPage));
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Fee Rules</h1>
        <Button asChild>
          <Link to="/rules/new">New Rule</Link>
        </Button>
      </div>

      <FilterBar />

      {isLoading && (
        <p className="text-muted-foreground text-sm">Loading…</p>
      )}
      {isError && (
        <p className="text-destructive text-sm">Failed to load fee rules.</p>
      )}
      {data && (
        <RuleTable data={data} page={page} onPageChange={handlePageChange} />
      )}
    </div>
  );
}
