import type { DraftStatus, GenerateDraftRequest } from '@/types/ai-draft';
import type { PromptFormValues } from '@/lib/schemas';

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
