import {
  canDryRun, canApprove, canReject, canDelete, canEdit, isTerminal,
  extractRuleSummary, toGenerateRequest, normalizeTierKeyOrder, ruleJsonToFormValues,
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

describe('normalizeTierKeyOrder', () => {
  it('FIXED tier: emits min, max, rateType, amount (no percentage)', () => {
    const result = normalizeTierKeyOrder([{ min: 0, max: 10000, rateType: 'FIXED', amount: 5.00 }]);
    expect(result[0]).toEqual({ min: 0, max: 10000, rateType: 'FIXED', amount: 5.00 });
    expect(result[0]).not.toHaveProperty('percentage');
  });

  it('PERCENTAGE tier: emits min, max, rateType, percentage (no amount)', () => {
    const result = normalizeTierKeyOrder([{ min: 0, max: 10000, rateType: 'PERCENTAGE', percentage: 0.03 }]);
    expect(result[0]).toEqual({ min: 0, max: 10000, rateType: 'PERCENTAGE', percentage: 0.03 });
    expect(result[0]).not.toHaveProperty('amount');
  });

  it('HYBRID tier: emits min, max, rateType, amount, percentage', () => {
    const result = normalizeTierKeyOrder([{ min: 0, max: 10000, rateType: 'HYBRID', amount: 2.00, percentage: 0.03 }]);
    expect(result[0]).toEqual({ min: 0, max: 10000, rateType: 'HYBRID', amount: 2.00, percentage: 0.03 });
  });

  it('normalises key order regardless of input key order', () => {
    const result = normalizeTierKeyOrder([{ percentage: 0.03, rateType: 'PERCENTAGE', max: 10000, min: 0 }]);
    expect(Object.keys(result[0] as object)).toEqual(['min', 'max', 'rateType', 'percentage']);
  });

  it('passes non-tier items through unchanged', () => {
    const result = normalizeTierKeyOrder([{ foo: 'bar' }]);
    expect(result[0]).toEqual({ foo: 'bar' });
  });

  it('GREATER_OF tier: emits min, max, rateType, amount, percentage', () => {
    const result = normalizeTierKeyOrder([{ min: 0, max: 10000, rateType: 'GREATER_OF', amount: 2.00, percentage: 0.03 }]);
    expect(result[0]).toEqual({ min: 0, max: 10000, rateType: 'GREATER_OF', amount: 2.00, percentage: 0.03 });
  });
});

describe('ruleJsonToFormValues', () => {
  it('returns empty object for null or non-object', () => {
    expect(ruleJsonToFormValues(null)).toEqual({});
    expect(ruleJsonToFormValues('string')).toEqual({});
  });

  it('maps flat rule fields to form strings', () => {
    const result = ruleJsonToFormValues({
      paymentType: 'DOMESTIC', scheme: 'FPS', chargeBearer: 'BorneByDebtor',
      chargeType: 'Fee', feeType: 'FLAT', flatAmount: 1.50, currency: 'GBP', priority: 0,
    });
    expect(result.feeType).toBe('FLAT');
    expect(result.flatAmount).toBe('1.5');
    expect(result.currency).toBe('GBP');
    expect(result.tiers).toEqual([]);
  });

  it('maps FIXED tier: rateType, amount as string, no percentage', () => {
    const result = ruleJsonToFormValues({
      feeType: 'TIERED_SLAB', currency: 'GBP',
      tiers: [{ min: 0, max: 10000, rateType: 'FIXED', amount: 5 }],
    });
    expect(result.tiers).toEqual([
      { min: '0', max: '10000', rateType: 'FIXED', amount: '5', percentage: undefined },
    ]);
  });

  it('maps PERCENTAGE tier: rateType, percentage as string, amount undefined', () => {
    const result = ruleJsonToFormValues({
      feeType: 'TIERED_SLAB', currency: 'GBP',
      tiers: [{ min: 0, max: 10000, rateType: 'PERCENTAGE', percentage: 0.03 }],
    });
    expect(result.tiers).toEqual([
      { min: '0', max: '10000', rateType: 'PERCENTAGE', amount: undefined, percentage: '0.03' },
    ]);
  });

  it('maps HYBRID tier: both amount and percentage as strings', () => {
    const result = ruleJsonToFormValues({
      feeType: 'TIERED_SLAB', currency: 'GBP',
      tiers: [{ min: 0, max: 10000, rateType: 'HYBRID', amount: 2, percentage: 0.005 }],
    });
    expect(result.tiers).toEqual([
      { min: '0', max: '10000', rateType: 'HYBRID', amount: '2', percentage: '0.005' },
    ]);
  });

  it('falls back to FIXED when rateType is missing (legacy data)', () => {
    const result = ruleJsonToFormValues({
      feeType: 'TIERED_SLAB', currency: 'GBP',
      tiers: [{ min: 0, max: 10000, amount: 5 }],
    });
    expect(result.tiers?.[0].rateType).toBe('FIXED');
  });
});
