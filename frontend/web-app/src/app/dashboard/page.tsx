'use client';
// frontend/web-app/src/app/dashboard/page.tsx
//
// ⚠️ REGRA ARQUITETURAL — FRONTEND_STRATEGY.md
//   ❌ Não usar fetch() diretamente
//   ❌ Não hardcodar userId
//   ✅ Usar catalogApi, compatibilityApi e o userId do AuthContext
//
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { catalogApi } from '@/api/catalog';
import { compatibilityApi, CompatibilityResponse } from '@/api/compatibility';
import { foodProfileApi } from '@/api/food-profile';
import { apiClient } from '@/api/client';
import { useToast } from '@/hooks/useToast';
import { Header } from '@/components/layout/Header';
import { HttpError } from '@/api/client';
import styles from './dashboard.module.css';

interface ReportWithName extends CompatibilityResponse {
  productName: string;
}

interface RestrictionItem {
  id?: string;
  allergen: string;
  severity: string;
  type?: string;
  notes?: string;
}

const ALLERGEN_LABELS: Record<string, string> = {
  GLUTEN: '🌾 Glúten',
  LACTOSE: '🥛 Lactose',
  NUTS: '🥜 Castanhas / Amendoim',
  SOY: '🫘 Soja',
  EGGS: '🥚 Ovos',
  SHELLFISH: '🦐 Frutos do Mar',
  FISH: '🐟 Peixes',
  SESAME: '🌱 Gergelim',
  OTHER: '⚠️ Outro',
};

const SEVERITY_BADGES: Record<string, { label: string; bg: string; color: string }> = {
  FATAL: { label: '🔴 Fatal (Celíaco)', bg: '#fef2f2', color: '#991b1b' },
  HIGH: { label: '🟠 Severidade Alta', bg: '#fff7ed', color: '#c2410c' },
  MEDIUM: { label: '🟡 Severidade Média', bg: '#fefce8', color: '#a16207' },
  LOW: { label: '🟢 Severidade Baixa', bg: '#f0fdf4', color: '#15803d' },
  LIFESTYLE: { label: '🟣 Estilo de Vida', bg: '#faf5ff', color: '#7e22ce' },
};

