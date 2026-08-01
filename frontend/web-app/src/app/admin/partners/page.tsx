'use client';
// frontend/web-app/src/app/admin/partners/page.tsx
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { partnerApi, PartnerSummary } from '@/api/partner';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { HttpError } from '@/api/client';
import { Header } from '@/components/layout/Header';
import styles from '../../partner/partner.module.css';

export default function AdminPartnersPage() {
  const { token, isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [partners, setPartners] = useState<PartnerSummary[]>([]);
  const [loading,  setLoading]  = useState(true);
  
  // Controle de diálogos de ação e detalhes
  const [activePartner, setActivePartner] = useState<PartnerSummary | null>(null);
  const [detailPartner, setDetailPartner] = useState<PartnerSummary | null>(null);
  const [actionType,    setActionType]    = useState<'REJECT' | 'SUSPEND' | null>(null);
  const [reason,        setReason]        = useState('');
  const [updating,      setUpdating]      = useState(false);

  const detailCloseRef = useRef<HTMLButtonElement>(null);
  const reasonCancelRef = useRef<HTMLButtonElement>(null);

  // Foco inicial e fechar com Escape — os dois diálogos de moderação
  // precisam de semântica de modal (WCAG 2.4.3 / 4.1.2).
  useEffect(() => {
    if (detailPartner) detailCloseRef.current?.focus();
  }, [detailPartner]);

  useEffect(() => {
    if (actionType) reasonCancelRef.current?.focus();
  }, [actionType]);

  useEffect(() => {
    if (!detailPartner && !actionType) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (detailPartner) setDetailPartner(null);
      if (actionType) closeModal();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [detailPartner, actionType]);

  useEffect(() => {
    if (isInitializing) return;

    if (!isAuthenticated || !token) {
      router.push('/auth/login');
      return;
    }

    partnerApi.listAdminPartners(token)
      .then((data) => setPartners(data))
      .catch((err) => {
        const msg = (err instanceof HttpError || err?.message) ? err.message : 'Erro ao listar parceiros para administração.';
        toast.error(msg, 'Erro');
        router.push('/');
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, token, isInitializing, router, toast]);

  async function handleApprove(id: string) {
    if (!token) return;
    setUpdating(true);
    try {
      await partnerApi.approve(id, token);
      setPartners((prev) => prev.map((p) => p.id === id ? { ...p, approvalStatus: 'APPROVED', rejectionReason: undefined, suspensionReason: undefined, operationalStatus: 'ACTIVE' } : p));
      if (detailPartner?.id === id) {
        setDetailPartner((prev) => prev ? { ...prev, approvalStatus: 'APPROVED', operationalStatus: 'ACTIVE' } : null);
      }
      toast.success('Parceiro aprovado com sucesso!');
    } catch (err: any) {
      const msg = (err instanceof HttpError || err?.message) ? err.message : 'Erro ao aprovar parceiro.';
      toast.error(msg, 'Erro');
    } finally {
      setUpdating(false);
    }
  }

  async function handleReactivate(id: string) {
    if (!token) return;
    setUpdating(true);
    try {
      await partnerApi.reactivate(id, token);
      setPartners((prev) => prev.map((p) => p.id === id ? { ...p, approvalStatus: 'APPROVED', suspensionReason: undefined, operationalStatus: 'ACTIVE' } : p));
      if (detailPartner?.id === id) {
        setDetailPartner((prev) => prev ? { ...prev, approvalStatus: 'APPROVED', operationalStatus: 'ACTIVE' } : null);
      }
      toast.success('Parceiro reativado com sucesso!');
    } catch (err: any) {
      const msg = (err instanceof HttpError || err?.message) ? err.message : 'Erro ao reativar parceiro.';
      toast.error(msg, 'Erro');
    } finally {
      setUpdating(false);
    }
  }

  async function handleReasonActionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !activePartner || !actionType) return;
    if (!reason.trim()) {
      toast.warning('O preenchimento do motivo é obrigatório.');
      return;
    }

    setUpdating(true);
    try {
      if (actionType === 'REJECT') {
        await partnerApi.reject(activePartner.id, reason, token);
        setPartners((prev) => prev.map((p) => p.id === activePartner.id ? { ...p, approvalStatus: 'REJECTED', rejectionReason: reason } : p));
        toast.success('Parceiro rejeitado.');
      } else {
        await partnerApi.suspend(activePartner.id, reason, token);
        setPartners((prev) => prev.map((p) => p.id === activePartner.id ? { ...p, approvalStatus: 'SUSPENDED', suspensionReason: reason, operationalStatus: 'INACTIVE' } : p));
        toast.success('Parceiro suspenso.');
      }
      closeModal();
      setDetailPartner(null);
    } catch (err: any) {
      const msg = (err instanceof HttpError || err?.message) ? err.message : 'Erro ao executar ação.';
      toast.error(msg, 'Erro');
    } finally {
      setUpdating(false);
    }
  }

  function openModal(partner: PartnerSummary, type: 'REJECT' | 'SUSPEND') {
    setActivePartner(partner);
    setActionType(type);
    setReason('');
  }

  function closeModal() {
    setActivePartner(null);
    setActionType(null);
    setReason('');
  }

  if (loading || isInitializing) {
    return (
      <div className={styles.container}>
        <p className="profile-loading" role="status">Carregando painel de moderação…</p>
      </div>
    );
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className={`${styles.badge} ${styles.badgeApproved}`}>Aprovado</span>;
      case 'PENDING_REVIEW':
        return <span className={`${styles.badge} ${styles.badgePending}`}>Pendente de Revisão</span>;
      case 'REJECTED':
        return <span className={`${styles.badge} ${styles.badgeRejected}`}>Rejeitado</span>;
      case 'SUSPENDED':
        return <span className={`${styles.badge} ${styles.badgeSuspended}`}>Suspenso</span>;
      default:
        return <span className={`${styles.badge} ${styles.badgeDraft}`}>Rascunho</span>;
    }
  };

  return (
    <div className="profile-page">
      <Header />

      <main className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>Moderação de Parceiros</h1>
            <p className={styles.subtitle}>Gerencie cadastros de fornecedores, aprove estabelecimentos e garanta a conformidade da plataforma.</p>
          </div>
        </div>

        <div className={styles.grid}>
          {partners.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🛡️</span>
              <h2>Nenhum parceiro comercial cadastrado no sistema</h2>
            </div>
          ) : (
            partners.map((partner) => (
              <section key={partner.id} className={styles.card}>
                <div className={styles.cardContent}>
<<<<<<< HEAD
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
=======
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
>>>>>>> develop
                    <h2 className={styles.partnerName}>{partner.name}</h2>
                    {getStatusLabel(partner.approvalStatus)}
                  </div>
                  <p className={styles.partnerDescription}>{partner.description || 'Sem descrição cadastrada.'}</p>
                  
                  <div className={styles.partnerMeta}>
                    <span className={styles.metaItem}>📍 {partner.city ? `${partner.city} - ${partner.state}` : 'Sem cidade'}</span>
                    <span className={styles.metaItem}>📞 {partner.phone}</span>
                    <span className={styles.metaItem}>💼 {partner.type}</span>
                  </div>

                  {partner.approvalStatus === 'REJECTED' && partner.rejectionReason && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-status-rejected)', background: 'rgba(248,113,113,0.08)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(248,113,113,0.2)' }}>
                      <strong>Motivo Rejeição:</strong> {partner.rejectionReason}
                    </p>
                  )}

                  {partner.approvalStatus === 'SUSPENDED' && partner.suspensionReason && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-status-suspended)', background: 'rgba(167,139,250,0.08)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(167,139,250,0.2)' }}>
                      <strong>Motivo Suspensão:</strong> {partner.suspensionReason}
                    </p>
                  )}
                </div>

                <div className={styles.cardActions} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnSecondary}`}
                    style={{ flex: '1 1 100%', marginBottom: '0.25rem' }}
                    onClick={() => setDetailPartner(partner)}
                  >
                    👁️ Ver Detalhes do Parceiro
                  </button>

                  {partner.approvalStatus === 'PENDING_REVIEW' && (
                    <>
                      <button 
                        type="button" 
                        className={`${styles.btn} ${styles.btnPrimary}`} 
                        style={{ flex: 1 }}
                        onClick={() => handleApprove(partner.id)}
                        disabled={updating}
                        id={`approve-${partner.id}`}
                      >
                        ✔️ Aprovar
                      </button>
                      <button 
                        type="button" 
                        className={`${styles.btn} ${styles.btnDanger}`} 
                        style={{ flex: 1 }}
                        onClick={() => openModal(partner, 'REJECT')}
                        disabled={updating}
                        id={`reject-${partner.id}`}
                      >
                        ❌ Rejeitar
                      </button>
                    </>
                  )}

                  {partner.approvalStatus === 'APPROVED' && (
                    <button 
                      type="button" 
                      className={`${styles.btn} ${styles.btnDanger}`} 
                      style={{ flex: 1 }}
                      onClick={() => openModal(partner, 'SUSPEND')}
                      disabled={updating}
                      id={`suspend-${partner.id}`}
                    >
                      🚫 Suspender Estabelecimento
                    </button>
                  )}

                  {partner.approvalStatus === 'SUSPENDED' && (
                    <button 
                      type="button" 
                      className={`${styles.btn} ${styles.btnPrimary}`} 
                      style={{ flex: 1 }}
                      onClick={() => handleReactivate(partner.id)}
                      disabled={updating}
                      id={`reactivate-${partner.id}`}
                    >
                      🔄 Reativar Cadastro
                    </button>
                  )}

                  {partner.approvalStatus === 'DRAFT' && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                      Rascunho: Aguardando envio pelo parceiro.
                    </span>
                  )}
                </div>
              </section>
            ))
          )}
        </div>

        {/* Modal de Visualização Completa de Detalhes com Design System Premium */}
        {detailPartner && (
          <div className={styles.dialogOverlay} onClick={() => setDetailPartner(null)}>
            <div
              className={styles.dialogCard}
              style={{ maxWidth: '640px', width: '90%' }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="detail-partner-heading"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <h2 id="detail-partner-heading" className={styles.modalTitle}>
                    🏬 {detailPartner.name}
                  </h2>
                  {getStatusLabel(detailPartner.approvalStatus)}
                </div>
                <button
                  type="button"
                  ref={detailCloseRef}
                  onClick={() => setDetailPartner(null)}
                  style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', opacity: 0.7 }}
                  aria-label="Fechar"
                >
                  ✖️
                </button>
              </div>

              <div className={styles.detailSection}>
                <div className={styles.detailBox}>
                  <span className={styles.detailLabel}>Descrição Comercial</span>
                  <p className={styles.detailValue} style={{ marginTop: '0.35rem', lineHeight: '1.6' }}>
                    {detailPartner.description || 'Nenhuma descrição comercial cadastrada.'}
                  </p>
                </div>

                <div className={styles.infoGrid}>
                  <div className={styles.detailGroup}>
                    <span className={styles.detailLabel}>CNPJ / Registro</span>
                    <p className={styles.detailValue}>{detailPartner.cnpj || 'Não informado (Pessoa Física)'}</p>
                  </div>
                  <div className={styles.detailGroup}>
                    <span className={styles.detailLabel}>Tipo de Fornecedor</span>
                    <p className={styles.detailValue}>{detailPartner.type}</p>
                  </div>
                  <div className={styles.detailGroup}>
                    <span className={styles.detailLabel}>Telefone de Contato</span>
                    <p className={styles.detailValue}>{detailPartner.phone}</p>
                  </div>
                  <div className={styles.detailGroup}>
                    <span className={styles.detailLabel}>Cidade / Estado</span>
                    <p className={styles.detailValue}>{detailPartner.city ? `${detailPartner.city} - ${detailPartner.state}` : 'Não informado'}</p>
                  </div>
                </div>

                <div className={styles.detailBox}>
                  <span className={styles.detailLabel}>📍 Endereço Completo</span>
                  <p className={styles.detailValue} style={{ marginTop: '0.25rem' }}>{detailPartner.address}</p>
                </div>

                <div className={styles.detailBox}>
                  <span className={styles.detailLabel}>🚚 Região de Atendimento / Entrega</span>
                  <p className={styles.detailValue} style={{ marginTop: '0.25rem' }}>{detailPartner.deliveryRegion || 'Local'}</p>
                </div>

                {detailPartner.rejectionReason && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '0.85rem', borderRadius: '12px', color: '#f87171' }}>
                    <strong style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Motivo da Rejeição:</strong>
                    <span>{detailPartner.rejectionReason}</span>
                  </div>
                )}

                {detailPartner.suspensionReason && (
                  <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', padding: '0.85rem', borderRadius: '12px', color: '#a78bfa' }}>
                    <strong style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Motivo da Suspensão:</strong>
                    <span>{detailPartner.suspensionReason}</span>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '1.75rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                {detailPartner.approvalStatus === 'PENDING_REVIEW' && (
                  <>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      onClick={() => handleApprove(detailPartner.id)}
                      disabled={updating}
                    >
                      ✔️ Aprovar Cadastro
                    </button>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnDanger}`}
                      onClick={() => openModal(detailPartner, 'REJECT')}
                      disabled={updating}
                    >
                      ❌ Rejeitar
                    </button>
                  </>
                )}

                <button
                  ref={detailCloseRef}
                  type="button"
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={() => setDetailPartner(null)}
                >
                  Fechar Detalhes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Justificativa */}
        {actionType && activePartner && (
          <div className={styles.dialogOverlay} onClick={closeModal}>
<<<<<<< HEAD
            <div
              className={styles.dialogCard}
              role="dialog"
              aria-modal="true"
              aria-labelledby="reason-modal-heading"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="reason-modal-heading" className={styles.partnerName} style={{ fontSize: 'var(--text-title)', marginBottom: '0.75rem' }}>
=======
            <div className={styles.dialogCard} onClick={(e) => e.stopPropagation()}>
              <h2 className={styles.modalTitle} style={{ marginBottom: '0.75rem' }}>
>>>>>>> develop
                {actionType === 'REJECT' ? 'Rejeitar Cadastro' : 'Suspender Estabelecimento'}
              </h2>
              <p style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
                {actionType === 'REJECT' 
                  ? `Forneça a justificativa para a rejeição do parceiro ${activePartner.name}. O responsável receberá essa orientação.` 
                  : `Forneça o motivo para a suspensão do parceiro ${activePartner.name}. A operação dele e exibição de produtos serão pausadas.`
                }
              </p>
              
              <form onSubmit={handleReasonActionSubmit}>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="modal-reason">Motivo / Justificativa *</label>
                  <textarea
                    id="modal-reason"
                    className={styles.textarea}
                    placeholder="Digite com clareza o motivo..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    disabled={updating}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button
                    ref={reasonCancelRef}
                    type="button"
                    className={`${styles.btn} ${styles.btnSecondary}`}
                    style={{ flex: 1 }}
                    onClick={closeModal}
                    disabled={updating}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className={`${styles.btn} ${styles.btnDanger}`} 
                    style={{ flex: 2 }}
                    disabled={updating}
                    id="confirm-modal-action-btn"
                  >
                    {updating ? 'Processando...' : 'Confirmar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
