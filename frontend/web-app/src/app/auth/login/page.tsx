'use client';
// frontend/web-app/src/app/auth/login/page.tsx
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { iamApi } from '@/api/iam';
import { useAuth } from '@/contexts/AuthContext';
import { HttpError } from '@/api/client';

// Decodifica o payload do JWT (sem verificar assinatura — só para extrair userId)
function decodeJwtPayload(token: string): { sub?: string } {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return {};
  }
}

export default function LoginPage() {
  const router  = useRouter();
  const { login } = useAuth();

  const [email,   setEmail]   = useState('');
  const [password, setPassword] = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const session = await iamApi.login({ email, password });
      const payload = decodeJwtPayload(session.token);
      login(session.token, payload.sub ?? '');
      router.push('/');
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Erro ao entrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-split-card">
        <aside className="auth-brand-panel">
          <Image
            src="/brand/logo_with_transparent_background.png"
            alt="CeliLac"
            width={180}
            height={180}
            priority
            className="auth-brand-panel-logo"
          />
          <p className="auth-brand-panel-wordmark">
            Celi<span>Lac</span>
          </p>
          <p className="auth-brand-panel-tagline">Vivendo bem a vida</p>
        </aside>

        <div className="auth-form-panel">
          <div className="auth-card animate-slide">
            <div className="auth-logo">
              <Image src="/brand/logo_with_transparent_background.png" alt="CeliLac" width={64} height={64} priority />
            </div>

            <h1 className="auth-title">Acesse sua conta</h1>
            <p className="auth-subtitle">Entre para continuar sua jornada com segurança alimentar.</p>

            {error && <div className="alert alert-error" role="alert">{error}</div>}

            <form className="auth-form" onSubmit={handleSubmit} id="login-form">
              <div className="field">
                <label className="field-label" htmlFor="login-email">E-mail</label>
                <input
                  id="login-email"
                  type="email"
                  className="field-input"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="login-password">Senha</label>
                <input
                  id="login-password"
                  type="password"
                  className="field-input"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                className="btn btn-em"
                id="login-submit"
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
              >
                {loading ? 'Entrando…' : '→ Entrar'}
              </button>
            </form>

            <p className="auth-footer-link">
              Não tem conta? <Link href="/auth/register">Criar conta grátis</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
