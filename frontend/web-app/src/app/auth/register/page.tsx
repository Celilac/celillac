'use client';
// frontend/web-app/src/app/auth/register/page.tsx
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { iamApi } from '@/api/iam';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { HttpError } from '@/api/client';

export default function RegisterPage() {
  const router   = useRouter();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState<'CELIACO' | 'PARCEIRO'>('CELIACO');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await iamApi.register({ email, password, role });
      // Após cadastro, faz login automático para obter o token
      const session = await iamApi.login({ email, password });
      login(session.token, user.id);
      router.push('/profile');
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)' }}>
      <header className="topbar">
        <span className="topbar-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Image src="/brand/logo_with_transparent_background.png" alt="CeliLac" width={32} height={32} priority />
          <span className="brand-wordmark">
            Celi<span>Lac</span>
          </span>
          <span className="brand-tagline">Vivendo bem a vida</span>
        </span>
        <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={toggleTheme}
            className="btn btn-ghost"
            aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
            style={{ padding: '0.4rem 0.75rem' }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <Link href="/" className="btn btn-ghost" aria-label="Ir para a página inicial" style={{ padding: '0.4rem 0.75rem' }}>
            🏠
          </Link>
        </nav>
      </header>

      <div className="auth-shell" style={{ flex: 1, minHeight: 0 }}>
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

              <h1 className="auth-title">Criar conta</h1>
              <p className="auth-subtitle">Configure seu perfil alimentar e coma com segurança.</p>

              {error && <div className="alert alert-error" role="alert">{error}</div>}

              <form className="auth-form" onSubmit={handleSubmit} id="register-form">
                <div className="field">
                  <label className="field-label" htmlFor="register-email">E-mail</label>
                  <input
                    id="register-email"
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
                  <label className="field-label" htmlFor="register-password">Senha</label>
                  <input
                    id="register-password"
                    type="password"
                    className="field-input"
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="register-role">Tipo de conta</label>
                  <select
                    id="register-role"
                    className="field-input field-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value as typeof role)}
                  >
                    <option value="CELIACO">🛡️ Celíaco / Pessoa com restrição</option>
                    <option value="PARCEIRO">🏪 Parceiro (Restaurante / Loja)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn btn-em"
                  id="register-submit"
                  disabled={loading}
                  style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
                >
                  {loading ? 'Criando conta…' : '✨ Criar minha conta'}
                </button>
              </form>

              <p className="auth-footer-link">
                Já tem conta? <Link href="/auth/login">Entrar</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
