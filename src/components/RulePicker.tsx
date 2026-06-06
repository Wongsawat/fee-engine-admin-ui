import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { useFeeRules } from '@/api/fee-rules';
import type { FeeRuleResponse } from '@/types/fee-rule';

interface RulePickerProps {
  value: string | undefined;
  onChange: (id: string) => void;
}

function summary(r: FeeRuleResponse): string {
  return `${r.paymentType} | ${r.scheme} | ${r.feeType} | ${r.currency}`;
}

export function RulePicker({ value, onChange }: RulePickerProps) {
  const { data } = useFeeRules({}, 0, 100);
  const rules = data?.content ?? [];
  const atLimit = rules.length >= 100;

  return (
    <div className="space-y-1">
      <Command className="rounded-md border" aria-label="Target rule">
        <CommandInput placeholder="Search rules…" />
        <CommandList>
          <CommandEmpty>No rules found.</CommandEmpty>
          <CommandGroup>
            {rules.map(rule => (
              <CommandItem
                key={rule.id}
                value={`${summary(rule)} ${rule.id}`}
                onSelect={() => onChange(rule.id)}
                className={value === rule.id ? 'bg-accent' : ''}
              >
                <div className="flex flex-col">
                  <span>{summary(rule)}</span>
                  <span className="text-xs text-muted-foreground">{rule.id.slice(0, 8)}…</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
      {atLimit && (
        <p className="text-xs text-muted-foreground">
          Showing first 100 rules — refine to narrow
        </p>
      )}
    </div>
  );
}
