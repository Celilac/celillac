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
import { catalogApi, ProductSummary } from '@/api/catalog';
import { compatibilityApi, CompatibilityResponse } from '@/api/compatibility';
import { foodProfileApi } from '@/api/food-profile';
import { apiClient, HttpError } from '@/api/client';
import { useToast } from '@/hooks/useToast';
import { Header } from '@/components/layout/Header';
import { RiskBadge } from '@/components/compatibility/RiskBadge';
import styles from './dashboard.module.css';

interface ReportWithName extends CompatibilityResponse {
  productName: string;
  productId: string;
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

// Cores acompanham a mesma escala de gravidade do veredito do AllergenEngine
// (ver DESIGN.md) — reforça que vermelho/laranja/amarelo/verde significam a
// mesma coisa em toda a aplicação, seja no veredito de um produto ou na
// severidade da própria restrição do usuário.
const SEVERITY_BADGES: Record<string, { label: string; bg: string; color: string }> = {
  FATAL: { label: '🔴 Fatal (Celíaco)', bg: 'var(--color-blocked-bg)', color: 'var(--color-blocked)' },
  HIGH: { label: '🟠 Severidade Alta', bg: 'var(--color-danger-bg)', color: 'var(--color-danger)' },
  MEDIUM: { label: '🟡 Severidade Média', bg: 'var(--color-warning-bg)', color: 'var(--color-warning)' },
  LOW: { label: '🟢 Severidade Baixa', bg: 'var(--color-safe-bg)', color: 'var(--color-safe)' },
  LIFESTYLE: { label: '🟣 Estilo de Vida', bg: 'var(--color-status-suspended-bg)', color: 'var(--color-status-suspended)' },
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

  const [searchResults, setSearchResults] = useState<ProductSummary[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (!isAuthenticated || !token || !userId) {
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    setReport(null);
    setSearchResults([]);

    try {
      const result = await catalogApi.search(searchQuery, token);
      const products = result.data;

      if (!products || products.length === 0) {
        toast.warning('Nenhum produto encontrado com este nome.', 'Aviso');
        return;
      }

      setSearchResults(products);

      if (products.length === 1) {
        await checkProductCompatibility(products[0]);
      }
    } catch (err) {
      const message = err instanceof HttpError ? err.message : (err as Error).message ?? 'Erro desconhecido.';
      toast.error(message, 'Erro ao buscar produtos');
    } finally {
      setLoading(false);
    }
  };

  const checkProductCompatibility = async (product: ProductSummary) => {
    if (!token || !userId) return;
    setLoading(true);
    try {
      const compatibility = await compatibilityApi.check(
        { userId, productId: product.id },
        token,
      );
      setReport({ ...compatibility, productName: product.name, productId: product.id });
    } catch (err) {
      const message = err instanceof HttpError ? err.message : (err as Error).message ?? 'Erro desconhecido.';
      toast.error(message, 'Erro ao analisar produto');
    } finally {
      setLoading(false);
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
            background: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger-border)',
            color: 'var(--color-danger)',
            padding: 'var(--space-6)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-6)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 'var(--space-4)',
          }}>
            <div>
              <strong style={{ fontSize: 'var(--text-title)', display: 'block', marginBottom: 'var(--space-1)' }}>
                📩 Verifique seu e-mail para desbloquear todas as funções
              </strong>
              <span style={{ fontSize: 'var(--text-body)' }}>
                Enviamos um código de verificação para o seu e-mail. Confirme seu e-mail para garantir a segurança da sua conta.
              </span>
            </div>
            <Link href="/auth/verify-email" className="btn btn-em" style={{ whiteSpace: 'nowrap', padding: 'var(--space-3) var(--space-6)', textDecoration: 'none', background: 'var(--color-danger)' }}>
              Verificar E-mail Agora
            </Link>
          </div>
        )}

        {/* Banner de Perfil Incompleto */}
        {mounted && isProfileIncomplete && (
          <div style={{
            background: 'var(--color-warning-bg)',
            border: '1px solid var(--color-warning-border)',
            color: 'var(--color-warning)',
            padding: 'var(--space-6)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-6)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 'var(--space-4)',
          }}>
            <div>
              <strong style={{ fontSize: 'var(--text-title)', display: 'block', marginBottom: 'var(--space-1)' }}>
                ⚠️ Perfil Alimentar Incompleto
              </strong>
              <span style={{ fontSize: 'var(--text-body)' }}>
                Seu perfil alimentar ainda não possui restrições configuradas. A análise de compatibilidade alimentar será limitada até que você configure seu perfil.
              </span>
            </div>
            <Link href="/profile" className="btn btn-em" style={{ whiteSpace: 'nowrap', padding: 'var(--space-3) var(--space-6)', textDecoration: 'none' }}>
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
                <Link href="/profile" className="btn btn-ghost" style={{ fontSize: 'var(--text-label)', padding: 'var(--space-2) var(--space-3)' }}>
                  ⚙️ Editar Perfil
                </Link>
              )}
            </div>

            {mounted && isAuthenticated ? (
              userRestrictions.length > 0 ? (
                <div>
                  <p style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
                    Alérgenos ativos configurados para sua proteção:
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                    {userRestrictions.map((res, index) => {
                      const allergenLabel = ALLERGEN_LABELS[res.allergen] || res.allergen;
                      const badgeInfo = SEVERITY_BADGES[res.severity] || { label: res.severity, bg: 'var(--color-elevated)', color: 'var(--color-text-muted)' };

                      return (
                        <div key={index} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: 'var(--space-3) var(--space-4)',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--color-elevated)',
                          border: '1px solid var(--color-border)'
                        }}>
                          <span style={{ fontWeight: '600', fontSize: 'var(--text-body)' }}>{allergenLabel}</span>
                          <span style={{
                            padding: 'var(--space-1) var(--space-3)',
                            borderRadius: 'var(--radius-full)',
                            fontSize: 'var(--text-label)',
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
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-label)',
                    background: acceptsCrossContamination ? 'var(--color-warning-bg)' : 'var(--color-safe-bg)',
                    border: acceptsCrossContamination ? '1px solid var(--color-warning-border)' : '1px solid var(--color-safe-border)',
                    color: acceptsCrossContamination ? 'var(--color-warning)' : 'var(--color-safe)'
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
                {loading ? 'Buscando...' : 'Buscar Produtos'}
              </button>
            </form>

            {mounted && !isAuthenticated && (
              <p style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-label)', color: 'var(--color-text-muted)' }}>
                ⚠️ Faça{' '}
                <Link href="/auth/login" style={{ color: 'var(--color-emerald)' }}>login</Link>{' '}
                para verificar compatibilidade com seu perfil.
              </p>
            )}

            {/* Lista de Resultados Encontrados */}
            {searchResults.length > 0 && (
              <div style={{ marginTop: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <h3 style={{ fontSize: 'var(--text-title)', color: 'var(--color-text)' }}>
                  Resultados encontrados ({searchResults.length}):
                </h3>
                {searchResults.map((product) => {
                  const productReport = report?.productId === product.id ? report : null;
                  return (
                    <div
                      key={product.id}
                      style={{
                        padding: 'var(--space-4)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-elevated)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--space-3)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong style={{ fontSize: '1.1rem', color: 'var(--color-text)', display: 'block' }}>
                            {product.name}
                          </strong>
                          <span style={{ fontSize: 'var(--text-label)', color: 'var(--color-text-muted)' }}>
                            Marca: {product.brand}
                          </span>
                        </div>
                        <Link
                          href={`/products/${product.id}`}
                          className="btn btn-ghost"
                          style={{
                            fontSize: 'var(--text-label)',
                            padding: 'var(--space-2) var(--space-3)',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          📦 Ver Detalhes
                        </Link>
                      </div>

                      {product.ingredients && (
                        <p style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-muted)', margin: 0 }}>
                          <strong>Ingredientes:</strong> {product.ingredients}
                        </p>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => checkProductCompatibility(product)}
                          disabled={loading}
                          className="btn btn-em"
                          style={{ fontSize: 'var(--text-label)', padding: 'var(--space-2) var(--space-4)' }}
                        >
                          🧪 Checar Compatibilidade
                        </button>

                        {productReport && (
                          <RiskBadge riskLevel={productReport.riskLevel} showDescription={true} />
                        )}
                      </div>

                      {productReport && (
                        <div style={{ padding: 'var(--space-3)', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                          <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--color-text)' }}>
                            {productReport.reasoning}
                          </p>
                          {productReport.conflicts?.map((c, index) => (
                            <p key={index} style={{ margin: '4px 0 0 0', fontSize: 'var(--text-label)', color: 'var(--color-danger)' }}>
                              ⚠️ {c.reason}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
