'use client';
// frontend/web-app/src/app/auth/verify-email/page.tsx
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { iamApi } from '@/api/iam';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/useToast';
import { HttpError } from '@/api/client';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();

  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const localToken = typeof window !== 'undefined' ? localStorage.getItem('celilac:token') : null;
    if (!isAuthenticated && !localToken) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  // Contador de 60 segundos para reenvio de código
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  function handleDigitChange(index: number, value: string) {
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal) {
      const updated = [...digits];
      updated[index] = '';
      setDigits(updated);
      return;
    }

    const char = cleanVal[cleanVal.length - 1];
    const updated = [...digits];
    updated[index] = char;
    setDigits(updated);

    // Auto-advance para o próximo input
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasteData.length === 6) {
      setDigits(pasteData.split(''));
      inputRefs.current[5]?.focus();
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const fullCode = digits.join('');
    if (fullCode.length !== 6) {
      toast.error('Informe o código de 6 dígitos completo enviado para seu e-mail.', 'Código incompleto');
      return;
    }

    const currentToken = token || localStorage.getItem('celilac:token');
    if (!currentToken) {
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    try {
      await iamApi.verifyEmailCode(fullCode, currentToken);
      toast.success('Seu endereço de e-mail foi verificado com sucesso!', 'E-mail Verificado');
      router.push('/dashboard');
    } catch (err) {
      toast.error(
        err instanceof HttpError ? err.message : 'Erro ao verificar código de e-mail.',
        'Falha na verificação',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (countdown > 0 || resendLoading) return;

    const currentToken = token || localStorage.getItem('celilac:token');
    if (!currentToken) {
      router.push('/auth/login');
      return;
    }

    setResendLoading(true);
    try {
      await iamApi.resendEmailVerificationCode(currentToken);
      toast.info('Um novo código de verificação foi enviado para seu e-mail.', 'Código Reenviado');
      setCountdown(60);
    } catch (err) {
      toast.error(
        err instanceof HttpError ? err.message : 'Erro ao reenviar código de e-mail.',
        'Erro ao reenviar',
      );
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)' }}>
      <header className="topbar">
        <Link href="/" className="topbar-title brand-lockup">
          <Image src="/brand/logo_with_transparent_background.png" alt="CeliLac" width={32} height={32} priority />
          <span className="brand-wordmark">Celi<span>Lac</span></span>
          <span className="brand-tagline">Vivendo bem a vida</span>
        </Link>
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
          <Link href="/dashboard" className="btn btn-ghost" style={{ padding: '0.4rem 0.75rem' }}>
            🏠 Voltar ao Dashboard
          </Link>
        </nav>
      </header>

      <div className="auth-shell" style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div className="auth-card animate-slide" style={{ maxWidth: '460px', width: '100%', padding: '2rem' }}>
          <div className="auth-logo" style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <Image src="/brand/logo_with_transparent_background.png" alt="CeliLac" width={64} height={64} priority />
          </div>

          <h1 className="auth-title" style={{ textAlign: 'center' }}>Verificar E-mail</h1>
          <p className="auth-subtitle" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            Digite o código numérico de 6 dígitos que enviamos para o seu e-mail.
          </p>

          <form onSubmit={handleVerify} id="verify-email-form">
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                justifyContent: 'center',
                marginBottom: '1.5rem',
              }}
              onPaste={handlePaste}
            >
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  style={{
                    width: '44px',
                    height: '52px',
                    fontSize: '1.4rem',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    borderRadius: '8px',
                    border: '2px solid var(--color-border, #d1d5db)',
                    background: 'var(--color-bg-card, #ffffff)',
                    color: 'var(--color-text, #111827)',
                  }}
                  required
                />
              ))}
            </div>

            <button
              type="submit"
              className="btn btn-em"
              disabled={loading || digits.join('').length !== 6}
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginBottom: '1rem' }}
            >
              {loading ? 'Verificando…' : '✅ Validar Código'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>
            <p style={{ color: 'var(--color-text-secondary, #6b7280)', marginBottom: '0.5rem' }}>
              Não recebeu o código?
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={countdown > 0 || resendLoading}
              className="btn btn-ghost"
              style={{ fontSize: '0.85rem', color: countdown > 0 ? '#9ca3af' : 'var(--color-emerald, #10b981)' }}
            >
              {resendLoading
                ? 'Enviando…'
                : countdown > 0
                ? `🔄 Reenviar código em ${countdown}s`
                : '📩 Reenviar novo código'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
