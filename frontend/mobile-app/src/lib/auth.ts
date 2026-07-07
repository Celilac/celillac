// src/lib/auth.ts
// Utilitários para decodificar o payload do JWT.
// NUNCA valide o JWT aqui — apenas decodifique o payload.
// A validação ocorre no servidor em cada requisição protegida.

export interface JwtPayload {
  sub: string;   // userId
  role: 'CELIACO' | 'PARCEIRO' | 'ADMIN';
  iat: number;
  exp: number;
}

/**
 * Decodifica o payload do JWT sem verificar a assinatura.
 * Conforme API_CONTRACTS.md seção 9: "Decodificar o sub do JWT para obter o userId (não pedir ao usuário)."
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    // Base64url → Base64 → JSON
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token);
  if (!payload) return true;
  return Date.now() >= payload.exp * 1000;
}
