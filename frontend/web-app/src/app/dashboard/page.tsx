'use client';

import { useState } from 'react';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setReport(null);
    
    try {
      // 1. Busca o produto no catálogo (Backend Porta 3000)
      const catalogRes = await fetch(`http://localhost:3000/catalog?query=${encodeURIComponent(searchQuery)}`);
      if (!catalogRes.ok) throw new Error('Erro ao comunicar com o catálogo.');
      
      const products = await catalogRes.json();
      if (!products || products.length === 0) {
        throw new Error('Nenhum produto encontrado com este nome.');
      }

      const product = products[0]; // Pega o primeiro match

      // 2. Envia para o Motor de Alérgenos
      // Em produção, o userId vem do Auth Context/JWT
      const checkRes = await fetch('http://localhost:3000/compatibility/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'aed052fa-b410-440b-a1f4-2a73268bae49', // Hardcoded temporário para dev
          productId: product.id,
        })
      });

      if (!checkRes.ok) {
        const errData = await checkRes.json();
        throw new Error(errData.error || 'Falha ao verificar compatibilidade.');
      }

      const compatibility = await checkRes.json();
      setReport({ ...compatibility, productName: product.name });

    } catch (err: any) {
      setError(err.message);
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
          <div className={styles.tags}>
            <span className={`${styles.tag} ${styles.tagFatal}`}>GLUTEN (Fatal)</span>
            <span className={`${styles.tag} ${styles.tagHigh}`}>AMENDOIM (Alto)</span>
          </div>
          <p className={styles.reason} style={{ marginTop: '1rem' }}>
            Última atualização: Hoje, às 08:30
          </p>
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
            />
            <button type="submit" className={styles.searchButton} disabled={loading}>
              {loading ? 'Verificando...' : 'Verificar Compatibilidade'}
            </button>
          </form>

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
                {report.conflicts && report.conflicts.map((c: any, index: number) => (
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
