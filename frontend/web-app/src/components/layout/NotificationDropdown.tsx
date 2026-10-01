'use client';
// frontend/web-app/src/components/layout/NotificationDropdown.tsx
import React, { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications, AppNotification } from '@/contexts/NotificationContext';
import styles from './notification-dropdown.module.css';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffSec < 60) return 'agora';
    if (diffMin < 60) return `há ${diffMin} min`;
    if (diffHour < 24) return `há ${diffHour}h`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function getIconForType(type: AppNotification['type']): string {
  switch (type) {
    case 'NEW_ORDER':
      return '🍳';
    case 'ORDER_CONFIRMED':
      return '✅';
    case 'PREPARING':
      return '🔥';
    case 'READY':
      return '📦';
    case 'DELIVERY':
      return '🛵';
    case 'DELIVERED':
      return '🏁';
    case 'CANCELLED':
      return '❌';
    default:
      return '🔔';
  }
}

export function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, isConnected } = useNotifications();

  // Fecha o dropdown ao clicar fora ou apertar ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNotificationClick = (notif: AppNotification) => {
    markAsRead(notif.id);
    onClose();
    if (notif.targetUrl) {
      router.push(notif.targetUrl);
    }
  };

  return (
    <div ref={dropdownRef} className={styles.dropdownContainer}>
      <div className={styles.dropdownHeader}>
        <div className={styles.titleArea}>
          <h3 className={styles.title}>Notificações</h3>
          {unreadCount > 0 && <span className={styles.unreadPill}>{unreadCount} novas</span>}
        </div>
        {unreadCount > 0 && (
          <button type="button" className={styles.markAllBtn} onClick={markAllAsRead}>
            Marcar lidas
          </button>
        )}
      </div>

      <div className={styles.notificationsList}>
        {notifications.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔔</div>
            <p className={styles.emptyText}>Nenhuma notificação no momento.</p>
            <small style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.25rem', display: 'block' }}>
              Atualizações de pedidos e entregas aparecerão aqui em tempo real.
            </small>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`${styles.notificationItem} ${!notif.read ? styles.notificationItemUnread : ''}`}
              onClick={() => handleNotificationClick(notif)}
              role="button"
              tabIndex={0}
            >
              <div className={styles.iconBox}>{getIconForType(notif.type)}</div>
              <div className={styles.contentBox}>
                <div className={styles.notifTitle}>
                  <span>{notif.title}</span>
                  {!notif.read && <span className={styles.unreadDot} />}
                </div>
                <p className={styles.notifMessage}>{notif.message}</p>
                <div className={styles.notifTime}>{formatRelativeTime(notif.timestamp)}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className={styles.dropdownFooter}>
        <div className={styles.statusIndicator}>
          <span className={isConnected ? styles.statusDotActive : styles.statusDotInactive} />
          <span>{isConnected ? 'Tempo real ativo' : 'Desconectado'}</span>
        </div>
        {notifications.length > 0 && (
          <button type="button" className={styles.clearBtn} onClick={clearAll}>
            Limpar tudo
          </button>
        )}
      </div>
    </div>
  );
}
