import { http, HttpResponse } from 'msw';
import type { FeeRulePageResponse, FeeRuleResponse } from '@/types/fee-rule';
import type { AiDraftResponse } from '@/types/ai-draft';

export const MOCK_RULE: FeeRuleResponse = {
  id: 'aaaaaaaa-0000-0000-0000-000000000001',
  paymentType: 'DOMESTIC',
  scheme: 'FPS',
  chargeBearer: 'BorneByDebtor',
  accountIdentification: undefined,
  chargeType: 'ServiceCharge',
  feeType: 'FLAT',
  flatAmount: '1.50',
  percentage: undefined,
  minFee: undefined,
  maxFee: undefined,
  tiers: [],
  currency: 'GBP',
  destinationCountry: undefined,
  active: true,
  version: 0,
  createdAt: '2026-06-01T10:00:00Z',
  createdBy: 'admin',
  updatedAt: '2026-06-01T10:00:00Z',
  updatedBy: 'admin',
  priority: 0,
};

export const MOCK_DRAFT: AiDraftResponse = {
  id: 'dddddddd-0000-0000-0000-000000000001',
  type: 'GENERATE',
  targetRuleId: null,
  prompt: 'Create a flat fee of £1.50 for domestic FPS payments borne by the debtor.',
  ruleJson: {
    paymentType: 'DOMESTIC',
    scheme: 'FPS',
    chargeBearer: 'BorneByDebtor',
    chargeType: 'ServiceCharge',
    feeType: 'FLAT',
    flatAmount: '1.50',
    currency: 'GBP',
    priority: 0,
  },
  explanation: 'Applies a £1.50 flat fee to domestic FPS payments.',
  status: 'PENDING',
  dryRunResult: null,
  feeRuleId: null,
  createdAt: '2026-06-06T10:00:00Z',
  createdBy: 'admin',
  updatedAt: '2026-06-06T10:00:00Z',
  updatedBy: 'admin',
  version: 0,
};

const STATUSES = [
  'PENDING', 'DRY_RUN_PASSED', 'DRY_RUN_FAILED', 'APPROVED', 'REJECTED',
] as const;

const DRAFT_FIXTURES: AiDraftResponse[] = Array.from({ length: 25 }, (_, i) => ({
  ...MOCK_DRAFT,
  id: `dddddddd-0000-0000-0000-${String(i + 1).padStart(12, '0')}`,
  status: STATUSES[i % 5],
}));

const BASE = '/admin/fee-rules';

export const handlers = [
  http.get(BASE, () =>
    HttpResponse.json<FeeRulePageResponse>({
      content: [MOCK_RULE],
      page: { number: 0, size: 20, totalElements: 1, totalPages: 1 },
    })
  ),

  http.get(`${BASE}/:id`, ({ params }) =>
    params.id === MOCK_RULE.id
      ? HttpResponse.json(MOCK_RULE)
      : new HttpResponse(null, { status: 404 })
  ),

  http.post(BASE, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json(
      { ...MOCK_RULE, ...body, id: 'bbbbbbbb-0000-0000-0000-000000000002' },
      { status: 201 }
    );
  }),

  http.put(`${BASE}/:id`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ ...MOCK_RULE, ...body });
  }),

  http.patch(`${BASE}/:id/status`, async ({ request }) => {
    const body = await request.json() as { active: boolean; version: number };
    return HttpResponse.json({ ...MOCK_RULE, active: body.active, version: body.version + 1 });
  }),

  http.post(`${BASE}/dry-run`, () =>
    HttpResponse.json({
      charges: [
        {
          chargeBearer: 'BorneByDebtor',
          type: 'ServiceCharge',
          amount: { amount: '1.50', currency: 'GBP' },
          chargingParty: { schemeName: 'SortCodeAccountNumber', identification: '12345678' },
        },
      ],
    })
  ),

  // AI draft handlers
  http.get('/ai/drafts', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '0');
    const size = Number(url.searchParams.get('size') ?? '20');
    const status = url.searchParams.get('status');
    const filtered = status
      ? DRAFT_FIXTURES.filter(d => d.status === status)
      : DRAFT_FIXTURES;
    const slice = filtered.slice(page * size, (page + 1) * size);
    return HttpResponse.json(slice);
  }),

  http.get('/ai/drafts/:id', ({ params }) =>
    params.id === MOCK_DRAFT.id
      ? HttpResponse.json(MOCK_DRAFT)
      : new HttpResponse(null, { status: 404 })
  ),

  http.post('/ai/drafts/generate', () =>
    HttpResponse.json({ ...MOCK_DRAFT, id: 'dddddddd-0000-0000-0000-999999999999' }, { status: 201 })
  ),

  http.post('/ai/drafts/review', () =>
    HttpResponse.json({ analysis: 'Mock AI analysis: rule looks valid.' })
  ),

  http.put('/ai/drafts/:id', async ({ request }) => {
    const body = await request.json() as { ruleJson: string };
    return HttpResponse.json({ ...MOCK_DRAFT, ruleJson: JSON.parse(body.ruleJson) });
  }),

  http.delete('/ai/drafts/:id', ({ params }) => {
    const draft = DRAFT_FIXTURES.find(d => d.id === params.id);
    if (draft?.status === 'APPROVED') {
      return HttpResponse.json(
        { type: 'about:blank', status: 422, title: 'Approved drafts cannot be deleted' },
        { status: 422 }
      );
    }
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('/ai/drafts/:id/dry-run', () =>
    HttpResponse.json({
      ...MOCK_DRAFT,
      status: 'DRY_RUN_PASSED',
      dryRunResult: { charges: [{ amount: { amount: '1.50', currency: 'GBP' } }] },
    })
  ),

  http.post('/ai/drafts/:id/approve', () =>
    HttpResponse.json({
      ...MOCK_DRAFT,
      status: 'APPROVED',
      feeRuleId: MOCK_RULE.id,
    })
  ),

  http.post('/ai/drafts/:id/reject', () =>
    HttpResponse.json({ ...MOCK_DRAFT, status: 'REJECTED' })
  ),
];
