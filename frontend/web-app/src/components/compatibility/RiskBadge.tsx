// frontend/web-app/src/components/compatibility/RiskBadge.tsx
// ⚠️ REGRA: o riskLevel vem SEMPRE do Backend — nunca calculado no frontend.
import type { RiskLevel } from '@/api/compatibility';

export type ExtendedRiskLevel = RiskLevel | 'INDETERMINATE';

export interface RiskConfig {
  icon: string;
  label: string;
  description: string;
  cssClass: string;
}

const RISK_CONFIG: Record<ExtendedRiskLevel, RiskConfig> = {
  SAFE: {
    icon: '🟢',
    label: 'COMPATÍVEL',
    description: 'Compatível com as informações disponíveis.',
    cssClass: 'statusSafe',
  },
  WARNING: {
    icon: '🟡',
    label: 'ATENÇÃO',
    description: 'Possível risco de contaminação cruzada ou restrição moderada.',
    cssClass: 'statusWarning',
  },
  DANGER: {
    icon: '🟠',
    label: 'RISCO ALTO',
    description: 'Risco relevante identificado para o seu perfil.',
    cssClass: 'statusDanger',
  },
  BLOCKED: {
    icon: '🔴',
    label: 'INCOMPATÍVEL',
    description: 'Contém ingrediente conflitante com seu perfil.',
    cssClass: 'statusBlocked',
  },
  UNEVALUATED: {
    icon: '⚪',
    label: 'PERFIL INCOMPLETO',
    description: 'Perfil alimentar não configurado para cálculo de compatibilidade.',
    cssClass: 'statusWarning',
  },
  INDETERMINATE: {
    icon: '⚪',
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
}

export function RiskBadge({
  riskLevel,
  showLabel = true,
  showDescription = false,
  className = '',
}: RiskBadgeProps) {
  const normalizedLevel = (riskLevel as ExtendedRiskLevel) in RISK_CONFIG
    ? (riskLevel as ExtendedRiskLevel)
    : 'INDETERMINATE';

  const config = RISK_CONFIG[normalizedLevel];

  return (
    <div className={`risk-badge-wrapper ${className}`} style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px' }}>
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
        <span aria-hidden="true">{config.icon}</span>
        {showLabel && <span>{config.label}</span>}
      </span>
      {showDescription && (
        <small style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
          {config.description}
        </small>
      )}
    </div>
  );
}
