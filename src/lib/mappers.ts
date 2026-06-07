import type { CreateFeeRuleRequest, Tier } from '@/types/fee-rule';
import type { RuleFormValues } from '@/lib/schemas';

function decimal(s: string | undefined): number | undefined {
  return s ? parseFloat(s) : undefined;
}

export function toApiRuleRequest(rule: RuleFormValues): CreateFeeRuleRequest {
  return {
    paymentType: rule.paymentType,
    scheme: rule.scheme,
    chargeBearer: rule.chargeBearer,
    accountIdentification: rule.accountIdentification || undefined,
    chargeType: rule.chargeType,
    feeType: rule.feeType,
    flatAmount: decimal(rule.flatAmount),
    percentage: decimal(rule.percentage),
    minFee: decimal(rule.minFee),
    maxFee: decimal(rule.maxFee),
    tiers: rule.tiers?.map((t): Tier => ({
      min: parseFloat(t.min),
      max: parseFloat(t.max),
      amount: parseFloat(t.amount),
    })),
    currency: rule.currency,
    destinationCountry: rule.destinationCountry || undefined,
    priority: rule.priority,
  };
}
