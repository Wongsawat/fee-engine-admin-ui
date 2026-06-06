import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import { DraftListPage } from '@/pages/DraftListPage';

describe('DraftListPage', () => {
  it('renders the page heading and New AI Draft button', async () => {
    renderWithProviders(<DraftListPage />, { initialEntries: ['/ai-drafts'] });
    expect(screen.getByRole('heading', { name: /ai drafts/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /new ai draft/i })).toBeInTheDocument();
  });

  it('renders draft rows from the API', async () => {
    renderWithProviders(<DraftListPage />, { initialEntries: ['/ai-drafts'] });
    // DRAFT_FIXTURES has 25 items; first page returns 20
    const viewLinks = await screen.findAllByRole('link', { name: /view/i });
    expect(viewLinks).toHaveLength(20);
  });

  it('shows "Load more" button when a full page is returned', async () => {
    renderWithProviders(<DraftListPage />, { initialEntries: ['/ai-drafts'] });
    expect(await screen.findByRole('button', { name: /load more/i })).toBeInTheDocument();
  });

  it('hides "Load more" after the last page is fetched', async () => {
    // Override handler: return only 5 drafts (less than page size of 20)
    const { server } = await import('../mocks/server');
    const { http, HttpResponse } = await import('msw');
    const { MOCK_DRAFT } = await import('../mocks/handlers');
    server.use(
      http.get('/ai/drafts', () =>
        HttpResponse.json([{ ...MOCK_DRAFT, id: 'only-one' }])
      )
    );
    renderWithProviders(<DraftListPage />, { initialEntries: ['/ai-drafts'] });
    await screen.findByRole('link', { name: /view/i });
    expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument();
  });

  it('appends rows after clicking Load more', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();
    renderWithProviders(<DraftListPage />, { initialEntries: ['/ai-drafts'] });
    await screen.findAllByRole('link', { name: /view/i }); // wait for initial 20 rows
    await user.click(screen.getByRole('button', { name: /load more/i }));
    await waitFor(() => {
      expect(screen.getAllByRole('link', { name: /view/i })).toHaveLength(25);
    });
  });

  it('filters by status via URL param', async () => {
    renderWithProviders(<DraftListPage />, { initialEntries: ['/ai-drafts?status=APPROVED'] });
    // DRAFT_FIXTURES has 5 APPROVED drafts (every 5th)
    const viewLinks = await screen.findAllByRole('link', { name: /view/i });
    expect(viewLinks).toHaveLength(5);
  });

  it('shows empty state when no drafts exist at all', async () => {
    const { server } = await import('../mocks/server');
    const { http, HttpResponse } = await import('msw');
    server.use(http.get('/ai/drafts', () => HttpResponse.json([])));
    renderWithProviders(<DraftListPage />, { initialEntries: ['/ai-drafts'] });
    expect(await screen.findByText(/no ai drafts yet/i)).toBeInTheDocument();
  });

  it('shows filter-empty state when status filter returns nothing', async () => {
    const { server } = await import('../mocks/server');
    const { http, HttpResponse } = await import('msw');
    server.use(http.get('/ai/drafts', () => HttpResponse.json([])));
    renderWithProviders(<DraftListPage />, { initialEntries: ['/ai-drafts?status=REJECTED'] });
    expect(await screen.findByText(/no drafts match/i)).toBeInTheDocument();
  });
});
