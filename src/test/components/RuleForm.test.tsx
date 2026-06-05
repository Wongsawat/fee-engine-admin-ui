import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test-utils';
import { RuleForm } from '@/components/RuleForm';
import { ruleFormSchema, type RuleFormValues } from '@/lib/schemas';

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

describe('RuleForm — fee bounds', () => {
  beforeEach(() => noop.mockReset());

  it('does not show fee bounds section when feeType is not PERCENTAGE', () => {
    renderWithProviders(<RuleForm onSubmit={noop} />);
    expect(screen.queryByText(/fee bounds/i)).not.toBeInTheDocument();
  });

  it('shows fee bounds section when feeType is PERCENTAGE', async () => {
    renderWithProviders(<RuleForm onSubmit={noop} />);
    await selectOption(/fee type/i, 'PERCENTAGE');
    expect(screen.getByText(/fee bounds/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/min fee/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/max fee/i)).toBeInTheDocument();
  });

  it('hides fee bounds section when feeType changes from PERCENTAGE to FLAT', async () => {
    renderWithProviders(<RuleForm onSubmit={noop} />);
    await selectOption(/fee type/i, 'PERCENTAGE');
    expect(screen.getByText(/fee bounds/i)).toBeInTheDocument();
    await selectOption(/fee type/i, 'FLAT');
    expect(screen.queryByText(/fee bounds/i)).not.toBeInTheDocument();
  });

  it('clears minFee and maxFee values when switching away from PERCENTAGE', async () => {
    renderWithProviders(<RuleForm onSubmit={noop} />);
    await selectOption(/fee type/i, 'PERCENTAGE');
    await userEvent.type(screen.getByLabelText(/min fee/i), '5.00');
    await selectOption(/fee type/i, 'FLAT');
    await selectOption(/fee type/i, 'PERCENTAGE');
    expect(screen.getByLabelText(/min fee/i)).toHaveValue('');
  });

  it('shows error when minFee is non-positive', async () => {
    renderWithProviders(<RuleForm onSubmit={noop} />);
    await selectOption(/payment type/i, 'DOMESTIC');
    await selectOption(/scheme/i, 'FPS');
    await selectOption(/charge bearer/i, 'BorneByDebtor');
    await userEvent.type(screen.getByLabelText(/charge type/i), 'ServiceCharge');
    await selectOption(/fee type/i, 'PERCENTAGE');
    await userEvent.type(screen.getByLabelText(/percentage/i), '0.50');
    await userEvent.type(screen.getByLabelText(/min fee/i), '0');
    await userEvent.type(screen.getByLabelText(/currency/i), 'GBP');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => {
      expect(screen.getByText('Must be greater than 0')).toBeInTheDocument();
    });
    expect(noop).not.toHaveBeenCalled();
  });

  it('shows error when minFee is greater than maxFee', async () => {
    renderWithProviders(<RuleForm onSubmit={noop} />);
    await selectOption(/payment type/i, 'DOMESTIC');
    await selectOption(/scheme/i, 'FPS');
    await selectOption(/charge bearer/i, 'BorneByDebtor');
    await userEvent.type(screen.getByLabelText(/charge type/i), 'ServiceCharge');
    await selectOption(/fee type/i, 'PERCENTAGE');
    await userEvent.type(screen.getByLabelText(/percentage/i), '0.50');
    await userEvent.type(screen.getByLabelText(/min fee/i), '50.00');
    await userEvent.type(screen.getByLabelText(/max fee/i), '10.00');
    await userEvent.type(screen.getByLabelText(/currency/i), 'GBP');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => {
      expect(screen.getByText('Max must be greater than or equal to min')).toBeInTheDocument();
    });
    expect(noop).not.toHaveBeenCalled();
  });

  it('rejects caps on non-PERCENTAGE rule at schema level', () => {
    const result = ruleFormSchema.safeParse({
      paymentType: 'DOMESTIC',
      scheme: 'FPS',
      chargeBearer: 'BorneByDebtor',
      chargeType: 'ServiceCharge',
      feeType: 'FLAT',
      flatAmount: '1.50',
      currency: 'GBP',
      minFee: '1.00',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('minFee');
    }
  });
});

