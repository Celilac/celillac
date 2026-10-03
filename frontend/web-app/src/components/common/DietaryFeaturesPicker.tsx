'use client';
// frontend/web-app/src/components/common/DietaryFeaturesPicker.tsx
import React from 'react';
import { DietaryFeature } from '@/api/catalog';

interface DietaryFeaturesPickerProps {
  selected: DietaryFeature[];
  onChange: (features: DietaryFeature[]) => void;
  disabled?: boolean;
}

interface FeatureConfig {
  key: DietaryFeature;
  label: string;
  icon: string;
  badgeBg: string;
  badgeColor: string;
  badgeBorder: string;
  description: string;
}

const FEATURE_CONFIGS: FeatureConfig[] = [
  {
    key: 'VEGAN',
    label: 'Vegano',
    icon: '🌱',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    badgeColor: '#10b981',
    badgeBorder: 'rgba(16, 185, 129, 0.35)',
    description: 'Sem nenhum ingrediente de origem animal (laticínios, ovos, mel ou carnes).',
  },
  {
    key: 'VEGETARIAN',
    label: 'Vegetariano',
    icon: '🥕',
    badgeBg: 'rgba(52, 211, 153, 0.15)',
    badgeColor: '#34d399',
    badgeBorder: 'rgba(52, 211, 153, 0.35)',
    description: 'Sem carnes ou pescados. Pode conter laticínios ou ovos.',
  },
  {
    key: 'NO_ADDED_SUGAR',
    label: 'Sem Adição de Açúcares',
    icon: '🍎',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    badgeColor: '#f59e0b',
    badgeBorder: 'rgba(245, 158, 11, 0.35)',
    description: 'Adoçado apenas naturalmente pelas frutas e ingredientes da receita.',
  },
  {
    key: 'SUGAR_FREE',
    label: 'Zero Açúcar',
    icon: '🫐',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    badgeColor: '#38bdf8',
    badgeBorder: 'rgba(56, 189, 248, 0.35)',
    description: 'Isento de sacarose ou açúcares totais, indicado para controle glicêmico.',
  },
  {
    key: 'ORGANIC',
    label: 'Orgânico',
    icon: '🌿',
    badgeBg: 'rgba(132, 204, 22, 0.15)',
    badgeColor: '#a3e635',
    badgeBorder: 'rgba(132, 204, 22, 0.35)',
    description: 'Cultivado sem defensivos agrícolas sintéticos ou transgênicos.',
  },
  {
    key: 'KOSHER',
    label: 'Kosher',
    icon: '✡️',
    badgeBg: 'rgba(168, 85, 247, 0.15)',
    badgeColor: '#c084fc',
    badgeBorder: 'rgba(168, 85, 247, 0.35)',
    description: 'Em conformidade com os preceitos e regras dietéticas judaicas.',
  },
  {
    key: 'HALAL',
    label: 'Halal',
    icon: '☪️',
    badgeBg: 'rgba(236, 72, 153, 0.15)',
    badgeColor: '#f472b6',
    badgeBorder: 'rgba(236, 72, 153, 0.35)',
    description: 'Preparado de acordo com as normas da lei islâmica.',
  },
];

export const DietaryFeaturesPicker: React.FC<DietaryFeaturesPickerProps> = ({
  selected = [],
  onChange,
  disabled = false,
}) => {
  const handleToggle = (feature: DietaryFeature) => {
    if (disabled) return;
    if (selected.includes(feature)) {
      onChange(selected.filter((f) => f !== feature));
    } else {
      onChange([...selected, feature]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '10px',
        }}
      >
        {FEATURE_CONFIGS.map((cfg) => {
          const isSelected = selected.includes(cfg.key);

          return (
            <button
              key={cfg.key}
              type="button"
              disabled={disabled}
              onClick={() => handleToggle(cfg.key)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                textAlign: 'left',
                padding: '10px 12px',
                borderRadius: '8px',
                background: isSelected ? cfg.badgeBg : 'var(--color-surface, #ffffff)',
                border: isSelected ? `1.5px solid ${cfg.badgeColor}` : '1px solid var(--color-border)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: '20px', lineHeight: 1 }}>{cfg.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: isSelected ? cfg.badgeColor : 'var(--color-text)',
                    }}
                  >
                    {cfg.label}
                  </span>
                  {isSelected && (
                    <span
                      style={{
                        fontSize: '11px',
                        color: cfg.badgeColor,
                        fontWeight: 900,
                      }}
                    >
                      ✓
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--color-text-muted)',
                    lineHeight: 1.3,
                    display: 'block',
                    marginTop: '2px',
                  }}
                >
                  {cfg.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
