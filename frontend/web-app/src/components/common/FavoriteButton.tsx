'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { favoriteApi } from '@/api/favorites';

interface FavoriteButtonProps {
  productId?: string;
  partnerId?: string;
  initialIsFavorite?: boolean;
  onToggle?: (isFav: boolean) => void;
  showLabel?: boolean;
  className?: string;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  productId,
  partnerId,
  initialIsFavorite = false,
  onToggle,
  showLabel = true,
  className = '',
}) => {
  const { token, isAuthenticated } = useAuth();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (initialIsFavorite) {
      setIsFavorite(true);
      return;
    }
    if (!isAuthenticated || !token || (!productId && !partnerId)) return;

    favoriteApi.list(token)
      .then((favs) => {
        const isFav = favs.some((f) => (productId && f.productId === productId) || (partnerId && f.partnerId === partnerId));
        setIsFavorite(isFav);
      })
      .catch(() => {});
  }, [token, isAuthenticated, productId, partnerId, initialIsFavorite]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated || !token) {
      alert('Faça login para salvar favoritos.');
      return;
    }

    setLoading(true);
    try {
      if (isFavorite) {
        const targetId = productId || partnerId || '';
        await favoriteApi.remove(targetId, token);
        setIsFavorite(false);
        onToggle?.(false);
      } else {
        await favoriteApi.add({ productId, partnerId }, token);
        setIsFavorite(true);
        onToggle?.(true);
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('validar seu e-mail') || msg.includes('EMAIL_NOT_VERIFIED') || err.status === 403) {
        alert('É obrigatório validar seu endereço de e-mail com o código OTP antes de favoritar produtos e parceiros.');
      } else {
        alert(msg || 'Erro ao atualizar favorito.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      className={`btn ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.45rem 0.85rem',
        borderRadius: '999px',
        fontSize: '0.875rem',
        fontWeight: 600,
        cursor: loading ? 'wait' : 'pointer',
        transition: 'all 0.2s ease-in-out',
        background: isFavorite ? 'var(--color-danger-bg)' : 'var(--color-surface)',
        color: isFavorite ? 'var(--color-danger)' : 'var(--color-text)',
        border: isFavorite ? '1px solid var(--color-danger-border)' : '1px solid var(--color-border)',
        opacity: loading ? 0.6 : 1,
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={isFavorite ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          width: '18px',
          height: '18px',
          flexShrink: 0,
          transition: 'transform 0.2s ease',
          transform: isFavorite ? 'scale(1.1)' : 'scale(1)',
          color: isFavorite ? 'var(--color-danger)' : 'var(--color-text-muted)',
        }}
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
      {showLabel && (
        <span>{isFavorite ? 'Favoritado' : 'Favoritar'}</span>
      )}
    </button>
  );
};
