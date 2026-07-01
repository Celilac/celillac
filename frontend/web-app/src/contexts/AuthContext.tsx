'use client';
// frontend/web-app/src/contexts/AuthContext.tsx
// JWT armazenado em memória (não localStorage) para segurança.
import React, { createContext, useContext, useState, useCallback } from 'react';

interface AuthState {
  token: string | null;
  userId: string | null;
}

interface AuthContextValue extends AuthState {
  login:  (token: string, userId: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ token: null, userId: null });

  const login = useCallback((token: string, userId: string) => {
    setAuth({ token, userId });
  }, []);

  const logout = useCallback(() => {
    setAuth({ token: null, userId: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, isAuthenticated: !!auth.token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
