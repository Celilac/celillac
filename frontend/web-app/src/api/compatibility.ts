// frontend/web-app/src/api/compatibility.ts
//
// ⚠️ PONTO CRÍTICO DA ARQUITETURA (FRONTEND_STRATEGY.md)
//
// Esta função é a ÚNICA forma de verificar compatibilidade no frontend.
// O AllergenEngine NUNCA é importado ou replicado aqui.
// O riskLevel retornado pelo backend deve ser renderizado como-está.
//
import { apiClient } from './client';

export type RiskLevel = 'SAFE' | 'WARNING' | 'DANGER' | 'BLOCKED';

export interface ConflictDetail {
  allergen: string;
  severity: string;
  reason:   string;
}

export interface CompatibilityRequest {
  userId:    string;
  productId: string;
}

export interface CompatibilityResponse {
  isCompatible: boolean;
  riskLevel:    RiskLevel;
  conflicts:    ConflictDetail[];
  reasoning:    string;
}

export const compatibilityApi = {
  /**
   * Verifica a compatibilidade de um produto com o perfil do usuário.
   * A lógica reside EXCLUSIVAMENTE no Backend (AllergenEngine).
   * O frontend apenas renderiza o resultado.
   */
  check: (body: CompatibilityRequest, token: string) =>
    apiClient.post<CompatibilityResponse>('/compatibility/check', body, token),
};
