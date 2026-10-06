'use client';
// frontend/web-app/src/app/public-partners/page.tsx
import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { partnerApi, PartnerSummary } from '@/api/partner';
import { catalogApi, ProductSummary } from '@/api/catalog';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Header } from '@/components/layout/Header';
import { RiskBadge } from '@/components/compatibility/RiskBadge';
import { translatePartnerType } from '@/utils/compatibilityTranslator';
import {
  ProductFiltersSidebar,
  CategoryOption,
} from '@/components/catalog/ProductFiltersSidebar';
import {
  ProductFilterState,
  INITIAL_PRODUCT_FILTER_STATE,
  filterAndSortProducts,
  countActiveFilters,
} from '@/utils/productFilters';
import {
  BuildingIcon,
  PackageIcon,
  SearchIcon,
  InfoIcon,
  MapPinIcon,
  BriefcaseIcon,
  AlertTriangleIcon,
  CookieIcon,
  ShoppingCartIcon,
  SlidersIcon,
} from '@/components/layout/icons';
import styles from './public-partners.module.css';

function PublicPartnersContent() {
  const { theme, toggleTheme } = useTheme();
  const { token, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedTab = searchParams.get('tab') === 'products' ? 'products' : 'partners';
  const [activeTab, setActiveTab] = useState<'partners' | 'products'>(requestedTab);
  const [partners, setPartners] = useState<PartnerSummary[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  // Estados de Filtros e Ordenação de Produtos
  const [productFilters, setProductFilters] = useState<ProductFilterState>(INITIAL_PRODUCT_FILTER_STATE);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const handleTabChange = (newTab: 'partners' | 'products') => {
    setActiveTab(newTab);
    setQuery('');
    router.replace(`/public-partners?tab=${newTab}`, { scroll: false });
  };

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'products') {
      setActiveTab('products');
    } else if (tabParam === 'partners') {
      setActiveTab('partners');
    }
  }, [searchParams]);

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
  const partnerMap = useMemo(() => {
    const map = new Map<string, string>();
    partners.forEach((p) => {
      map.set(p.id, p.name);
    });
    return map;
  }, [partners]);

  // Categorias únicas extraídas dos produtos cadastrados
  const productCategories: CategoryOption[] = useMemo(() => {
    const categoryMap = new Map<string, number>();
    products.forEach((p) => {
      const cat = p.category?.trim() || 'Alimentos e Bebidas';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    });
    return Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count }));
  }, [products]);

  const activeFilterCount = useMemo(() => {
    return countActiveFilters(productFilters);
  }, [productFilters]);

  const filteredPartners = useMemo(() => {
    const q = query.toLowerCase();
    return partners.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      (p.city && p.city.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  }, [partners, query]);

  const displayedProducts = useMemo(() => {
    return filterAndSortProducts(products, productFilters, query);
  }, [products, productFilters, query]);


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
            <h1 className={styles.title}>Guia Comercial: Locais & Produtos</h1>
            <p className={styles.subtitle}>
              Descubra estabelecimentos homologados e navegue por todos os produtos certificados com transparência biológica.
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
            onClick={() => handleTabChange('partners')}
            id="tab-filter-partners"
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <BuildingIcon size={16} /> Estabelecimentos ({partners.length})
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'products'}
            className={`${styles.tabBtn} ${activeTab === 'products' ? styles.tabBtnActive : ''}`}
            onClick={() => handleTabChange('products')}
            id="tab-filter-products"
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <PackageIcon size={16} /> Produtos Ofertados ({products.length})
            </span>
          </button>
        </div>

        {/* Visualização de Estabelecimentos */}
        {activeTab === 'partners' ? (
          <div>
            {/* Buscador de estabelecimentos */}
            <div className={styles.searchSection}>
              <div className={styles.searchCard}>
                <span className={styles.searchIcon}><SearchIcon size={18} /></span>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Pesquise por nome do estabelecimento ou cidade..."
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
                  Exibindo <strong className={styles.resultsCount}>{filteredPartners.length}</strong>{' '}
                  {filteredPartners.length === 1 ? 'estabelecimento homologado' : 'estabelecimentos homologados'}
                </span>
                {query && <span>Filtro ativo: &quot;{query}&quot;</span>}
              </div>
            </div>

            {/* Banner de atalho para ver produtos diretamente */}
            <div style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '12px 18px',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: 'var(--color-text)' }}>
                <InfoIcon size={16} style={{ color: 'var(--color-primary, #10b981)', flexShrink: 0 }} />
                <span>Procurando itens específicos? Você pode navegar por todos os produtos homologados cadastrados de uma vez só.</span>
              </div>
              <button
                type="button"
                onClick={() => handleTabChange('products')}
                className="btn btn-em"
                style={{
                  fontSize: '0.82rem',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <PackageIcon size={15} /> Ver Todos os Produtos ({products.length})
              </button>
            </div>

            <div className={styles.partnersGrid}>
            {filteredPartners.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}><SearchIcon size={44} /></span>
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
                      <span className={styles.metaItem}><MapPinIcon size={14} /> {partner.city ? `${partner.city} - ${partner.state}` : 'Sem cidade'}</span>
                      <span className={styles.metaItem}><BriefcaseIcon size={14} /> {translatePartnerType(partner.type)}</span>
                    </div>

                    {partner.operationalStatus === 'TEMPORARILY_CLOSED' && (
                      <div className={styles.statusNotice}>
                        <AlertTriangleIcon size={15} style={{ color: '#f59e0b' }} />
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
                      <SearchIcon size={15} /> Ver Perfil Completo
                    </button>
                  </div>
                </section>
              ))
            )}
            </div>
          </div>
        ) : (
          /* Visualização de Produtos com Ferramenta Lateral de Filtros */
          <div className={styles.productsLayout}>
            {/* Ferramenta Lateral de Filtros e Ordenação */}
            <div className={styles.productsSidebarColumn}>
              <ProductFiltersSidebar
                filters={productFilters}
                onFilterChange={setProductFilters}
                onResetFilters={() => setProductFilters(INITIAL_PRODUCT_FILTER_STATE)}
                categories={productCategories}
                totalProductsCount={products.length}
                filteredProductsCount={displayedProducts.length}
                isAuthenticated={isAuthenticated}
                isOpenMobile={mobileFiltersOpen}
                onCloseMobile={() => setMobileFiltersOpen(false)}
              />
            </div>

            {/* Coluna Principal: Top Bar, Chips de Filtro e Grid */}
            <div className={styles.productsMainColumn}>
              {/* Barra Superior: Busca de Produtos e Gatilho Mobile */}
              <div className={styles.productsTopBar}>
                <div className={styles.searchCard} style={{ flex: 1, maxWidth: 'none' }}>
                  <span className={styles.searchIcon}><SearchIcon size={18} /></span>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Pesquise produtos por nome, marca ou ingrediente..."
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

                <button
                  type="button"
                  className={styles.mobileFilterTriggerBtn}
                  onClick={() => setMobileFiltersOpen(true)}
                  id="open-mobile-product-filters"
                  aria-label="Abrir filtros e ordenação"
                >
                  <SlidersIcon size={16} />
                  <span>Filtros</span>
                  {activeFilterCount > 0 && (
                    <span className={styles.filterChip} style={{ padding: '0.1rem 0.45rem', fontSize: '0.72rem' }}>
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Metadados de Resultados */}
              <div className={styles.resultsMeta}>
                <span>
                  Exibindo <strong className={styles.resultsCount}>{displayedProducts.length}</strong>{' '}
                  {displayedProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
                  {displayedProducts.length !== products.length && ` (de ${products.length} no total)`}
                </span>
                {query && <span>Busca: &quot;{query}&quot;</span>}
              </div>

              {/* Chips de Filtros Ativos para Remoção Rápida */}
              {activeFilterCount > 0 && (
                <div className={styles.filterChipsRow}>
                  <span className={styles.filterChipsLabel}>Filtros ativos:</span>

                  {productFilters.sortBy !== 'featured' && (
                    <span className={styles.filterChip}>
                      {productFilters.sortBy === 'price-asc' && 'Menor Preço'}
                      {productFilters.sortBy === 'price-desc' && 'Maior Preço'}
                      {productFilters.sortBy === 'name-asc' && 'Nome (A → Z)'}
                      <button
                        type="button"
                        className={styles.filterChipRemove}
                        onClick={() => setProductFilters({ ...productFilters, sortBy: 'featured' })}
                        aria-label="Remover ordenação"
                      >
                        ✕
                      </button>
                    </span>
                  )}

                  {productFilters.freeOfGluten && (
                    <span className={styles.filterChip}>
                      Sem Glúten
                      <button
                        type="button"
                        className={styles.filterChipRemove}
                        onClick={() => setProductFilters({ ...productFilters, freeOfGluten: false })}
                        aria-label="Remover filtro sem glúten"
                      >
                        ✕
                      </button>
                    </span>
                  )}

                  {productFilters.freeOfMilk && (
                    <span className={styles.filterChip}>
                      Sem Leite/Lactose
                      <button
                        type="button"
                        className={styles.filterChipRemove}
                        onClick={() => setProductFilters({ ...productFilters, freeOfMilk: false })}
                        aria-label="Remover filtro sem leite"
                      >
                        ✕
                      </button>
                    </span>
                  )}

                  {productFilters.freeOfSoy && (
                    <span className={styles.filterChip}>
                      Sem Soja
                      <button
                        type="button"
                        className={styles.filterChipRemove}
                        onClick={() => setProductFilters({ ...productFilters, freeOfSoy: false })}
                        aria-label="Remover filtro sem soja"
                      >
                        ✕
                      </button>
                    </span>
                  )}

                  {productFilters.freeOfNuts && (
                    <span className={styles.filterChip}>
                      Sem Nozes/Castanhas
                      <button
                        type="button"
                        className={styles.filterChipRemove}
                        onClick={() => setProductFilters({ ...productFilters, freeOfNuts: false })}
                        aria-label="Remover filtro sem nozes"
                      >
                        ✕
                      </button>
                    </span>
                  )}

                  {productFilters.freeOfEggs && (
                    <span className={styles.filterChip}>
                      Sem Ovos
                      <button
                        type="button"
                        className={styles.filterChipRemove}
                        onClick={() => setProductFilters({ ...productFilters, freeOfEggs: false })}
                        aria-label="Remover filtro sem ovos"
                      >
                        ✕
                      </button>
                    </span>
                  )}

                  {productFilters.onlySafeCompatibility && (
                    <span className={styles.filterChip}>
                      Meu Perfil Seguro
                      <button
                        type="button"
                        className={styles.filterChipRemove}
                        onClick={() => setProductFilters({ ...productFilters, onlySafeCompatibility: false })}
                        aria-label="Remover filtro de perfil seguro"
                      >
                        ✕
                      </button>
                    </span>
                  )}

                  {productFilters.category !== 'ALL' && (
                    <span className={styles.filterChip}>
                      Categoria: {productFilters.category}
                      <button
                        type="button"
                        className={styles.filterChipRemove}
                        onClick={() => setProductFilters({ ...productFilters, category: 'ALL' })}
                        aria-label="Remover filtro de categoria"
                      >
                        ✕
                      </button>
                    </span>
                  )}

                  {productFilters.veganOnly && (
                    <span className={styles.filterChip}>
                      Vegano 🌱
                      <button
                        type="button"
                        className={styles.filterChipRemove}
                        onClick={() => setProductFilters({ ...productFilters, veganOnly: false })}
                        aria-label="Remover filtro vegano"
                      >
                        ✕
                      </button>
                    </span>
                  )}

                  {(productFilters.minPrice !== '' || productFilters.maxPrice !== '') && (
                    <span className={styles.filterChip}>
                      {productFilters.minPrice ? `Mín: R$ ${productFilters.minPrice}` : ''}
                      {productFilters.minPrice && productFilters.maxPrice ? ' | ' : ''}
                      {productFilters.maxPrice ? `Máx: R$ ${productFilters.maxPrice}` : ''}
                      <button
                        type="button"
                        className={styles.filterChipRemove}
                        onClick={() => setProductFilters({ ...productFilters, minPrice: '', maxPrice: '' })}
                        aria-label="Remover filtro de preço"
                      >
                        ✕
                      </button>
                    </span>
                  )}

                  {productFilters.onlyWithPrice && (
                    <span className={styles.filterChip}>
                      Com Preço
                      <button
                        type="button"
                        className={styles.filterChipRemove}
                        onClick={() => setProductFilters({ ...productFilters, onlyWithPrice: false })}
                        aria-label="Remover filtro de preço informado"
                      >
                        ✕
                      </button>
                    </span>
                  )}

                  <button
                    type="button"
                    className={styles.filterClearAllLink}
                    onClick={() => setProductFilters(INITIAL_PRODUCT_FILTER_STATE)}
                  >
                    Limpar todos
                  </button>
                </div>
              )}

              {/* Grid de Produtos */}
              <div className={styles.productsGrid}>
                {displayedProducts.length === 0 ? (
                  <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}><CookieIcon size={44} /></span>
                    <h2>Nenhum produto encontrado</h2>
                    <p>Tente alterar seus filtros, alérgenos ou termo de busca para localizar outros itens certificados.</p>
                    {activeFilterCount > 0 && (
                      <button
                        type="button"
                        className="btn btn-em"
                        style={{
                          marginTop: '0.75rem',
                          padding: '0.55rem 1.25rem',
                          fontSize: '0.86rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          setProductFilters(INITIAL_PRODUCT_FILTER_STATE);
                          setQuery('');
                        }}
                      >
                        Limpar todos os filtros
                      </button>
                    )}
                  </div>
                ) : (
                  displayedProducts.map((product) => {
                    const partnerName = product.partnerId ? partnerMap.get(product.partnerId) : null;
                    const rawPrice = (product as any).price;
                    const unitPrice = rawPrice !== undefined && rawPrice !== null && !isNaN(Number(rawPrice))
                      ? Number(rawPrice)
                      : 0;

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
                                  href={`/products/${product.id}?from=public-partners`}
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
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}> · <BuildingIcon size={13} /> <strong>{partnerName}</strong></span>
                            )}
                          </div>

                          {/* Selo de compatibilidade personalizada com o perfil do usuário logado */}
                          {isAuthenticated && product.compatibilityReport && (
                            <div style={{ marginBottom: '0.65rem' }}>
                              <RiskBadge
                                riskLevel={product.compatibilityReport.riskLevel}
                                confidenceLevel={product.compatibilityReport.confidenceLevel}
                                hasDivergence={product.compatibilityReport.hasDivergence}
                                showLabel={true}
                              />
                            </div>
                          )}

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

                            {(() => {
                              const cross = (product.crossContamination || '').toLowerCase();
                              const nutTerms = ['castanha', 'amendoim', 'nozes', 'amêndoa', 'pistache', 'avelã', 'macadâmia'];
                              if (nutTerms.some((t) => cross.includes(t))) {
                                return <span className={styles.badgePending} title={product.crossContamination}>Traços: Castanhas/Amendoim</span>;
                              }
                              return null;
                            })()}
                          </div>

                          <p className={styles.productIngredients} title={product.ingredients}>
                            <strong style={{ color: 'var(--color-text)' }}>Ingredientes:</strong> {product.ingredients || 'Não informados.'}
                          </p>
                        </div>

                        <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Valor unitário
                            </span>
                            {unitPrice > 0 ? (
                              <strong style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-emerald, #10b981)' }}>
                                R$ {unitPrice.toFixed(2).replace('.', ',')}
                              </strong>
                            ) : (
                              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Sob Consulta</span>
                            )}
                          </div>

                          {(() => {
                            const isBlocked = isAuthenticated && product.compatibilityReport?.riskLevel === 'BLOCKED';
                            return (
                              <Link
                                href={`/products/${product.id}?from=public-partners`}
                                className={styles.btnPrimary}
                                style={{
                                  textDecoration: 'none',
                                  padding: '0.55rem 1rem',
                                  fontSize: '0.875rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                  width: 'auto',
                                  background: isBlocked ? 'rgba(239, 68, 68, 0.12)' : undefined,
                                  color: isBlocked ? '#ef4444' : undefined,
                                  border: isBlocked ? '1px solid #ef4444' : undefined,
                                }}
                              >
                                <ShoppingCartIcon size={15} /> {isBlocked ? 'Ver Detalhes (Incompatível)' : 'Ver Detalhes / Comprar'}
                              </Link>
                            );
                          })()}
                        </div>
                      </section>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function PublicPartnersListPage() {
  return (
    <Suspense fallback={
      <div className="profile-page">
        <Header />
        <main className={styles.container}>
          <p className="profile-loading" role="status">Carregando estabelecimentos e produtos homologados…</p>
        </main>
      </div>
    }>
      <PublicPartnersContent />
    </Suspense>
  );
}
