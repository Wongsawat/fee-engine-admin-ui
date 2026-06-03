import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/auth/AuthContext';
import { useFeeRules, useFeeRule, useCreateFeeRule } from '@/api/fee-rules';
import { MOCK_RULE } from '../mocks/handlers';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <AuthContext.Provider value={{
      token: 'test-token', isAuthenticated: true, isLoading: false,
      login: vi.fn(), logout: vi.fn(),
    }}>
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </AuthContext.Provider>
  );
}

describe('useFeeRules', () => {
  it('fetches paginated list', async () => {
    const { result } = renderHook(() => useFeeRules({}, 0), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.content).toHaveLength(1);
    expect(result.current.data?.content[0].id).toBe(MOCK_RULE.id);
  });
});

describe('useFeeRule', () => {
  it('fetches single rule by id', async () => {
    const { result } = renderHook(() => useFeeRule(MOCK_RULE.id), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.chargeType).toBe('ServiceCharge');
  });
});

describe('useCreateFeeRule', () => {
  it('sends POST and returns created rule', async () => {
    const { result } = renderHook(() => useCreateFeeRule(), { wrapper });
    result.current.mutate({
      paymentType: 'DOMESTIC', scheme: 'FPS', chargeBearer: 'BorneByDebtor',
      chargeType: 'ServiceCharge', feeType: 'FLAT', flatAmount: '1.50', currency: 'GBP',
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.feeType).toBe('FLAT');
  });

  it('surfaces ApiError on 400 response', async () => {
    server.use(
      http.post('/admin/fee-rules', () =>
        HttpResponse.json({ detail: 'Validation failed' }, { status: 400 })
      )
    );
    const { result } = renderHook(() => useCreateFeeRule(), { wrapper });
    result.current.mutate({
      paymentType: 'DOMESTIC', scheme: 'FPS', chargeBearer: 'BorneByDebtor',
      chargeType: 'X', feeType: 'FREE', currency: 'GBP',
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Validation failed');
  });
});
