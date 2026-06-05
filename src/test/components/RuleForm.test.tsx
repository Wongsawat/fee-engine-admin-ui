import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test-utils';
import { RuleForm } from '@/components/RuleForm';
import type { RuleFormValues } from '@/lib/schemas';

const noop = vi.fn();

/** Helper to select a value in a Radix Select component. */
async function selectOption(labelPattern: RegExp, value: string) {
  // The trigger is a combobox with the aria-label
  const trigger = screen.getByRole('combobox', { name: labelPattern });
  await userEvent.click(trigger);
  // After opening, the option should be visible
  const option = await screen.findByRole('option', { name: value });
  await userEvent.click(option);
}

describe('RuleForm validation', () => {
  beforeEach(() => noop.mockReset());

  it('shows error when required fields are missing on submit', async () => {
    renderWithProviders(<RuleForm onSubmit={noop} />);
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => {
      expect(screen.getAllByText('Required').length).toBeGreaterThan(0);
    });
    expect(noop).not.toHaveBeenCalled();
  });

  it('shows flatAmount field only when feeType is FLAT', async () => {
    renderWithProviders(<RuleForm onSubmit={noop} />);
    expect(screen.queryByLabelText(/flat amount/i)).not.toBeInTheDocument();
    await selectOption(/fee type/i, 'FLAT');
    expect(screen.getByLabelText(/flat amount/i)).toBeInTheDocument();
  });

  it('shows percentage field only when feeType is PERCENTAGE', async () => {
    renderWithProviders(<RuleForm onSubmit={noop} />);
    await selectOption(/fee type/i, 'PERCENTAGE');
    expect(screen.getByLabelText(/percentage/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/flat amount/i)).not.toBeInTheDocument();
  });

  it('shows TierEditor only when feeType is TIERED', async () => {
    renderWithProviders(<RuleForm onSubmit={noop} />);
    await selectOption(/fee type/i, 'TIERED');
    expect(screen.getByRole('button', { name: /add tier/i })).toBeInTheDocument();
  });

  it('shows no amount fields when feeType is FREE', async () => {
    renderWithProviders(<RuleForm onSubmit={noop} />);
    await selectOption(/fee type/i, 'FREE');
    expect(screen.queryByLabelText(/flat amount/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/percentage/i)).not.toBeInTheDocument();
  });

  it('shows error when tier max is not greater than min', async () => {
    renderWithProviders(<RuleForm onSubmit={noop} />);
    await selectOption(/fee type/i, 'TIERED');
    fireEvent.click(screen.getByRole('button', { name: /add tier/i }));
    await userEvent.type(screen.getByPlaceholderText('Min'), '100');
    await userEvent.type(screen.getByPlaceholderText('Max'), '50');
    await userEvent.type(screen.getByPlaceholderText('Amount'), '1.00');
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => {
      expect(screen.getByText('Max must be greater than min')).toBeInTheDocument();
    });
    expect(noop).not.toHaveBeenCalled();
  });

  it('calls onSubmit with valid values', async () => {
    renderWithProviders(<RuleForm onSubmit={noop} />);
    await selectOption(/payment type/i, 'DOMESTIC');
    await selectOption(/scheme/i, 'FPS');
    await selectOption(/charge bearer/i, 'BorneByDebtor');
    await userEvent.type(screen.getByLabelText(/charge type/i), 'ServiceCharge');
    await selectOption(/fee type/i, 'FLAT');
    await userEvent.type(screen.getByLabelText(/flat amount/i), '1.50');
    await userEvent.type(screen.getByLabelText(/currency/i), 'GBP');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(noop).toHaveBeenCalledTimes(1));
    const values: RuleFormValues = noop.mock.calls[0][0];
    expect(values.feeType).toBe('FLAT');
    expect(values.flatAmount).toBe('1.50');
  });
});
