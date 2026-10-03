'use client';
// frontend/web-app/src/components/common/CrossContaminationSelector.tsx
import React from 'react';
import { CrossContaminationDetails, EnvironmentRiskLevel } from '@/api/catalog';

interface CrossContaminationSelectorProps {
  value?: CrossContaminationDetails;
  onChange: (updated: CrossContaminationDetails) => void;
  disabled?: boolean;
}

const RISK_OPTIONS: Array<{
  key: EnvironmentRiskLevel;
  title: string;
  badge: string;
  badgeBg: string;
  badgeColor: string;
  badgeBorder: string;
  description: string;
  icon: string;
}> = [
  {
    key: 'EXCLUSIVE_ENVIRONMENT',
    title: 'Ambiente / Linha 100% Exclusivo',
    badge: 'Risco Mínimo / Exclusivo',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    badgeColor: '#10b981',
    badgeBorder: 'rgba(16, 185, 129, 0.35)',
    description:
      'A cozinha, maquinário e utensílios são totalmente dedicados e livres de glúten e outros alérgenos. Não há entrada de farinhas ou ingredientes de risco no local.',
    icon: '🛡️',
  },
  {
    key: 'SHARED_WITH_PROTOCOL',
    title: 'Ambiente Compartilhado com Protocolo Rígido',
    badge: 'Protocolo de Higienização',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    badgeColor: '#38bdf8',
    badgeBorder: 'rgba(56, 189, 248, 0.35)',
    description:
      'Mesmo espaço físico, porém com dias/horários de produção separados, higienização validada e utensílios identificados por cor ou autoclave.',
    icon: '🧼',
  },
  {
    key: 'SHARED_ENVIRONMENT',
    title: 'Ambiente Compartilhado com Risco de Traços',
    badge: 'Risco de Contaminação Cruzada',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    badgeColor: '#f59e0b',
    badgeBorder: 'rgba(245, 158, 11, 0.35)',
    description:
      'Mesmo maquinário, masseiras, fornos ou fritadeiras compartilhados com produtos contendo glúten ou alérgenos sem higienização certificada.',
    icon: '⚠️',
  },
  {
    key: 'UNKNOWN_RISK',
    title: 'Não Testado / Risco Desconhecido',
    badge: 'Não Auditado',
    badgeBg: 'rgba(148, 163, 184, 0.15)',
    badgeColor: '#94a3b8',
    badgeBorder: 'rgba(148, 163, 184, 0.35)',
    description:
      'O estabelecimento revende o item pronto ou não possui informações detalhadas do ambiente de manufatura.',
    icon: '❓',
  },
];

export const CrossContaminationSelector: React.FC<CrossContaminationSelectorProps> = ({
  value = {},
  onChange,
  disabled = false,
}) => {
  const currentRisk = value.environmentRisk || 'UNKNOWN_RISK';

  const handleSelectRisk = (risk: EnvironmentRiskLevel) => {
    if (disabled) return;
    onChange({
      ...value,
      environmentRisk: risk,
    });
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (disabled) return;
    onChange({
      ...value,
      cleaningProtocolNotes: e.target.value,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '8px',
            color: 'var(--color-text)',
          }}
        >
          Grau de Isolamento do Ambiente de Produção
        </label>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '12px',
          }}
        >
          {RISK_OPTIONS.map((opt) => {
            const isSelected = currentRisk === opt.key;

            return (
              <div
                key={opt.key}
                onClick={() => handleSelectRisk(opt.key)}
                style={{
                  background: isSelected
                    ? opt.badgeBg
                    : 'var(--color-surface, #ffffff)',
                  borderRadius: '10px',
                  border: isSelected
                    ? `2px solid ${opt.badgeColor}`
                    : '1px solid var(--color-border)',
                  padding: '14px',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? `0 0 12px ${opt.badgeBg}` : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{opt.icon}</span>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: isSelected ? opt.badgeColor : 'var(--color-text)',
                      }}
                    >
                      {opt.title}
                    </span>
                  </div>
                  {isSelected && (
                    <span
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: opt.badgeColor,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 900,
                      }}
                    >
                      ✓
                    </span>
                  )}
                </div>

                <p
                  style={{
                    margin: 0,
                    fontSize: '11px',
                    lineHeight: 1.5,
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {opt.description}
                </p>

                <div style={{ marginTop: 'auto', paddingTop: '4px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: '999px',
                      fontSize: '10px',
                      fontWeight: 700,
                      background: opt.badgeBg,
                      color: opt.badgeColor,
                      border: `1px solid ${opt.badgeBorder}`,
                    }}
                  >
                    {opt.badge}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detalhes de Protocolo e Higienização */}
      <div>
        <label
          htmlFor="cleaningProtocolNotes"
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '6px',
            color: 'var(--color-text)',
          }}
        >
          Observações de Sanitização / Protocolos de Cozinha (Opcional)
        </label>
        <textarea
          id="cleaningProtocolNotes"
          rows={3}
          value={value.cleaningProtocolNotes || ''}
          onChange={handleNotesChange}
          disabled={disabled}
          placeholder="Ex: Todas as superfícies são limpas com álcool 70% e reagente de swab de glúten antes de cada lote. Forno exclusivo no segundo andar."
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface, #ffffff)',
            color: 'var(--color-text)',
            fontSize: '13px',
            resize: 'vertical',
          }}
        />
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
          Estas notas aumentam a confiabilidade técnica para celíacos severos que analisam a segurança do estabelecimento.
        </span>
      </div>
    </div>
  );
};
