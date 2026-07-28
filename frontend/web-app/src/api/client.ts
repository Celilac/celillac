// frontend/web-app/src/api/client.ts
//
// ══════════════════════════════════════════════════════════════
// ⚠️ REGRA FUNDAMENTAL — FRONTEND_STRATEGY.md
//
// Esta é a ÚNICA camada autorizada a fazer chamadas HTTP.
// Nenhum componente, página ou contexto deve usar fetch() diretamente.
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

  const text = await response.text().catch(() => '');

  if (!response.ok) {
    let errorMessage = 'Erro no servidor.';
    if (text && text.trim()) {
      try {
        const body = JSON.parse(text);
        errorMessage = body.error || body.message || errorMessage;
      } catch (_) {
        errorMessage = text;
      }
    }
    throw new HttpError(response.status, errorMessage);
  }

  if (!text || !text.trim()) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch (_) {
    return {} as T;
  }
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
