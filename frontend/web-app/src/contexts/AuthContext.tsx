'use client';
// frontend/web-app/src/contexts/AuthContext.tsx
//
// Estratégia de armazenamento do JWT:
//   ✅ sessionStorage — persiste durante a sessão da aba (navegação client-side incluída)
//   ✅ Limpo automaticamente ao fechar a aba
//   ❌ localStorage — proibido (persiste indefinidamente, risco maior de XSS)
//
// O token NÃO é exposto via window nem concatenado em logs.
//
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const SESSION_KEY_TOKEN  = 'celilac:token';
const SESSION_KEY_USERID = 'celilac:userId';

interface AuthState {
  token:  string | null;
  userId: string | null;
}

interface AuthContextValue extends AuthState {
  login:           (token: string, userId: string) => void;
  logout:          () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ token: null, userId: null });

  // Restaura sessão do sessionStorage ao montar (sobrevive a navegação Next.js)
  useEffect(() => {
    try {
      const token  = sessionStorage.getItem(SESSION_KEY_TOKEN);
      const userId = sessionStorage.getItem(SESSION_KEY_USERID);
      if (token && userId) {
        setAuth({ token, userId });
      }
    } catch {
      // sessionStorage indisponível (SSR ou modo privado restrito) — sem ação
    }
  }, []);

  const login = useCallback((token: string, userId: string) => {
    try {
      sessionStorage.setItem(SESSION_KEY_TOKEN,  token);
      sessionStorage.setItem(SESSION_KEY_USERID, userId);
    } catch {
      // Falha silenciosa — token só em memória como fallback
    }
    setAuth({ token, userId });
  }, []);

  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_KEY_TOKEN);
      sessionStorage.removeItem(SESSION_KEY_USERID);
    } catch { /* sem ação */ }
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
