'use client';
// frontend/web-app/src/contexts/AuthContext.tsx
//
// Estratégia de armazenamento do JWT:
//   ✅ localStorage — persiste entre abas e janelas do mesmo navegador
//   ✅ Limpo explicitamente no logout (revogação via blacklist no backend)
//   ✅ Token revogado no servidor na chamada de logout — mesmo que localStorage
//      seja lido após o logout, o backend rejeita o token com 401.
//
// O token NÃO é exposto via window nem concatenado em logs.
//
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { iamApi } from '@/api/iam';

const STORAGE_KEY_TOKEN  = 'celilac:token';
const STORAGE_KEY_USERID = 'celilac:userId';

interface AuthState {
  token:  string | null;
  userId: string | null;
}

interface AuthContextValue extends AuthState {
  login:           (token: string, userId: string) => void;
  logout:          () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ token: null, userId: null });

  // Restaura sessão do localStorage ao montar (persiste entre abas e recargas)
  useEffect(() => {
    try {
      const token  = localStorage.getItem(STORAGE_KEY_TOKEN);
      const userId = localStorage.getItem(STORAGE_KEY_USERID);
      if (token && userId) {
        setAuth({ token, userId });
      }
    } catch {
      // localStorage indisponível (SSR ou modo privado restrito) — sem ação
    }
  }, []);

  const login = useCallback((token: string, userId: string) => {
    try {
      localStorage.setItem(STORAGE_KEY_TOKEN,  token);
      localStorage.setItem(STORAGE_KEY_USERID, userId);
    } catch {
      // Falha silenciosa — token só em memória como fallback
    }
    setAuth({ token, userId });
  }, []);

  const logout = useCallback(async () => {
    if (auth.token) {
      try {
        await iamApi.logout(auth.token);
      } catch {
        // Silencia erros para garantir logout client-side incondicional
      }
    }
    try {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_USERID);
    } catch { /* sem ação */ }
    setAuth({ token: null, userId: null });
  }, [auth.token]);

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
