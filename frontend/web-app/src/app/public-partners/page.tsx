'use client';
// frontend/web-app/src/app/public-partners/page.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { partnerApi, PartnerSummary } from '@/api/partner';
import { useTheme } from '@/contexts/ThemeContext';
import { Header } from '@/components/layout/Header';
import styles from '../partner/partner.module.css';

export default function PublicPartnersListPage() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const [partners, setPartners] = useState<PartnerSummary[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [query,    setQuery]    = useState('');

  useEffect(() => {
    partnerApi.listPublicPartners()
      .then((data) => setPartners(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredPartners = partners.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    (p.city && p.city.toLowerCase().includes(query.toLowerCase()))
  );

  if (loading) {
    return (
      <div className={styles.container}>
        <p className="profile-loading" role="status">Carregando estabelecimentos…</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Header />

      <main className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>Parceiros Comerciais</h1>
            <p className={styles.subtitle}>Encontre lanchonetes, mercados e produtores independentes homologados.</p>
          </div>
        </div>

        {/* Buscador */}
        <div className={styles.card} style={{ padding: '1rem 1.5rem', marginBottom: '2rem', gap: '0' }}>
          <input
            type="text"
            className={styles.input}
            placeholder="Pesquise por nome ou cidade..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            id="public-partner-search-input"
          />
        </div>

        <div className={styles.grid}>
          {filteredPartners.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🔍</span>
              <h2>Nenhum parceiro encontrado</h2>
              <p>Tente alterar sua busca para localizar estabelecimentos.</p>
            </div>
          ) : (
            filteredPartners.map((partner) => (
              <section key={partner.id} className={styles.card}>
                <div className={styles.cardContent}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h2 className={styles.partnerName}>{partner.name}</h2>
                    <span className={`${styles.badge} ${styles.badgeApproved}`} style={{ fontSize: '0.65rem' }}>Homologado</span>
                  </div>
                  <p className={styles.partnerDescription}>{partner.description || 'Sem descrição.'}</p>
                  
                  <div className={styles.partnerMeta}>
                    <span className={styles.metaItem}>📍 {partner.city ? `${partner.city} - ${partner.state}` : 'Sem cidade'}</span>
                    <span className={styles.metaItem}>💼 {partner.type === 'RESTAURANT' ? '🍽️ Lanchonete/Restaurante' : partner.type === 'MARKET' ? '🛒 Mercado/Empório' : '👩‍🍳 Produtor Artesanal'}</span>
                  </div>

                  {partner.operationalStatus === 'TEMPORARILY_CLOSED' && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#fbbf24', display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                      <span>⚠️</span>
                      <strong>Temporariamente Fechado</strong>
                    </div>
                  )}
                </div>

                <div className={styles.cardActions}>
                  <button 
                    type="button" 
                    className={`${styles.btn} ${styles.btnPrimary}`} 
                    style={{ flex: 1 }}
                    onClick={() => router.push(`/public-partners/${partner.id}`)}
                    id={`view-public-partner-${partner.id}`}
                  >
                    🔍 Ver Perfil Completo
                  </button>
                </div>
              </section>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
