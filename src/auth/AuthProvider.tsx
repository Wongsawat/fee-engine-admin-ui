import { useEffect, useRef, useState } from 'react';
import Keycloak from 'keycloak-js';
import { AuthContext, type AuthContextValue } from './AuthContext';

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Omit<AuthContextValue, 'login' | 'logout'>>({
    token: undefined,
    isAuthenticated: false,
    isLoading: true,
  });
  const initialised = useRef(false);

  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;

    keycloak
      .init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
        pkceMethod: 'S256',
      })
      .then((authenticated) => {
        setState({
          token: keycloak.token,
          isAuthenticated: authenticated,
          isLoading: false,
        });
      })
      .catch(() => {
        setState({ token: undefined, isAuthenticated: false, isLoading: false });
      });

    keycloak.onTokenExpired = () => {
      keycloak.updateToken(30)
        .then(() => setState((prev) => ({ ...prev, token: keycloak.token })))
        .catch(() => setState({ token: undefined, isAuthenticated: false, isLoading: false }));
    };
  }, []);

  const value: AuthContextValue = {
    ...state,
    login: () => keycloak.login(),
    logout: () => keycloak.logout(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
