'use client';
// frontend/web-app/src/app/dashboard/page.tsx
//
// ⚠️ REGRA ARQUITETURAL — FRONTEND_STRATEGY.md
//   ❌ Não usar fetch() diretamente
//   ❌ Não hardcodar userId
//   ✅ Usar catalogApi, compatibilityApi e o userId do AuthContext
//
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { catalogApi } from '@/api/catalog';
import { compatibilityApi, CompatibilityResponse } from '@/api/compatibility';
import { HttpError } from '@/api/client';
import styles from './dashboard.module.css';

interface ReportWithName extends CompatibilityResponse {
  productName: string;
}

export default function DashboardPage() {
  const { token, userId, isAuthenticated } = useAuth();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [report,      setReport]      = useState<ReportWithName | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (!isAuthenticated || !token || !userId) {
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      // 1. Busca produto via catalogApi (nunca fetch() direto)
      const result = await catalogApi.search(searchQuery, token);
      const products = result.data;

      if (!products || products.length === 0) {
        throw new Error('Nenhum produto encontrado com este nome.');
      }

      const product = products[0];

      // 2. Verifica compatibilidade via compatibilityApi com o userId real do JWT
      const compatibility = await compatibilityApi.check(
        { userId, productId: product.id },
        token,
      );

      setReport({ ...compatibility, productName: product.name });
    } catch (err) {
      setError(err instanceof HttpError ? err.message : (err as Error).message ?? 'Erro desconhecido.');
    } finally {
      setLoading(false);
    }

  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Meu Dashboard</h1>
        <p className={styles.subtitle}>Verifique seus produtos com segurança antes do consumo.</p>
      </header>

      <div className={styles.grid}>
        {/* Cartão de Perfil */}
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>🥗 Meu Perfil Alimentar</h2>
          {isAuthenticated ? (
            <p className={styles.reason}>
              Perfil autenticado via JWT. Configure suas restrições em{' '}
              <a href="/profile" style={{ color: 'var(--color-emerald)', textDecoration: 'underline' }}>
                /profile
              </a>
              .
            </p>
          ) : (
            <p className={styles.reason}>
              <a href="/auth/login" style={{ color: 'var(--color-emerald)' }}>Faça login</a> para ver seu perfil.
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
              placeholder="Digite o nome (ex: pão, maçã)..."
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
              <a href="/auth/login" style={{ color: 'var(--color-emerald)' }}>login</a>{' '}
              para verificar compatibilidade com seu perfil.
            </p>
          )}

          {error && (
            <div className={styles.reportArea}>
              <div className={styles.statusBlocked} style={{ borderLeftColor: '#f59e0b', color: '#f59e0b' }}>
                <p><strong>Aviso:</strong> {error}</p>
              </div>
            </div>
          )}

          {report && !error && (
            <div className={styles.reportArea}>
              <h3 style={{ marginBottom: '1rem', color: '#fff' }}>Produto: {report.productName}</h3>
              <div className={report.riskLevel === 'SAFE' ? styles.statusSafe : styles.statusBlocked}>
                <strong>Status: {report.riskLevel}</strong>
                <p className={styles.reason}>{report.reasoning}</p>
                {report.conflicts?.map((c, index) => (
                  <p key={index} className={styles.reason}>- {c.reason}</p>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
