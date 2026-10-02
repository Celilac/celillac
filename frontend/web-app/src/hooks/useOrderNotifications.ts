// frontend/web-app/src/hooks/useOrderNotifications.ts
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ordersApi, OrderNotificationDTO } from '@/api/orders';

export interface UseOrderNotificationsOptions {
  partnerId?: string;
  token?: string | null;
  enabled?: boolean;
  onPaymentConfirmed?: (payload: OrderNotificationDTO) => void;
  onStatusUpdated?: (payload: OrderNotificationDTO) => void;
  onPollSync?: () => void;
}

export interface UseOrderNotificationsReturn {
  isConnected: boolean;
  lastNotification: OrderNotificationDTO | null;
  error: string | null;
}

/**
 * Sintetizador harmônico via Web Audio API.
 * Emite um alerta sonoro suave ("Ding-dong") sem requerer download de arquivos de áudio externos.
 */
function playPaymentChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Primeiro tom suave (D5 - 587.33Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Segundo tom harmônico elevado (A5 - 880Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.18, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch (err) {
    // Silencia qualquer restrição de autoplay do navegador caso o usuário não tenha interagido com a tela
    console.debug('Aviso sonoro suprimido por política de autoplay do browser:', err);
  }
}

export function useOrderNotifications({
  partnerId,
  token,
  enabled = true,
  onPaymentConfirmed,
  onStatusUpdated,
  onPollSync,
}: UseOrderNotificationsOptions): UseOrderNotificationsReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<OrderNotificationDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Armazena callbacks em referências mutáveis para evitar reconexão de SSE a cada render
  const onPaymentConfirmedRef = useRef(onPaymentConfirmed);
  const onStatusUpdatedRef = useRef(onStatusUpdated);
  const onPollSyncRef = useRef(onPollSync);

  useEffect(() => {
    onPaymentConfirmedRef.current = onPaymentConfirmed;
  }, [onPaymentConfirmed]);

  useEffect(() => {
    onStatusUpdatedRef.current = onStatusUpdated;
  }, [onStatusUpdated]);

  useEffect(() => {
    onPollSyncRef.current = onPollSync;
  }, [onPollSync]);

  const handlePaymentConfirmed = useCallback((payload: OrderNotificationDTO) => {
    setLastNotification(payload);
    playPaymentChime();
    if (onPaymentConfirmedRef.current) {
      onPaymentConfirmedRef.current(payload);
    }
  }, []);

  const handleStatusUpdated = useCallback((payload: OrderNotificationDTO) => {
    setLastNotification(payload);
    if (onStatusUpdatedRef.current) {
      onStatusUpdatedRef.current(payload);
    }
  }, []);

  // Polling de resiliência: se o SSE estiver desconectado, consulta a cada 15s; se conectado, a cada 60s
  useEffect(() => {
    if (!enabled || !token || typeof window === 'undefined') return;

    const intervalMs = isConnected ? 60000 : 15000;
    const timer = setInterval(() => {
      if (onPollSyncRef.current) {
        onPollSyncRef.current();
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [enabled, token, isConnected]);

  useEffect(() => {
    if (!enabled || !token || typeof window === 'undefined') {
      setIsConnected(false);
      return;
    }

    const streamUrl = ordersApi.getOrderStreamUrl({
      partnerId: partnerId || undefined,
      token,
    });

    let eventSource: EventSource | null = null;
    let isCancelled = false;

    try {
      eventSource = new EventSource(streamUrl, { withCredentials: true });

      eventSource.onopen = () => {
        if (!isCancelled) {
          setIsConnected(true);
          setError(null);
        }
      };

      eventSource.onerror = (e) => {
        if (!isCancelled) {
          setIsConnected(false);
          // O navegador tenta reconectar automaticamente
          console.debug('Canal de eventos em tempo real desconectado temporariamente, aguardando reconexão...');
        }
      };

      eventSource.addEventListener('connected', () => {
        if (!isCancelled) {
          setIsConnected(true);
          setError(null);
        }
      });

      eventSource.addEventListener('order:payment_confirmed', (e: MessageEvent) => {
        if (isCancelled) return;
        try {
          const data: OrderNotificationDTO = JSON.parse(e.data);
          handlePaymentConfirmed(data);
        } catch (err) {
          console.error('Falha ao processar evento SSE order:payment_confirmed:', err);
        }
      });

      eventSource.addEventListener('order:status_updated', (e: MessageEvent) => {
        if (isCancelled) return;
        try {
          const data: OrderNotificationDTO = JSON.parse(e.data);
          handleStatusUpdated(data);
        } catch (err) {
          console.error('Falha ao processar evento SSE order:status_updated:', err);
        }
      });
    } catch (err: any) {
      if (!isCancelled) {
        setIsConnected(false);
        setError(err.message || 'Falha ao estabelecer conexão de stream');
      }
    }

    return () => {
      isCancelled = true;
      if (eventSource) {
        eventSource.close();
      }
      setIsConnected(false);
    };
  }, [enabled, token, partnerId, handlePaymentConfirmed, handleStatusUpdated]);

  return {
    isConnected,
    lastNotification,
    error,
  };
}
