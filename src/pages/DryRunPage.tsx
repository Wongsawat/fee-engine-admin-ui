import { useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { TierEditor } from '@/components/TierEditor';
import { z } from 'zod';
import {
  ruleFormSchema,
  accountDtoSchema,
  PAYMENT_TYPES, PAYMENT_SCHEMES, CHARGE_BEARERS, FEE_TYPES,
  type DryRunFormValues,
} from '@/lib/schemas';
import { useDryRun } from '@/api/dry-run';

const emptyAccountToUndefined = z.preprocess(
  (val: unknown) => {
    if (
      typeof val === 'object' &&
      val !== null &&
      !('schemeName' in val && val.schemeName) &&
      !('identification' in val && val.identification)
    ) {
      return undefined;
    }
    return val;
  },
  accountDtoSchema.optional(),
);

const instructedAmountSchema = z.preprocess(
  (val: unknown) => {
    if (
      typeof val === 'object' &&
      val !== null &&
      !('amount' in val && (val as Record<string, unknown>).amount)
    ) {
      return undefined;
    }
    return val;
  },
  z
    .object({
      amount: z.string().min(1, 'Required'),
      currency: z.string().length(3, 'Must be 3-character ISO code').toUpperCase(),
    })
    .optional(),
);

/** Form schema that treats empty account objects as undefined. */
const formSchema = z.object({
  rule: ruleFormSchema,
  instructedAmount: instructedAmountSchema,
  debtorAccount: emptyAccountToUndefined,
  creditorAccount: emptyAccountToUndefined,
});

export function DryRunPage() {
  const location = useLocation();
  const preloadedRule = (location.state as { rule?: DryRunFormValues['rule'] } | null)?.rule;
  const dryRun = useDryRun();

  const form = useForm<DryRunFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rule: preloadedRule ?? {
        paymentType: undefined, scheme: undefined, chargeBearer: undefined,
        accountIdentification: '', chargeType: '', feeType: undefined,
        flatAmount: '', percentage: '', tiers: [], currency: '',
      },
      instructedAmount: undefined,
      debtorAccount: { schemeName: '', identification: '' },
      creditorAccount: { schemeName: '', identification: '' },
    },
  });

  const feeType = form.watch('rule.feeType');
  const instructedAmount = form.watch('instructedAmount');

  function onSubmit(values: DryRunFormValues) {
    dryRun.mutate({
      rule: values.rule,
      instructedAmount: values.instructedAmount,
      debtorAccount: values.debtorAccount,
      creditorAccount: values.creditorAccount,
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      <h1 className="text-xl font-semibold">Dry Run — Fee Preview</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Rule definition */}
            <div className="space-y-4">
              <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Rule Definition
              </h2>

              <FormField control={form.control} name="rule.paymentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger aria-label="Payment Type">
                          <SelectValue placeholder="Select…" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYMENT_TYPES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField control={form.control} name="rule.scheme"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scheme</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger aria-label="Scheme">
                          <SelectValue placeholder="Select…" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYMENT_SCHEMES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField control={form.control} name="rule.chargeBearer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Charge Bearer</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger aria-label="Charge Bearer">
                          <SelectValue placeholder="Select…" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CHARGE_BEARERS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField control={form.control} name="rule.chargeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Charge Type</FormLabel>
                    <FormControl>
                      <Input {...field} aria-label="Charge Type" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField control={form.control} name="rule.feeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fee Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger aria-label="Fee Type">
                          <SelectValue placeholder="Select…" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FEE_TYPES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {feeType === 'FLAT' && (
                <FormField control={form.control} name="rule.flatAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Flat Amount</FormLabel>
                      <FormControl>
                        <Input {...field} aria-label="Flat Amount" placeholder="0.00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {feeType === 'PERCENTAGE' && (
                <FormField control={form.control} name="rule.percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Percentage</FormLabel>
                      <FormControl>
                        <Input {...field} aria-label="Percentage" placeholder="0.00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {feeType === 'TIERED' && (
                <FormItem>
                  <FormLabel>Tiers</FormLabel>
                  <TierEditor control={form.control} name="rule.tiers" />
                  <FormMessage />
                </FormItem>
              )}

              <FormField control={form.control} name="rule.currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <Input {...field} aria-label="Currency" placeholder="GBP" maxLength={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Payment context */}
            <div className="space-y-4">
              <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Payment Context
              </h2>

              <FormField control={form.control} name="instructedAmount.amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructed Amount</FormLabel>
                    <FormControl>
                      <Input {...field} aria-label="Instructed Amount" placeholder="0.00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField control={form.control} name="instructedAmount.currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Currency</FormLabel>
                    <FormControl>
                      <Input {...field} aria-label="Amount Currency" placeholder="GBP" maxLength={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <p className="text-xs text-muted-foreground">Debtor Account (optional)</p>
              <FormField control={form.control} name="debtorAccount.schemeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scheme Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="SortCodeAccountNumber" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="debtorAccount.identification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Identification</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="12345678" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <p className="text-xs text-muted-foreground">Creditor Account (optional)</p>
              <FormField control={form.control} name="creditorAccount.schemeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scheme Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="SortCodeAccountNumber" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="creditorAccount.identification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Identification</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="87654321" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Results */}
              <Separator />

              {!instructedAmount?.amount ? (
                <p className="text-sm text-muted-foreground">
                  Provide an amount to see charges.
                </p>
              ) : dryRun.data ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Charges</p>
                  {dryRun.data.charges.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No charges calculated.</p>
                  ) : (
                    <ul className="space-y-1">
                      {dryRun.data.charges.map((c, i) => (
                        <li key={i} className="text-sm">
                          <span className="font-medium">{c.type}</span>{' '}
                          — {c.amount.amount} {c.amount.currency}{' '}
                          <span className="text-muted-foreground">({c.chargeBearer})</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          <Button type="submit" disabled={dryRun.isPending}>
            {dryRun.isPending ? 'Running…' : 'Run'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
