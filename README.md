# Fee Engine Admin UI

React + TypeScript admin console for the [fee-engine](../fee-engine) backend. Browse, create, edit, and dry-run fee rules; manage caps, corridor matching, and priority ordering. Generate, review, and approve AI-drafted rules.

## Features

- **Rule list** with filtering (payment type, scheme, charge bearer, fee type, currency, account identification, destination country, active state) and pagination.
- **Rule create/edit** with full client-side validation. Conditional fields per `feeType`: `FLAT` requires `flatAmount`, `PERCENTAGE` requires `percentage` (plus optional `minFee`/`maxFee` caps), `TIERED_SLAB`/`TIERED_STEP` require tiers with per-tier `rateType` (FIXED, PERCENTAGE, HYBRID, GREATER_OF), `FREE` permits none of these.
- **Fee caps (V5)** — `minFee`/`maxFee` bounds on `PERCENTAGE` rules.
- **Corridor matching (V6)** — `destinationCountry` (ISO 3166-1 alpha-2) on international payment types only.
- **Priority ordering (V7)** — explicit non-negative `priority` integer (default 0) for rule selection.
- **Status toggle** with optimistic updates and rollback on error.
- **Dry run** — simulate a rule against a hypothetical payment to preview calculated charges.
- **AI Drafts** — generate draft fee rules from natural-language prompts (GENERATE or UPDATE mode). Review AI analysis, edit rule JSON inline, dry-run, approve (pushes to fee-engine), or reject. Status-gated actions with toast notifications for resets, conflicts (409), and missing target rules (404).

## Tech stack

| Concern | Choice |
|---|---|
| Framework | React 19, TypeScript, Vite |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix UI primitives in `src/components/ui/`) |
| Data fetching | TanStack Query v5 |
| Forms / validation | React Hook Form + Zod v4 (`@hookform/resolvers/zod`) |
| Routing | React Router v7 |
| Auth | Keycloak JS (PKCE S256) |
| Notifications | Sonner |
| Testing | Vitest + Testing Library + MSW v2 |

## Quick start

```bash
npm install
cp .env.example .env.local   # VITE_API_BASE_URL intentionally blank; Vite proxy handles /admin/* and /ai/* locally
npm run dev                  # http://localhost:5173
```

The Vite dev server proxies `/admin/*` to `http://localhost:8080` (the fee-engine backend) and `/ai/*` to `http://localhost:8081` (the AI draft service).

## Commands

```bash
npm run dev       # Vite dev server with HMR
npm run build     # tsc -b && vite build
npm run lint      # ESLint
npm test          # Vitest in watch mode
npx vitest run                                       # Run all tests once
npx vitest run src/test/path/to/file.test.tsx        # Single file
npx vitest run --reporter=verbose                    # All tests, verbose
```

## Project layout

```
src/
  api/             TanStack Query hooks + apiFetch (RFC 9457 problem-detail errors)
  auth/            Keycloak PKCE S256; AuthGuard redirects unauthenticated users
  components/      RuleForm, RuleTable, TierEditor, FilterBar, AppNav, ErrorToast, StatusBadge,
                   DraftStatusBadge, DraftTable, RulePicker, AiReviewDialog, PromptForm (+ ui/ shadcn primitives)
  lib/             Zod schemas + inferred form types, formatRelativeTime, draft-helpers
  pages/           RuleListPage, RuleFormPage (create + edit), DryRunPage,
                   DraftListPage, DraftNewPage, DraftDetailPage
  test/            Vitest setup, MSW handlers, renderWithProviders helper, mocks
  types/           API request/response shapes (fee-rule, ai-draft)
```

### Layer responsibilities

- **`src/types/fee-rule.ts`**, **`src/types/ai-draft.ts`** — request/response shapes (source of truth for what the backend sends/accepts).
- **`src/lib/schemas.ts`** — Zod schemas + inferred `RuleFormValues`/`DryRunFormValues`/`PromptFormValues` types.
- **`src/api/fee-rules.ts`**, **`src/api/dry-run.ts`**, **`src/api/ai-drafts.ts`** — TanStack Query mutations/queries wrapping `apiFetch`.
- **`src/api/client.ts`** — `apiFetch`: attaches Bearer token, parses RFC 9457 problem-detail errors into `ApiError`.
- **`src/lib/format.ts`**, **`src/lib/draft-helpers.ts`** — pure utilities (`formatRelativeTime`, draft status guards, rule summary extraction).
- **`src/components/RuleForm.tsx`** — the canonical form (used by `RuleFormPage` and embedded by `DryRunPage`'s rule definition).
- **`src/pages/`** — page-level composition, navigation state, and route-specific wiring.

## Routes

| Path | Page | Notes |
|---|---|---|
| `/` | redirect | → `/rules` |
| `/rules` | `RuleListPage` | Filterable, paginated rule list |
| `/rules/new` | `RuleFormPage` | Create mode |
| `/rules/:id` | `RuleFormPage` | Edit mode |
| `/ai-drafts` | `DraftListPage` | AI draft list with status filter and infinite scroll |
| `/ai-drafts/new` | `DraftNewPage` | Prompt form (GENERATE or UPDATE mode) |
| `/ai-drafts/:id` | `DraftDetailPage` | View, edit, dry-run, approve/reject/delete |
| `/dry-run` | `DryRunPage` | Simulate a rule against a hypothetical payment |
| `*` | 404 | "Page not found" |

## Conditional field rules

Enforced by `ruleFormSchema.superRefine` in `src/lib/schemas.ts`:

- `FLAT` → `flatAmount` required.
- `PERCENTAGE` → `percentage` required; `minFee`/`maxFee` optional; `minFee ≤ maxFee` and both `> 0`.
- `TIERED_SLAB` / `TIERED_STEP` → at least one tier required; each tier's `max > min` and `rateType` present (FIXED, PERCENTAGE, HYBRID, GREATER_OF); `amount`/`percentage` required per `rateType`.
- `FREE` → none of `flatAmount`, `percentage`, `tiers` may be set.
- `destinationCountry` → only on `INTERNATIONAL`, `INTERNATIONAL_SCHEDULED`, `INTERNATIONAL_STANDING_ORDER`; must match `^[A-Z]{2}$`.

## Testing

- `npm test` runs Vitest in watch mode; `npx vitest run` runs once.
- Tests use Vitest + Testing Library + MSW v2.
- The test server (`src/test/mocks/server.ts`) runs with `onUnhandledRequest: 'error'` — any fetch without a registered handler fails the test.
- Use `renderWithProviders` from `src/test/test-utils.tsx` for component tests. It wraps with `AuthContext` (stub token), `QueryClientProvider` (retries disabled), and `MemoryRouter`.
- Shared MSW fixtures live in `src/test/mocks/handlers.ts`; one-off overrides use `server.use(...)` inline.

## Environment

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Optional override for the API base URL. Leave blank in local dev so the Vite proxy can forward `/admin/*` to `http://localhost:8080` and `/ai/*` to `http://localhost:8081`. |

Keycloak is configured in `src/auth/AuthProvider.tsx` (PKCE S256, `check-sso` on load). Update the Keycloak URL, realm, and client ID there.
