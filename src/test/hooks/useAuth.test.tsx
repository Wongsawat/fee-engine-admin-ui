import { renderHook, act } from '@testing-library/react';
import { AuthProvider } from '@/auth/AuthProvider';
import { useAuth } from '@/auth/useAuth';

vi.mock('keycloak-js', () => {
  const mockInit = vi.fn().mockResolvedValue(true);
  const mockLogin = vi.fn();
  const mockLogout = vi.fn();
  const mockUpdateToken = vi.fn().mockResolvedValue(true);

  function MockKeycloak() {
    return {
      init: mockInit,
      token: 'mock-kc-token',
      authenticated: true,
      login: mockLogin,
      logout: mockLogout,
      updateToken: mockUpdateToken,
      onTokenExpired: undefined as (() => void) | undefined,
    };
  }

  return { default: MockKeycloak };
});

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('useAuth', () => {
  it('starts in loading state', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
    // Drain the already-resolved keycloak.init() microtask so it doesn't leak into subsequent tests
    await act(async () => {});
  });

  it('becomes authenticated after Keycloak init resolves', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe('mock-kc-token');
  });
});
