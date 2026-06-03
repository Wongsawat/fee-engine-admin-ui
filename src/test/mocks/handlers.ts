import { http, HttpResponse } from 'msw';
import type { FeeRulePageResponse, FeeRuleResponse } from '@/types/fee-rule';

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
  tiers: [],
  currency: 'GBP',
  active: true,
  version: 0,
  createdAt: '2026-06-01T10:00:00Z',
  createdBy: 'admin',
  updatedAt: '2026-06-01T10:00:00Z',
  updatedBy: 'admin',
};

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
];
