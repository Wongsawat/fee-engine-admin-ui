import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import { RuleTable } from '@/components/RuleTable';
import type { FeeRulePageResponse } from '@/types/fee-rule';
import { MOCK_RULE } from '../mocks/handlers';

function makePageResponse(overrides: Partial<typeof MOCK_RULE> = {}): FeeRulePageResponse {
  return {
    content: [{ ...MOCK_RULE, ...overrides }],
    page: { number: 0, size: 20, totalElements: 1, totalPages: 1 },
  };
}

const emptyPage: FeeRulePageResponse = {
  content: [],
  page: { number: 0, size: 20, totalElements: 0, totalPages: 0 },
};

describe('RuleTable — columns', () => {
  it('renders Country column header', () => {
    renderWithProviders(
      <RuleTable data={makePageResponse()} page={0} onPageChange={vi.fn()} />
    );
    expect(screen.getByRole('columnheader', { name: /^country$/i })).toBeInTheDocument();
  });

  it('renders Priority column header', () => {
    renderWithProviders(
      <RuleTable data={makePageResponse()} page={0} onPageChange={vi.fn()} />
    );
    expect(screen.getByRole('columnheader', { name: /^priority$/i })).toBeInTheDocument();
  });

  it('shows destination country code in Country cell', () => {
    renderWithProviders(
      <RuleTable data={makePageResponse({ destinationCountry: 'IN' })} page={0} onPageChange={vi.fn()} />
    );
    expect(screen.getByText('IN')).toBeInTheDocument();
  });

  it('shows em-dash in Country cell when destinationCountry is absent', () => {
    renderWithProviders(
      <RuleTable data={makePageResponse({ destinationCountry: undefined })} page={0} onPageChange={vi.fn()} />
    );
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it('shows priority value in Priority cell', () => {
    renderWithProviders(
      <RuleTable data={makePageResponse({ priority: 5 })} page={0} onPageChange={vi.fn()} />
    );
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('empty-state row spans all 11 columns', () => {
    renderWithProviders(
      <RuleTable data={emptyPage} page={0} onPageChange={vi.fn()} />
    );
    const emptyCell = screen.getByText(/no fee rules found/i).closest('td');
    expect(emptyCell).toHaveAttribute('colspan', '11');
  });
});
