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

function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Se o envUrl não estiver definido ou se for localhost, mas o navegador estiver em um IP/domínio remoto (ex: VPS Oracle 163.176.195.210)
    if (!envUrl || (envUrl.includes('localhost') && hostname !== 'localhost' && hostname !== '127.0.0.1')) {
      const protocol = window.location.protocol;
      return `${protocol}//${hostname}:3002`;
    }
  }

  return envUrl ?? 'http://localhost:3000';
}

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
  const baseUrl = getApiBaseUrl();

  const response = await fetch(`${baseUrl}${path}`, {
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
  get: <T>(path: string, token?: string) =>
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

  delete: <T>(path: string, token?: string) =>
    request<T>(path, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),
};
