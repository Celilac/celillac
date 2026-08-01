// frontend/web-app/src/components/compatibility/RiskBadge.tsx
// ⚠️ REGRA: o riskLevel vem SEMPRE do Backend — nunca calculado no frontend.
import type { RiskLevel } from '@/api/compatibility';

const RISK_CONFIG: Record<RiskLevel, { icon: string; label: string }> = {
  SAFE:        { icon: '✅', label: 'Seguro' },
  WARNING:     { icon: '🟡', label: 'Atenção' },
  DANGER:      { icon: '⚠️', label: 'Perigo' },
  BLOCKED:     { icon: '⛔', label: 'Bloqueado' },
  UNEVALUATED: { icon: '⚪', label: 'Perfil Incompleto' },
};

interface RiskBadgeProps {
  riskLevel: RiskLevel;
  showLabel?: boolean;
}

export function RiskBadge({ riskLevel, showLabel = true }: RiskBadgeProps) {
  const config = RISK_CONFIG[riskLevel];
  return (
    <span className={`risk-badge ${riskLevel}`} role="status" aria-label={`Risco: ${config.label}`}>
      <span aria-hidden="true">{config.icon}</span>
      {showLabel && config.label}
    </span>
  );
}
