// frontend/web-app/src/api/client.ts
//
// ══════════════════════════════════════════════════════════════
// ⚠️ REGRA FUNDAMENTAL — FRONTEND_STRATEGY.md
//
// Esta é a ÚNICA camada autorizada a fazer chamadas HTTP.
// Nenhum componente, página ou contexto deve usar fetch() diretamente.
//
// PROIBIDO no frontend:
//   ❌ Importar AllergenEngine, RiskLevel, ou qualquer lógica do backend
//   ❌ Recalcular compatibilidade com base em ingredientes
//   ❌ Usar fetch() fora desta pasta src/api/
//
// CORRETO:
//   ✅ Chamar compatibility.ts → POST /compatibility/check
//   ✅ Renderizar o riskLevel retornado pelo Backend
// ══════════════════════════════════════════════════════════════

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export interface ApiError {
  error: string;
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { headers: optionHeaders, ...restOptions } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(optionHeaders ?? {}),
    },
    ...restOptions,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'Erro desconhecido.' }));
    throw new HttpError(response.status, (body as ApiError).error ?? 'Erro desconhecido.');
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  get:  <T>(path: string, token?: string) =>
    request<T>(path, { method: 'GET', headers: token ? { Authorization: `Bearer ${token}` } : {} }),

  post: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  put: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  patch: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),
};
