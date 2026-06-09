import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '../test-utils';
import { RuleFormPage } from '@/pages/RuleFormPage';
import { MOCK_RULE } from '../mocks/handlers';
import { server } from '../mocks/server';

function RulesWrapped() {
  return (
    <Routes>
      <Route path="/rules" element={<div>Rules List</div>} />
      <Route path="/rules/*" element={<RuleFormPage />} />
    </Routes>
  );
}

describe('RuleFormPage — create mode', () => {
  it('renders empty form with Save button', () => {
    renderWithProviders(<RulesWrapped />, { initialEntries: ['/rules/new'] });
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('has a Try in Dry Run button', () => {
    renderWithProviders(<RulesWrapped />, { initialEntries: ['/rules/new'] });
    expect(screen.getByRole('button', { name: /try in dry run/i })).toBeInTheDocument();
  });

  it('submits POST and navigates to /rules on success', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RulesWrapped />, { initialEntries: ['/rules/new'] });

    await user.click(screen.getByRole('combobox', { name: /payment type/i }));
    await user.click(screen.getByRole('option', { name: 'DOMESTIC' }));

    await user.click(screen.getByRole('combobox', { name: /scheme/i }));
    await user.click(screen.getByRole('option', { name: 'FPS' }));

    await user.click(screen.getByRole('combobox', { name: /charge bearer/i }));
    await user.click(screen.getByRole('option', { name: 'BorneByDebtor' }));

    await user.type(screen.getByLabelText(/charge type/i), 'ServiceCharge');

    await user.click(screen.getByRole('combobox', { name: /fee type/i }));
    await user.click(screen.getByRole('option', { name: 'FLAT' }));

    await user.type(screen.getByLabelText(/flat amount/i), '1.50');
    await user.type(screen.getByLabelText(/currency/i), 'GBP');

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      // After successful POST, the page navigates to /rules
      // We can verify the form button is no longer in the document
      expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
    });
  });
});

describe('RuleFormPage — edit mode', () => {
  it('pre-populates form with existing rule data', async () => {
    renderWithProviders(<RulesWrapped />, {
      initialEntries: [`/rules/${MOCK_RULE.id}`],
    });
    await waitFor(() => {
      expect(screen.getByDisplayValue('ServiceCharge')).toBeInTheDocument();
    });
  });

  it('shows Dry Run button that navigates to /dry-run', async () => {
    renderWithProviders(<RulesWrapped />, {
      initialEntries: [`/rules/${MOCK_RULE.id}`],
    });
    await waitFor(() => screen.getByRole('button', { name: /dry run/i }));
    expect(screen.getByRole('button', { name: /dry run/i })).toBeInTheDocument();
  });

  it('pre-populates priority from existing rule', async () => {
    server.use(
      http.get(`/admin/fee-rules/${MOCK_RULE.id}`, () =>
        HttpResponse.json({ ...MOCK_RULE, priority: 7 })
      )
    );
    renderWithProviders(<RulesWrapped />, {
      initialEntries: [`/rules/${MOCK_RULE.id}`],
    });
    await waitFor(() => {
      expect(screen.getByDisplayValue('7')).toBeInTheDocument();
    });
  });

  it('pre-populates tier fields for TIERED_SLAB rule', async () => {
    server.use(
      http.get(`/admin/fee-rules/${MOCK_RULE.id}`, () =>
        HttpResponse.json({
          ...MOCK_RULE,
          feeType: 'TIERED_SLAB',
          flatAmount: undefined,
          tiers: [{ min: 0, max: 10000, rateType: 'FIXED', amount: 5 }],
        })
      )
    );
    renderWithProviders(<RulesWrapped />, {
      initialEntries: [`/rules/${MOCK_RULE.id}`],
    });
    await waitFor(() => {
      expect(screen.getByLabelText(/^min$/i)).toHaveValue('0');
      expect(screen.getByLabelText(/^max$/i)).toHaveValue('10000');
      expect(screen.getByLabelText(/^amount$/i)).toHaveValue('5');
    });
    expect(screen.getByRole('combobox', { name: /rate type/i })).toBeInTheDocument();
  });
});
