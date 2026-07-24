'use client';
// frontend/web-app/src/app/public-partners/[id]/page.tsx
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { partnerApi, PartnerSummary } from '@/api/partner';
import { catalogApi, ProductSummary } from '@/api/catalog';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/useToast';
import { HttpError } from '@/api/client';
import styles from '../../partner/partner.module.css';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PublicPartnerDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { token } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const toast = useToast();

  const [partner,  setPartner]  = useState<PartnerSummary | null>(null);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      partnerApi.get(id),
      catalogApi.listByPartner(id, token || undefined)
    ])
      .then(([partnerData, catalogData]) => {
        setPartner(partnerData);
        setProducts(catalogData.data || []);
      })
      .catch((err) => {
        toast.error(
          err instanceof HttpError ? err.message : 'Erro ao carregar perfil do parceiro comercial.',
          'Erro'
        );
        router.push('/public-partners');
      })
      .finally(() => setLoading(false));
  }, [id, token, router, toast]);

  if (loading) {
    return (
      <div className={styles.container}>
        <p className="profile-loading" role="status">Carregando perfil do estabelecimento…</p>
      </div>
    );
  }

  if (!partner) return null;

  return (
    <div className="profile-page">
      <header className="topbar">
        <span className="topbar-title brand-lockup" onClick={() => router.push('/public-partners')} style={{ cursor: 'pointer' }}>
          <Image src="/brand/logo_with_transparent_background.png" alt="CeliLac" width={32} height={32} priority />
          <span className="brand-wordmark">Celi<span>Lac</span></span>
          <span className="brand-tagline">Guia de Estabelecimentos</span>
        </span>
        <nav className="topbar-actions">
          <button type="button" onClick={toggleTheme} className="btn btn-ghost theme-button" aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </nav>
      </header>

      <main className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>{partner.name}</h1>
            <p className={styles.subtitle}>Perfil comercial homologado pelo CeLiLac</p>
          </div>
          <button 
            type="button" 
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={() => router.push('/public-partners')}
          >
            ⬅️ Voltar ao Guia
          </button>
        </div>

        {partner.operationalStatus === 'TEMPORARILY_CLOSED' && (
          <div className={`${styles.alertBanner} ${styles.alertBannerWarning}`} style={{ marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
            <div>
              <strong>Temporariamente Fechado</strong>
              <p style={{ marginTop: '0.25rem', fontSize: '0.85rem' }}>
                Este estabelecimento está temporariamente indisponível no momento. Você ainda pode visualizar os produtos dele, mas observe os avisos operacionais.
              </p>
            </div>
          </div>
        )}

        <div className={styles.dashboardLayout}>
          <section className={styles.mainPanel}>
            {/* Detalhes do parceiro */}
            <div className={styles.card} style={{ gap: '1rem' }}>
              <h2 className={styles.sectionTitle}>ℹ️ Sobre o Estabelecimento</h2>
              <p style={{ color: '#d1d5db', fontSize: '0.95rem', lineHeight: '1.6' }}>
                {partner.description || 'Este parceiro ainda não forneceu uma descrição detalhada.'}
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem', fontSize: '0.9rem', color: '#9ca3af', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
                <div>
                  <p style={{ marginBottom: '0.5rem' }}><strong>📍 Endereço:</strong> {partner.address}</p>
                  <p style={{ marginBottom: '0.5rem' }}><strong>🌆 Cidade:</strong> {partner.city ? `${partner.city} - ${partner.state}` : 'Não informada'}</p>
                </div>
                <div>
                  <p style={{ marginBottom: '0.5rem' }}><strong>📞 Contato:</strong> {partner.phone}</p>
                  <p style={{ marginBottom: '0.5rem' }}><strong>🚗 Região Atendimento:</strong> {partner.deliveryRegion || 'Local'}</p>
                </div>
              </div>
            </div>

            {/* Listagem de produtos */}
            <div style={{ marginTop: '1rem' }}>
              <h2 className={styles.sectionTitle} style={{ marginBottom: '1rem' }}>📦 Produtos Ofertados ({products.length})</h2>
              
              {products.length === 0 ? (
                <div className={styles.emptyState} style={{ padding: '3rem 1rem' }}>
                  <span className={styles.emptyIcon}>🍪</span>
                  <h3>Nenhum produto cadastrado para este estabelecimento</h3>
                  <p>Volte em breve para verificar novos lançamentos de produtos seguros.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {products.map((product) => (
                    <div key={product.id} className={styles.card} style={{ padding: '1.25rem', gap: '0.5rem', background: 'rgba(255,255,255,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '700' }}>{product.name}</h3>
                        {product.hasGluten ? (
                          <span className={`${styles.badge} ${styles.badgeRejected}`} style={{ fontSize: '0.6rem' }}>Contém Glúten</span>
                        ) : (
                          <span className={`${styles.badge} ${styles.badgeApproved}`} style={{ fontSize: '0.6rem' }}>Sem Glúten</span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Marca: {product.brand}</p>
                      <p style={{ fontSize: '0.8rem', color: '#6b7280', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        Ingredientes: {product.ingredients}
                      </p>
                      {product.crossContamination && (
                        <p style={{ fontSize: '0.8rem', color: '#fbbf24', fontStyle: 'italic' }}>
                          ⚠️ Traços: {product.crossContamination}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className={styles.sidePanel}>
            <div className={styles.card} style={{ gap: '1rem' }}>
              <h2 className={styles.sectionTitle}>🛡️ Certificação CeLiLac</h2>
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <Image src="/brand/logo_with_transparent_background.png" alt="Selo" width={100} height={100} />
                <h3 style={{ color: '#fff', marginTop: '1rem', fontSize: '1.1rem', fontWeight: '700' }}>Parceiro Homologado</h3>
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.5rem', lineHeight: '1.4' }}>
                  Este parceiro comercial declarou conformidade e responsabilidade no manejo de alimentos para celíacos.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
