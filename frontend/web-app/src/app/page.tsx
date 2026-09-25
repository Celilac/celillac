'use client';
// frontend/web-app/src/app/page.tsx — Home
// ⚠️ REGRA: compatibilidade consultada via POST /compatibility/check (Backend)
//    O riskLevel é RENDERIZADO, nunca calculado aqui.
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RiskBadge } from '@/components/compatibility/RiskBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Header } from '@/components/layout/Header';
import { foodProfileApi } from '@/api/food-profile';
import { apiClient } from '@/api/client';
import {
  getRecentChecks,
  clearRecentChecks,
  formatRecentDate,
  RecentCheckItem,
} from '@/services/recentChecks';
import type { RiskLevel } from '@/api/compatibility';

interface UserProfileSummary {
  isComplete: boolean;
  restrictionsCount: number;
  role: string;
  fullName?: string;
}

export default function Home() {
  const { isAuthenticated, userId, token } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [recentChecks, setRecentChecks] = useState<RecentCheckItem[]>([]);
  const [profileSummary, setProfileSummary] = useState<UserProfileSummary | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const loadRecentChecksList = useCallback(() => {
    const list = getRecentChecks(userId);
    setRecentChecks(list);
  }, [userId]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    loadRecentChecksList();
  }, [mounted, loadRecentChecksList]);

  useEffect(() => {
    if (!mounted || !isAuthenticated || !token || !userId) {
      setProfileSummary(null);
      return;
    }

    setLoadingProfile(true);
    apiClient
      .get<{ role?: string; fullName?: string }>('/iam/me', token)
      .then((user) => {
        const role = user?.role || 'CELIACO';
        const fullName = user?.fullName;

        if (role === 'PARCEIRO' || role === 'ADMIN') {
          setProfileSummary({
            isComplete: true,
            restrictionsCount: 0,
            role,
            fullName,
          });
          setLoadingProfile(false);
          return;
        }

        foodProfileApi
          .getByUserId(userId, token)
          .then((profile) => {
            const count = profile?.restrictions?.length || 0;
            setProfileSummary({
              isComplete: count > 0,
              restrictionsCount: count,
              role,
              fullName,
            });
          })
          .catch(() => {
            setProfileSummary({
              isComplete: false,
              restrictionsCount: 0,
              role,
              fullName,
            });
          })
          .finally(() => setLoadingProfile(false));
      })
      .catch(() => {
        setLoadingProfile(false);
      });
  }, [mounted, isAuthenticated, token, userId]);

  const handleClearHistory = () => {
    clearRecentChecks(userId);
    setRecentChecks([]);
  };

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
          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link
              href="/dashboard"
              className="btn btn-em"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.7rem 1.5rem',
                fontSize: 'var(--text-body)',
                textDecoration: 'none',
              }}
            >
              🔍 Analisador de Produtos (Dashboard) →
            </Link>
            <Link
              href="/public-partners"
              className="btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.7rem 1.25rem',
                fontSize: 'var(--text-body)',
                textDecoration: 'none',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              🏢 Descobrir Locais Seguros
            </Link>
          </div>
        </div>

        {/* ── Cards de resumo ── */}
        <div className="cards-grid" style={{ marginBottom: '2rem' }}>
          <div className="card">
            <p className="card-title">Status do Perfil</p>
            {mounted && isAuthenticated ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {loadingProfile ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Carregando perfil...</p>
                ) : profileSummary ? (
                  <>
                    <div>
                      {profileSummary.fullName ? (
                        <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text)' }}>
                          Olá, {profileSummary.fullName}
                        </p>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                          ID: {userId?.substring(0, 12)}…
                        </span>
                      )}
                    </div>

                    {profileSummary.role === 'PARCEIRO' ? (
                      <div>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.6rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: 'var(--color-status-approved-bg)',
                            color: 'var(--color-status-approved)',
                            border: '1px solid var(--color-status-approved-border)',
                            marginBottom: '0.5rem',
                          }}
                        >
                          Perfil de Parceiro
                        </span>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                          Gerenciamento de estabelecimentos e produtos.
                        </p>
                      </div>
                    ) : profileSummary.role === 'ADMIN' ? (
                      <div>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.6rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: '#60A5FA',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            marginBottom: '0.5rem',
                          }}
                        >
                          Administrador
                        </span>
                      </div>
                    ) : profileSummary.isComplete ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.2rem 0.55rem',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: 'var(--color-safe-bg)',
                              color: 'var(--color-safe)',
                              border: '1px solid var(--color-safe-border)',
                            }}
                          >
                            ✓ Perfil Configurado
                          </span>
                        </div>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                          {profileSummary.restrictionsCount}{' '}
                          {profileSummary.restrictionsCount === 1 ? 'restrição ativa' : 'restrições ativas'} cadastradas.
                        </p>
                        <Link
                          href="/profile"
                          style={{ color: 'var(--color-emerald)', fontSize: '0.8rem', fontWeight: 600 }}
                        >
                          Gerenciar restrições →
                        </Link>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.2rem 0.55rem',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: 'var(--color-warning-bg)',
                              color: 'var(--color-warning)',
                              border: '1px solid var(--color-warning-border)',
                            }}
                          >
                            ⚠️ Perfil Incompleto
                          </span>
                        </div>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                          Configure suas restrições para obter análises de segurança alimentar precisas.
                        </p>
                        <Link
                          href="/profile"
                          style={{ color: 'var(--color-emerald)', fontSize: '0.8rem', fontWeight: 600 }}
                        >
                          Configurar agora →
                        </Link>
                      </div>
                    )}
                  </>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    ID: {userId?.substring(0, 12)}…
                  </span>
                )}
              </div>
            ) : (
              <div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  Faça login para ver seu perfil e analisar produtos com suas restrições.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link href="/auth/login" className="btn btn-em" style={{ fontSize: '0.8rem' }}>
                    Entrar
                  </Link>
                  <Link
                    href="/auth/register"
                    className="btn"
                    style={{
                      fontSize: '0.8rem',
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                    }}
                  >
                    Cadastrar
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <p className="card-title">Motor de Alérgenos</p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              A verificação de compatibilidade é processada <strong>exclusivamente no servidor</strong> pela arquitetura
              auditável do CeLiLac.
            </p>
            <div style={{ marginTop: '1rem' }}>
              <Link
                href="/dashboard"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  color: 'var(--color-emerald)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Ir para o Analisador de Produtos →
              </Link>
            </div>
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.5rem',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <p className="card-title" style={{ margin: 0 }}>
              Verificações Recentes
            </p>
            {mounted && recentChecks.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '0.2rem 0.5rem',
                }}
                title="Limpar histórico de verificações salvas neste navegador"
              >
                Limpar histórico
              </button>
            )}
          </div>

          <p style={{ fontSize: '0.825rem', color: 'var(--color-text-subtle)', marginBottom: '1.25rem' }}>
            Histórico das últimas análises de compatibilidade alimentar consultadas para o seu perfil.
          </p>

          {mounted && recentChecks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentChecks.map((item, i) => (
                <Link
                  key={`${item.productId}-${i}`}
                  href={`/products/${item.productId}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1.1rem',
                    background: 'var(--color-elevated)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'border-color 0.2s, transform 0.15s, background-color 0.2s',
                    animation: `slideUp 0.3s ease ${i * 0.04}s both`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-emerald)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div style={{ marginRight: '1rem' }}>
                    <p style={{ fontWeight: 600, fontSize: 'var(--text-body)', color: 'var(--color-text)' }}>
                      {item.productName}
                    </p>
                    <p style={{ fontSize: 'var(--text-label)', color: 'var(--color-text-subtle)', marginTop: '2px' }}>
                      {formatRecentDate(item.checkedAt)}
                    </p>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <RiskBadge riskLevel={item.riskLevel} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2.5rem 1.5rem',
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--color-border)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '2rem',
                  marginBottom: '0.75rem',
                  opacity: 0.8,
                }}
              >
                🔎
              </div>
              <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text)', marginBottom: '0.35rem' }}>
                Nenhuma verificação recente
              </p>
              <p
                style={{
                  fontSize: '0.825rem',
                  color: 'var(--color-text-muted)',
                  maxWidth: '420px',
                  lineHeight: 1.5,
                  marginBottom: '1.25rem',
                }}
              >
                Ao pesquisar e verificar produtos no Analisador ou abrir os detalhes de um item, seu histórico de
                segurança alimentar aparecerá aqui.
              </p>
              <Link
                href="/dashboard"
                className="btn btn-em"
                style={{
                  fontSize: '0.8rem',
                  padding: '0.55rem 1.25rem',
                  textDecoration: 'none',
                }}
              >
                Pesquisar Produtos no Dashboard →
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
