'use client';
// frontend/web-app/src/components/common/NutritionalInfoAccordion.tsx
import React, { useState } from 'react';
import { NutritionalInfo } from '@/api/catalog';

interface NutritionalInfoAccordionProps {
  value?: NutritionalInfo;
  onChange: (info: NutritionalInfo) => void;
  disabled?: boolean;
}

export const NutritionalInfoAccordion: React.FC<NutritionalInfoAccordionProps> = ({
  value = {},
  onChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleFieldChange = (field: keyof NutritionalInfo, rawVal: string) => {
    if (disabled) return;
    if (field === 'servingSize') {
      onChange({ ...value, servingSize: rawVal });
    } else {
      const num = rawVal === '' ? undefined : parseFloat(rawVal);
      onChange({ ...value, [field]: num });
    }
  };

  const hasData = Boolean(
    value.servingSize ||
    value.calories !== undefined ||
    value.carbohydrates !== undefined ||
    value.proteins !== undefined ||
    value.sodium !== undefined
  );

  return (
    <div
      style={{
        borderRadius: '10px',
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface, #ffffff)',
        overflow: 'hidden',
      }}
    >
      {/* Header com Toggle do Accordion */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-text)',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>📊</span>
          <div>
            <span style={{ fontSize: '14px', fontWeight: 700, display: 'block' }}>
              Tabela Nutricional & Porção (Opcional - RDC 429 ANVISA)
            </span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              Informe os macronutrientes e açúcares adicionados para visualização técnica completa
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {hasData && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '999px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
              }}
            >
              Preenchida
            </span>
          )}
          <span
            style={{
              fontSize: '16px',
              color: 'var(--color-text-muted)',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          >
            ▼
          </span>
        </div>
      </button>

      {/* Conteúdo Expansível */}
      {isOpen && (
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            background: 'var(--color-elevated, #f1f0ec)',
          }}
        >
          {/* Tamanho da Porção */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              Tamanho da Porção de Referência
            </label>
            <input
              type="text"
              value={value.servingSize || ''}
              onChange={(e) => handleFieldChange('servingSize', e.target.value)}
              disabled={disabled}
              placeholder="Ex: 50g (2 fatias) ou 200ml (1 copo)"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                background: 'var(--color-surface, #ffffff)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
                fontSize: '13px',
              }}
            />
          </div>

          {/* Grid de Nutrientes */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '12px',
            }}
          >
            {/* Calorias */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                Valor Energético (kcal)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={value.calories !== undefined ? value.calories : ''}
                onChange={(e) => handleFieldChange('calories', e.target.value)}
                disabled={disabled}
                placeholder="Ex: 140"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'var(--color-surface, #ffffff)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  fontSize: '13px',
                }}
              />
            </div>

            {/* Carboidratos */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                Carboidratos (g)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={value.carbohydrates !== undefined ? value.carbohydrates : ''}
                onChange={(e) => handleFieldChange('carbohydrates', e.target.value)}
                disabled={disabled}
                placeholder="Ex: 22"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'var(--color-surface, #ffffff)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  fontSize: '13px',
                }}
              />
            </div>

            {/* Açúcares Totais */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                Açúcares Totais (g)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={value.totalSugars !== undefined ? value.totalSugars : ''}
                onChange={(e) => handleFieldChange('totalSugars', e.target.value)}
                disabled={disabled}
                placeholder="Ex: 3.5"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'var(--color-surface, #ffffff)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  fontSize: '13px',
                }}
              />
            </div>

            {/* Açúcares Adicionados */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                Açúcares Adicionados (g)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={value.addedSugars !== undefined ? value.addedSugars : ''}
                onChange={(e) => handleFieldChange('addedSugars', e.target.value)}
                disabled={disabled}
                placeholder="Ex: 0"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'var(--color-surface, #ffffff)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  fontSize: '13px',
                }}
              />
            </div>

            {/* Proteínas */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                Proteínas (g)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={value.proteins !== undefined ? value.proteins : ''}
                onChange={(e) => handleFieldChange('proteins', e.target.value)}
                disabled={disabled}
                placeholder="Ex: 4"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'var(--color-surface, #ffffff)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  fontSize: '13px',
                }}
              />
            </div>

            {/* Gorduras Totais */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                Gorduras Totais (g)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={value.totalFat !== undefined ? value.totalFat : ''}
                onChange={(e) => handleFieldChange('totalFat', e.target.value)}
                disabled={disabled}
                placeholder="Ex: 5.2"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'var(--color-surface, #ffffff)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  fontSize: '13px',
                }}
              />
            </div>

            {/* Gorduras Saturadas */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                Gorduras Saturadas (g)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={value.saturatedFat !== undefined ? value.saturatedFat : ''}
                onChange={(e) => handleFieldChange('saturatedFat', e.target.value)}
                disabled={disabled}
                placeholder="Ex: 1.1"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'var(--color-surface, #ffffff)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  fontSize: '13px',
                }}
              />
            </div>

            {/* Fibras Alimentares */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                Fibra Alimentar (g)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={value.dietaryFiber !== undefined ? value.dietaryFiber : ''}
                onChange={(e) => handleFieldChange('dietaryFiber', e.target.value)}
                disabled={disabled}
                placeholder="Ex: 3"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'var(--color-surface, #ffffff)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  fontSize: '13px',
                }}
              />
            </div>

            {/* Sódio */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                Sódio (mg)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={value.sodium !== undefined ? value.sodium : ''}
                onChange={(e) => handleFieldChange('sodium', e.target.value)}
                disabled={disabled}
                placeholder="Ex: 95"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'var(--color-surface, #ffffff)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
