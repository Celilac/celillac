'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { favoriteApi, FavoriteDTO } from '@/api/favorites';
import styles from '../partner/partner.module.css';

export default function FavoritesPage() {
  const router = useRouter();
  const { token, isAuthenticated, isInitializing } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PRODUCTS' | 'PARTNERS'>('ALL');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isInitializing && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [mounted, isInitializing, isAuthenticated, router]);

  const fetchFavorites = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await favoriteApi.list(token);
      setFavorites(data);
    } catch (_) {
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchFavorites();
    }
  }, [isAuthenticated, token, fetchFavorites]);

  const handleRemove = async (targetId: string) => {
    if (!token) return;
    try {
      await favoriteApi.remove(targetId, token);
      setFavorites((prev) => prev.filter((f) => f.productId !== targetId && f.partnerId !== targetId));
    } catch (err: any) {
      alert(err.message || 'Erro ao remover favorito.');
    }
  };

  const filteredFavorites = favorites.filter((fav) => {
    if (activeTab === 'PRODUCTS') return !!fav.productId;
    if (activeTab === 'PARTNERS') return !!fav.partnerId;
    return true;
  });

  if (!mounted || isInitializing || loading) {
    return (
      <div className="profile-page">
        <Header />
        <main className={styles.container}>
          <p className="profile-loading" role="status">Carregando seus favoritos...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Header />

      <main className={styles.container}>
        {/* Header Area */}
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className={`${styles.badge} ${styles.badgeRejected}`}>❤️ Seus Salvos</span>
            </div>
            <h1 className={styles.title}>Meus Favoritos</h1>
            <p className={styles.subtitle}>
              Acesse rapidamente os estabelecimentos e produtos seguros salvos no seu perfil.
            </p>
          </div>

          {/* Tabs Filter */}
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--color-elevated)', padding: '0.35rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)' }}>
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`${styles.btn} ${activeTab === 'ALL' ? styles.btnPrimary : styles.btnSecondary}`}
              style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
            >
              Todos ({favorites.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PRODUCTS')}
              className={`${styles.btn} ${activeTab === 'PRODUCTS' ? styles.btnPrimary : styles.btnSecondary}`}
              style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
            >
              Produtos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PARTNERS')}
              className={`${styles.btn} ${activeTab === 'PARTNERS' ? styles.btnPrimary : styles.btnSecondary}`}
              style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
            >
              Parceiros
            </button>
          </div>
        </div>

        {/* Favorites Grid */}
        <div className={styles.grid}>
          {filteredFavorites.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>❤️</span>
              <h2>Nenhum favorito encontrado</h2>
              <p>Você ainda não salvou nenhum item nos favoritos. Explore o catálogo para salvar seus preferidos!</p>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => router.push('/dashboard')}
                style={{ marginTop: '1rem' }}
              >
                🔍 Explorar Produtos
              </button>
            </div>
          ) : (
            filteredFavorites.map((fav) => {
              const isPartner = !!fav.partnerId;
              const targetId = fav.partnerId || fav.productId || '';
              const title = fav.partner?.name || fav.product?.name || 'Item Favorito';
              const subtitle = isPartner
                ? `${fav.partner?.type === 'RESTAURANT' ? '🍽️ Restaurante/Lanchonete' : fav.partner?.type === 'MARKET' ? '🛒 Mercado/Empório' : '👩‍🍳 Produtor Artesanal'} • ${fav.partner?.city || 'Brasil'}`
                : fav.product?.brand ? `Marca: ${fav.product.brand}` : 'Sem marca informada';

              return (
                <section key={fav.id} className={styles.card}>
                  <div className={styles.cardContent}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className={`${styles.badge} ${isPartner ? styles.badgePending : styles.badgeApproved}`}>
                        {isPartner ? '🏢 Parceiro' : '📦 Produto'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemove(targetId)}
                        title="Remover dos favoritos"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '1.1rem',
                          color: 'var(--color-text-muted)',
                          padding: '0.25rem',
                        }}
                      >
                        🗑️
                      </button>
                    </div>

                    <h2 className={styles.partnerName} style={{ marginTop: '0.5rem' }}>
                      {title}
                    </h2>
                    <p className={styles.partnerDescription}>
                      {subtitle}
                    </p>

                    <div className={styles.partnerMeta}>
                      <span className={styles.metaItem}>
                        📅 Salvo em {new Date(fav.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  {isPartner && (
                    <div className={styles.cardActions} style={{ marginTop: '1rem' }}>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        style={{ flex: 1 }}
                        onClick={() => router.push(`/public-partners/${fav.partnerId}`)}
                      >
                        🔍 Ver Perfil Completo
                      </button>
                    </div>
                  )}
                </section>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
