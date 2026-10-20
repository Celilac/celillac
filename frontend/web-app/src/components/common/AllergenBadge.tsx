'use client';
// frontend/web-app/src/components/common/AllergenBadge.tsx
// Componente unificado de selos de alérgenos com pictogramas e símbolos mundiais
// (Crossed Grain AOECS/ACELBRA para Sem Glúten, Dairy-Free para Sem Leite, etc.)

import React from 'react';
import {
  WheatIcon,
  WheatOffIcon,
  MilkIcon,
  MilkOffIcon,
  LeafIcon,
  NutIcon,
  EggIcon,
  FishIcon,
  ShellfishIcon,
} from '@/components/layout/icons';

export type AllergenStatus = 'FREE' | 'CONTAINS' | 'TRACES';

export type AllergenType =
  | 'GLUTEN'
  | 'MILK'
  | 'SOY'
  | 'EGGS'
  | 'PEANUTS'
  | 'TREE_NUTS'
  | 'FISH'
  | 'CRUSTACEANS'
  | 'SESAME';

interface AllergenBadgeProps {
  type: AllergenType;
  status: AllergenStatus;
  customLabel?: string;
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
  className?: string;
}

export function AllergenBadge({
  type,
  status,
  customLabel,
  size = 'sm',
  style,
  className,
}: AllergenBadgeProps) {
  const iconSize = size === 'sm' ? 14 : 16;

  // Resolução do ícone mundial de acordo com o alérgeno e o estado de presença
  const getIcon = () => {
    switch (type) {
      case 'GLUTEN':
        return status === 'FREE' ? (
          <WheatOffIcon size={iconSize} aria-hidden="true" />
        ) : (
          <WheatIcon size={iconSize} aria-hidden="true" />
        );
      case 'MILK':
        return status === 'FREE' ? (
          <MilkOffIcon size={iconSize} aria-hidden="true" />
        ) : (
          <MilkIcon size={iconSize} aria-hidden="true" />
        );
      case 'SOY':
        return <LeafIcon size={iconSize} aria-hidden="true" />;
      case 'EGGS':
        return <EggIcon size={iconSize} aria-hidden="true" />;
      case 'PEANUTS':
      case 'TREE_NUTS':
        return <NutIcon size={iconSize} aria-hidden="true" />;
      case 'FISH':
        return <FishIcon size={iconSize} aria-hidden="true" />;
      case 'CRUSTACEANS':
        return <ShellfishIcon size={iconSize} aria-hidden="true" />;
      default:
        return null;
    }
  };

  // Rótulo descritivo padrão
  const getDefaultLabel = () => {
    if (customLabel) return customLabel;

    switch (type) {
      case 'GLUTEN':
        return status === 'FREE' ? 'Sem Glúten' : 'Contém Glúten';
      case 'MILK':
        if (status === 'FREE') return 'Sem Leite';
        if (status === 'TRACES') return 'Traços de Leite';
        return 'Contém Leite';
      case 'SOY':
        if (status === 'FREE') return 'Sem Soja';
        if (status === 'TRACES') return 'Traços de Soja';
        return 'Contém Soja';
      case 'EGGS':
        if (status === 'FREE') return 'Sem Ovos';
        if (status === 'TRACES') return 'Traços de Ovos';
        return 'Contém Ovos';
      case 'PEANUTS':
      case 'TREE_NUTS':
        if (status === 'FREE') return 'Sem Castanhas';
        if (status === 'TRACES') return 'Traços de Castanhas';
        return 'Contém Castanhas';
      case 'FISH':
        return status === 'FREE' ? 'Sem Peixe' : 'Contém Peixe';
      case 'CRUSTACEANS':
        return status === 'FREE' ? 'Sem Crustáceos' : 'Contém Crustáceos';
      default:
        return '';
    }
  };

  // Cores semânticas de acordo com o status
  const getColorStyles = () => {
    switch (status) {
      case 'FREE':
        return {
          background: 'rgba(16, 185, 129, 0.12)',
          color: '#10b981',
          border: '1px solid rgba(16, 185, 129, 0.35)',
        };
      case 'CONTAINS':
        return {
          background: 'rgba(239, 68, 68, 0.12)',
          color: '#ef4444',
          border: '1px solid rgba(239, 68, 68, 0.35)',
        };
      case 'TRACES':
        return {
          background: 'rgba(245, 158, 11, 0.12)',
          color: '#f59e0b',
          border: '1px solid rgba(245, 158, 11, 0.35)',
        };
    }
  };

  const colors = getColorStyles();
  const label = getDefaultLabel();

  return (
    <span
      className={className}
      title={`${label} (Símbolo internacional CeLiLac)`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: size === 'sm' ? '3px 8px' : '4px 10px',
        borderRadius: '9999px',
        fontSize: size === 'sm' ? '0.74rem' : '0.82rem',
        fontWeight: 650,
        letterSpacing: '0.01em',
        lineHeight: 1.2,
        userSelect: 'none',
        whiteSpace: 'nowrap',
        ...colors,
        ...style,
      }}
    >
      {getIcon()}
      <span>{label}</span>
    </span>
  );
}

