// src/types/ai-draft.ts
export type DraftStatus =
  | 'PENDING'
  | 'DRY_RUN_PASSED'
  | 'DRY_RUN_FAILED'
  | 'APPROVED'
  | 'REJECTED';

export type DraftType = 'GENERATE' | 'UPDATE';

export interface AiDraftResponse {
  id: string;
  type: DraftType;
  targetRuleId: string | null;
  prompt: string;
  ruleJson: unknown;
  explanation: string | null;
  status: DraftStatus;
  dryRunResult: unknown;
  feeRuleId: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  version: number;
}

export interface GenerateDraftRequest {
  prompt: string;
  type?: DraftType;
  targetRuleId?: string;
}

export interface ReviewRuleRequest {
  ruleJson: string;
}

export interface ReviewRuleResponse {
  analysis: string;
}

export interface UpdateDraftRequest {
  ruleJson: string;
}

export interface DraftFilters {
  status?: DraftStatus;
}
