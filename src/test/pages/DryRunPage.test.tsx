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
    renderWithProviders(<DryRunPage />, { initialEntries: ['/dry-run'] });

    // Fill rule form
    await userEvent.click(screen.getByRole('combobox', { name: /payment type/i }));
    await userEvent.click(screen.getByRole('option', { name: 'DOMESTIC' }));

    await userEvent.click(screen.getByRole('combobox', { name: /^scheme$/i }));
    await userEvent.click(screen.getByRole('option', { name: 'FPS' }));

    await userEvent.click(screen.getByRole('combobox', { name: /charge bearer/i }));
    await userEvent.click(screen.getByRole('option', { name: 'BorneByDebtor' }));

    await userEvent.type(screen.getByLabelText(/charge type/i), 'ServiceCharge');

    await userEvent.click(screen.getByRole('combobox', { name: /fee type/i }));
    await userEvent.click(screen.getByRole('option', { name: 'FLAT' }));

    await userEvent.type(screen.getByLabelText(/flat amount/i), '1.50');
    await userEvent.type(screen.getByLabelText(/^currency$/i), 'GBP');

    // Fill payment context
    await userEvent.type(screen.getByLabelText(/instructed amount/i), '100.00');
    await userEvent.type(screen.getByLabelText(/amount currency/i), 'GBP');

    await userEvent.click(screen.getByRole('button', { name: /run/i }));

    // Wait for mutation to complete and re-render with results
    await waitFor(() => {
      expect(screen.getByText(/1\.50/)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('pre-populates rule from navigation state', async () => {
    renderWithProviders(<DryRunPage />, {
      initialEntries: [{ pathname: '/dry-run', state: { rule: MOCK_RULE_VALUES } }],
    });
    await waitFor(() => {
      expect(screen.getByDisplayValue('ServiceCharge')).toBeInTheDocument();
    });
  });
});
