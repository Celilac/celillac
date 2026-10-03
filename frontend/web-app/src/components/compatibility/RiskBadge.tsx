// frontend/web-app/src/components/compatibility/RiskBadge.tsx
// ⚠️ REGRA: o riskLevel vem SEMPRE do Backend — nunca calculado no frontend.
import React from 'react';
import type { RiskLevel } from '@/api/compatibility';
import { StatusDot, ShieldCheckIcon, AlertTriangleIcon } from '@/components/layout/icons';

export type ExtendedRiskLevel = RiskLevel | 'INDETERMINATE';

export interface RiskConfig {
  color: 'green' | 'yellow' | 'orange' | 'red' | 'gray';
  label: string;
  description: string;
  cssClass: string;
}

const RISK_CONFIG: Record<ExtendedRiskLevel, RiskConfig> = {
  SAFE: {
    color: 'green',
    label: 'COMPATÍVEL',
    description: 'Compatível com as informações disponíveis.',
    cssClass: 'statusSafe',
  },
  WARNING: {
    color: 'yellow',
    label: 'ATENÇÃO',
    description: 'Possível risco de contaminação cruzada ou restrição moderada.',
    cssClass: 'statusWarning',
  },
  DANGER: {
    color: 'orange',
    label: 'RISCO ALTO',
    description: 'Risco relevante identificado para o seu perfil.',
    cssClass: 'statusDanger',
  },
  BLOCKED: {
    color: 'red',
    label: 'INCOMPATÍVEL',
    description: 'Contém ingrediente conflitante com seu perfil.',
    cssClass: 'statusBlocked',
  },
  UNEVALUATED: {
    color: 'gray',
    label: 'PERFIL INCOMPLETO',
    description: 'Perfil alimentar não configurado para cálculo de compatibilidade.',
    cssClass: 'statusWarning',
  },
  INDETERMINATE: {
    color: 'gray',
    label: 'INDETERMINADO',
    description: 'Informações insuficientes para garantir compatibilidade.',
    cssClass: 'statusWarning',
  },
};

interface RiskBadgeProps {
  riskLevel: ExtendedRiskLevel | string;
  showLabel?: boolean;
  showDescription?: boolean;
  className?: string;
  confidenceLevel?: 'AUDITED_BY_CELILAC' | 'PARTNER_DECLARED' | 'PRECAUTIONARY';
  hasDivergence?: boolean;
}

export function RiskBadge({
  riskLevel,
  showLabel = true,
  showDescription = false,
  className = '',
  confidenceLevel,
  hasDivergence = false,
}: RiskBadgeProps) {
  const normalizedLevel = (riskLevel as ExtendedRiskLevel) in RISK_CONFIG
    ? (riskLevel as ExtendedRiskLevel)
    : 'INDETERMINATE';

  const config = RISK_CONFIG[normalizedLevel];

  return (
    <div className={`risk-badge-wrapper ${className}`} style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span
          className={`risk-badge ${normalizedLevel} ${config.cssClass}`}
          role="status"
          aria-label={`Status: ${config.label}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '999px',
            fontWeight: 600,
            fontSize: '0.875rem',
          }}
        >
          <StatusDot color={config.color} size={10} />
          {showLabel && <span>{config.label}</span>}
        </span>

        {confidenceLevel === 'AUDITED_BY_CELILAC' && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 8px',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#047857',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
            title="Produto com laudo técnico ou certificação homologada pela equipe CeLiLac"
          >
            <ShieldCheckIcon size={14} style={{ color: '#047857' }} /> Auditado CeLiLac
          </span>
        )}

        {hasDivergence && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 8px',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#dc2626',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
            title="Divergência detectada entre a declaração do parceiro e o texto de ingredientes"
          >
            <AlertTriangleIcon size={14} style={{ color: '#dc2626' }} /> Divergência
          </span>
        )}
      </div>

      {showDescription && (
        <small style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
          {config.description}
        </small>
      )}
    </div>
  );
}
