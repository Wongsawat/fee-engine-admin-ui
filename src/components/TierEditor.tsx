import { useFieldArray, useWatch, useFormContext, type Control } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { TIER_RATE_TYPES } from '@/lib/schemas';

interface TierEditorProps {
  // react-hook-form's Control is contravariant in ValidateForm, making
  // Control<SpecificType> incompatible with Control<any>.  Casting to
  // Control<Record<string, any>> at the call-site is safe at runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<Record<string, any>>;
  name: string;
}

interface TierRowProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<Record<string, any>>;
  name: string;
  index: number;
  onRemove: () => void;
}

function TierRow({ control, name, index, onRemove }: TierRowProps) {
  const { setValue } = useFormContext();
  const rateType = useWatch({ control, name: `${name}.${index}.rateType` });
  const showAmount = rateType !== 'PERCENTAGE';
  const showPercentage = rateType !== 'FIXED';

  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="flex gap-2 items-start">
        <FormField
          control={control}
          name={`${name}.${index}.rateType`}
          render={({ field }) => (
            <FormItem className="w-36 flex-shrink-0">
              <FormLabel>Rate Type</FormLabel>
              <Select
                onValueChange={(next) => {
                  field.onChange(next);
                  if (next === 'PERCENTAGE') setValue(`${name}.${index}.amount`, '');
                  if (next === 'FIXED') setValue(`${name}.${index}.percentage`, '');
                }}
                value={field.value ?? ''}
              >
                <FormControl>
                  <SelectTrigger aria-label="Rate Type">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {TIER_RATE_TYPES.map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`${name}.${index}.min`}
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Min</FormLabel>
              <FormControl>
                <Input {...field} placeholder="0" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`${name}.${index}.max`}
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Max</FormLabel>
              <FormControl>
                <Input {...field} placeholder="10000" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Remove tier"
          className="mt-6"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {(showAmount || showPercentage) && (
        <div className="flex gap-2 items-start">
          {showAmount && (
            <FormField
              control={control}
              name={`${name}.${index}.amount`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="0.00" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {showPercentage && (
            <FormField
              control={control}
              name={`${name}.${index}.percentage`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Rate (0–1)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. 0.03 for 3%" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <div className="w-9 flex-shrink-0" />
        </div>
      )}
    </div>
  );
}

export function TierEditor({ control, name }: TierEditorProps) {
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <div className="space-y-2">
      {fields.map((field, index) => (
        <TierRow
          key={field.id}
          control={control}
          name={name}
          index={index}
          onRemove={() => remove(index)}
        />
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ min: '', max: '', rateType: 'FIXED', amount: '', percentage: '' })}
      >
        <Plus className="h-4 w-4 mr-1" />
        Add Tier
      </Button>
    </div>
  );
}
