'use client';

import { useState } from 'react';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [report, setReport] = useState<any>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock request to the backend check compatibility endpoint
    if (searchQuery.toLowerCase().includes('pão')) {
      setReport({
        isCompatible: false,
        riskLevel: 'BLOCKED',
        conflicts: [
          { allergen: 'GLUTEN', severity: 'FATAL', reason: '[FATAL] GLUTEN — detectado nos ingredientes' }
        ],
        reasoning: '1 conflito(s) encontrado(s). Risco: BLOCKED.'
      });
    } else if (searchQuery.toLowerCase().includes('maçã')) {
      setReport({
        isCompatible: true,
        riskLevel: 'SAFE',
        conflicts: [],
        reasoning: 'Produto compatível com o perfil alimentar.'
      });
    } else {
      setReport(null);
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
            />
            <button type="submit" className={styles.searchButton}>
              Verificar Compatibilidade
            </button>
          </form>

          {report && (
            <div className={styles.reportArea}>
              <div className={report.riskLevel === 'SAFE' ? styles.statusSafe : styles.statusBlocked}>
                <strong>Status: {report.riskLevel}</strong>
                <p className={styles.reason}>{report.reasoning}</p>
                {report.conflicts.map((c: any, index: number) => (
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
