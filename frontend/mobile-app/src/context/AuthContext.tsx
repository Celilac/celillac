// src/context/AuthContext.tsx
// Estado global de autenticação.
// Token armazenado de forma segura via expo-secure-store (Keychain/Keystore).
// Conforme FRONTEND_STRATEGY.md e AGENTS.md: JWT nunca exposto em AsyncStorage sem criptografia.

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { login as apiLogin, register as apiRegister, setAuthToken, RegisterPayload } from '../lib/api';
import { decodeJwt, isTokenExpired, JwtPayload } from '../lib/auth';

const TOKEN_KEY = 'celilac_auth_token';

interface AuthState {
  token: string | null;
  user: { id: string; role: string } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    isAuthenticated: false,
    isLoading: true, // Começa carregando enquanto lê o SecureStore
  });

  // Ao abrir o app, tenta recuperar o token salvo
  useEffect(() => {
    async function loadStoredToken() {
      try {
        const stored = await SecureStore.getItemAsync(TOKEN_KEY);
        if (stored && !isTokenExpired(stored)) {
          const payload = decodeJwt(stored) as JwtPayload;
          setAuthToken(stored);
          setState({
            token: stored,
            user: { id: payload.sub, role: payload.role },
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          // Token expirado ou inexistente — limpa
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    }
    loadStoredToken();
  }, []);

  const login = async (email: string, password: string) => {
    const { token } = await apiLogin({ email, password });
    const payload = decodeJwt(token) as JwtPayload;
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    setAuthToken(token);
    setState({
      token,
      user: { id: payload.sub, role: payload.role },
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const register = async (payload: RegisterPayload) => {
    await apiRegister(payload);
    // Após registrar, faz login automaticamente
    await login(payload.email, payload.password);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setAuthToken(null);
    setState({ token: null, user: null, isAuthenticated: false, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
