import { useLocation, useNavigate } from 'react-router-dom';
import { RuleForm } from '@/components/RuleForm';
import { useFeeRule, useCreateFeeRule, useUpdateFeeRule } from '@/api/fee-rules';
import type { RuleFormValues } from '@/lib/schemas';
import { toApiRuleRequest } from '@/lib/mappers';

function extractIdFromPath(pathname: string): string | undefined {
  const segments = pathname.split('/').filter(Boolean);
  const rulesIdx = segments.indexOf('rules');
  if (rulesIdx === -1 || rulesIdx + 1 >= segments.length) return undefined;
  const candidate = segments[rulesIdx + 1];
  if (candidate === 'new') return undefined;
  return candidate;
}

export function RuleFormPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const id = extractIdFromPath(location.pathname);
  const isEdit = !!id;

  const { data: existing, isLoading } = useFeeRule(id);
  const createMutation = useCreateFeeRule();
  const updateMutation = useUpdateFeeRule();

  const isPending = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(values: RuleFormValues) {
    const apiRule = toApiRuleRequest(values);
    if (isEdit && existing) {
      updateMutation.mutate(
        { id, ...apiRule, version: existing.version },
        { onSuccess: () => navigate('/rules') }
      );
    } else {
      createMutation.mutate(apiRule, {
        onSuccess: () => navigate('/rules'),
      });
    }
  }

  function handleDryRun(values: RuleFormValues) {
    navigate('/dry-run', { state: { rule: values } });
  }

  if (isEdit && isLoading) {
    return <p className="p-6 text-muted-foreground text-sm">Loading…</p>;
  }

  const defaultValues: Partial<RuleFormValues> | undefined = existing
    ? {
        paymentType: existing.paymentType,
        scheme: existing.scheme,
        chargeBearer: existing.chargeBearer,
        accountIdentification: existing.accountIdentification ?? '',
        chargeType: existing.chargeType,
        feeType: existing.feeType,
        flatAmount: existing.flatAmount != null ? String(existing.flatAmount) : '',
        percentage: existing.percentage != null ? String(existing.percentage) : '',
        minFee: existing.minFee != null ? String(existing.minFee) : '',
        maxFee: existing.maxFee != null ? String(existing.maxFee) : '',
        tiers: existing.tiers?.map((t) => ({
          min: String(t.min), max: String(t.max), amount: String(t.amount),
        })) ?? [],
        currency: existing.currency,
        destinationCountry: existing.destinationCountry ?? '',
        priority: existing.priority ?? 0,
      }
    : undefined;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
      <h1 className="text-xl font-semibold">
        {isEdit ? 'Edit Fee Rule' : 'New Fee Rule'}
      </h1>
      <RuleForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        isSubmitting={isPending}
        onDryRun={handleDryRun}
        dryRunLabel={isEdit ? 'Dry Run' : 'Try in Dry Run'}
      />
    </div>
  );
}
