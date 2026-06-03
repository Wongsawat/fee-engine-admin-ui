import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/auth/AuthContext';
import { useDryRun } from '@/api/dry-run';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return (
    <AuthContext.Provider value={{
      token: 'test-token', isAuthenticated: true, isLoading: false,
      login: vi.fn(), logout: vi.fn(),
    }}>
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </AuthContext.Provider>
  );
}

describe('useDryRun', () => {
  it('returns computed charges', async () => {
    const { result } = renderHook(() => useDryRun(), { wrapper });
    result.current.mutate({
      rule: {
        paymentType: 'DOMESTIC', scheme: 'FPS', chargeBearer: 'BorneByDebtor',
        chargeType: 'ServiceCharge', feeType: 'FLAT', flatAmount: '1.50', currency: 'GBP',
      },
      instructedAmount: { amount: '100.00', currency: 'GBP' },
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.charges).toHaveLength(1);
    expect(result.current.data?.charges[0].amount.amount).toBe('1.50');
  });
});
