'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

import { iamApi } from '@/api/iam';
import { useToast } from '@/hooks/useToast';
import { HttpError } from '@/api/client';
import { Header } from '@/components/layout/Header';
import { PasswordEyeIcon } from '@/components/common/PasswordEyeIcon';

const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const hasMinLength = newPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isPasswordValid = STRONG_PASSWORD_REGEX.test(newPassword);

  async function handleResendCode() {
    if (countdown > 0 || resending) return;
    if (!email.trim()) {
      toast.error('Informe seu e-mail para reenviar o código.', 'E-mail obrigatório');
      return;
    }

    setResending(true);
    try {
      await iamApi.requestPasswordReset(email.trim());
      toast.info('Um novo código de recuperação foi enviado para seu e-mail.', 'Código Reenviado');
      setCountdown(60);
    } catch (err) {
      toast.error(
        err instanceof HttpError ? err.message : 'Erro ao reenviar código.',
        'Falha no reenvio',
      );
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Por favor, informe seu e-mail.', 'Validação');
      return;
    }

    if (code.trim().length !== 6) {
      toast.error('O código de recuperação deve ter 6 dígitos.', 'Validação');
      return;
    }

    if (!isPasswordValid) {
      toast.error(
        'A nova senha deve ter no mínimo 8 caracteres, maiúscula, minúscula, número e símbolo especial.',
        'Senha Fraca',
      );
      return;
    }

    if (!passwordsMatch) {
      toast.error('As senhas digitadas não coincidem.', 'Validação');
      return;
    }

    setLoading(true);
    try {
      const res = await iamApi.resetPassword({
        email: email.trim(),
        code: code.trim(),
        newPassword,
      });

      toast.success(
        res.message || 'Senha redefinida com sucesso! Você já pode entrar com sua nova senha.',
        'Senha Alterada',
      );

      // Redireciona para login conforme definido no plano
      router.push('/auth/login');
    } catch (err) {
      toast.error(
        err instanceof HttpError ? err.message : 'Erro ao redefinir senha.',
        'Erro na redefinição',
      );
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

              <h1 className="auth-title">Redefinir senha</h1>
              <p className="auth-subtitle">
                Digite o código de 6 dígitos que você recebeu por e-mail e crie sua nova senha de acesso.
              </p>

              <form className="auth-form" onSubmit={handleSubmit} id="reset-password-form">
                <div className="field">
                  <label className="field-label" htmlFor="reset-email">E-mail</label>
                  <input
                    id="reset-email"
                    type="email"
                    className="field-input"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>

                <div className="field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
                    <label className="field-label" htmlFor="reset-code" style={{ marginBottom: 0 }}>
                      Código de Recuperação (6 dígitos)
                    </label>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={countdown > 0 || resending || !email.trim()}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: countdown > 0 ? 'var(--color-text-muted)' : 'var(--color-primary)',
                        fontSize: '0.8125rem',
                        cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                        padding: 0,
                        fontWeight: 500,
                      }}
                    >
                      {resending ? 'Reenviando…' : countdown > 0 ? `Reenviar em ${countdown}s` : 'Reenviar código'}
                    </button>
                  </div>
                  <input
                    id="reset-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className="field-input"
                    placeholder="Ex: 123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    style={{ letterSpacing: '3px', fontWeight: 600, fontSize: '1.125rem' }}
                    disabled={loading}
                  />
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="new-password">Nova Senha</label>
                  <div className="password-input-wrap">
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      className="field-input password-input"
                      placeholder="Mínimo 8 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="password-visibility-toggle"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      <PasswordEyeIcon visible={showPassword} />
                    </button>
                  </div>
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="confirm-password">Confirmar Nova Senha</label>
                  <div className="password-input-wrap">
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="field-input password-input"
                      placeholder="Repita a nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="password-visibility-toggle"
                      aria-label={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
                      aria-pressed={showConfirmPassword}
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      <PasswordEyeIcon visible={showConfirmPassword} />
                    </button>
                  </div>
                </div>

                {/* Checklist de requisitos de senha */}
                {newPassword.length > 0 && (
                  <div
                    style={{
                      fontSize: '0.75rem',
                      lineHeight: '1.4',
                      padding: '8px 12px',
                      background: 'var(--color-surface)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '4px',
                    }}
                  >
                    <span style={{ color: hasMinLength ? '#10b981' : 'var(--color-text-muted)' }}>
                      {hasMinLength ? '✓' : '○'} Mínimo 8 caracteres
                    </span>
                    <span style={{ color: hasUpperCase && hasLowerCase ? '#10b981' : 'var(--color-text-muted)' }}>
                      {hasUpperCase && hasLowerCase ? '✓' : '○'} Maiúscula e minúscula
                    </span>
                    <span style={{ color: hasNumber ? '#10b981' : 'var(--color-text-muted)' }}>
                      {hasNumber ? '✓' : '○'} Ao menos um número
                    </span>
                    <span style={{ color: hasSpecialChar ? '#10b981' : 'var(--color-text-muted)' }}>
                      {hasSpecialChar ? '✓' : '○'} Caractere especial (!@#$)
                    </span>
                    {confirmPassword.length > 0 && (
                      <span
                        style={{
                          gridColumn: 'span 2',
                          color: passwordsMatch ? '#10b981' : '#ef4444',
                          fontWeight: 500,
                        }}
                      >
                        {passwordsMatch ? '✓ As senhas coincidem' : '✗ As senhas não coincidem'}
                      </span>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-em"
                  id="reset-password-submit"
                  disabled={loading || !isPasswordValid || !passwordsMatch || code.length !== 6}
                  style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
                >
                  {loading ? 'Salvando nova senha…' : '→ Redefinir senha e entrar'}
                </button>
              </form>

              <p className="auth-footer-link">
                Lembrou sua senha? <Link href="/auth/login">Voltar para o login</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Carregando…</p>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
