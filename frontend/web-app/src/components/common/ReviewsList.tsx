'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { reviewApi, ReviewDTO } from '@/api/reviews';
import { ReviewModal } from './ReviewModal';
import styles from '../../app/partner/partner.module.css';

interface ReviewsListProps {
  productId?: string;
  partnerId?: string;
  targetName?: string;
}

export const ReviewsList: React.FC<ReviewsListProps> = ({
  productId,
  partnerId,
  targetName,
}) => {
  const [reviews, setReviews] = useState<ReviewDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      let data: any = null;
      if (productId) {
        data = await reviewApi.getByProduct(productId);
      } else if (partnerId) {
        data = await reviewApi.getByPartner(partnerId);
      }

      if (Array.isArray(data)) {
        setReviews(data);
      } else if (data && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
      } else {
        setReviews([]);
      }
    } catch (_) {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [productId, partnerId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const safeReviews = Array.isArray(reviews) ? reviews : [];

  const averageRating =
    safeReviews.length > 0
      ? (safeReviews.reduce((acc, r) => acc + r.rating, 0) / safeReviews.length).toFixed(1)
      : '0.0';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
        <div>
          <h4 className={styles.sectionTitle} style={{ marginBottom: '0.25rem' }}>
            💬 Avaliações da Comunidade
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--text-body)', color: 'var(--color-text-muted)' }}>
            <span style={{ fontSize: '1.25rem', color: '#f59e0b' }}>⭐</span>
            <strong style={{ fontSize: '1.25rem', color: 'var(--color-text)' }}>{averageRating}</strong>
            <span>({safeReviews.length} {safeReviews.length === 1 ? 'avaliação' : 'avaliações'})</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={`${styles.btn} ${styles.btnPrimary}`}
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
        >
          ✍️ Avaliar
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem 0', fontSize: 'var(--text-body)' }}>
          Carregando avaliações...
        </p>
      ) : safeReviews.length === 0 ? (
        <div className={styles.emptyState} style={{ padding: '2rem 1rem' }}>
          <span className={styles.emptyIcon}>⭐</span>
          <p style={{ fontSize: 'var(--text-body)' }}>Nenhuma avaliação enviada ainda. Seja o primeiro a avaliar!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '320px', overflowY: 'auto' }}>
          {safeReviews.map((rev) => (
            <div
              key={rev.id}
              style={{
                padding: '1rem',
                background: 'var(--color-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: '#f59e0b', fontSize: '0.9rem' }}>
                  {'⭐'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                </div>
                <span style={{ fontSize: 'var(--text-label)', color: 'var(--color-text-muted)' }}>
                  {new Date(rev.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
              {rev.comment && (
                <p style={{ fontSize: 'var(--text-body)', color: 'var(--color-text)', fontStyle: 'italic', margin: 0 }}>
                  &ldquo;{rev.comment}&rdquo;
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <ReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productId={productId}
        partnerId={partnerId}
        targetName={targetName}
        onSuccess={fetchReviews}
      />
    </div>
  );
};
