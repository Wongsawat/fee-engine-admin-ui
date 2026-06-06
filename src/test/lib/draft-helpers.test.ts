import {
  canDryRun, canApprove, canReject, canDelete, canEdit, isTerminal,
  extractRuleSummary, toGenerateRequest,
} from '@/lib/draft-helpers';
import type { DraftStatus } from '@/types/ai-draft';
import type { PromptFormValues } from '@/lib/schemas';

describe('status gate helpers', () => {
  const ALL: DraftStatus[] = ['PENDING', 'DRY_RUN_PASSED', 'DRY_RUN_FAILED', 'APPROVED', 'REJECTED'];

  it('canDryRun: true for PENDING and DRY_RUN_FAILED only', () => {
    expect(ALL.filter(canDryRun)).toEqual(['PENDING', 'DRY_RUN_FAILED']);
  });

  it('canApprove: true for DRY_RUN_PASSED only', () => {
    expect(ALL.filter(canApprove)).toEqual(['DRY_RUN_PASSED']);
  });

  it('canReject: true for PENDING, DRY_RUN_PASSED, DRY_RUN_FAILED', () => {
    expect(ALL.filter(canReject)).toEqual(['PENDING', 'DRY_RUN_PASSED', 'DRY_RUN_FAILED']);
  });

  it('canDelete: true for all except APPROVED', () => {
    expect(ALL.filter(canDelete)).toEqual(['PENDING', 'DRY_RUN_PASSED', 'DRY_RUN_FAILED', 'REJECTED']);
  });

  it('canEdit: true for PENDING, DRY_RUN_PASSED, DRY_RUN_FAILED', () => {
    expect(ALL.filter(canEdit)).toEqual(['PENDING', 'DRY_RUN_PASSED', 'DRY_RUN_FAILED']);
  });

  it('isTerminal: true for APPROVED and REJECTED', () => {
    expect(ALL.filter(isTerminal)).toEqual(['APPROVED', 'REJECTED']);
  });
});

describe('extractRuleSummary', () => {
  it('extracts paymentType, feeType, currency from valid object', () => {
    expect(
      extractRuleSummary({ paymentType: 'DOMESTIC', feeType: 'FLAT', currency: 'GBP' })
    ).toEqual({ paymentType: 'DOMESTIC', feeType: 'FLAT', currency: 'GBP' });
  });

  it('returns empty object for null', () => {
    expect(extractRuleSummary(null)).toEqual({});
  });

  it('returns empty object for non-object', () => {
    expect(extractRuleSummary('string')).toEqual({});
  });

  it('returns undefined fields for missing keys', () => {
    expect(extractRuleSummary({ paymentType: 'DOMESTIC' })).toEqual({
      paymentType: 'DOMESTIC',
      feeType: undefined,
      currency: undefined,
    });
  });

  it('ignores non-string values defensively', () => {
    expect(extractRuleSummary({ paymentType: 42 })).toEqual({
      paymentType: undefined,
      feeType: undefined,
      currency: undefined,
    });
  });
});

describe('toGenerateRequest', () => {
  it('maps GENERATE mode without targetRuleId', () => {
    const v: PromptFormValues = { mode: 'GENERATE', prompt: 'make a rule' };
    expect(toGenerateRequest(v)).toEqual({ prompt: 'make a rule', type: 'GENERATE' });
  });

  it('maps UPDATE mode with targetRuleId', () => {
    const v: PromptFormValues = { mode: 'UPDATE', prompt: 'change the fee', targetRuleId: 'rule-123' };
    expect(toGenerateRequest(v)).toEqual({ prompt: 'change the fee', type: 'UPDATE', targetRuleId: 'rule-123' });
  });
});
