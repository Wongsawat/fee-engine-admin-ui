import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import { DraftTable } from '@/components/DraftTable';
import { MOCK_DRAFT } from '../mocks/handlers';
import type { AiDraftResponse } from '@/types/ai-draft';

describe('DraftTable', () => {
  it('renders column headers', () => {
    renderWithProviders(<DraftTable drafts={[]} />);
    expect(screen.getByRole('columnheader', { name: /^type$/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /payment type/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /fee type/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /currency/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /created/i })).toBeInTheDocument();
  });

  it('renders empty state when drafts is empty', () => {
    renderWithProviders(<DraftTable drafts={[]} />);
    expect(screen.getByText(/no drafts/i)).toBeInTheDocument();
  });

  it('renders a row for each draft', () => {
    const drafts: AiDraftResponse[] = [MOCK_DRAFT, { ...MOCK_DRAFT, id: 'other-id' }];
    renderWithProviders(<DraftTable drafts={drafts} />);
    const viewLinks = screen.getAllByRole('link', { name: /view/i });
    expect(viewLinks).toHaveLength(2);
  });

  it('extracts paymentType from ruleJson and renders it', () => {
    renderWithProviders(<DraftTable drafts={[MOCK_DRAFT]} />);
    expect(screen.getByText('DOMESTIC')).toBeInTheDocument();
  });

  it('renders View link pointing to /ai-drafts/:id', () => {
    renderWithProviders(<DraftTable drafts={[MOCK_DRAFT]} />, {
      initialEntries: ['/ai-drafts'],
    });
    const link = screen.getByRole('link', { name: /view/i });
    expect(link).toHaveAttribute('href', `/ai-drafts/${MOCK_DRAFT.id}`);
  });

  it('renders GENERATE type badge', () => {
    renderWithProviders(<DraftTable drafts={[{ ...MOCK_DRAFT, type: 'GENERATE' }]} />);
    expect(screen.getByText('GENERATE')).toBeInTheDocument();
  });
});
