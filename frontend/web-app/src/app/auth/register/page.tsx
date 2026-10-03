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
import { Header } from '@/components/layout/Header';
import { PasswordEyeIcon } from '@/components/common/PasswordEyeIcon';

const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();

  const [step, setStep] = useState<'ROLE_SELECTION' | 'FORM'>('ROLE_SELECTION');
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

  function handleSelectRole(selectedRole: 'CELIACO' | 'PARCEIRO') {
    setRole(selectedRole);
    setStep('FORM');
  }

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
      toast.success('Conta criada com sucesso! Por favor, valide o código enviado para o seu e-mail.', 'Bem-vindo');
      router.push('/auth/verify-email?recent=true');
    } catch (err) {
      toast.error(err instanceof HttpError ? err.message : 'Erro ao criar conta.', 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)' }}>
      <Header />

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

              {step === 'ROLE_SELECTION' ? (
                <div>
                  <h1 className="auth-title">Criar conta</h1>
                  <p className="auth-subtitle">Qual tipo de conta melhor descreve o seu objetivo?</p>

                  <div className="role-options-list">
                    <button
                      type="button"
                      id="select-role-celiaco"
                      className="role-option-card"
                      onClick={() => handleSelectRole('CELIACO')}
                    >
                      <span className="role-option-icon" role="img" aria-label="Consumidor">🥗</span>
                      <div className="role-option-body">
                        <div className="role-option-title">
                          <span>Consumidor / Perfil Alimentar</span>
                          <span className="role-option-arrow">→</span>
                        </div>
                        <p className="role-option-desc">
                          Tenho restrições alimentares (celíaco, intolerâncias, alergias) ou busco produtos e estabelecimentos seguros.
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      id="select-role-parceiro"
                      className="role-option-card"
                      onClick={() => handleSelectRole('PARCEIRO')}
                    >
                      <span className="role-option-icon" role="img" aria-label="Parceiro">🏪</span>
                      <div className="role-option-body">
                        <div className="role-option-title">
                          <span>Parceiro / Fornecedor</span>
                          <span className="role-option-arrow">→</span>
                        </div>
                        <p className="role-option-desc">
                          Sou restaurante, padaria, produtor ou comércio e quero cadastrar estabelecimentos e opções seguras.
                        </p>
                      </div>
                    </button>
                  </div>

                  <p className="auth-footer-link">
                    Já tem conta? <Link href="/auth/login">Entrar</Link>
                  </p>
                </div>
              ) : (
                <div>
                  <div className="role-header-banner">
                    <div className="role-header-banner-role">
                      <span>{role === 'CELIACO' ? '🥗' : '🏪'}</span>
                      <span>{role === 'CELIACO' ? 'Conta Consumidor' : 'Conta Parceiro / Fornecedor'}</span>
                    </div>
                    <button
                      type="button"
                      id="change-role-btn"
                      className="role-header-banner-change"
                      onClick={() => setStep('ROLE_SELECTION')}
                    >
                      ← Alterar
                    </button>
                  </div>

                  <h1 className="auth-title">Criar conta</h1>
                  <p className="auth-subtitle">
                    {role === 'CELIACO'
                      ? 'Configure seu perfil alimentar e coma com segurança.'
                      : 'Cadastre seu acesso de parceiro e gerencie suas ofertas.'}
                  </p>

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

                    <button
                      type="submit"
                      className="btn btn-em"
                      id="register-submit"
                      disabled={isSubmitDisabled}
                      style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
                    >
                      {loading ? 'Criando conta…' : '✨ Criar minha conta'}
                    </button>
                  </form>

                  <p className="auth-footer-link">
                    Já tem conta? <Link href="/auth/login">Entrar</Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
