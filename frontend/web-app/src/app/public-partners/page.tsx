'use client';
// frontend/web-app/src/app/public-partners/page.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { partnerApi, PartnerSummary } from '@/api/partner';
import { useTheme } from '@/contexts/ThemeContext';
import { Header } from '@/components/layout/Header';
import { translatePartnerType } from '@/utils/compatibilityTranslator';
import styles from './public-partners.module.css';

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

        {/* Buscador com metadados */}
        <div className={styles.searchSection}>
          <div className={styles.searchCard}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              className={styles.input}
              placeholder="Pesquise por nome ou cidade..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              id="public-partner-search-input"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '1rem', padding: '0 4px' }}
                title="Limpar busca"
              >
                ✕
              </button>
            )}
          </div>
          <div className={styles.resultsMeta}>
            <span>
              Exibindo <strong className={styles.resultsCount}>{filteredPartners.length}</strong> {filteredPartners.length === 1 ? 'estabelecimento homologado' : 'estabelecimentos homologados'}
            </span>
            {query && <span>Filtro ativo: &quot;{query}&quot;</span>}
          </div>
        </div>

        {/* Grid Responsivo de Estabelecimentos */}
        <div className={styles.partnersGrid}>
          {filteredPartners.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🔍</span>
              <h2>Nenhum parceiro encontrado</h2>
              <p>Tente alterar sua busca para localizar outros estabelecimentos homologados.</p>
            </div>
          ) : (
            filteredPartners.map((partner) => (
              <section key={partner.id} className={styles.card}>
                <div className={styles.cardContent}>
                  <div className={styles.cardHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                      {partner.logoUrl && (
                        <div className={styles.brandWrapper}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={partner.logoUrl}
                            alt={`Marca de ${partner.name}`}
                            className={styles.brandImage}
                          />
                        </div>
                      )}
                      <h2 className={styles.partnerName}>{partner.name}</h2>
                    </div>
                    <span className={styles.badgeApproved}>Homologado</span>
                  </div>

                  <p className={styles.partnerDescription}>{partner.description || 'Sem descrição cadastrada.'}</p>
                  
                  <div className={styles.partnerMeta}>
                    <span className={styles.metaItem}>📍 {partner.city ? `${partner.city} - ${partner.state}` : 'Sem cidade'}</span>
                    <span className={styles.metaItem}>💼 {translatePartnerType(partner.type)}</span>
                  </div>

                  {partner.operationalStatus === 'TEMPORARILY_CLOSED' && (
                    <div className={styles.statusNotice}>
                      <span>⚠️</span>
                      <strong>Temporariamente Fechado</strong>
                    </div>
                  )}
                </div>

                <div className={styles.cardActions}>
                  <button 
                    type="button" 
                    className={styles.btnPrimary}
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
