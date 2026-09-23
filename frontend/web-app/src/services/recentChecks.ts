// frontend/web-app/src/services/recentChecks.ts
import type { RiskLevel } from '@/api/compatibility';

export interface RecentCheckItem {
  productId: string;
  productName: string;
  riskLevel: RiskLevel;
  checkedAt: string; // ISO string
}

const STORAGE_PREFIX = 'celilac_recent_checks_';
const MAX_RECENT_ITEMS = 8;

function getStorageKey(userId?: string | null): string {
  return `${STORAGE_PREFIX}${userId ? userId.trim() : 'guest'}`;
}

/**
 * Obtém a lista de verificações recentes salvas no navegador.
 */
export function getRecentChecks(userId?: string | null): RecentCheckItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (err) {
    console.error('[recentChecks] Falha ao carregar verificações recentes:', err);
    return [];
  }
}

/**
 * Salva uma nova verificação de produto no histórico do navegador.
 * Desduplica pelo productId, atualiza o timestamp e mantém até o limite máximo.
 */
export function saveRecentCheck(
  item: Omit<RecentCheckItem, 'checkedAt'>,
  userId?: string | null
): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getRecentChecks(userId);
    const filtered = current.filter((c) => c.productId !== item.productId);
    const updated: RecentCheckItem[] = [
      {
        ...item,
        checkedAt: new Date().toISOString(),
      },
      ...filtered,
    ].slice(0, MAX_RECENT_ITEMS);

    localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
  } catch (err) {
    console.error('[recentChecks] Falha ao salvar verificação recente:', err);
  }
}

/**
 * Remove todo o histórico de verificações recentes.
 */
export function clearRecentChecks(userId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(getStorageKey(userId));
  } catch (err) {
    console.error('[recentChecks] Falha ao limpar verificações recentes:', err);
  }
}

/**
 * Formata um ISO timestamp em texto amigável em português.
 * Exemplos: "Hoje, 14:32", "Ontem, 09:15", "22/09 às 16:40".
 */
export function formatRecentDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return 'Recentemente';

    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    if (isToday) {
      return `Hoje, ${timeStr}`;
    }
    if (isYesterday) {
      return `Ontem, ${timeStr}`;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month} às ${timeStr}`;
  } catch {
    return 'Recentemente';
  }
}
