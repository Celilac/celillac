'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { favoriteApi } from '@/api/favorites';

interface FavoriteButtonProps {
  productId?: string;
  partnerId?: string;
  initialIsFavorite?: boolean;
  onToggle?: (isFav: boolean) => void;
  className?: string;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  productId,
  partnerId,
  initialIsFavorite = false,
  onToggle,
  className = '',
}) => {
  const { token, isAuthenticated } = useAuth();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [loading, setLoading] = useState(false);

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
      alert(err.message || 'Erro ao atualizar favorito.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      className={`inline-flex items-center justify-center p-2 rounded-full transition-all duration-200 ${
        isFavorite
          ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
          : 'bg-gray-100 text-gray-400 hover:text-red-500 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
      } ${loading ? 'opacity-50 cursor-wait' : ''} ${className}`}
    >
      <svg
        width="20"
        height="20"
        style={{ width: '20px', height: '20px' }}
        className={`transition-transform duration-200 shrink-0 ${
          isFavorite ? 'fill-current scale-110' : 'scale-100'
        }`}
        viewBox="0 0 24 24"
        fill={isFavorite ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    </button>
  );
};
