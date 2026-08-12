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

function extractUserIdFromToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    return typeof parsed.sub === 'string' && parsed.sub.trim().length > 0 ? parsed.sub : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Restaura sessão do localStorage de forma síncrona no cliente se disponível
  const [auth, setAuth] = useState<AuthState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const token  = localStorage.getItem(STORAGE_KEY_TOKEN);
        let userId = localStorage.getItem(STORAGE_KEY_USERID);
        if (token) {
          if (!userId || userId.trim() === '') {
            userId = extractUserIdFromToken(token);
            if (userId) {
              localStorage.setItem(STORAGE_KEY_USERID, userId);
            }
          }
          if (userId) {
            return { token, userId };
          }
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
      let userId = localStorage.getItem(STORAGE_KEY_USERID);
      if (token) {
        if (!userId || userId.trim() === '') {
          userId = extractUserIdFromToken(token);
          if (userId) {
            localStorage.setItem(STORAGE_KEY_USERID, userId);
          }
        }
        if (userId && (!auth.token || auth.userId !== userId)) {
          setAuth({ token, userId });
        }
      }
    } catch {
      // localStorage indisponível
    } finally {
      setIsInitializing(false);
    }
  }, [auth.token, auth.userId]);

  const login = useCallback((token: string, userIdProvided?: string) => {
    const finalUserId = (userIdProvided && userIdProvided.trim().length > 0)
      ? userIdProvided
      : extractUserIdFromToken(token);

    if (!finalUserId) {
      console.error('[AuthContext] Não foi possível obter um userId válido a partir do token ou argumento.');
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY_TOKEN,  token);
      localStorage.setItem(STORAGE_KEY_USERID, finalUserId);
    } catch {
      // Falha silenciosa
    }
    setAuth({ token, userId: finalUserId });
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
