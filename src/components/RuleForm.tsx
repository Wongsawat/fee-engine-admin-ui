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
import { TierEditor } from './TierEditor';
import {
  ruleFormSchema, PAYMENT_TYPES, PAYMENT_SCHEMES, CHARGE_BEARERS, FEE_TYPES,
  type RuleFormValues,
} from '@/lib/schemas';

interface RuleFormProps {
  defaultValues?: Partial<RuleFormValues>;
  onSubmit: (values: RuleFormValues) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  onDryRun?: (values: RuleFormValues) => void;
  dryRunLabel?: string;
}

export function RuleForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Save',
  onDryRun,
  dryRunLabel = 'Try in Dry Run',
}: RuleFormProps) {
  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: {
      paymentType: undefined,
      scheme: undefined,
      chargeBearer: undefined,
      accountIdentification: '',
      chargeType: '',
      feeType: undefined,
      flatAmount: '',
      percentage: '',
      tiers: [],
      currency: '',
      ...defaultValues,
    },
  });

  const feeType = form.watch('feeType');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="paymentType"
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

        <FormField
          control={form.control}
          name="scheme"
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

        <FormField
          control={form.control}
          name="chargeBearer"
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

        <FormField
          control={form.control}
          name="accountIdentification"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Identification (optional)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Sort code / account number" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="chargeType"
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

        <FormField
          control={form.control}
          name="feeType"
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
          <FormField
            control={form.control}
            name="flatAmount"
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
          <FormField
            control={form.control}
            name="percentage"
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
            <TierEditor control={form.control} name="tiers" />
            <FormMessage />
          </FormItem>
        )}

        <FormField
          control={form.control}
          name="currency"
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

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {submitLabel}
          </Button>
          {onDryRun && (
            <Button type="button" variant="outline" onClick={() => onDryRun(form.getValues())}>
              {dryRunLabel}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
