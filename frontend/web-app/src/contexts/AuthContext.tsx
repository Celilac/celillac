'use client';
// frontend/web-app/src/contexts/AuthContext.tsx
//
// Estratégia de armazenamento do JWT:
//   ✅ localStorage — persiste entre abas e janelas do mesmo navegador
//   ✅ Inicialização síncrona / SSR-safe para evitar falsos redirecionamentos no F5
//   ✅ Limpo explicitamente no logout (revogação via blacklist no backend)
//
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
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
  isLoggingOut:    boolean;
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
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

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
    const tokenToRevoke = auth.token;

    // 1. Ativa imediatamente o overlay para encobrir a tela e evitar tela zumbi ou header parcial
    setIsLoggingOut(true);

    // 2. Limpeza síncrona no cliente para resposta instantânea
    try {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_USERID);
    } catch { /* sem ação */ }
    setAuth({ token: null, userId: null });

    // 3. Notifica o backend em segundo plano com keepalive (não-bloqueante)
    if (tokenToRevoke) {
      iamApi.logout(tokenToRevoke).catch(() => {});
    }

    // 4. Redirecionamento determinístico e limpo para /auth/login
    // O breve timeout de 50ms permite ao React e navegador renderizarem o frame do overlay,
    // e o window.location.replace purga o cache em memória do App Router do Next.js
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.replace('/auth/login');
      }, 50);
    }
  }, [auth.token]);

  return (
    <AuthContext.Provider
      value={{
        ...auth,
        login,
        logout,
        isAuthenticated: !!auth.token,
        isInitializing,
        isLoggingOut,
      }}
    >
      {isLoggingOut && (
        <div className="logout-overlay" role="status" aria-live="polite">
          <Image
            src="/brand/logo_with_transparent_background.png"
            alt="CeLiLac"
            width={72}
            height={72}
            priority
          />
          <div className="logout-overlay-spinner" />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', fontWeight: 500 }}>
            Encerrando sessão...
          </p>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
