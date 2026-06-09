import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test-utils';
import { DryRunPage } from '@/pages/DryRunPage';
import { MOCK_RULE } from '../mocks/handlers';

const MOCK_RULE_VALUES = {
  paymentType: MOCK_RULE.paymentType,
  scheme: MOCK_RULE.scheme,
  chargeBearer: MOCK_RULE.chargeBearer,
  accountIdentification: MOCK_RULE.accountIdentification ?? '',
  chargeType: MOCK_RULE.chargeType,
  feeType: MOCK_RULE.feeType,
  flatAmount: MOCK_RULE.flatAmount ?? '',
  percentage: MOCK_RULE.percentage ?? '',
  tiers: MOCK_RULE.tiers,
  currency: MOCK_RULE.currency,
};

describe('DryRunPage', () => {
  it('renders rule form and payment context fields', () => {
    renderWithProviders(<DryRunPage />, { initialEntries: ['/dry-run'] });
    expect(screen.getByRole('combobox', { name: /payment type/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/instructed amount/i)).toBeInTheDocument();
  });

  it('shows hint when no instructedAmount provided', () => {
    renderWithProviders(<DryRunPage />, { initialEntries: ['/dry-run'] });
    expect(screen.getByText(/provide an amount/i)).toBeInTheDocument();
  });

  it('submits dry-run and renders charge results', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DryRunPage />, { initialEntries: ['/dry-run'] });

    // Fill rule form
    await user.click(screen.getByRole('combobox', { name: /payment type/i }));
    await user.click(screen.getByRole('option', { name: 'DOMESTIC' }));

    await user.click(screen.getByRole('combobox', { name: /^scheme$/i }));
    await user.click(screen.getByRole('option', { name: 'FPS' }));

    await user.click(screen.getByRole('combobox', { name: /charge bearer/i }));
    await user.click(screen.getByRole('option', { name: 'BorneByDebtor' }));

    await user.type(screen.getByLabelText(/charge type/i), 'ServiceCharge');

    await user.click(screen.getByRole('combobox', { name: /fee type/i }));
    await user.click(screen.getByRole('option', { name: 'FLAT' }));

    await user.type(screen.getByLabelText(/flat amount/i), '1.50');
    await user.type(screen.getByLabelText(/^currency$/i), 'GBP');

    // Fill payment context
    await user.type(screen.getByLabelText(/instructed amount/i), '100.00');
    await user.type(screen.getByLabelText(/amount currency/i), 'GBP');

    await user.click(screen.getByRole('button', { name: /run/i }));

    await waitFor(() => {
      expect(screen.getByText(/1\.50/)).toBeInTheDocument();
    });
  });

  it('pre-populates rule from navigation state', async () => {
    renderWithProviders(<DryRunPage />, {
      initialEntries: [{ pathname: '/dry-run', state: { rule: MOCK_RULE_VALUES } }],
    });
    await waitFor(() => {
      expect(screen.getByDisplayValue('ServiceCharge')).toBeInTheDocument();
    });
  });

  it('renders priority field with default value 0', () => {
    renderWithProviders(<DryRunPage />, { initialEntries: ['/dry-run'] });
    const priority = screen.getByLabelText(/^priority$/i);
    expect(priority).toBeInTheDocument();
    expect(priority).toHaveValue(0);
  });

  it('does not show destination country field for DOMESTIC payment type', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DryRunPage />, { initialEntries: ['/dry-run'] });
    await user.click(screen.getByRole('combobox', { name: /payment type/i }));
    await user.click(screen.getByRole('option', { name: 'DOMESTIC' }));
    expect(screen.queryByLabelText(/destination country/i)).not.toBeInTheDocument();
  });

  it('shows destination country field for INTERNATIONAL payment type', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DryRunPage />, { initialEntries: ['/dry-run'] });
    await user.click(screen.getByRole('combobox', { name: /payment type/i }));
    await user.click(screen.getByRole('option', { name: 'INTERNATIONAL' }));
    expect(screen.getByLabelText(/destination country/i)).toBeInTheDocument();
  });

  it('does not show fee bounds section for FLAT fee type', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DryRunPage />, { initialEntries: ['/dry-run'] });
    await user.click(screen.getByRole('combobox', { name: /fee type/i }));
    await user.click(screen.getByRole('option', { name: 'FLAT' }));
    expect(screen.queryByText(/fee bounds/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/min fee/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/max fee/i)).not.toBeInTheDocument();
  });

  it('shows fee bounds section for PERCENTAGE fee type', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DryRunPage />, { initialEntries: ['/dry-run'] });
    await user.click(screen.getByRole('combobox', { name: /fee type/i }));
    await user.click(screen.getByRole('option', { name: 'PERCENTAGE' }));
    expect(screen.getByText(/fee bounds/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/min fee/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/max fee/i)).toBeInTheDocument();
  });
});
