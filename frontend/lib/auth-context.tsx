'use client';

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { SessionUser } from './api';

interface AuthState {
  user: SessionUser | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: SessionUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const t = localStorage.getItem('token');
      const u = localStorage.getItem('user');
      if (t && u) {
        setToken(t);
        setUser(JSON.parse(u));
      }
    } catch {
      /* corrupted storage — start clean */
    }
    setLoading(false);
  }, []);

  const login = (t: string, u: SessionUser) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
