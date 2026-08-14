'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { reviewApi } from '@/api/reviews';
import { apiClient } from '@/api/client';
import styles from '../../app/partner/partner.module.css';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: string;
  partnerId?: string;
  targetName?: string;
  onSuccess?: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  productId,
  partnerId,
  targetName = 'Item',
  onSuccess,
}) => {
  const { token, userId, isAuthenticated } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(true);

  React.useEffect(() => {
    if (!isOpen || !token || !isAuthenticated) return;

    apiClient.get<any>('/iam/me', token)
      .then((user) => {
        if (user && user.isEmailVerified === false) {
          setIsEmailVerified(false);
        } else {
          setIsEmailVerified(true);
        }
      })
      .catch(() => {});
  }, [isOpen, token, isAuthenticated]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !token) {
      setError('Você precisa estar autenticado para enviar uma avaliação.');
      return;
    }

    if (!isEmailVerified) {
      setError('É obrigatório validar seu endereço de e-mail com o código OTP antes de enviar avaliações.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await reviewApi.submit(
        {
          userId: userId || undefined,
          productId,
          partnerId,
          rating,
          comment: comment.trim() || undefined,
        },
        token
      );
      setComment('');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar avaliação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.dialogOverlay}>
      <div className={styles.dialogCard} style={{ maxWidth: '480px' }}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            ⭐ Avaliar {targetName}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--color-text-muted)' }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
          Compartilhe sua experiência de segurança alimentar com a comunidade CeLiLac.
        </p>

        {!isEmailVerified && (
          <div className={`${styles.alertBanner} ${styles.alertBannerWarning}`} style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📩</span>
              <div>
                <strong>E-mail não verificado:</strong> Valide sua conta para habilitar avaliações.
              </div>
            </div>
            <Link
              href="/auth/verify-email"
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#ffffff',
                background: 'var(--color-warning, #f59e0b)',
                padding: '4px 10px',
                borderRadius: '6px',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Validar Agora
            </Link>
          </div>
        )}

        {error && (
          <div className={`${styles.alertBanner} ${styles.alertBannerDanger}`} style={{ marginBottom: '1rem' }}>
            <span>⚠️</span>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label className={styles.label} style={{ marginBottom: '0.5rem', display: 'block' }}>
              Sua Nota (1 a 5 estrelas)
            </label>
            <div
              style={{ display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}
              onMouseLeave={() => setHoverRating(0)}
            >
              {[1, 2, 3, 4, 5].map((star) => {
                const active = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    aria-label={`${star} estrelas`}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '2rem',
                      width: '42px',
                      height: '42px',
                      padding: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1,
                      filter: active ? 'none' : 'grayscale(100%) opacity(30%)',
                      transition: 'filter 0.15s ease',
                      userSelect: 'none',
                    }}
                  >
                    ⭐
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.formGroup} style={{ marginBottom: 0 }}>
            <label className={styles.label}>Comentário (opcional)</label>
            <textarea
              className={styles.textarea}
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Descreva detalhes sobre a qualidade, atendimento ou rotulagem..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              className={`${styles.btn} ${styles.btnSecondary}`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !isEmailVerified}
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              {loading ? 'Enviando...' : !isEmailVerified ? 'Validação necessária' : 'Enviar Avaliação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
