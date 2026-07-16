// src/lib/api.ts
// Camada única de comunicação HTTP do app mobile.
// Injeta o JWT automaticamente em rotas protegidas.
// NUNCA chamar a API de outra parte do app — apenas via estas funções.

const BASE_URL = 'http://10.0.2.2:3000'; // Android emulator → localhost. Para iOS/device real, use IP da máquina.

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Erro ${response.status}`);
  }

  return data as T;
}

// ─── IAM ──────────────────────────────────────────────────────────────────────

export interface RegisterPayload {
  email: string;
  password: string;
  role: 'CELIACO' | 'PARCEIRO' | 'ADMIN';
}

export interface RegisterResponse {
  id: string;
  email: string;
  role: string;
}

export function register(payload: RegisterPayload): Promise<RegisterResponse> {
  return request('/iam/register', { method: 'POST', body: JSON.stringify(payload) });
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresIn: string;
}

export function login(payload: LoginPayload): Promise<LoginResponse> {
  return request('/iam/login', { method: 'POST', body: JSON.stringify(payload) });
}

// ─── Food Profile ─────────────────────────────────────────────────────────────

export type AllergenType = 'GLUTEN' | 'LACTOSE' | 'NUTS' | 'SOY' | 'EGGS' | 'SHELLFISH' | 'FISH' | 'SESAME' | 'OTHER';
export type SeverityLevel = 'LIFESTYLE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'FATAL';

export interface Restriction {
  id?: string;
  allergen: AllergenType;
  severity: SeverityLevel;
}

export interface FoodProfile {
  id: string;
  userId: string;
  isActive: boolean;
  requiresHistoryRevalidation: boolean;
  restrictions: Restriction[];
}

export interface FoodProfilePayload {
  userId: string;
  restrictions: { allergen: AllergenType; severity: SeverityLevel }[];
}

export function createFoodProfile(payload: FoodProfilePayload): Promise<FoodProfile> {
  return request('/food-profile', { method: 'POST', body: JSON.stringify(payload) });
}

export function getFoodProfile(userId: string): Promise<FoodProfile> {
  return request(`/food-profile/${userId}`);
}

// ─── Catalog ──────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  brand: string;
  ingredients: string;
  hasGluten: boolean;
  crossContamination: string;
  analysisStatus: 'PENDENTE_DE_ANALISE' | 'ANALISADO';
}

export interface CatalogResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}

export function searchProducts(query: string, page = 1, limit = 20): Promise<CatalogResponse> {
  return request(`/catalog/products?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
}

// ─── Compatibility ────────────────────────────────────────────────────────────

export type RiskLevel = 'SAFE' | 'WARNING' | 'DANGER' | 'BLOCKED';

export interface CompatibilityConflict {
  allergen: string;
  severity: string;
  reason: string;
}

export interface CompatibilityReport {
  isCompatible: boolean;
  riskLevel: RiskLevel;
  reasoning: string;
  conflicts: CompatibilityConflict[];
}

export function checkCompatibility(userId: string, productId: string): Promise<CompatibilityReport> {
  return request('/compatibility/check', {
    method: 'POST',
    body: JSON.stringify({ userId, productId }),
  });
}
