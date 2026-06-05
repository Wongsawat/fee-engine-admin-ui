import { useSearchParams } from 'react-router-dom';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PAYMENT_TYPES, PAYMENT_SCHEMES, CHARGE_BEARERS, FEE_TYPES } from '@/lib/schemas';
import type { FeeRuleFilters } from '@/types/fee-rule';

const ALL = '__all__';

function toParam(value: string | undefined): string | undefined {
  return value === ALL ? undefined : value;
}

export function FilterBar() {
  const [params, setParams] = useSearchParams();

  function get(key: string): string {
    return params.get(key) ?? ALL;
  }

  function set(key: string, value: string) {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === ALL || value === '') next.delete(key);
      else next.set(key, value);
      next.set('page', '0');
      return next;
    });
  }

  function clear() {
    setParams({});
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Select value={get('paymentType')} onValueChange={(v) => set('paymentType', v)}>
        <SelectTrigger className="w-44" aria-label="Filter by Payment Type">
          <SelectValue placeholder="Payment Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All types</SelectItem>
          {PAYMENT_TYPES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={get('scheme')} onValueChange={(v) => set('scheme', v)}>
        <SelectTrigger className="w-36" aria-label="Filter by Scheme">
          <SelectValue placeholder="Scheme" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All schemes</SelectItem>
          {PAYMENT_SCHEMES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={get('chargeBearer')} onValueChange={(v) => set('chargeBearer', v)}>
        <SelectTrigger className="w-44" aria-label="Filter by Charge Bearer">
          <SelectValue placeholder="Charge Bearer" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All bearers</SelectItem>
          {CHARGE_BEARERS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={get('feeType')} onValueChange={(v) => set('feeType', v)}>
        <SelectTrigger className="w-36" aria-label="Filter by Fee Type">
          <SelectValue placeholder="Fee Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All fee types</SelectItem>
          {FEE_TYPES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={get('active')} onValueChange={(v) => set('active', v)}>
        <SelectTrigger className="w-32" aria-label="Filter by Status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All</SelectItem>
          <SelectItem value="true">Active</SelectItem>
          <SelectItem value="false">Inactive</SelectItem>
        </SelectContent>
      </Select>

      <Input
        className="w-24"
        aria-label="Filter by Currency"
        placeholder="Currency"
        maxLength={3}
        value={params.get('currency') ?? ''}
        onChange={(e) => set('currency', e.target.value.toUpperCase())}
      />

      <Input
        className="w-20"
        aria-label="Filter by Destination Country"
        placeholder="Country"
        maxLength={2}
        value={params.get('destinationCountry') ?? ''}
        onChange={(e) => set('destinationCountry', e.target.value.toUpperCase())}
      />

      <Button variant="ghost" size="sm" onClick={clear}>
        Clear
      </Button>
    </div>
  );
}

export function filtersFromParams(params: URLSearchParams): FeeRuleFilters {
  return {
    paymentType: toParam(params.get('paymentType') ?? undefined),
    scheme: toParam(params.get('scheme') ?? undefined),
    chargeBearer: toParam(params.get('chargeBearer') ?? undefined),
    feeType: toParam(params.get('feeType') ?? undefined),
    currency: toParam(params.get('currency') ?? undefined),
    destinationCountry: toParam(params.get('destinationCountry') ?? undefined),
    active: params.has('active')
      ? params.get('active') === 'true'
      : undefined,
  };
}
