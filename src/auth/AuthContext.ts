import { createContext } from 'react';

export interface AuthContextValue {
  token: string | undefined;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  token: undefined,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
});
