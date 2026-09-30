'use client';
// frontend/web-app/src/app/public-partners/page.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { partnerApi, PartnerSummary } from '@/api/partner';
import { catalogApi, ProductSummary } from '@/api/catalog';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Header } from '@/components/layout/Header';
import { translatePartnerType } from '@/utils/compatibilityTranslator';
import styles from './public-partners.module.css';

export default function PublicPartnersListPage() {
  const { theme, toggleTheme } = useTheme();
  const { token } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'partners' | 'products'>('partners');
  const [partners, setPartners] = useState<PartnerSummary[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      partnerApi.listPublicPartners(),
      catalogApi.search('', token || undefined),
    ])
      .then(([partnersData, catalogData]) => {
        setPartners(partnersData || []);
        setProducts(catalogData?.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  // Mapa de ID do parceiro para nome do estabelecimento
  const partnerMap = new Map<string, string>();
  partners.forEach((p) => {
    partnerMap.set(p.id, p.name);
  });

  const filteredPartners = partners.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    (p.city && p.city.toLowerCase().includes(query.toLowerCase())) ||
    (p.description && p.description.toLowerCase().includes(query.toLowerCase()))
  );

  const filteredProducts = products.filter((prod) =>
    prod.name.toLowerCase().includes(query.toLowerCase()) ||
    (prod.brand && prod.brand.toLowerCase().includes(query.toLowerCase())) ||
    (prod.ingredients && prod.ingredients.toLowerCase().includes(query.toLowerCase())) ||
    (prod.category && prod.category.toLowerCase().includes(query.toLowerCase()))
  );

  if (loading) {
    return (
      <div className={styles.container}>
        <p className="profile-loading" role="status">Carregando estabelecimentos e produtos homologados…</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Header />

      <main className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>Guia Comercial CeLiLac</h1>
            <p className={styles.subtitle}>
              Descubra estabelecimentos homologados e alimentos seguros certificados com transparência biológica.
            </p>
          </div>
        </div>

        {/* Abas de Navegação Segmentada: Estabelecimentos vs Produtos */}
        <div className={styles.tabsContainer} role="tablist" aria-label="Filtro de busca do guia comercial">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'partners'}
            className={`${styles.tabBtn} ${activeTab === 'partners' ? styles.tabBtnActive : ''}`}
            onClick={() => {
              setActiveTab('partners');
              setQuery('');
            }}
            id="tab-filter-partners"
          >
            🏢 Estabelecimentos ({partners.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'products'}
            className={`${styles.tabBtn} ${activeTab === 'products' ? styles.tabBtnActive : ''}`}
            onClick={() => {
              setActiveTab('products');
              setQuery('');
            }}
            id="tab-filter-products"
          >
            📦 Produtos Ofertados ({products.length})
          </button>
        </div>

        {/* Buscador com metadados adaptativos */}
        <div className={styles.searchSection}>
          <div className={styles.searchCard}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              className={styles.input}
              placeholder={
                activeTab === 'partners'
                  ? 'Pesquise por nome do estabelecimento ou cidade...'
                  : 'Pesquise produtos por nome, marca ou ingrediente...'
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              id="public-guide-search-input"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  padding: '0 4px',
                }}
                title="Limpar busca"
              >
                ✕
              </button>
            )}
          </div>
          <div className={styles.resultsMeta}>
            <span>
              {activeTab === 'partners' ? (
                <>
                  Exibindo <strong className={styles.resultsCount}>{filteredPartners.length}</strong>{' '}
                  {filteredPartners.length === 1 ? 'estabelecimento homologado' : 'estabelecimentos homologados'}
                </>
              ) : (
                <>
                  Exibindo <strong className={styles.resultsCount}>{filteredProducts.length}</strong>{' '}
                  {filteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
                </>
              )}
            </span>
            {query && <span>Filtro ativo: &quot;{query}&quot;</span>}
          </div>
        </div>

        {/* Visualização de Estabelecimentos */}
        {activeTab === 'partners' ? (
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
        ) : (
          /* Visualização de Produtos */
          <div className={styles.productsGrid}>
            {filteredProducts.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>🍪</span>
                <h2>Nenhum produto encontrado</h2>
                <p>Tente buscar por outro termo, ingrediente ou categoria de alimento seguro.</p>
              </div>
            ) : (
              filteredProducts.map((product) => {
                const partnerName = product.partnerId ? partnerMap.get(product.partnerId) : null;
                const unitPrice = (product as any).price ? Number((product as any).price) : 0;

                return (
                  <section key={product.id} className={styles.productCard}>
                    <div>
                      <div className={styles.productHeader}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {product.category || 'Alimentos e Bebidas'}
                          </span>
                          <h2 className={styles.productTitle}>
                            <Link
                              href={`/products/${product.id}`}
                              style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                              {product.name}
                            </Link>
                          </h2>
                        </div>
                        {unitPrice > 0 ? (
                          <span className={styles.productPrice}>
                            R$ {unitPrice.toFixed(2).replace('.', ',')}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Sob Consulta</span>
                        )}
                      </div>

                      <div className={styles.productPartnerTag}>
                        <span>Marca: <strong>{product.brand}</strong></span>
                        {partnerName && (
                          <span> · 🏢 <strong>{partnerName}</strong></span>
                        )}
                      </div>

                      <div className={styles.productBadges}>
                        {product.hasGluten ? (
                          <span className={styles.badgeRejected}>Contém Glúten</span>
                        ) : (
                          <span className={styles.badgeApproved}>Sem Glúten</span>
                        )}

                        {(() => {
                          const ing = (product.ingredients || '').toLowerCase();
                          const cross = (product.crossContamination || '').toLowerCase();
                          const milkTerms = ['leite', 'lactose', 'queijo', 'manteiga', 'creme', 'whey', 'soro'];
                          if (milkTerms.some((t) => ing.includes(t))) {
                            return <span className={styles.badgeRejected}>Contém Leite</span>;
                          }
                          if (milkTerms.some((t) => cross.includes(t))) {
                            return <span className={styles.badgePending}>Traços de Leite</span>;
                          }
                          return <span className={styles.badgeApproved}>Sem Leite</span>;
                        })()}
                      </div>

                      <p className={styles.productIngredients} title={product.ingredients}>
                        <strong style={{ color: 'var(--color-text)' }}>Ingredientes:</strong> {product.ingredients || 'Não informados.'}
                      </p>
                    </div>

                    <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                      <Link
                        href={`/products/${product.id}`}
                        className={styles.btnPrimary}
                        style={{
                          textDecoration: 'none',
                          padding: '0.55rem 1rem',
                          fontSize: '0.875rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        🛒 Ver Detalhes / Comprar
                      </Link>
                    </div>
                  </section>
                );
              })
            )}
          </div>
        )}
      </main>
    </div>
  );
}
