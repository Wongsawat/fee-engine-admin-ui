import type { DraftStatus, DraftType, GenerateDraftRequest } from '@/types/ai-draft';

// Local structural type — mirrors the PromptFormValues shape that will be
// exported from '@/lib/schemas' by a future task. Defined locally so this
// module does not have a build-time dependency on the schemas module.
type PromptFormValues = {
  mode: DraftType;
  prompt: string;
  targetRuleId?: string;
};

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
