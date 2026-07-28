'use client';
// frontend/web-app/src/contexts/AuthContext.tsx
//
// Estratégia de armazenamento do JWT:
//   ✅ localStorage — persiste entre abas e janelas do mesmo navegador
//   ✅ Inicialização síncrona / SSR-safe para evitar falsos redirecionamentos no F5
//   ✅ Limpo explicitamente no logout (revogação via blacklist no backend)
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
  isInitializing:  boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Restaura sessão do localStorage de forma síncrona no cliente se disponível
  const [auth, setAuth] = useState<AuthState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const token  = localStorage.getItem(STORAGE_KEY_TOKEN);
        const userId = localStorage.getItem(STORAGE_KEY_USERID);
        if (token && userId) {
          return { token, userId };
        }
      } catch {
        // Fallback silencioso
      }
    }
    return { token: null, userId: null };
  });

  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  useEffect(() => {
    try {
      const token  = localStorage.getItem(STORAGE_KEY_TOKEN);
      const userId = localStorage.getItem(STORAGE_KEY_USERID);
      if (token && userId && (!auth.token || !auth.userId)) {
        setAuth({ token, userId });
      }
    } catch {
      // localStorage indisponível
    } finally {
      setIsInitializing(false);
    }
  }, [auth.token, auth.userId]);

  const login = useCallback((token: string, userId: string) => {
    try {
      localStorage.setItem(STORAGE_KEY_TOKEN,  token);
      localStorage.setItem(STORAGE_KEY_USERID, userId);
    } catch {
      // Falha silenciosa
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
    <AuthContext.Provider
      value={{
        ...auth,
        login,
        logout,
        isAuthenticated: !!auth.token,
        isInitializing,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
