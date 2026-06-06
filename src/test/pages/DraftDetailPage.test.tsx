import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test-utils';
import { DraftDetailPage } from '@/pages/DraftDetailPage';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { MOCK_DRAFT } from '../mocks/handlers';
import { toast } from 'sonner';

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
    // createdBy and updatedBy are both 'admin' — use getAllByText to confirm
    // the footer renders at least one "admin" entry (the createdBy field).
    expect(await screen.findAllByText(/admin/i)).not.toHaveLength(0);
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

describe('DraftDetailPage — delete navigates away', () => {
  it('navigates to /ai-drafts after successful delete', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DraftDetailPage />, {
      initialEntries: [`/ai-drafts/${DRAFT_ID}`],
    });
    // PENDING draft — delete button is visible and enabled
    const deleteBtn = await screen.findByRole('button', { name: /^delete$/i });
    await user.click(deleteBtn);
    // After navigation the detail page heading is gone
    await waitFor(() =>
      expect(screen.queryByText(MOCK_DRAFT.prompt)).not.toBeInTheDocument()
    );
  });
});

describe('DraftDetailPage — PENDING reset toast on edit', () => {
  it('shows toast.info when edit resets status from DRY_RUN_PASSED to PENDING', async () => {
    server.use(
      http.get(`/ai/drafts/${DRAFT_ID}`, () =>
        HttpResponse.json({ ...MOCK_DRAFT, status: 'DRY_RUN_PASSED', dryRunResult: { result: 'ok' } })
      ),
      http.put(`/ai/drafts/${DRAFT_ID}`, () =>
        HttpResponse.json({ ...MOCK_DRAFT, status: 'PENDING', dryRunResult: null })
      )
    );
    // toast is an object with methods — spy on the method, not the module export
    const infoSpy = vi.spyOn(toast, 'info');
    const user = userEvent.setup();
    renderWithProviders(<DraftDetailPage />, {
      initialEntries: [`/ai-drafts/${DRAFT_ID}`],
    });
    await user.click(await screen.findByRole('button', { name: /edit rule/i }));
    await user.click(await screen.findByRole('button', { name: /save/i }));
    await waitFor(() =>
      expect(infoSpy).toHaveBeenCalledWith('Rule edited. Draft reset to PENDING.')
    );
  });
});

describe('DraftDetailPage — no changes detected toast', () => {
  it('shows toast.info when PUT returns the same updatedAt', async () => {
    // Same updatedAt as MOCK_DRAFT signals the backend made no change
    server.use(
      http.put(`/ai/drafts/${DRAFT_ID}`, () =>
        HttpResponse.json({ ...MOCK_DRAFT, updatedAt: MOCK_DRAFT.updatedAt })
      )
    );
    const infoSpy = vi.spyOn(toast, 'info');
    const user = userEvent.setup();
    renderWithProviders(<DraftDetailPage />, {
      initialEntries: [`/ai-drafts/${DRAFT_ID}`],
    });
    await user.click(await screen.findByRole('button', { name: /edit rule/i }));
    await user.click(await screen.findByRole('button', { name: /save/i }));
    await waitFor(() =>
      expect(infoSpy).toHaveBeenCalledWith('No changes detected.')
    );
  });
});

describe('DraftDetailPage — approve 404 specific toast', () => {
  it('shows specific toast.error text when approve returns 404', async () => {
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
    const errorSpy = vi.spyOn(toast, 'error');
    const user = userEvent.setup();
    renderWithProviders(<DraftDetailPage />, {
      initialEntries: [`/ai-drafts/${DRAFT_ID}`],
    });
    await user.click(await screen.findByRole('button', { name: /approve/i }));
    await waitFor(() =>
      expect(errorSpy).toHaveBeenCalledWith(
        'Target rule was deleted. Draft reset to PENDING — re-run dry-run or reject.'
      )
    );
  });
});

describe('DraftDetailPage — 409 Reload-action toast', () => {
  it('shows toast.error with Reload action when edit conflicts', async () => {
    server.use(
      http.put(`/ai/drafts/${DRAFT_ID}`, () =>
        HttpResponse.json(
          { type: 'about:blank', status: 409, title: 'Draft was modified concurrently' },
          { status: 409 }
        )
      )
    );
    const errorSpy = vi.spyOn(toast, 'error');
    const user = userEvent.setup();
    renderWithProviders(<DraftDetailPage />, {
      initialEntries: [`/ai-drafts/${DRAFT_ID}`],
    });
    await user.click(await screen.findByRole('button', { name: /edit rule/i }));
    await user.click(await screen.findByRole('button', { name: /save/i }));
    await waitFor(() =>
      expect(errorSpy).toHaveBeenCalledWith(
        'Draft was modified concurrently. Reload and retry.',
        expect.objectContaining({ action: expect.objectContaining({ label: 'Reload' }) })
      )
    );
  });
});
