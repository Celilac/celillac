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
import { useToast } from '@/hooks/useToast';
import { HttpError } from '@/api/client';
import styles from './dashboard.module.css';

interface ReportWithName extends CompatibilityResponse {
  productName: string;
}

export default function DashboardPage() {
  const { token, userId, isAuthenticated } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [report, setReport] = useState<ReportWithName | null>(null);
  const [loading, setLoading] = useState(false);
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);

  useEffect(() => {
    if (isAuthenticated && token && userId) {
      foodProfileApi.getByUserId(userId, token)
        .then((profile) => {
          if (!profile || !profile.restrictions || profile.restrictions.length === 0) {
            setIsProfileIncomplete(true);
          } else {
            setIsProfileIncomplete(false);
          }
        })
        .catch(() => {
          setIsProfileIncomplete(true);
        });
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
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Meu Dashboard</h1>
        <p className={styles.subtitle}>Verifique seus produtos com transparência e segurança alimentar.</p>
      </header>

      {/* Banner de Perfil Incompleto */}
      {isProfileIncomplete && (
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
        {/* Cartão de Perfil */}
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>🥗 Meu Perfil Alimentar</h2>
          {isAuthenticated ? (
            <p className={styles.reason}>
              Perfil vinculado à sua conta. Mantenha suas restrições e preferências atualizadas em{' '}
              <Link href="/profile" style={{ color: 'var(--color-emerald)', textDecoration: 'underline' }}>
                /profile
              </Link>
              .
            </p>
          ) : (
            <p className={styles.reason}>
              <Link href="/auth/login" style={{ color: 'var(--color-emerald)' }}>Faça login</Link> para ver seu perfil.
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

          {!isAuthenticated && (
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
  );
}
