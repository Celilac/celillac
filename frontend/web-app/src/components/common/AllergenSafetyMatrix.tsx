'use client';
// frontend/web-app/src/components/common/AllergenSafetyMatrix.tsx
import React from 'react';
import { AllergenPresence } from '@/api/catalog';

export interface AllergenItemConfig {
  key: string;
  name: string;
  category: string;
  icon: string;
  description: string;
}

export const ALLERGEN_CATALOG_LIST: AllergenItemConfig[] = [
  { key: 'GLUTEN', name: 'Glúten', category: 'Cereais', icon: '🌾', description: 'Trigo, centeio, cevada, aveia e derivados' },
  { key: 'MILK', name: 'Leite', category: 'Laticínios', icon: '🥛', description: 'Leite de vaca, lactose, caseína e derivados' },
  { key: 'SOY', name: 'Soja', category: 'Leguminosas', icon: '🌱', description: 'Grãos, lecitina de soja, proteína vegetal' },
  { key: 'EGGS', name: 'Ovos', category: 'Proteínas', icon: '🥚', description: 'Clara, gema, albumina e derivados' },
  { key: 'PEANUTS', name: 'Amendoim', category: 'Oleaginosas', icon: '🥜', description: 'Amendoim in natura, óleo, pasta e derivados' },
  { key: 'TREE_NUTS', name: 'Castanhas & Nozes', category: 'Oleaginosas', icon: '🌰', description: 'Amêndoas, nozes, avelãs, castanha-de-caju, pistache' },
  { key: 'FISH', name: 'Peixes', category: 'Pescados', icon: '🐟', description: 'Todas as espécies de peixes e derivados' },
  { key: 'CRUSTACEANS', name: 'Crustáceos', category: 'Frutos do Mar', icon: '🦐', description: 'Camarão, siri, caranguejo, lagosta' },
  { key: 'WHEAT', name: 'Trigo', category: 'Cereais', icon: '🥖', description: 'Alergia a proteínas específicas do grão de trigo' },
  { key: 'SESAME', name: 'Gergelim', category: 'Sementes', icon: '🥯', description: 'Sementes de gergelim, óleo e tahine' },
];

interface AllergenSafetyMatrixProps {
  value: Record<string, AllergenPresence>;
  onChange: (updated: Record<string, AllergenPresence>) => void;
  disabled?: boolean;
}

const STATE_CONFIG: Record<
  AllergenPresence,
  { label: string; shortLabel: string; bg: string; border: string; text: string; dotColor: string }
> = {
  FREE: {
    label: 'Não Contém (Livre)',
    shortLabel: 'Livre',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.35)',
    text: '#10b981',
    dotColor: '#10b981',
  },
  CONTAINS: {
    label: 'Contém (Presente)',
    shortLabel: 'Contém',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.35)',
    text: '#ef4444',
    dotColor: '#ef4444',
  },
  TRACES: {
    label: 'Pode Conter Traços',
    shortLabel: 'Traços',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.35)',
    text: '#f59e0b',
    dotColor: '#f59e0b',
  },
  NOT_INFORMED: {
    label: 'Não Informado',
    shortLabel: 'Não Inf.',
    bg: 'rgba(148, 163, 184, 0.1)',
    border: 'rgba(148, 163, 184, 0.25)',
    text: '#94a3b8',
    dotColor: '#64748b',
  },
};

export const AllergenSafetyMatrix: React.FC<AllergenSafetyMatrixProps> = ({
  value = {},
  onChange,
  disabled = false,
}) => {
  const handleSetState = (key: string, state: AllergenPresence) => {
    if (disabled) return;
    const next = { ...value, [key]: state };
    onChange(next);
  };

  const handleMarkAllFree = () => {
    if (disabled) return;
    const next = { ...value };
    ALLERGEN_CATALOG_LIST.forEach((item) => {
      if (!next[item.key] || next[item.key] === 'NOT_INFORMED') {
        next[item.key] = 'FREE';
      }
    });
    onChange(next);
  };

  const handleClearAll = () => {
    if (disabled) return;
    const next = { ...value };
    ALLERGEN_CATALOG_LIST.forEach((item) => {
      next[item.key] = 'NOT_INFORMED';
    });
    onChange(next);
  };

  // Contadores para sumário
  let freeCount = 0;
  let containsCount = 0;
  let tracesCount = 0;
  let notInformedCount = 0;

  ALLERGEN_CATALOG_LIST.forEach((item) => {
    const st = value[item.key] || 'NOT_INFORMED';
    if (st === 'FREE') freeCount++;
    else if (st === 'CONTAINS') containsCount++;
    else if (st === 'TRACES') tracesCount++;
    else notInformedCount++;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header com ações rápidas e sumário */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          background: 'var(--color-elevated, #f1f0ec)',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
            Status da Declaração:
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 600,
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
            }}
          >
            ● {freeCount} Livres
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 600,
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
            }}
          >
            ● {containsCount} Contém
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 600,
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#f59e0b',
            }}
          >
            ● {tracesCount} Traços
          </span>
          {notInformedCount > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 600,
                background: 'rgba(148, 163, 184, 0.15)',
                color: '#94a3b8',
              }}
            >
              ○ {notInformedCount} Pendentes
            </span>
          )}
        </div>

        {/* Botões de Ação Rápida */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={handleMarkAllFree}
            disabled={disabled}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '6px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Define todos os alérgenos pendentes como 'Não Contém'"
          >
            ✓ Marcar Pendentes como Livres
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            disabled={disabled}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              background: 'rgba(148, 163, 184, 0.1)',
              color: '#94a3b8',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '6px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Grid de Alérgenos */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '12px',
        }}
      >
        {ALLERGEN_CATALOG_LIST.map((item) => {
          const currentState = value[item.key] || 'NOT_INFORMED';
          const cfg = STATE_CONFIG[currentState];

          return (
            <div
              key={item.key}
              style={{
                background: 'var(--color-surface, #ffffff)',
                borderRadius: '10px',
                border: `1px solid ${cfg.border}`,
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              {/* Header do Item com Ícone e Nome */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px', lineHeight: 1 }}>{item.icon}</span>
                  <div>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: '14px',
                        fontWeight: 700,
                        color: 'var(--color-text)',
                      }}
                    >
                      {item.name}
                    </h4>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {item.description}
                    </span>
                  </div>
                </div>

                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: '999px',
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    background: cfg.bg,
                    color: cfg.text,
                    border: `1px solid ${cfg.border}`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cfg.shortLabel}
                </span>
              </div>

              {/* Seletor Segmentado de 4 Estados */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '4px',
                  background: 'var(--color-elevated, #f1f0ec)',
                  padding: '3px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                }}
              >
                {(['FREE', 'CONTAINS', 'TRACES', 'NOT_INFORMED'] as AllergenPresence[]).map((stateKey) => {
                  const isSelected = currentState === stateKey;
                  const itemCfg = STATE_CONFIG[stateKey];

                  return (
                    <button
                      key={stateKey}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleSetState(item.key, stateKey)}
                      style={{
                        padding: '6px 4px',
                        fontSize: '11px',
                        fontWeight: isSelected ? 700 : 500,
                        borderRadius: '6px',
                        border: isSelected ? `1px solid ${itemCfg.border}` : '1px solid transparent',
                        background: isSelected ? itemCfg.bg : 'transparent',
                        color: isSelected ? itemCfg.text : 'var(--color-text-muted)',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease',
                        textAlign: 'center',
                        lineHeight: 1.2,
                      }}
                    >
                      {itemCfg.shortLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
