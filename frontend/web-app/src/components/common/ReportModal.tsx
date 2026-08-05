'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { reportApi, ReportReason } from '@/api/reports';
import styles from '../../app/partner/partner.module.css';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: string;
  partnerId?: string;
  targetName?: string;
  onSuccess?: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  productId,
  partnerId,
  targetName = 'Item',
  onSuccess,
}) => {
  const { token, isAuthenticated } = useAuth();
  const [reason, setReason] = useState<string>(ReportReason.MISSING_ALLERGEN);
  const [details, setDetails] = useState('');
  const [isFoodSafetyRisk, setIsFoodSafetyRisk] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !token) {
      setError('Você precisa estar autenticado para enviar uma denúncia.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await reportApi.create(
        {
          productId,
          partnerId,
          reason,
          details: details.trim() || undefined,
          isFoodSafetyRisk,
        },
        token
      );
      setSuccessMsg(true);
      setTimeout(() => {
        setSuccessMsg(false);
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar denúncia.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.dialogOverlay}>
      <div className={styles.dialogCard} style={{ maxWidth: '540px' }}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle} style={{ color: 'var(--color-status-rejected)' }}>
            🚩 Denunciar {targetName}
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
          Notifique a equipe de moderação sobre informações incorretas ou riscos à saúde dos consumidores.
        </p>

        {error && (
          <div className={`${styles.alertBanner} ${styles.alertBannerDanger}`} style={{ marginBottom: '1rem' }}>
            <span>⚠️</span>
            <div>{error}</div>
          </div>
        )}

        {successMsg ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <span style={{ fontSize: '3rem' }}>✅</span>
            <h4 className={styles.partnerName} style={{ marginTop: '1rem' }}>
              Denúncia enviada com sucesso!
            </h4>
            <p className={styles.subtitle} style={{ marginTop: '0.5rem' }}>
              Nossa equipe de moderação revisará o relato com prioridade máxima.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className={styles.formGroup} style={{ marginBottom: 0 }}>
              <label className={styles.label}>Motivo da Denúncia</label>
              <select
                className={styles.select}
                value={reason}
                onChange={(e) => {
                  const val = e.target.value;
                  setReason(val);
                  if (
                    val === ReportReason.MISSING_ALLERGEN ||
                    val === ReportReason.WRONG_CROSS_CONTAMINATION
                  ) {
                    setIsFoodSafetyRisk(true);
                  }
                }}
              >
                <option value={ReportReason.MISSING_ALLERGEN}>
                  Omissão de Alérgenos ou Traços de Glúten
                </option>
                <option value={ReportReason.WRONG_CROSS_CONTAMINATION}>
                  Informação Incorreta de Contaminação Cruzada
                </option>
                <option value={ReportReason.INCORRECT_INGREDIENTS}>
                  Lista de Ingredientes Incorreta
                </option>
                <option value={ReportReason.OTHER}>Outro Motivo</option>
              </select>
            </div>

            <div className={styles.formGroup} style={{ marginBottom: 0 }}>
              <label className={styles.label}>Detalhes da Denúncia</label>
              <textarea
                className={styles.textarea}
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Descreva o ocorrido ou a divergência encontrada..."
              />
            </div>

            <div className={`${styles.alertBanner} ${styles.alertBannerWarning}`}>
              <span>⚠️</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: 'var(--text-label)' }}>
                <input
                  type="checkbox"
                  checked={isFoodSafetyRisk}
                  onChange={(e) => setIsFoodSafetyRisk(e.target.checked)}
                />
                Esta denúncia envolve risco direto de segurança alimentar (prioridade máxima na moderação).
              </label>
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
                disabled={loading}
                className={`${styles.btn} ${styles.btnDanger}`}
              >
                {loading ? 'Enviando...' : 'Enviar Denúncia'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
