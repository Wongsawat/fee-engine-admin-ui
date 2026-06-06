import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test-utils';
import { RulePicker } from '@/components/RulePicker';
import { MOCK_RULE } from '../mocks/handlers';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';

describe('RulePicker', () => {
  it('fetches rules and shows them in the list', async () => {
    renderWithProviders(<RulePicker value={undefined} onChange={vi.fn()} />);
    expect(await screen.findByText(/DOMESTIC \| FPS \| FLAT \| GBP/i)).toBeInTheDocument();
  });

  it('shows truncated rule ID alongside summary', async () => {
    renderWithProviders(<RulePicker value={undefined} onChange={vi.fn()} />);
    const idPrefix = MOCK_RULE.id.slice(0, 8);
    expect(await screen.findByText(new RegExp(idPrefix))).toBeInTheDocument();
  });

  it('calls onChange with full rule id when item is selected', async () => {
    const onChange = vi.fn();
    renderWithProviders(<RulePicker value={undefined} onChange={onChange} />);
    const item = await screen.findByText(/DOMESTIC \| FPS \| FLAT \| GBP/i);
    fireEvent.click(item);
    expect(onChange).toHaveBeenCalledWith(MOCK_RULE.id);
  });

  it('shows "Showing first 100" note when response has exactly 100 items', async () => {
    const rules = Array.from({ length: 100 }, (_, i) => ({
      ...MOCK_RULE,
      id: `rule-${i}`,
    }));
    server.use(
      http.get('/admin/fee-rules', () =>
        HttpResponse.json({
          content: rules,
          page: { number: 0, size: 100, totalElements: 100, totalPages: 1 },
        })
      )
    );
    renderWithProviders(<RulePicker value={undefined} onChange={vi.fn()} />);
    expect(await screen.findByText(/showing first 100/i)).toBeInTheDocument();
  });

  it('does NOT show the "first 100" note when fewer than 100 rules are returned', async () => {
    renderWithProviders(<RulePicker value={undefined} onChange={vi.fn()} />);
    await screen.findByText(/DOMESTIC/i);
    expect(screen.queryByText(/showing first 100/i)).not.toBeInTheDocument();
  });

  it('hides non-matching items when search text is typed', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RulePicker value={undefined} onChange={vi.fn()} />);
    await screen.findByText(/DOMESTIC \| FPS \| FLAT \| GBP/i); // wait for items to load
    await user.type(screen.getByPlaceholderText(/search rules/i), 'XYZ_NO_MATCH');
    expect(screen.queryByText(/DOMESTIC \| FPS \| FLAT \| GBP/i)).not.toBeInTheDocument();
  });
});