export default function DashboardPage() {
  const { token, userId, isAuthenticated } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [report, setReport] = useState<ReportWithName | null>(null);
  const [loading, setLoading] = useState(false);
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(true);
  const [userRestrictions, setUserRestrictions] = useState<RestrictionItem[]>([]);
  const [acceptsCrossContamination, setAcceptsCrossContamination] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated && token && userId) {
      // Checa os dados do usuário para verificar role e status de e-mail
      apiClient.get<any>('/iam/me', token)
        .then((u) => {
          setIsEmailVerified(u?.isEmailVerified !== false);
          
          const role = u?.role;
          // Contas corporativas e operacionais (ADMIN e PARCEIRO) não exigem perfil alimentar de consumidor
          if (role === 'ADMIN' || role === 'PARCEIRO') {
            setIsProfileIncomplete(false);
            return;
          }

          // Para consumidores e celíacos, verifica as restrições cadastradas
          foodProfileApi.getByUserId(userId, token)
            .then((profile) => {
              if (!profile || !profile.restrictions || profile.restrictions.length === 0) {
                setIsProfileIncomplete(true);
                setUserRestrictions([]);
              } else {
                setIsProfileIncomplete(false);
                setUserRestrictions(profile.restrictions);
              }
              setAcceptsCrossContamination(!!profile?.acceptsCrossContamination);
            })
            .catch(() => {
              setIsProfileIncomplete(true);
              setUserRestrictions([]);
            });
        })
        .catch(() => {});
    }
  }, [isAuthenticated, token, userId]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (!isAuthenticated || !token || !userId) {
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    setReport(null);

    try {
      const result = await catalogApi.search(searchQuery, token);
      const products = result.data;

      if (!products || products.length === 0) {
        toast.warning('Nenhum produto encontrado com este nome.', 'Aviso');
        return;
      }

      const product = products[0];

      const compatibility = await compatibilityApi.check(
        { userId, productId: product.id },
        token,
      );

      setReport({ ...compatibility, productName: product.name });
    } catch (err) {
      const message = err instanceof HttpError ? err.message : (err as Error).message ?? 'Erro desconhecido.';
      toast.error(message, 'Erro ao analisar produto');
    } finally {
      setLoading(false);
    }
  };

  const getCompatibilityBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'SAFE':
        return { label: '🟢 COMPATÍVEL', text: 'Compatível com as informações disponíveis.', class: styles.statusSafe };
      case 'WARNING':
        return { label: '🟡 ATENÇÃO', text: 'Possível risco de contaminação cruzada ou restrição moderada.', class: styles.statusWarning || styles.statusBlocked };
      case 'DANGER':
      case 'BLOCKED':
        return { label: '🔴 INCOMPATÍVEL', text: 'Contém ingrediente conflitante com seu perfil.', class: styles.statusBlocked };
      default:
        return { label: '⚪ INDETERMINADO', text: 'Informações insuficientes para garantir compatibilidade.', class: styles.statusWarning || styles.statusBlocked };
    }
  };

  return (
    <div className="dashboard-page-wrapper">
      <Header />

      <main className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Meu Dashboard</h1>
          <p className={styles.subtitle}>Verifique seus produtos com transparência e segurança alimentar.</p>
        </header>

        {/* Banner de E-mail Não Verificado */}
        {mounted && !isEmailVerified && (
          <div style={{
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            border: '1px solid #fca5a5',
            color: '#991b1b',
            padding: '1.25rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <div>
              <strong style={{ fontSize: '1.05rem', display: 'block', marginBottom: '0.25rem' }}>
                📩 Verifique seu e-mail para desbloquear todas as funções
              </strong>
              <span style={{ fontSize: '0.9rem' }}>
                Enviamos um código de verificação para o seu e-mail. Confirme seu e-mail para garantir a segurança da sua conta.
              </span>
            </div>
            <Link href="/auth/verify-email" className="btn btn-em" style={{ whiteSpace: 'nowrap', padding: '0.6rem 1.2rem', textDecoration: 'none', background: '#dc2626' }}>
              Verificar E-mail Agora
            </Link>
          </div>
        )}

        {/* Banner de Perfil Incompleto */}
        {mounted && isProfileIncomplete && (
          <div style={{
            background: 'linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%)',
            border: '1px solid #ffe8a1',
            color: '#856404',
            padding: '1.25rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <div>
              <strong style={{ fontSize: '1.05rem', display: 'block', marginBottom: '0.25rem' }}>
                ⚠️ Perfil Alimentar Incompleto
              </strong>
              <span style={{ fontSize: '0.9rem' }}>
                Seu perfil alimentar ainda não possui restrições configuradas. A análise de compatibilidade alimentar será limitada até que você configure seu perfil.
              </span>
            </div>
            <Link href="/profile" className="btn btn-em" style={{ whiteSpace: 'nowrap', padding: '0.6rem 1.2rem', textDecoration: 'none' }}>
              Configurar Agora
            </Link>
          </div>
        )}

        <div className={styles.grid}>
          {/* Cartão de Perfil Alimentar com Exibição Detalhada */}
          <section className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 className={styles.cardTitle} style={{ margin: 0 }}>🥗 Meu Perfil Alimentar</h2>
              {mounted && isAuthenticated && (
                <Link href="/profile" className="btn btn-ghost" style={{ fontSize: '0.85rem', padding: '0.3rem 0.7rem' }}>
                  ⚙️ Editar Perfil
                </Link>
              )}
            </div>

            {mounted && isAuthenticated ? (
              userRestrictions.length > 0 ? (
                <div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                    Alérgenos ativos configurados para sua proteção:
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
                    {userRestrictions.map((res, index) => {
                      const allergenLabel = ALLERGEN_LABELS[res.allergen] || res.allergen;
                      const badgeInfo = SEVERITY_BADGES[res.severity] || { label: res.severity, bg: '#f3f4f6', color: '#374151' };

                      return (
                        <div key={index} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.6rem 0.85rem',
                          borderRadius: '8px',
                          background: 'var(--bg-secondary, rgba(255,255,255,0.05))',
                          border: '1px solid var(--border-color, rgba(255,255,255,0.1))'
                        }}>
                          <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{allergenLabel}</span>
                          <span style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            background: badgeInfo.bg,
                            color: badgeInfo.color
                          }}>
                            {badgeInfo.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    background: acceptsCrossContamination ? '#fffbeb' : '#f0fdf4',
                    border: acceptsCrossContamination ? '1px solid #fde68a' : '1px solid #bbf7d0',
                    color: acceptsCrossContamination ? '#b45309' : '#15803d'
                  }}>
                    {acceptsCrossContamination ? (
                      <span>⚠️ <strong>Contaminação Cruzada:</strong> Aceita risco de traços.</span>
                    ) : (
                      <span>🛡️ <strong>Contaminação Cruzada:</strong> Bloqueada (Segurança Máxima).</span>
                    )}
                  </div>
                </div>
              ) : (
                <p className={styles.reason}>
                  Nenhuma restrição alimentar cadastrada. Acesse o{' '}
                  <Link href="/profile" style={{ color: 'var(--color-emerald)', textDecoration: 'underline' }}>
                    seu perfil
                  </Link>{' '}
                  para adicionar alérgenos.
                </p>
              )
            ) : (
              <p className={styles.reason}>
                <Link href="/auth/login" style={{ color: 'var(--color-emerald)' }}>Faça login</Link> para ver seu perfil alimentar.
              </p>
            )}
          </section>

          {/* Buscador de Produtos */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>🔍 Analisar Produto</h2>

            <form className={styles.searchForm} onSubmit={handleSearch}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Digite o nome (ex: pão, leite, biscoito)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={loading}
                id="dashboard-search-input"
              />
              <button
                type="submit"
                className={styles.searchButton}
                disabled={loading}
                id="dashboard-search-btn"
              >
                {loading ? 'Verificando...' : 'Verificar Compatibilidade'}
              </button>
            </form>

            {mounted && !isAuthenticated && (
              <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                ⚠️ Faça{' '}
                <Link href="/auth/login" style={{ color: 'var(--color-emerald)' }}>login</Link>{' '}
                para verificar compatibilidade com seu perfil.
              </p>
            )}

            {report && (() => {
              const badge = getCompatibilityBadge(report.riskLevel);
              return (
                <div className={styles.reportArea}>
                  <h3 style={{ marginBottom: '1rem', color: '#fff' }}>Produto: {report.productName}</h3>
                  <div className={badge.class}>
                    <strong>{badge.label}</strong>
                    <p className={styles.reason}>{badge.text}</p>
                    <p className={styles.reason} style={{ marginTop: '0.5rem' }}>{report.reasoning}</p>
                    {report.conflicts?.map((c, index) => (
                      <p key={index} className={styles.reason}>- {c.reason}</p>
                    ))}
                  </div>
                </div>
              );
            })()}
          </section>
        </div>
      </main>
    </div>
  );
}