export interface ProductLike {
  hasGluten?: boolean;
  ingredients?: string;
  crossContamination?: string;
  declaredAllergens?: Record<string, string>;
}

interface ProductAllergenBadgesProps {
  product: ProductLike;
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
}

/**
 * Componente contêiner que analisa os ingredientes e declarações de um produto
 * e renderiza o conjunto de badges padronizados com os ícones mundiais.
 */
export function ProductAllergenBadges({
  product,
  size = 'sm',
  style,
}: ProductAllergenBadgesProps) {
  const ing = (product.ingredients || '').toLowerCase();
  const cross = (product.crossContamination || '').toLowerCase();
  const declared = product.declaredAllergens || {};

  // 1. Glúten (prioriza hasGluten direto ou matriz declarada)
  const isGlutenFree =
    declared.GLUTEN === 'FREE' ||
    (!product.hasGluten && declared.GLUTEN !== 'CONTAINS' && declared.GLUTEN !== 'TRACES');

  const glutenStatus: AllergenStatus = isGlutenFree
    ? 'FREE'
    : declared.GLUTEN === 'TRACES'
      ? 'TRACES'
      : 'CONTAINS';

  // 2. Leite / Lactose
  const milkTerms = ['leite', 'lactose', 'queijo', 'manteiga', 'creme', 'whey', 'soro'];
  const hasMilkIng = milkTerms.some((t) => ing.includes(t));
  const hasMilkCross = milkTerms.some((t) => cross.includes(t));

  let milkStatus: AllergenStatus = 'FREE';
  if (declared.MILK === 'CONTAINS' || hasMilkIng) {
    milkStatus = 'CONTAINS';
  } else if (declared.MILK === 'TRACES' || hasMilkCross) {
    milkStatus = 'TRACES';
  } else if (declared.MILK === 'FREE') {
    milkStatus = 'FREE';
  } else if (!hasMilkIng && !hasMilkCross) {
    milkStatus = 'FREE';
  }

  // 3. Castanhas / Amendoim (Oleaginosas)
  const nutTerms = ['castanha', 'amendoim', 'nozes', 'amêndoa', 'pistache', 'avelã', 'macadâmia'];
  const hasNutIng = nutTerms.some((t) => ing.includes(t));
  const hasNutCross = nutTerms.some((t) => cross.includes(t));
  const hasNutWarning = hasNutIng || hasNutCross || declared.PEANUTS === 'CONTAINS' || declared.PEANUTS === 'TRACES';

  // 4. Soja
  const soyTerms = ['soja', 'lecitina de soja'];
  const hasSoyIng = soyTerms.some((t) => ing.includes(t));
  const hasSoyCross = soyTerms.some((t) => cross.includes(t));
  const hasSoyWarning = hasSoyIng || hasSoyCross || declared.SOY === 'CONTAINS' || declared.SOY === 'TRACES';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        flexWrap: 'wrap',
        ...style,
      }}
    >
      {/* Glúten — sempre exibido prioritariamente para celíacos */}
      <AllergenBadge type="GLUTEN" status={glutenStatus} size={size} />

      {/* Leite / Lactose */}
      <AllergenBadge type="MILK" status={milkStatus} size={size} />

      {/* Castanhas / Amendoim quando relevante */}
      {hasNutWarning && (
        <AllergenBadge
          type="PEANUTS"
          status={hasNutIng || declared.PEANUTS === 'CONTAINS' ? 'CONTAINS' : 'TRACES'}
          customLabel={hasNutIng ? 'Contém Castanhas' : 'Traços: Castanhas'}
          size={size}
        />
      )}

      {/* Soja quando relevante */}
      {hasSoyWarning && (
        <AllergenBadge
          type="SOY"
          status={hasSoyIng || declared.SOY === 'CONTAINS' ? 'CONTAINS' : 'TRACES'}
          customLabel={hasSoyIng ? 'Contém Soja' : 'Traços de Soja'}
          size={size}
        />
      )}
    </div>
  );
}
