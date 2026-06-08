import { useEffect, useRef, useState } from 'react';
import Keycloak from 'keycloak-js';
import { AuthContext, type AuthContextValue } from './AuthContext';

const authDisabled = import.meta.env.VITE_AUTH_DISABLED === 'true';

const keycloak = !authDisabled ? new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
}) : null;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Omit<AuthContextValue, 'login' | 'logout'>>({
    token: authDisabled ? 'dev-mock-token' : undefined,
    isAuthenticated: authDisabled,
    isLoading: !authDisabled,
  });
  const initialised = useRef(false);

  useEffect(() => {
    if (authDisabled || initialised.current) return;
    initialised.current = true;

    keycloak!
      .init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
        pkceMethod: 'S256',
      })
      .then((authenticated) => {
        setState({
          token: keycloak!.token,
          isAuthenticated: authenticated,
          isLoading: false,
        });
      })
      .catch(() => {
        setState({ token: undefined, isAuthenticated: false, isLoading: false });
      });

    keycloak!.onTokenExpired = () => {
      keycloak!.updateToken(30)
        .then(() => setState((prev) => ({ ...prev, token: keycloak!.token })))
        .catch(() => setState({ token: undefined, isAuthenticated: false, isLoading: false }));
    };
  }, []);

  const value: AuthContextValue = {
    ...state,
    login: () => authDisabled ? undefined : keycloak!.login(),
    logout: () => authDisabled ? undefined : keycloak!.logout(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
