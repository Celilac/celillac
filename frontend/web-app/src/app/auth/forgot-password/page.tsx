'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { iamApi } from '@/api/iam';
import { useToast } from '@/hooks/useToast';
import { HttpError } from '@/api/client';
import { Header } from '@/components/layout/Header';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const response = await iamApi.requestPasswordReset(email.trim());
      toast.success(
        response.message || 'Se o e-mail estiver cadastrado, você receberá o código em instantes.',
        'Código Enviado',
      );
      router.push(`/auth/reset-password?email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      toast.error(
        err instanceof HttpError ? err.message : 'Erro ao solicitar recuperação de senha.',
        'Erro na solicitação',
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

              <h1 className="auth-title">Recuperar senha</h1>
              <p className="auth-subtitle">
                Informe o e-mail cadastrado na sua conta. Enviaremos um código OTP de 6 dígitos para você redefinir sua senha com segurança.
              </p>

              <form className="auth-form" onSubmit={handleSubmit} id="forgot-password-form">
                <div className="field">
                  <label className="field-label" htmlFor="forgot-email">E-mail</label>
                  <input
                    id="forgot-email"
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

                <button
                  type="submit"
                  className="btn btn-em"
                  id="forgot-password-submit"
                  disabled={loading || !email.trim()}
                  style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
                >
                  {loading ? 'Enviando código…' : '→ Enviar código de recuperação'}
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
