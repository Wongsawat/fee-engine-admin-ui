import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import { RuleListPage } from '@/pages/RuleListPage';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';

describe('RuleListPage', () => {
  it('renders fee rule rows from API', async () => {
    renderWithProviders(<RuleListPage />, { initialEntries: ['/rules'] });
    await waitFor(() => {
      expect(screen.getByText('DOMESTIC')).toBeInTheDocument();
    });
    expect(screen.getByText('FPS')).toBeInTheDocument();
  });

  it('shows empty state when list is empty', async () => {
    server.use(
      http.get('/admin/fee-rules', () =>
        HttpResponse.json({ content: [], page: { number: 0, size: 20, totalElements: 0, totalPages: 0 } })
      )
    );
    renderWithProviders(<RuleListPage />, { initialEntries: ['/rules'] });
    await waitFor(() => {
      expect(screen.getByText(/no fee rules found/i)).toBeInTheDocument();
    });
  });

  it('has a New Rule link', async () => {
    renderWithProviders(<RuleListPage />, { initialEntries: ['/rules'] });
    await waitFor(() => screen.getByRole('link', { name: /new rule/i }));
    expect(screen.getByRole('link', { name: /new rule/i })).toHaveAttribute('href', '/rules/new');
  });

  it('shows Active badge for active rule', async () => {
    renderWithProviders(<RuleListPage />, { initialEntries: ['/rules'] });
    await waitFor(() => expect(screen.getByText('Active')).toBeInTheDocument());
  });
});
