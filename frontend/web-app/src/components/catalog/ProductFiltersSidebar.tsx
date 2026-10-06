// frontend/web-app/src/components/catalog/ProductFiltersSidebar.tsx
'use client';

import React from 'react';
import {
  ProductFilterState,
  ProductSortOption,
  countActiveFilters,
} from '@/utils/productFilters';
import {
  SlidersIcon,
  ChevronDownIcon,
  CheckIcon,
  XIcon,
  ArrowUpDownIcon,
  ShieldCheckIcon,
} from '@/components/layout/icons';
import styles from './ProductFiltersSidebar.module.css';

export interface CategoryOption {
  name: string;
  count: number;
}

export interface ProductFiltersSidebarProps {
  filters: ProductFilterState;
  onFilterChange: (newFilters: ProductFilterState) => void;
  onResetFilters: () => void;
  categories: CategoryOption[];
  totalProductsCount: number;
  filteredProductsCount: number;
  isAuthenticated: boolean;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function ProductFiltersSidebar({
  filters,
  onFilterChange,
  onResetFilters,
  categories,
  totalProductsCount,
  filteredProductsCount,
  isAuthenticated,
  isOpenMobile = false,
  onCloseMobile,
}: ProductFiltersSidebarProps) {
  const activeCount = countActiveFilters(filters);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      ...filters,
      sortBy: e.target.value as ProductSortOption,
    });
  };

  const handleToggle = (key: keyof ProductFilterState) => {
    onFilterChange({
      ...filters,
      [key]: !filters[key],
    });
  };

  const handlePriceChange = (field: 'minPrice' | 'maxPrice', value: string) => {
    // Apenas números ou vazio
    const sanitized = value.replace(/[^0-9.]/g, '');
    onFilterChange({
      ...filters,
      [field]: sanitized,
    });
  };

  const handleCategorySelect = (categoryName: string) => {
    onFilterChange({
      ...filters,
      category: categoryName,
    });
  };

  const renderContent = () => (
    <>
      {/* Cabeçalho */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <span className={styles.titleIcon}>
            <SlidersIcon size={18} />
          </span>
          <h2 className={styles.title}>Filtros</h2>
          {activeCount > 0 && (
            <span className={styles.activeCountBadge} title={`${activeCount} filtros ativos`}>
              {activeCount}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {activeCount > 0 && (
            <button
              type="button"
              className={styles.btnClear}
              onClick={onResetFilters}
              id="clear-all-product-filters"
            >
              Limpar
            </button>
          )}

          {onCloseMobile && (
            <button
              type="button"
              className={styles.closeMobileBtn}
              onClick={onCloseMobile}
              aria-label="Fechar filtros"
            >
              <XIcon size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Ordenação */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span>
            <span className={styles.sectionIcon}>
              <ArrowUpDownIcon size={14} />
            </span>
            Ordenar por
          </span>
        </div>
        <div className={styles.selectWrapper}>
          <select
            className={styles.select}
            value={filters.sortBy}
            onChange={handleSortChange}
            id="product-sort-by-select"
            aria-label="Opções de ordenação"
          >
            <option value="featured">Padrão / Relevância</option>
            <option value="price-asc">Menor Preço (R$ ↑)</option>
            <option value="price-desc">Maior Preço (R$ ↓)</option>
            <option value="name-asc">Nome do Produto (A → Z)</option>
          </select>
          <span className={styles.selectArrow}>
            <ChevronDownIcon size={15} />
          </span>
        </div>
      </div>

      {/* Perfil Seguro Personalizado (para usuários logados) */}
      {isAuthenticated && (
        <div className={styles.safeProfileCard}>
          <div
            className={`${styles.checkboxItem} ${
              filters.onlySafeCompatibility ? styles.checkboxChecked : ''
            }`}
            onClick={() => handleToggle('onlySafeCompatibility')}
            role="checkbox"
            aria-checked={filters.onlySafeCompatibility}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                handleToggle('onlySafeCompatibility');
              }
            }}
            id="filter-only-safe-compatibility"
          >
            <div className={styles.customCheck}>
              {filters.onlySafeCompatibility && <CheckIcon size={13} />}
            </div>
            <div className={styles.checkboxLabel}>
              <strong style={{ fontSize: '0.86rem', color: 'var(--color-emerald)' }}>
                Meu Perfil Seguro
              </strong>
              <span className={styles.badgeTag}>SAFE</span>
            </div>
          </div>
          <p className={styles.safeProfileHint}>
            Exibir somente produtos 100% validados contra suas restrições biológicas.
          </p>
        </div>
      )}

      {/* Segurança Alimentar & Alérgenos */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span>
            <span className={styles.sectionIcon}>
              <ShieldCheckIcon size={14} />
            </span>
            Isenções & Alérgenos
          </span>
        </div>

        <div className={styles.checkboxList}>
          {/* Sem Glúten */}
          <div
            className={`${styles.checkboxItem} ${
              filters.freeOfGluten ? styles.checkboxChecked : ''
            }`}
            onClick={() => handleToggle('freeOfGluten')}
            role="checkbox"
            aria-checked={filters.freeOfGluten}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                handleToggle('freeOfGluten');
              }
            }}
            id="filter-gluten-free"
          >
            <div className={styles.customCheck}>
              {filters.freeOfGluten && <CheckIcon size={13} />}
            </div>
            <div className={styles.checkboxLabel}>
              <span>100% Sem Glúten</span>
              <span className={styles.badgeTag}>Apto Celíacos</span>
            </div>
          </div>

          {/* Sem Leite / Sem Lactose */}
          <div
            className={`${styles.checkboxItem} ${
              filters.freeOfMilk ? styles.checkboxChecked : ''
            }`}
            onClick={() => handleToggle('freeOfMilk')}
            role="checkbox"
            aria-checked={filters.freeOfMilk}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                handleToggle('freeOfMilk');
              }
            }}
            id="filter-milk-free"
          >
            <div className={styles.customCheck}>
              {filters.freeOfMilk && <CheckIcon size={13} />}
            </div>
            <div className={styles.checkboxLabel}>
              <span>Sem Leite / Sem Lactose</span>
            </div>
          </div>

          {/* Sem Soja */}
          <div
            className={`${styles.checkboxItem} ${
              filters.freeOfSoy ? styles.checkboxChecked : ''
            }`}
            onClick={() => handleToggle('freeOfSoy')}
            role="checkbox"
            aria-checked={filters.freeOfSoy}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                handleToggle('freeOfSoy');
              }
            }}
            id="filter-soy-free"
          >
            <div className={styles.customCheck}>
              {filters.freeOfSoy && <CheckIcon size={13} />}
            </div>
            <div className={styles.checkboxLabel}>
              <span>Sem Soja</span>
            </div>
          </div>

          {/* Sem Amendoim / Castanhas */}
          <div
            className={`${styles.checkboxItem} ${
              filters.freeOfNuts ? styles.checkboxChecked : ''
            }`}
            onClick={() => handleToggle('freeOfNuts')}
            role="checkbox"
            aria-checked={filters.freeOfNuts}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                handleToggle('freeOfNuts');
              }
            }}
            id="filter-nuts-free"
          >
            <div className={styles.customCheck}>
              {filters.freeOfNuts && <CheckIcon size={13} />}
            </div>
            <div className={styles.checkboxLabel}>
              <span>Sem Oleaginosas / Nozes</span>
            </div>
          </div>

          {/* Sem Ovos */}
          <div
            className={`${styles.checkboxItem} ${
              filters.freeOfEggs ? styles.checkboxChecked : ''
            }`}
            onClick={() => handleToggle('freeOfEggs')}
            role="checkbox"
            aria-checked={filters.freeOfEggs}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                handleToggle('freeOfEggs');
              }
            }}
            id="filter-eggs-free"
          >
            <div className={styles.customCheck}>
              {filters.freeOfEggs && <CheckIcon size={13} />}
            </div>
            <div className={styles.checkboxLabel}>
              <span>Sem Ovos</span>
            </div>
          </div>

          {/* Vegano */}
          <div
            className={`${styles.checkboxItem} ${
              filters.veganOnly ? styles.checkboxChecked : ''
            }`}
            onClick={() => handleToggle('veganOnly')}
            role="checkbox"
            aria-checked={filters.veganOnly}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                handleToggle('veganOnly');
              }
            }}
            id="filter-vegan-only"
          >
            <div className={styles.customCheck}>
              {filters.veganOnly && <CheckIcon size={13} />}
            </div>
            <div className={styles.checkboxLabel}>
              <span>Apenas Vegano 🌱</span>
            </div>
          </div>
        </div>
      </div>

      {/* Faixa de Preço */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span>Faixa de Preço</span>
        </div>

        <div className={styles.priceInputs}>
          <div className={styles.priceInputWrapper}>
            <span className={styles.currencyPrefix}>R$</span>
            <input
              type="text"
              inputMode="decimal"
              className={styles.priceInput}
              placeholder="Mín"
              value={filters.minPrice}
              onChange={(e) => handlePriceChange('minPrice', e.target.value)}
              id="filter-price-min"
              aria-label="Preço mínimo em reais"
            />
          </div>
          <span className={styles.priceSeparator}>–</span>
          <div className={styles.priceInputWrapper}>
            <span className={styles.currencyPrefix}>R$</span>
            <input
              type="text"
              inputMode="decimal"
              className={styles.priceInput}
              placeholder="Máx"
              value={filters.maxPrice}
              onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
              id="filter-price-max"
              aria-label="Preço máximo em reais"
            />
          </div>
        </div>

        <div
          className={`${styles.checkboxItem} ${
            filters.onlyWithPrice ? styles.checkboxChecked : ''
          }`}
          style={{ padding: '0.2rem 0.25rem' }}
          onClick={() => handleToggle('onlyWithPrice')}
          role="checkbox"
          aria-checked={filters.onlyWithPrice}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              handleToggle('onlyWithPrice');
            }
          }}
          id="filter-only-with-price"
        >
          <div className={styles.customCheck}>
            {filters.onlyWithPrice && <CheckIcon size={13} />}
          </div>
          <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
            Ocultar produtos sob consulta
          </span>
        </div>
      </div>

      {/* Categorias de Produtos */}
      {categories.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span>Categorias</span>
          </div>

          <div className={styles.categoryPills}>
            <button
              type="button"
              className={`${styles.categoryPill} ${
                filters.category === 'ALL' ? styles.categoryPillActive : ''
              }`}
              onClick={() => handleCategorySelect('ALL')}
            >
              <span>Todas as categorias</span>
              <span className={styles.categoryCount}>{totalProductsCount}</span>
            </button>

            {categories.map((cat) => (
              <button
                key={cat.name}
                type="button"
                className={`${styles.categoryPill} ${
                  filters.category.toLowerCase() === cat.name.toLowerCase()
                    ? styles.categoryPillActive
                    : ''
                }`}
                onClick={() => handleCategorySelect(cat.name)}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {cat.name}
                </span>
                <span className={styles.categoryCount}>{cat.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Visualização Desktop (Sticky Sidebar) */}
      <aside
        className={styles.sidebarCard}
        aria-label="Filtros e ordenação do catálogo"
      >
        {renderContent()}
      </aside>

      {/* Visualização Mobile (Drawer Modal) */}
      {isOpenMobile && (
        <div
          className={styles.mobileDrawerOpen}
          onClick={(e) => {
            if (e.target === e.currentTarget && onCloseMobile) {
              onCloseMobile();
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Filtros do Catálogo"
        >
          <div className={styles.mobileDrawerContent}>
            {renderContent()}
            <button
              type="button"
              className="btn btn-em"
              style={{
                marginTop: 'auto',
                padding: '0.75rem',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              onClick={onCloseMobile}
            >
              Aplicar Filtros ({filteredProductsCount})
            </button>
          </div>
        </div>
      )}
    </>
  );
}
