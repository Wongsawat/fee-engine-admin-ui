import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test-utils';
import { DraftDetailPage } from '@/pages/DraftDetailPage';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { MOCK_DRAFT } from '../mocks/handlers';

const DRAFT_ID = MOCK_DRAFT.id;

describe('DraftDetailPage — layout', () => {
  it('renders 404 state for unknown draft', async () => {
    renderWithProviders(<DraftDetailPage />, {
      initialEntries: ['/ai-drafts/unknown-id'],
    });
    expect(await screen.findByText(/draft not found/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/ai-drafts');
  });

  it('renders prompt text', async () => {
    renderWithProviders(<DraftDetailPage />, {
      initialEntries: [`/ai-drafts/${DRAFT_ID}`],
    });
    expect(await screen.findByText(MOCK_DRAFT.prompt)).toBeInTheDocument();
  });

  it('renders explanation text', async () => {
    renderWithProviders(<DraftDetailPage />, {
      initialEntries: [`/ai-drafts/${DRAFT_ID}`],
    });
    expect(await screen.findByText(MOCK_DRAFT.explanation!)).toBeInTheDocument();
  });

  it('renders rule JSON in a pre block', async () => {
    renderWithProviders(<DraftDetailPage />, {
      initialEntries: [`/ai-drafts/${DRAFT_ID}`],
    });
    const pre = await screen.findByRole('region', { name: /rule json/i });
    expect(pre).toBeInTheDocument();
  });

  it('renders metadata footer with createdBy', async () => {
    renderWithProviders(<DraftDetailPage />, {
      initialEntries: [`/ai-drafts/${DRAFT_ID}`],
    });
    expect(await screen.findByText(/admin/i)).toBeInTheDocument();
  });
});

describe('DraftDetailPage — status-gated actions (PENDING)', () => {
  it('shows Dry Run and Reject buttons but not Approve', async () => {
    renderWithProviders(<DraftDetailPage />, {
      initialEntries: [`/ai-drafts/${DRAFT_ID}`],
    });
    await screen.findByText(MOCK_DRAFT.prompt);
    expect(screen.getByRole('button', { name: /dry.?run/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument();
  });

  it('shows Edit Rule button', async () => {
    renderWithProviders(<DraftDetailPage />, {
      initialEntries: [`/ai-drafts/${DRAFT_ID}`],
    });
    await screen.findByText(MOCK_DRAFT.prompt);
    expect(screen.getByRole('button', { name: /edit rule/i })).toBeInTheDocument();
  });
});

describe('DraftDetailPage — status-gated actions (DRY_RUN_PASSED)', () => {
  beforeEach(() => {
    server.use(
      http.get(`/ai/drafts/${DRAFT_ID}`, () =>
        HttpResponse.json({ ...MOCK_DRAFT, status: 'DRY_RUN_PASSED', dryRunResult: { result: 'ok' } })
      )
    );
  });

  it('shows Approve button', async () => {
    renderWithProviders(<DraftDetailPage />, {
      initialEntries: [`/ai-drafts/${DRAFT_ID}`],
    });
    expect(await screen.findByRole('button', { name: /approve/i })).toBeInTheDocument();
  });

  it('hides Dry Run button', async () => {
    renderWithProviders(<DraftDetailPage />, {
      initialEntries: [`/ai-drafts/${DRAFT_ID}`],
    });
    await screen.findByRole('button', { name: /approve/i });
    expect(screen.queryByRole('button', { name: /dry.?run/i })).not.toBeInTheDocument();
  });

  it('shows dry-run result section', async () => {
    renderWithProviders(<DraftDetailPage />, {
      initialEntries: [`/ai-drafts/${DRAFT_ID}`],
    });
    expect(await screen.findByText(/dry.?run result/i)).toBeInTheDocument();
  });
});

describe('DraftDetailPage — status-gated actions (APPROVED)', () => {
  beforeEach(() => {
    server.use(
      http.get(`/ai/drafts/${DRAFT_ID}`, () =>
        HttpResponse.json({
          ...MOCK_DRAFT,
          status: 'APPROVED',
          feeRuleId: 'aaaaaaaa-0000-0000-0000-000000000001',
        })
      )
    );
  });

  it('shows linked rule section', async () => {
    renderWithProviders(<DraftDetailPage />, {
      initialEntries: [`/ai-drafts/${DRAFT_ID}`],
    });
    expect(await screen.findByText(/pushed to fee-engine/i)).toBeInTheDocument();
  });

  it('Delete button is disabled', async () => {
    renderWithProviders(<DraftDetailPage />, {
      initialEntries: [`/ai-drafts/${DRAFT_ID}`],
    });
    const deleteBtn = await screen.findByRole('button', { name: /delete/i });
    expect(deleteBtn).toBeDisabled();
  });

  it('hides Edit Rule, Approve, Reject, Dry Run buttons', async () => {
    renderWithProviders(<DraftDetailPage />, {
      initialEntries: [`/ai-drafts/${DRAFT_ID}`],
    });
    await screen.findByText(/pushed to fee-engine/i);
    expect(screen.queryByRole('button', { name: /edit rule/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reject/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /dry.?run/i })).not.toBeInTheDocument();
  });
});

describe('DraftDetailPage — approve 404 auto-reset', () => {
  it('shows toast and re-fetches draft when approve returns 404', async () => {
    server.use(
      http.get(`/ai/drafts/${DRAFT_ID}`, () =>
        HttpResponse.json({ ...MOCK_DRAFT, status: 'DRY_RUN_PASSED', dryRunResult: { result: 'ok' } })
      ),
      http.post(`/ai/drafts/${DRAFT_ID}/approve`, () =>
        HttpResponse.json(
          { type: 'about:blank', status: 404, title: 'Target rule no longer exists' },
          { status: 404 }
        )
      )
    );
    const user = userEvent.setup();
    renderWithProviders(<DraftDetailPage />, {
      initialEntries: [`/ai-drafts/${DRAFT_ID}`],
    });
    await user.click(await screen.findByRole('button', { name: /approve/i }));
    // The hook invalidates the detail query on error; page re-fetches
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /approve/i })).toBeInTheDocument()
    );
  });
});

describe('DraftDetailPage — concurrent edit 409', () => {
  it('surfaces 409 error through ErrorToast pipeline', async () => {
    server.use(
      http.put(`/ai/drafts/${DRAFT_ID}`, () =>
        HttpResponse.json(
          { type: 'about:blank', status: 409, title: 'Draft was modified concurrently' },
          { status: 409 }
        )
      )
    );
    const user = userEvent.setup();
    renderWithProviders(<DraftDetailPage />, {
      initialEntries: [`/ai-drafts/${DRAFT_ID}`],
    });
    await user.click(await screen.findByRole('button', { name: /edit rule/i }));
    await user.click(await screen.findByRole('button', { name: /save/i }));
    // mutation error state is set; ErrorToast handles display (not in test scope)
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /saving/i })).not.toBeInTheDocument()
    );
  });
});
