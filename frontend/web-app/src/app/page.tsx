'use client';
// frontend/web-app/src/app/page.tsx — Home
// ⚠️ REGRA: compatibilidade consultada via POST /compatibility/check (Backend)
//    O riskLevel é RENDERIZADO, nunca calculado aqui.
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RiskBadge } from '@/components/compatibility/RiskBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Header } from '@/components/layout/Header';
import type { RiskLevel } from '@/api/compatibility';

// Dados de demonstração — serão substituídos por dados reais do backend
const DEMO_CHECKS: Array<{ product: string; riskLevel: RiskLevel; date: string }> = [
  { product: 'Macarrão Integral',    riskLevel: 'BLOCKED', date: 'Hoje, 14:32' },
  { product: 'Iogurte Natural',      riskLevel: 'WARNING', date: 'Hoje, 12:10' },
  { product: 'Arroz Branco',         riskLevel: 'SAFE',    date: 'Ontem, 19:45' },
  { product: 'Chocolate 70% Cacau',  riskLevel: 'DANGER',  date: 'Ontem, 16:20' },
];

export default function Home() {
  const { isAuthenticated, userId, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Header />

      <main className="page-container">
        {/* ── Header ── */}
        <div className="page-header" style={{ marginBottom: '2rem' }}>
          <h1 className="page-title">Plataforma CeLiLac</h1>
          <p className="page-subtitle">
            Segurança alimentar transparente e confiável para celíacos e pessoas com restrições alimentares.
          </p>
          <div style={{ marginTop: '1.25rem' }}>
            <Link href="/dashboard" className="btn btn-em" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.5rem', fontSize: '1rem', textDecoration: 'none' }}>
              🔍 Acessar Analisador de Produtos (Dashboard) →
            </Link>
          </div>
        </div>

        {/* ── Cards de resumo ── */}
        <div className="cards-grid" style={{ marginBottom: '2rem' }}>
          <div className="card">
            <p className="card-title">Status do Perfil</p>
            {mounted && isAuthenticated ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>ID: {userId?.substring(0, 12)}…</span>
                <RiskBadge riskLevel="SAFE" showLabel />
              </div>
            ) : (
              <div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  Faça login para ver seu perfil.
                </p>
                <Link href="/auth/login" className="btn btn-em" style={{ fontSize: '0.8rem' }}>Entrar</Link>
              </div>
            )}
          </div>

          <div className="card">
            <p className="card-title">Motor de Alérgenos</p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              A verificação de compatibilidade é processada <strong>exclusivamente no servidor</strong>.
              Configure seu perfil para começar.
            </p>
            <Link href="/profile" style={{ display: 'inline-block', marginTop: '1rem', color: 'var(--color-emerald)', fontSize: '0.875rem', fontWeight: 600 }}>
              Configurar perfil →
            </Link>
          </div>

          <div className="card">
            <p className="card-title">Legenda de Riscos</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(['BLOCKED', 'DANGER', 'WARNING', 'SAFE'] as RiskLevel[]).map((r) => (
                <RiskBadge key={r} riskLevel={r} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Verificações recentes ── */}
        <div className="card">
          <p className="card-title">Verificações Recentes</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)', marginBottom: '1.5rem' }}>
            * Demonstração — dados reais virão de <code style={{ color: 'var(--color-emerald)' }}>POST /compatibility/check</code>
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {DEMO_CHECKS.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  background: 'var(--color-elevated)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  animation: `slideUp 0.3s ease ${i * 0.05}s both`,
                }}
              >
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.product}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', marginTop: '2px' }}>{item.date}</p>
                </div>
                <RiskBadge riskLevel={item.riskLevel} />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
