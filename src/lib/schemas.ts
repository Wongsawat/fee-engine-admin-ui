import { z } from 'zod';

export const PAYMENT_TYPES = [
  'DOMESTIC', 'FILE', 'INTERNATIONAL',
  'DOMESTIC_SCHEDULED', 'DOMESTIC_STANDING_ORDER',
  'INTERNATIONAL_SCHEDULED', 'INTERNATIONAL_STANDING_ORDER',
] as const;

export const INTERNATIONAL_PAYMENT_TYPES = [
  'INTERNATIONAL', 'INTERNATIONAL_SCHEDULED', 'INTERNATIONAL_STANDING_ORDER',
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
  paymentType: z.enum(PAYMENT_TYPES, { message: 'Required' }),
  scheme: z.enum(PAYMENT_SCHEMES, { message: 'Required' }),
  chargeBearer: z.enum(CHARGE_BEARERS, { message: 'Required' }),
  accountIdentification: z.string().optional(),
  chargeType: z.string().min(1, 'Required'),
  feeType: z.enum(FEE_TYPES, { message: 'Required' }),
  flatAmount: z.string().optional(),
  percentage: z.string().optional(),
  minFee: z.string().optional(),
  maxFee: z.string().optional(),
  tiers: z.array(tierSchema).optional(),
  currency: z
    .string()
    .min(1, 'Required')
    .length(3, 'Must be 3-character ISO 4217 currency code')
    .toUpperCase(),
  destinationCountry: z.string().optional(),
  priority: z.number().int().min(0).optional(),
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
  if (data.feeType !== 'PERCENTAGE') {
    if (data.minFee) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Caps only allowed on PERCENTAGE fee type',
        path: ['minFee'],
      });
    }
    if (data.maxFee) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Caps only allowed on PERCENTAGE fee type',
        path: ['maxFee'],
      });
    }
  } else {
    if (data.minFee && Number(data.minFee) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Must be greater than 0',
        path: ['minFee'],
      });
    }
    if (data.maxFee && Number(data.maxFee) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Must be greater than 0',
        path: ['maxFee'],
      });
    }
    if (data.minFee && data.maxFee && Number(data.minFee) > Number(data.maxFee)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Max must be greater than or equal to min',
        path: ['maxFee'],
      });
    }
  }
  if (data.destinationCountry && !/^[A-Z]{2}$/.test(data.destinationCountry)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Must be a 2-letter uppercase country code (e.g. GB)',
      path: ['destinationCountry'],
    });
  }
  if (
    data.destinationCountry &&
    !(INTERNATIONAL_PAYMENT_TYPES as readonly string[]).includes(data.paymentType)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Destination country only allowed for international payment types',
      path: ['destinationCountry'],
    });
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

export const DRAFT_MODES = ['GENERATE', 'UPDATE'] as const;

export const promptFormSchema = z.object({
  mode: z.enum(DRAFT_MODES, { message: 'Required' }),
  prompt: z.string().min(1, 'Required').max(2000, 'Maximum 2000 characters'),
  targetRuleId: z.string().optional(),
}).superRefine((val, ctx) => {
  if (val.mode === 'UPDATE' && !val.targetRuleId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['targetRuleId'],
      message: 'Required for UPDATE mode',
    });
  }
});

export type PromptFormValues = z.infer<typeof promptFormSchema>;
