import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext, type AuthContextValue } from '@/auth/AuthContext';

const STUB_AUTH: AuthContextValue = {
  token: 'test-bearer-token',
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
};

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface Options extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  auth?: Partial<AuthContextValue>;
}

export function renderWithProviders(
  ui: React.ReactElement,
  { initialEntries = ['/'], auth, ...renderOptions }: Options = {}
) {
  const queryClient = createTestQueryClient();

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AuthContext.Provider value={{ ...STUB_AUTH, ...auth }}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={initialEntries}>
            {children}
          </MemoryRouter>
        </QueryClientProvider>
      </AuthContext.Provider>
    );
  }

  return { queryClient, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
