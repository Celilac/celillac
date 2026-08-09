'use client';
// frontend/web-app/src/app/public-partners/[id]/page.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { partnerApi, PartnerSummary } from '@/api/partner';
import { catalogApi, ProductSummary } from '@/api/catalog';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/useToast';
import { HttpError } from '@/api/client';
import { Header } from '@/components/layout/Header';
import { FavoriteButton } from '@/components/common/FavoriteButton';
import { ReviewsList } from '@/components/common/ReviewsList';
import { ReportModal } from '@/components/common/ReportModal';
import styles from '../../partner/partner.module.css';

interface PageProps {
  params: { id: string };
}

export default function PublicPartnerDetailPage({ params }: PageProps) {
  const { id } = params;
  const { token } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const toast = useToast();

  const [partner,  setPartner]  = useState<PartnerSummary | null>(null);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

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
        const msg = (err instanceof HttpError || err?.message)
          ? err.message
          : 'Erro ao carregar perfil do parceiro comercial.';
        toast.error(msg, 'Erro');
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
      <Header />

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
              <p style={{ marginTop: 'var(--space-1)', fontSize: 'var(--text-label)' }}>
                Este estabelecimento está temporariamente indisponível no momento. Você ainda pode visualizar os produtos dele, mas observe os avisos operacionais.
              </p>
            </div>
          </div>
        )}

        <div className={styles.dashboardLayout}>
          <section className={styles.mainPanel}>
            {/* Detalhes do parceiro com variáveis adaptativas de tema */}
            <div className={styles.card} style={{ gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className={styles.sectionTitle}>ℹ️ Sobre o Estabelecimento</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FavoriteButton partnerId={partner.id} />
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.4rem 0.75rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      borderRadius: '0.75rem',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      cursor: 'pointer',
                    }}
                  >
                    🚩 Denunciar Estabelecimento
                  </button>
                </div>
              </div>

              <p className={styles.partnerDescription} style={{ fontSize: 'var(--text-body)', lineHeight: '1.6', WebkitLineClamp: 'none', lineClamp: 'none' }}>
                {partner.description || 'Este parceiro ainda não forneceu uma descrição detalhada.'}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem', fontSize: 'var(--text-body)', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                <div>
                  <p style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--color-text)' }}>📍 Endereço:</strong> {partner.address}</p>
                  <p style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--color-text)' }}>🌆 Cidade:</strong> {partner.city ? `${partner.city} - ${partner.state}` : 'Não informada'}</p>
                </div>
                <div>
                  <p style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--color-text)' }}>📞 Contato:</strong> {partner.phone}</p>
                  <p style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--color-text)' }}>🚗 Região Atendimento:</strong> {partner.deliveryRegion || 'Local'}</p>
                </div>
              </div>
            </div>

            {/* Avaliações do Parceiro */}
            <div className={styles.card} style={{ marginTop: '1rem', padding: '1.5rem' }}>
              <ReviewsList partnerId={partner.id} targetName={partner.name} />
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
                    <div key={product.id} className={styles.card} style={{ padding: '1.25rem', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3 className={styles.partnerName} style={{ fontSize: 'var(--text-title)', fontWeight: '700' }}>{product.name}</h3>
                        {product.hasGluten ? (
                          <span className={`${styles.badge} ${styles.badgeRejected}`}>Contém Glúten</span>
                        ) : (
                          <span className={`${styles.badge} ${styles.badgeApproved}`}>Sem Glúten</span>
                        )}
                      </div>
                      <p style={{ fontSize: 'var(--text-label)', color: 'var(--color-text-muted)' }}>Marca: {product.brand}</p>
                      <p style={{ fontSize: 'var(--text-label)', color: 'var(--color-text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        Ingredientes: {product.ingredients}
                      </p>
                      {product.crossContamination && (
                        <p style={{ fontSize: 'var(--text-label)', color: 'var(--color-warning)', fontStyle: 'italic' }}>
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
                <h3 className={styles.partnerName} style={{ marginTop: '1rem', fontSize: 'var(--text-title)', fontWeight: '700' }}>Parceiro Homologado</h3>
                <p style={{ fontSize: 'var(--text-label)', color: 'var(--color-text-muted)', marginTop: '0.5rem', lineHeight: '1.4' }}>
                  Este parceiro comercial declarou conformidade e responsabilidade no manejo de alimentos para celíacos.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        partnerId={partner.id}
        targetName={partner.name}
      />
    </div>
  );
}
