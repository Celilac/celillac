'use client';
// frontend/web-app/src/contexts/NotificationContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { ordersApi, OrderNotificationDTO } from '@/api/orders';
import { useToast } from '@/hooks/useToast';

export interface AppNotification {
  id: string;
  orderId: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  targetUrl: string;
  type: 'NEW_ORDER' | 'ORDER_CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERY' | 'DELIVERED' | 'CANCELLED';
}

interface NotificationContextData {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextData>({} as NotificationContextData);

/**
 * Emite alerta sonoro suave ("Ding-dong") usando a Web Audio API nativa.
 */
function playChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12); // A5
    gain2.gain.setValueAtTime(0.18, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch {
    // Silencia restrições de autoplay
  }
}

const MAX_NOTIFICATIONS = 30;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { token, userId, isAuthenticated } = useAuth();
  const toast = useToast();

  const storageKey = useMemo(() => (userId ? `celilac_notifications_${userId}` : null), [userId]);

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = storageKey ? localStorage.getItem(storageKey) : null;
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isConnected, setIsConnected] = useState(false);

  // Recarregar do localStorage ao mudar de usuário
  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') {
      setNotifications([]);
      return;
    }
    try {
      const stored = localStorage.getItem(storageKey);
      setNotifications(stored ? JSON.parse(stored) : []);
    } catch {
      setNotifications([]);
    }
  }, [storageKey]);

  // Salvar no localStorage sempre que mudar
  const persistNotifications = useCallback(
    (newNotifs: AppNotification[]) => {
      setNotifications(newNotifs);
      if (storageKey && typeof window !== 'undefined') {
        try {
          localStorage.setItem(storageKey, JSON.stringify(newNotifs.slice(0, MAX_NOTIFICATIONS)));
        } catch {
          // localStorage pode estar cheio
        }
      }
    },
    [storageKey]
  );

  const addNotification = useCallback(
    (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
      const newEntry: AppNotification = {
        ...notif,
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        read: false,
      };

      setNotifications((prev) => {
        const next = [newEntry, ...prev.filter((n) => n.id !== newEntry.id)].slice(0, MAX_NOTIFICATIONS);
        if (storageKey && typeof window !== 'undefined') {
          try {
            localStorage.setItem(storageKey, JSON.stringify(next));
          } catch {}
        }
        return next;
      });

      playChime();
    },
    [storageKey]
  );

  const markAsRead = useCallback(
    (id: string) => {
      setNotifications((prev) => {
        const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
        persistNotifications(next);
        return next;
      });
    },
    [persistNotifications]
  );

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      persistNotifications(next);
      return next;
    });
  }, [persistNotifications]);

  const clearAll = useCallback(() => {
    persistNotifications([]);
  }, [persistNotifications]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  // Conexão SSE Global em Tempo Real
  useEffect(() => {
    if (!isAuthenticated || !token || typeof window === 'undefined') {
      setIsConnected(false);
      return;
    }

    const streamUrl = ordersApi.getOrderStreamUrl({ token });
    let eventSource: EventSource | null = null;
    let isCancelled = false;

    try {
      eventSource = new EventSource(streamUrl, { withCredentials: true });

      eventSource.onopen = () => {
        if (!isCancelled) setIsConnected(true);
      };

      eventSource.onerror = () => {
        if (!isCancelled) setIsConnected(false);
      };

      // 1. Novo Pedido Pago ou Confirmado (Relevante para Parceiro / Cozinha)
      eventSource.addEventListener('order:payment_confirmed', (e: MessageEvent) => {
        if (isCancelled) return;
        try {
          const payload: OrderNotificationDTO = JSON.parse(e.data);
          const shortId = payload.orderId.slice(0, 8);
          const formattedTotal = Number(payload.totalAmount).toFixed(2).replace('.', ',');

          addNotification({
            orderId: payload.orderId,
            title: '🍳 Novo Pedido Recebido!',
            message: `Pedido #${shortId} no valor de R$ ${formattedTotal} está pronto para preparo.`,
            targetUrl: '/partner/orders',
            type: 'NEW_ORDER',
          });

          toast.info(`Novo pedido recebido! #${shortId} • R$ ${formattedTotal}`, 'Novo Pedido! 🔔');
        } catch (err) {
          console.error('[NotificationContext] Erro ao parsear order:payment_confirmed:', err);
        }
      });

      // 2. Mudança de Status do Pedido (Relevante para Consumidor e Parceiro)
      eventSource.addEventListener('order:status_updated', (e: MessageEvent) => {
        if (isCancelled) return;
        try {
          const payload: OrderNotificationDTO = JSON.parse(e.data);
          const shortId = payload.orderId.slice(0, 8);

          // Notificações para o Consumidor
          if (payload.consumerId === userId) {
            let title = 'Status do Pedido Atualizado';
            let message = `Seu pedido #${shortId} teve o status alterado para ${payload.status}.`;
            let type: AppNotification['type'] = 'ORDER_CONFIRMED';

            switch (payload.status) {
              case 'CONFIRMED':
                title = '✅ Pedido Aceito!';
                message = `Seu pedido #${shortId} foi aceito pelo restaurante.`;
                type = 'ORDER_CONFIRMED';
                break;
              case 'PREPARING':
                title = '🔥 Pedido em Preparo!';
                message = `Seu pedido #${shortId} começou a ser preparado com segurança.`;
                type = 'PREPARING';
                break;
              case 'READY_FOR_PICKUP':
                title = '📦 Pedido Pronto!';
                message = `Seu pedido #${shortId} está pronto para retirada.`;
                type = 'READY';
                break;
              case 'OUT_FOR_DELIVERY':
                title = '🛵 Saiu para Entrega!';
                message = `O entregador está a caminho com seu pedido #${shortId}.`;
                type = 'DELIVERY';
                break;
              case 'DELIVERED':
                title = '🏁 Pedido Entregue!';
                message = `Seu pedido #${shortId} foi entregue com sucesso. Bom apetite!`;
                type = 'DELIVERED';
                break;
              case 'CANCELLED':
                title = '❌ Pedido Cancelado';
                message = `O pedido #${shortId} foi cancelado.`;
                type = 'CANCELLED';
                break;
            }

            addNotification({
              orderId: payload.orderId,
              title,
              message,
              targetUrl: '/orders',
              type,
            });

            toast.info(message, `${title} 🔔`);
          } else {
            // Notificação para o Parceiro (ex: novo pedido com pagamento na entrega ou cancelamento)
            if (payload.status === 'CONFIRMED') {
              const formattedTotal = Number(payload.totalAmount).toFixed(2).replace('.', ',');
              addNotification({
                orderId: payload.orderId,
                title: '💵 Novo Pedido na Entrega!',
                message: `Pedido #${shortId} (R$ ${formattedTotal}) confirmado para pagamento na entrega.`,
                targetUrl: '/partner/orders',
                type: 'NEW_ORDER',
              });
              toast.info(`Novo pedido na entrega recebido! #${shortId}`, 'Novo Pedido! 🔔');
            } else if (payload.status === 'CANCELLED') {
              addNotification({
                orderId: payload.orderId,
                title: '⚠️ Pedido Cancelado',
                message: `O pedido #${shortId} foi cancelado.`,
                targetUrl: '/partner/orders',
                type: 'CANCELLED',
              });
            }
          }
        } catch (err) {
          console.error('[NotificationContext] Erro ao parsear order:status_updated:', err);
        }
      });
    } catch {
      setIsConnected(false);
    }

    return () => {
      isCancelled = true;
      if (eventSource) eventSource.close();
      setIsConnected(false);
    };
  }, [isAuthenticated, token, userId, addNotification, toast]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAll,
        addNotification,
        isConnected,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
