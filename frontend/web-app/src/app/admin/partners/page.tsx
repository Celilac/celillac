'use client';
// frontend/web-app/src/app/admin/partners/page.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { partnerApi, PartnerSummary } from '@/api/partner';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/useToast';
import { HttpError } from '@/api/client';
import styles from '../../partner/partner.module.css';

export default function AdminPartnersPage() {
  const { token, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const toast = useToast();

  const [partners, setPartners] = useState<PartnerSummary[]>([]);
  const [loading,  setLoading]  = useState(true);
  
  // Controle de diálogos de ação
  const [activePartner, setActivePartner] = useState<PartnerSummary | null>(null);
  const [actionType,     setActionType]     = useState<'REJECT' | 'SUSPEND' | null>(null);
  const [reason,         setReason]         = useState('');
  const [updating,       setUpdating]       = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.push('/auth/login');
      return;
    }

    partnerApi.listAdminPartners(token)
      .then((data) => setPartners(data))
      .catch((err) => {
        toast.error(
          err instanceof HttpError ? err.message : 'Erro ao listar parceiros para administração.',
          'Erro'
        );
        router.push('/');
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, token, router, toast]);

  async function handleApprove(id: string) {
    if (!token) return;
    setUpdating(true);
    try {
      await partnerApi.approve(id, token);
      setPartners((prev) => prev.map((p) => p.id === id ? { ...p, approvalStatus: 'APPROVED', rejectionReason: undefined, suspensionReason: undefined } : p));
      toast.success('Parceiro aprovado com sucesso!');
    } catch (err) {
      toast.error(err instanceof HttpError ? err.message : 'Erro ao aprovar parceiro.', 'Erro');
    } finally {
      setUpdating(false);
    }
  }

  async function handleReactivate(id: string) {
    if (!token) return;
    setUpdating(true);
    try {
      await partnerApi.reactivate(id, token);
      setPartners((prev) => prev.map((p) => p.id === id ? { ...p, approvalStatus: 'APPROVED', suspensionReason: undefined } : p));
      toast.success('Parceiro reativado com sucesso!');
    } catch (err) {
      toast.error(err instanceof HttpError ? err.message : 'Erro ao reativar parceiro.', 'Erro');
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
    } catch (err) {
      toast.error(err instanceof HttpError ? err.message : 'Erro ao executar ação.', 'Erro');
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

  if (loading) {
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
      <header className="topbar">
        <span className="topbar-title brand-lockup" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
          <Image src="/brand/logo_with_transparent_background.png" alt="CeliLac" width={32} height={32} priority />
          <span className="brand-wordmark">Celi<span>Lac</span></span>
          <span className="brand-tagline">Painel Administrativo</span>
        </span>
        <nav className="topbar-actions">
          <button type="button" onClick={toggleTheme} className="btn btn-ghost theme-button" aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </nav>
      </header>

      <main className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>Moderação de Parceiros</h1>
            <p className={styles.subtitle}>Avalie novos cadastros e aplique suspensões de segurança no ecossistema.</p>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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
                    <p style={{ fontSize: '0.8rem', color: '#f87171', background: 'rgba(239,68,68,0.05)', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.1)' }}>
                      <strong>Motivo Rejeição:</strong> {partner.rejectionReason}
                    </p>
                  )}

                  {partner.approvalStatus === 'SUSPENDED' && partner.suspensionReason && (
                    <p style={{ fontSize: '0.8rem', color: '#a78bfa', background: 'rgba(139,92,246,0.05)', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(139,92,246,0.1)' }}>
                      <strong>Motivo Suspensão:</strong> {partner.suspensionReason}
                    </p>
                  )}
                </div>

                <div className={styles.cardActions} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
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
                    <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontStyle: 'italic' }}>
                      Rascunho: Aguardando envio pelo parceiro.
                    </span>
                  )}
                </div>
              </section>
            ))
          )}
        </div>

        {/* Modal de Justificativa */}
        {actionType && activePartner && (
          <div className={styles.dialogOverlay}>
            <div className={styles.dialogCard}>
              <h2 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '0.75rem' }}>
                {actionType === 'REJECT' ? 'Rejeitar Cadastro' : 'Suspender Estabelecimento'}
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '1.25rem' }}>
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
