import type { DraftStatus, GenerateDraftRequest } from '@/types/ai-draft';
import type { PromptFormValues, RuleFormValues } from '@/lib/schemas';

export function canDryRun(status: DraftStatus): boolean {
  return status === 'PENDING' || status === 'DRY_RUN_FAILED';
}

export function canApprove(status: DraftStatus): boolean {
  return status === 'DRY_RUN_PASSED';
}

export function canReject(status: DraftStatus): boolean {
  return status === 'PENDING' || status === 'DRY_RUN_PASSED' || status === 'DRY_RUN_FAILED';
}

export function canDelete(status: DraftStatus): boolean {
  return status !== 'APPROVED';
}

export function canEdit(status: DraftStatus): boolean {
  return status === 'PENDING' || status === 'DRY_RUN_PASSED' || status === 'DRY_RUN_FAILED';
}

export function isTerminal(status: DraftStatus): boolean {
  return status === 'APPROVED' || status === 'REJECTED';
}

export function extractRuleSummary(ruleJson: unknown): {
  paymentType?: string;
  feeType?: string;
  currency?: string;
} {
  if (!ruleJson || typeof ruleJson !== 'object') return {};
  const r = ruleJson as Record<string, unknown>;
  return {
    paymentType: typeof r.paymentType === 'string' ? r.paymentType : undefined,
    feeType: typeof r.feeType === 'string' ? r.feeType : undefined,
    currency: typeof r.currency === 'string' ? r.currency : undefined,
  };
}

export function toGenerateRequest(v: PromptFormValues): GenerateDraftRequest {
  if (v.mode === 'UPDATE') {
    return { prompt: v.prompt, type: 'UPDATE', targetRuleId: v.targetRuleId };
  }
  return { prompt: v.prompt, type: 'GENERATE' };
}

export function ruleJsonToFormValues(ruleJson: unknown): Partial<RuleFormValues> {
  if (!ruleJson || typeof ruleJson !== 'object') return {};
  const r = ruleJson as Record<string, unknown>;
  return {
    paymentType: r.paymentType as RuleFormValues['paymentType'],
    scheme: r.scheme as RuleFormValues['scheme'],
    chargeBearer: r.chargeBearer as RuleFormValues['chargeBearer'],
    accountIdentification: typeof r.accountIdentification === 'string' ? r.accountIdentification : undefined,
    chargeType: typeof r.chargeType === 'string' ? r.chargeType : '',
    feeType: r.feeType as RuleFormValues['feeType'],
    flatAmount: r.flatAmount != null ? String(r.flatAmount) : undefined,
    percentage: r.percentage != null ? String(r.percentage) : undefined,
    minFee: r.minFee != null ? String(r.minFee) : undefined,
    maxFee: r.maxFee != null ? String(r.maxFee) : undefined,
    tiers: Array.isArray(r.tiers)
      ? r.tiers.map((t: Record<string, unknown>) => ({
          min: String(t.min),
          max: String(t.max),
          rateType: (t.rateType as 'FIXED' | 'PERCENTAGE' | 'HYBRID' | 'GREATER_OF' | undefined) ?? 'FIXED',
          amount: t.amount != null ? String(t.amount) : undefined,
          percentage: t.percentage != null ? String(t.percentage) : undefined,
        }))
      : [],
    currency: typeof r.currency === 'string' ? r.currency : '',
    destinationCountry: typeof r.destinationCountry === 'string' ? r.destinationCountry : undefined,
    priority: typeof r.priority === 'number' ? r.priority : undefined,
  };
}

/** Normalises key order for tier display; items without a `rateType` field (legacy data) pass through unchanged. */
export function normalizeTierKeyOrder(tiers: unknown[]): unknown[] {
  return tiers.map((item) => {
    if (item && typeof item === 'object' && 'min' in item && 'max' in item && 'rateType' in item) {
      const t = item as Record<string, unknown>;
      return {
        min: t.min,
        max: t.max,
        rateType: t.rateType,
        ...(t.amount != null && { amount: t.amount }),
        ...(t.percentage != null && { percentage: t.percentage }),
      };
    }
    return item;
  });
}
