import { useForm, FormProvider, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test-utils';
import { TierEditor } from '@/components/TierEditor';
import { tierSchema, type RuleFormValues } from '@/lib/schemas';
import { toApiRuleRequest } from '@/lib/mappers';

const schema = z.object({ tiers: z.array(tierSchema) });

function Harness({ onSubmit = vi.fn() }: { onSubmit?: (data: unknown) => void }) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { tiers: [] as Array<z.infer<typeof tierSchema>> },
  });
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <TierEditor control={form.control as Control<Record<string, any>>} name="tiers" />
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}

async function selectRateType(value: string) {
  const trigger = screen.getByRole('combobox', { name: /rate type/i });
  await userEvent.click(trigger);
  const option = await screen.findByRole('option', { name: value });
  await userEvent.click(option);
}

describe('TierEditor', () => {
  it('renders empty state with add button', () => {
    renderWithProviders(<Harness />);
    expect(screen.getByRole('button', { name: /add tier/i })).toBeInTheDocument();
  });

  it('adds a tier defaulting to FIXED: Amount visible, Rate hidden', async () => {
    renderWithProviders(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: /add tier/i }));
    expect(screen.getByRole('combobox', { name: /rate type/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^amount$/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/rate \(0/i)).not.toBeInTheDocument();
  });

  it('removes a tier row when Remove is clicked', async () => {
    renderWithProviders(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: /add tier/i }));
    fireEvent.click(screen.getByRole('button', { name: /remove tier/i }));
    expect(screen.queryByRole('combobox', { name: /rate type/i })).not.toBeInTheDocument();
  });

  it('switching to PERCENTAGE hides Amount and shows Rate', async () => {
    renderWithProviders(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: /add tier/i }));
    await selectRateType('PERCENTAGE');
    expect(screen.queryByLabelText(/^amount$/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/rate \(0/i)).toBeInTheDocument();
  });

  it('switching to HYBRID shows both Amount and Rate', async () => {
    renderWithProviders(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: /add tier/i }));
    await selectRateType('HYBRID');
    expect(screen.getByLabelText(/^amount$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/rate \(0/i)).toBeInTheDocument();
  });

  it('switching to GREATER_OF shows both Amount and Rate', async () => {
    renderWithProviders(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: /add tier/i }));
    await selectRateType('GREATER_OF');
    expect(screen.getByLabelText(/^amount$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/rate \(0/i)).toBeInTheDocument();
  });

  it('HYBRID → FIXED clears percentage; switching back shows empty Rate field', async () => {
    renderWithProviders(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: /add tier/i }));
    await selectRateType('HYBRID');
    await userEvent.type(screen.getByLabelText(/rate \(0/i), '0.05');
    await selectRateType('FIXED');
    expect(screen.queryByLabelText(/rate \(0/i)).not.toBeInTheDocument();
    await selectRateType('PERCENTAGE');
    expect(screen.getByLabelText(/rate \(0/i)).toHaveValue('');
  });

  it('FIXED → PERCENTAGE clears amount; switching back shows empty Amount field', async () => {
    renderWithProviders(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: /add tier/i }));
    await userEvent.type(screen.getByLabelText(/^amount$/i), '5.00');
    await selectRateType('PERCENTAGE');
    expect(screen.queryByLabelText(/^amount$/i)).not.toBeInTheDocument();
    await selectRateType('FIXED');
    expect(screen.getByLabelText(/^amount$/i)).toHaveValue('');
  });

  it('PERCENTAGE → HYBRID keeps Rate value and reveals Amount', async () => {
    renderWithProviders(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: /add tier/i }));
    await selectRateType('PERCENTAGE');
    await userEvent.type(screen.getByLabelText(/rate \(0/i), '0.05');
    await selectRateType('HYBRID');
    expect(screen.getByLabelText(/^amount$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/rate \(0/i)).toHaveValue('0.05');
  });

  it('stale amount is cleared in RHF state before form submission', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(<Harness onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: /add tier/i }));
    await userEvent.type(screen.getByLabelText(/^min$/i), '0');
    await userEvent.type(screen.getByLabelText(/^max$/i), '10000');
    await userEvent.type(screen.getByLabelText(/^amount$/i), '5.00');
    await selectRateType('PERCENTAGE');
    await userEvent.type(screen.getByLabelText(/rate \(0/i), '0.03');
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const tiers = (onSubmit.mock.calls[0][0] as { tiers: Array<Record<string, string>> }).tiers;
    // Assert RHF state: amount cleared by onValueChange, percentage present
    expect(tiers[0].amount).toBe('');
    expect(tiers[0].percentage).toBe('0.03');
    expect(tiers[0].rateType).toBe('PERCENTAGE');
    // Assert mapper strips the empty amount from the outbound API request
    const apiRule = toApiRuleRequest({
      paymentType: 'DOMESTIC',
      scheme: 'FPS',
      chargeBearer: 'BorneByDebtor',
      chargeType: 'Fee',
      feeType: 'TIERED_SLAB',
      currency: 'GBP',
      tiers: tiers as RuleFormValues['tiers'],
    });
    expect(apiRule.tiers?.[0]).not.toHaveProperty('amount');
    expect(apiRule.tiers?.[0].percentage).toBe(0.03);
  });
});
