import { z } from 'zod';

export const PAYMENT_TYPES = [
  'DOMESTIC', 'FILE', 'INTERNATIONAL',
  'DOMESTIC_SCHEDULED', 'DOMESTIC_STANDING_ORDER',
  'INTERNATIONAL_SCHEDULED', 'INTERNATIONAL_STANDING_ORDER',
] as const;

export const PAYMENT_SCHEMES = ['FPS', 'BACS', 'CHAPS', 'SWIFT'] as const;

export const CHARGE_BEARERS = [
  'BorneByDebtor', 'BorneByCreditor', 'Shared', 'FollowingServiceLevel',
] as const;

export const FEE_TYPES = ['FLAT', 'PERCENTAGE', 'TIERED', 'FREE'] as const;

export const tierSchema = z.object({
  min: z.string().min(1, 'Required'),
  max: z.string().min(1, 'Required'),
  amount: z.string().min(1, 'Required'),
}).refine(
  (t) => Number(t.max) > Number(t.min),
  { message: 'Max must be greater than min', path: ['max'] }
);

export const ruleFormSchema = z.object({
  paymentType: z.enum(PAYMENT_TYPES, { required_error: 'Required' }),
  scheme: z.enum(PAYMENT_SCHEMES, { required_error: 'Required' }),
  chargeBearer: z.enum(CHARGE_BEARERS, { required_error: 'Required' }),
  accountIdentification: z.string().optional(),
  chargeType: z.string().min(1, 'Required'),
  feeType: z.enum(FEE_TYPES, { required_error: 'Required' }),
  flatAmount: z.string().optional(),
  percentage: z.string().optional(),
  tiers: z.array(tierSchema).optional(),
  currency: z
    .string()
    .min(1, 'Required')
    .length(3, 'Must be 3-character ISO 4217 currency code')
    .toUpperCase(),
}).superRefine((data, ctx) => {
  if (data.feeType === 'FLAT' && !data.flatAmount) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Required for FLAT fee type',
      path: ['flatAmount'],
    });
  }
  if (data.feeType === 'PERCENTAGE' && !data.percentage) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Required for PERCENTAGE fee type',
      path: ['percentage'],
    });
  }
  if (data.feeType === 'TIERED' && (!data.tiers || data.tiers.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one tier is required for TIERED fee type',
      path: ['tiers'],
    });
  }
  if (data.feeType === 'FREE') {
    if (data.flatAmount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'FREE fee type cannot have a flat amount',
        path: ['flatAmount'],
      });
    }
    if (data.percentage) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'FREE fee type cannot have a percentage',
        path: ['percentage'],
      });
    }
    if (data.tiers && data.tiers.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'FREE fee type cannot have tiers',
        path: ['tiers'],
      });
    }
  }
});

export const accountDtoSchema = z.object({
  schemeName: z.string().min(1, 'Required'),
  identification: z.string().min(1, 'Required'),
});

export const dryRunFormSchema = z.object({
  rule: ruleFormSchema,
  instructedAmount: z.object({
    amount: z.string().min(1, 'Required'),
    currency: z.string().length(3, 'Must be 3-character ISO code').toUpperCase(),
  }).optional(),
  debtorAccount: accountDtoSchema.optional(),
  creditorAccount: accountDtoSchema.optional(),
});

export type RuleFormValues = z.infer<typeof ruleFormSchema>;
export type DryRunFormValues = z.infer<typeof dryRunFormSchema>;
