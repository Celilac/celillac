'use client';
// frontend/web-app/src/app/auth/register/page.tsx
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { iamApi } from '@/api/iam';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/useToast';
import { HttpError } from '@/api/client';

const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

function PasswordEyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M2 12C3.8 7.9 7.4 5 12 5C16.6 5 20.2 7.9 22 12C20.2 16.1 16.6 19 12 19C7.4 19 3.8 16.1 2 12Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    );
  }

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 3L21 21"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.6 10.7C10.2 11.1 10 11.5 10 12C10 13.1 10.9 14 12 14C12.5 14 12.9 13.8 13.3 13.4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.9 5.3C10.6 5.1 11.3 5 12 5C16.6 5 20.2 7.9 22 12C21.2 13.8 20.1 15.3 18.6 16.4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 6.2C4.3 7.5 3 9.5 2 12C3.8 16.1 7.4 19 12 19C13.9 19 15.6 18.5 17 17.7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'CELIACO' | 'PARCEIRO'>('CELIACO');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordStrengthMessage = password && !STRONG_PASSWORD_REGEX.test(password)
    ? 'Use 8+ caracteres com letra maiúscula, minúscula, número e símbolo.'
    : '';

  const confirmPasswordMessage = confirmPassword && password !== confirmPassword
    ? 'As senhas devem ser iguais.'
    : '';

  const isSubmitDisabled =
    loading ||
    !email.trim() ||
    !password ||
    !confirmPassword ||
    Boolean(passwordStrengthMessage) ||
    Boolean(confirmPasswordMessage);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!STRONG_PASSWORD_REGEX.test(password)) {
      toast.error(
        'Use uma senha forte com 8+ caracteres, letra maiúscula, minúscula, número e símbolo.',
        'Senha inválida',
      );
      return;
    }

    if (password !== confirmPassword) {
      toast.error('A confirmação de senha precisa ser igual à senha.', 'Confirmação inválida');
      return;
    }

    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const user = await iamApi.register({ email: normalizedEmail, password, role, fullName: fullName.trim() } as any);
      
      const session = await iamApi.login({ email: normalizedEmail, password });
      login(session.token, user.id);
      toast.success('Conta criada com sucesso!');
      router.push('/profile');
    } catch (err) {
      toast.error(err instanceof HttpError ? err.message : 'Erro ao criar conta.', 'Erro ao criar conta');
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

              <form className="auth-form" onSubmit={handleSubmit} id="register-form">
                <div className="field">
                  <label className="field-label" htmlFor="register-fullname">Nome completo</label>
                  <input
                    id="register-fullname"
                    type="text"
                    className="field-input"
                    placeholder="Seu Nome Completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

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
                  <div className="password-input-wrap">
                    <input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      className="field-input password-input"
                      placeholder="Use uma senha forte"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      aria-invalid={Boolean(passwordStrengthMessage)}
                    />
                    <button
                      type="button"
                      className="password-visibility-toggle"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      <PasswordEyeIcon visible={showPassword} />
                    </button>
                  </div>
                  <p className={passwordStrengthMessage ? 'field-error' : 'field-hint'}>
                    {passwordStrengthMessage || 'Use 8+ caracteres com letra maiúscula, minúscula, número e símbolo.'}
                  </p>
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="register-confirm-password">Confirmar senha</label>
                  <div className="password-input-wrap">
                    <input
                      id="register-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="field-input password-input"
                      placeholder="Repita sua senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      aria-invalid={Boolean(confirmPasswordMessage)}
                    />
                    <button
                      type="button"
                      className="password-visibility-toggle"
                      aria-label={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
                      aria-pressed={showConfirmPassword}
                      onClick={() => setShowConfirmPassword((current) => !current)}
                    >
                      <PasswordEyeIcon visible={showConfirmPassword} />
                    </button>
                  </div>
                  {confirmPasswordMessage ? <p className="field-error">{confirmPasswordMessage}</p> : null}
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="register-role">Tipo de conta</label>
                  <select
                    id="register-role"
                    className="field-input field-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value as typeof role)}
                  >
                    <option value="CELIACO">Eu possuo restrições/Opto por comida saudável</option>
                    <option value="PARCEIRO">Sou/Quero ser parceiro/fornecedor</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn btn-em"
                  id="register-submit"
                  disabled={isSubmitDisabled}
                  style={{ width: '100%', justifyContent: 'center' }}
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