describe('RuleForm — destination country', () => {
  beforeEach(() => noop.mockReset());

  it('does not show destination country field for domestic payment type', async () => {
    renderWithProviders(<RuleForm onSubmit={noop} />);
    await selectOption(/payment type/i, 'DOMESTIC');
    expect(screen.queryByLabelText(/destination country/i)).not.toBeInTheDocument();
  });

  it('shows destination country field when payment type is INTERNATIONAL', async () => {
    renderWithProviders(<RuleForm onSubmit={noop} />);
    await selectOption(/payment type/i, 'INTERNATIONAL');
    expect(screen.getByLabelText(/destination country/i)).toBeInTheDocument();
  });

  it('shows destination country field when payment type is INTERNATIONAL_SCHEDULED', async () => {
    renderWithProviders(<RuleForm onSubmit={noop} />);
    await selectOption(/payment type/i, 'INTERNATIONAL_SCHEDULED');
    expect(screen.getByLabelText(/destination country/i)).toBeInTheDocument();
  });

  it('shows destination country field when payment type is INTERNATIONAL_STANDING_ORDER', async () => {
    renderWithProviders(<RuleForm onSubmit={noop} />);
    await selectOption(/payment type/i, 'INTERNATIONAL_STANDING_ORDER');
    expect(screen.getByLabelText(/destination country/i)).toBeInTheDocument();
  });

  it('clears destination country and hides field when switching from INTERNATIONAL to DOMESTIC', async () => {
    renderWithProviders(<RuleForm onSubmit={noop} />);
    await selectOption(/payment type/i, 'INTERNATIONAL');
    await userEvent.type(screen.getByLabelText(/destination country/i), 'IN');
    await selectOption(/payment type/i, 'DOMESTIC');
    expect(screen.queryByLabelText(/destination country/i)).not.toBeInTheDocument();
    await selectOption(/payment type/i, 'INTERNATIONAL');
    expect(screen.getByLabelText(/destination country/i)).toHaveValue('');
  });

  it('shows error for invalid country code format (non-alpha)', async () => {
    renderWithProviders(<RuleForm onSubmit={noop} />);
    await selectOption(/payment type/i, 'INTERNATIONAL');
    await selectOption(/scheme/i, 'SWIFT');
    await selectOption(/charge bearer/i, 'BorneByDebtor');
    await userEvent.type(screen.getByLabelText(/charge type/i), 'ServiceCharge');
    await selectOption(/fee type/i, 'FLAT');
    await userEvent.type(screen.getByLabelText(/flat amount/i), '5.00');
    await userEvent.type(screen.getByLabelText(/currency/i), 'GBP');
    await userEvent.type(screen.getByLabelText(/destination country/i), 'g1');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => {
      expect(screen.getByText('Must be a 2-letter uppercase country code (e.g. GB)')).toBeInTheDocument();
    });
    expect(noop).not.toHaveBeenCalled();
  });

  it('auto-uppercases destination country input', async () => {
    renderWithProviders(<RuleForm onSubmit={noop} />);
    await selectOption(/payment type/i, 'INTERNATIONAL');
    const input = screen.getByLabelText(/destination country/i);
    await userEvent.type(input, 'in');
    expect(input).toHaveValue('IN');
  });
});

describe('RuleForm — priority', () => {
  beforeEach(() => noop.mockReset());

  it('renders priority field with default value 0', () => {
    renderWithProviders(<RuleForm onSubmit={noop} />);
    const input = screen.getByLabelText(/priority/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue(0);
  });

  it('shows error when priority is negative', async () => {
    // Test at schema level that negative priority fails
    const result = ruleFormSchema.safeParse({
      paymentType: 'DOMESTIC',
      scheme: 'FPS',
      chargeBearer: 'BorneByDebtor',
      chargeType: 'ServiceCharge',
      feeType: 'FLAT',
      flatAmount: '1.50',
      currency: 'GBP',
      priority: -1,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const priorityIssue = result.error.issues.find(i => i.path.includes('priority'));
      expect(priorityIssue).toBeDefined();
      expect(priorityIssue!.message.toLowerCase()).toMatch(/too small|>=\s*0/);
    }
  });

  it('includes priority in submitted values', async () => {
    renderWithProviders(<RuleForm onSubmit={noop} />);
    await selectOption(/payment type/i, 'DOMESTIC');
    await selectOption(/scheme/i, 'FPS');
    await selectOption(/charge bearer/i, 'BorneByDebtor');
    await userEvent.type(screen.getByLabelText(/charge type/i), 'ServiceCharge');
    await selectOption(/fee type/i, 'FLAT');
    await userEvent.type(screen.getByLabelText(/flat amount/i), '1.50');
    await userEvent.type(screen.getByLabelText(/currency/i), 'GBP');
    const priorityInput = screen.getByLabelText(/priority/i);
    await userEvent.clear(priorityInput);
    await userEvent.type(priorityInput, '5');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(noop).toHaveBeenCalledTimes(1));
    const values: RuleFormValues = noop.mock.calls[0][0];
    expect(values.priority).toBe(5);
  });
});
