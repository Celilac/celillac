'use client';
// frontend/web-app/src/app/admin/reports/page.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { apiClient, HttpError } from '@/api/client';
import { reportApi, ReportDTO, ReportReason } from '@/api/reports';
import { Header } from '@/components/layout/Header';
import {
  StatusDot,
  LockIcon,
  HomeIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  ClockIcon,
  SearchIcon,
  CheckCircleIcon,
  XCircleIcon,
  PackageIcon,
  UserIcon,
  StoreIcon,
  FileTextIcon,
  EyeIcon,
  CheckIcon,
  RefreshCwIcon,
  ScaleIcon,
  InfoIcon,
  ShoppingCartIcon,
} from '@/components/layout/icons';
import styles from '../../partner/partner.module.css';

interface ConfirmModalState {
  reportId: string;
  protocol: string;
  action: 'RESOLVE' | 'DISMISS' | 'IN_REVIEW' | 'REOPEN';
  targetStatus: string;
  title: string;
  description: string;
  isFoodSafetyRisk?: boolean;
}

export default function AdminReportsPage() {
  const { token, isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [reports, setReports] = useState<ReportDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');

  // Modal de Detalhes / Revisão
  const [detailReport, setDetailReport] = useState<ReportDTO | null>(null);
  const detailCloseRef = useRef<HTMLButtonElement>(null);

  // Modal de Confirmação de Ações Administrativas
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);
  const [adminJustification, setAdminJustification] = useState<string>('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Trava de Segurança de Acesso — Verifica papel no backend/IAM
  useEffect(() => {
    if (isInitializing) return;

    if (!isAuthenticated || !token) {
      router.replace('/auth/login');
      return;
    }

    apiClient.get<{ role?: string }>('/iam/me', token)
      .then((res) => {
        if (res?.role === 'ADMIN') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          toast.error('Acesso negado: Página restrita a Administradores.', '403 Proibido');
        }
      })
      .catch(() => {
        setIsAdmin(false);
      });
  }, [isAuthenticated, token, isInitializing, router, toast]);

  const fetchReports = useCallback(async () => {
    if (!token || isAdmin !== true) return;
    setLoading(true);
    try {
      const filters: { status?: string; isFoodSafetyRisk?: boolean } = {};
      if (statusFilter !== 'ALL') {
        filters.status = statusFilter;
      }
      if (riskFilter === 'RISK_ONLY') {
        filters.isFoodSafetyRisk = true;
      } else if (riskFilter === 'NO_RISK') {
        filters.isFoodSafetyRisk = false;
      }

      const data = await reportApi.listAdminReports(filters, token);
      setReports(data);
    } catch (err: any) {
      const msg = (err instanceof HttpError || err?.message) ? err.message : 'Erro ao listar denúncias alimentares.';
      toast.error(msg, 'Erro');
      if (err instanceof HttpError && (err.status === 401 || err.status === 403)) {
        setIsAdmin(false);
      }
    } finally {
      setLoading(false);
    }
  }, [token, isAdmin, statusFilter, riskFilter, toast]);

  useEffect(() => {
    if (isAdmin === true) {
      fetchReports();
    }
  }, [isAdmin, fetchReports]);

  // Acessibilidade no modal
  useEffect(() => {
    if (detailReport) {
      detailCloseRef.current?.focus();
    }
  }, [detailReport]);

  useEffect(() => {
    if (!detailReport && !confirmModal) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (confirmModal) {
          setConfirmModal(null);
        } else {
          setDetailReport(null);
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [detailReport, confirmModal]);

  function requestActionConfirmation(report: ReportDTO, action: 'RESOLVE' | 'DISMISS' | 'IN_REVIEW' | 'REOPEN') {
    setAdminJustification('');
    const protocol = `#${report.id.substring(0, 8)}`;
    const isOrderIncident = !!report.targetUserId || !!report.orderId;

    if (action === 'RESOLVE') {
      setConfirmModal({
        reportId: report.id,
        protocol,
        action: 'RESOLVE',
        targetStatus: 'RESOLVED',
        title: isOrderIncident
          ? `Aceitar Denúncia e Bloquear Pagamento na Entrega ${protocol}`
          : `Resolver Denúncia ${protocol}`,
        description: isOrderIncident
          ? 'Após avaliar as circunstâncias e averiguar a declaração da loja, você confirma o não pagamento? O consumidor será bloqueado para compras na entrega (podendo pagar apenas via PIX ou Cartão online).'
          : 'Confirma que a denúncia foi devidamente analisada e as providências cabíveis foram tomadas?',
        isFoodSafetyRisk: report.isFoodSafetyRisk,
      });
    } else if (action === 'DISMISS') {
      setConfirmModal({
        reportId: report.id,
        protocol,
        action: 'DISMISS',
        targetStatus: 'DISMISSED',
        title: isOrderIncident
          ? `Descartar Denúncia (Sem Bloqueio ao Consumidor) ${protocol}`
          : `Descartar Denúncia ${protocol}`,
        description: isOrderIncident
          ? 'A ocorrência da loja foi avaliada como improcedente ou inconclusiva. O consumidor NÃO sofrerá restrições de pagamento na entrega (e qualquer restrição anterior será liberada).'
          : 'Tem certeza que deseja descartar esta denúncia? O relato será arquivado como improcedente.',
        isFoodSafetyRisk: report.isFoodSafetyRisk,
      });
    } else if (action === 'IN_REVIEW') {
      setConfirmModal({
        reportId: report.id,
        protocol,
        action: 'IN_REVIEW',
        targetStatus: 'IN_REVIEW',
        title: `Iniciar Análise da Denúncia ${protocol}`,
        description: 'Deseja colocar esta denúncia em status de análise ativa pela moderação?',
        isFoodSafetyRisk: report.isFoodSafetyRisk,
      });
    } else if (action === 'REOPEN') {
      setConfirmModal({
        reportId: report.id,
        protocol,
        action: 'REOPEN',
        targetStatus: 'PENDING',
        title: `Reabrir Denúncia ${protocol}`,
        description: 'Deseja reabrir esta denúncia previamente encerrada? O status retornará para Pendente para novas averiguações.',
        isFoodSafetyRisk: report.isFoodSafetyRisk,
      });
    }
  }

  async function handleConfirmAction() {
    if (!confirmModal || !token) return;
    setUpdating(true);
    try {
      const updated = await reportApi.reviewReport(
        confirmModal.reportId,
        confirmModal.targetStatus,
        token,
        adminJustification.trim() || undefined
      );

      setReports((prev) => prev.map((r) => (r.id === confirmModal.reportId ? updated : r)));
      if (detailReport?.id === confirmModal.reportId) {
        setDetailReport(updated);
      }

      let actionLabel = 'atualizada';
      if (confirmModal.action === 'IN_REVIEW') actionLabel = 'colocada em análise';
      if (confirmModal.action === 'RESOLVE') actionLabel = 'resolvida com sucesso';
      if (confirmModal.action === 'DISMISS') actionLabel = 'descartada';
      if (confirmModal.action === 'REOPEN') actionLabel = 'reaberta com sucesso';

      toast.success(`Denúncia ${actionLabel}!`, 'Status Atualizado');
      setConfirmModal(null);
      setAdminJustification('');
    } catch (err: any) {
      const msg = (err instanceof HttpError || err?.message) ? err.message : 'Erro ao atualizar status da denúncia.';
      toast.error(msg, 'Erro');
    } finally {
      setUpdating(false);
    }
  }

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case ReportReason.MISSING_ALLERGEN:
        return 'Alérgeno Não Declarado / Omitido';
      case ReportReason.WRONG_CROSS_CONTAMINATION:
        return 'Contaminação Cruzada Incorreta';
      case ReportReason.INCORRECT_INGREDIENTS:
        return 'Ingredientes Divergentes';
      case ReportReason.CLIENT_REFUSED_PAYMENT:
        return 'Recusa de Pagamento na Entrega';
      case ReportReason.CLIENT_ABSENT:
        return 'Cliente Ausente no Local';
      case ReportReason.FRAUDULENT_ORDER:
        return 'Pedido Fraudulento / Trote';
      case ReportReason.ADDRESS_UNREACHABLE:
        return 'Endereço Inacessível / Incorreto';
      case ReportReason.CLIENT_REQUESTED_CANCELLATION:
        return 'Cancelamento Solicitado pelo Cliente';
      case ReportReason.OUT_OF_STOCK:
        return 'Item Esgotado no Restaurante';
      case ReportReason.OTHER:
      default:
        return 'Outra Ocorrência';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className={`${styles.badge} ${styles.badgePending}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <StatusDot color="yellow" size={7} /> Pendente
          </span>
        );
      case 'IN_REVIEW':
        return (
          <span className={`${styles.badge}`} style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <StatusDot color="blue" size={7} /> Em Análise
          </span>
        );
      case 'RESOLVED':
        return (
          <span className={`${styles.badge} ${styles.badgeApproved}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <StatusDot color="green" size={7} /> Resolvida
          </span>
        );
      case 'DISMISSED':
        return (
          <span className={`${styles.badge} ${styles.badgeRejected}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <StatusDot color="red" size={7} /> Descartada
          </span>
        );
      default:
        return <span className={`${styles.badge} ${styles.badgeDraft}`}>{status}</span>;
    }
  };

  if (!mounted || !isAuthenticated) {
    return (
      <div className="profile-page">
        <Header />
      </div>
    );
  }

  if (isInitializing || (isAdmin === null && loading)) {
    return (
      <div className="profile-page">
        <Header />
        <main className={styles.container}>
          <p className="profile-loading" role="status">Verificando permissões de acesso ao painel admin…</p>
        </main>
      </div>
    );
  }

  // TELA DE BLOQUEIO DE SEGURANÇA (403 FORBIDDEN / ACESSO NEGADO)
  if (isAdmin === false) {
    return (
      <div className="profile-page">
        <Header />
        <main className={styles.container} style={{ maxWidth: '650px', margin: '4rem auto', textAlign: 'center' }}>
          <div style={{
            background: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger-border)',
            padding: '2.5rem 2rem',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <LockIcon size={52} style={{ color: 'var(--color-danger)' }} />
            </div>
            <h1 style={{ color: 'var(--color-danger)', fontSize: '1.75rem', marginBottom: '0.75rem' }}>
              Acesso Negado (403 Forbidden)
            </h1>
            <p style={{ color: 'var(--color-text)', fontSize: '1rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              Esta página é estritamente reservada aos Administradores do CeLiLac. Sua conta não possui os privilégios necessários para visualizar ou gerenciar denúncias alimentares.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Link href="/dashboard" className="btn btn-em" style={{ padding: '0.65rem 1.5rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <HomeIcon size={16} /> Voltar ao Dashboard
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Estatísticas Rápidas
  const totalCount = reports.length;
  const riskCount = reports.filter((r) => r.isFoodSafetyRisk).length;
  const pendingCount = reports.filter((r) => r.status === 'PENDING').length;
  const inReviewCount = reports.filter((r) => r.status === 'IN_REVIEW').length;
  const resolvedCount = reports.filter((r) => r.status === 'RESOLVED').length;

  return (
    <div className="profile-page">
      <Header />

      <main className={styles.container}>
        {/* Cabeçalho Principal (Operate Mode Impeccable) */}
        <div className={styles.header} style={{ marginBottom: '1.5rem' }}>
          <div className={styles.titleArea}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span className={`${styles.badge}`} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheckIcon size={14} /> Painel de Segurança Alimentar
              </span>
            </div>
            <h1 className={styles.title}>Moderação de Denúncias Alimentares</h1>
            <p className={styles.subtitle}>
              Monitore relatos da comunidade, priorize riscos de alérgenos (RN-CONSUMER-15) e mantenha a integridade do catálogo CeLiLac.
            </p>
          </div>
        </div>

        {/* Métricas KPI (Cards de Visão Geral) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '1rem 1.25rem', borderRadius: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>TOTAL REGISTRADO</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '0.2rem' }}>{totalCount}</div>
          </div>

          <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '1rem 1.25rem', borderRadius: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <AlertTriangleIcon size={13} /> RISCO ALIMENTAR (RN-15)
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f87171', marginTop: '0.2rem' }}>{riskCount}</div>
          </div>

          <div style={{ background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.25)', padding: '1rem 1.25rem', borderRadius: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: '#eab308', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <ClockIcon size={13} /> PENDENTES
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#eab308', marginTop: '0.2rem' }}>{pendingCount}</div>
          </div>

          <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', padding: '1rem 1.25rem', borderRadius: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <SearchIcon size={13} /> EM ANÁLISE
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3b82f6', marginTop: '0.2rem' }}>{inReviewCount}</div>
          </div>

          <div style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)', padding: '1rem 1.25rem', borderRadius: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: '#22c55e', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <CheckCircleIcon size={13} /> RESOLVIDAS
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#22c55e', marginTop: '0.2rem' }}>{resolvedCount}</div>
          </div>
        </div>

        {/* Barra de Filtros Estilizada */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          background: 'var(--color-surface)',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
        }}>
          {/* Tab Filter de Status */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'Todas' },
              { id: 'PENDING', label: 'Pendentes', icon: <ClockIcon size={13} /> },
              { id: 'IN_REVIEW', label: 'Em Análise', icon: <SearchIcon size={13} /> },
              { id: 'RESOLVED', label: 'Resolvidas', icon: <CheckCircleIcon size={13} /> },
              { id: 'DISMISSED', label: 'Descartadas', icon: <XCircleIcon size={13} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`${styles.btn} ${statusFilter === tab.id ? styles.btnPrimary : styles.btnSecondary}`}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Toggle de Risco Alimentar */}
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setRiskFilter(riskFilter === 'RISK_ONLY' ? 'ALL' : 'RISK_ONLY')}
              className={`${styles.btn}`}
              style={{
                padding: '0.45rem 0.85rem',
                fontSize: '0.85rem',
                borderRadius: '999px',
                background: riskFilter === 'RISK_ONLY' ? 'rgba(239, 68, 68, 0.2)' : 'var(--color-elevated)',
                color: riskFilter === 'RISK_ONLY' ? '#f87171' : 'var(--color-text)',
                border: riskFilter === 'RISK_ONLY' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--color-border)',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <AlertTriangleIcon size={14} /> {riskFilter === 'RISK_ONLY' ? 'Exibindo: Apenas Risco Alimentar' : 'Filtrar Risco Alimentar (RN-15)'}
            </button>
          </div>
        </div>

        {/* Grade de Cards de Denúncia */}
        {loading ? (
          <p className="profile-loading" role="status">Carregando registros de denúncias…</p>
        ) : (
          <div className={styles.grid}>
            {reports.length === 0 ? (
              <div className={styles.emptyState}>
                <ShieldCheckIcon size={44} style={{ color: 'var(--color-text-muted)' }} />
                <h2>Nenhuma denúncia encontrada</h2>
                <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                  Não há registros correspondentes aos filtros selecionados.
                </p>
              </div>
            ) : (
              reports.map((report) => {
                const isRisk = report.isFoodSafetyRisk;
                const borderAccent = isRisk
                  ? '#ef4444'
                  : report.status === 'PENDING'
                  ? '#eab308'
                  : report.status === 'IN_REVIEW'
                  ? '#3b82f6'
                  : report.status === 'RESOLVED'
                  ? '#22c55e'
                  : 'var(--color-border)';

                return (
                  <section
                    key={report.id}
                    className={styles.card}
                    style={{ borderLeft: `5px solid ${borderAccent}` }}
                  >
                    <div className={styles.cardContent}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <div>
                          <h2 className={styles.partnerName} style={{ fontSize: '1.15rem', margin: 0, color: 'var(--color-text)' }}>
                            {getReasonLabel(report.reason)}
                          </h2>
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                            Protocolo: <code>#{report.id.substring(0, 8)}</code> • {new Date(report.createdAt).toLocaleDateString('pt-BR')} às {new Date(report.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {getStatusBadge(report.status)}
                      </div>

                      {/* Flag de Risco Alimentar Prioritário (RN-CONSUMER-15) ou Ocorrência em Pedido */}
                      {isRisk ? (
                        <div style={{
                          marginTop: '0.85rem',
                          background: 'rgba(239, 68, 68, 0.12)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          padding: '0.55rem 0.85rem',
                          borderRadius: '8px',
                          color: '#f87171',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <AlertTriangleIcon size={16} /> ALERTA CRÍTICO: RISCO À SEGURANÇA ALIMENTAR
                          </span>
                        </div>
                      ) : report.targetUserId || report.orderId ? (
                        <div style={{
                          marginTop: '0.85rem',
                          background: 'rgba(234, 179, 8, 0.12)',
                          border: '1px solid rgba(234, 179, 8, 0.3)',
                          padding: '0.55rem 0.85rem',
                          borderRadius: '8px',
                          color: '#eab308',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <ShoppingCartIcon size={16} /> AUDITORIA DE NÃO PAGAMENTO / PEDIDO PRESENCIAL
                          </span>
                        </div>
                      ) : (
                        <div style={{
                          marginTop: '0.85rem',
                          background: 'var(--color-elevated)',
                          border: '1px solid var(--color-border)',
                          padding: '0.45rem 0.85rem',
                          borderRadius: '8px',
                          color: 'var(--color-text-muted)',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}>
                          <InfoIcon size={15} /> Denúncia Geral de Informações do Produto / Parceiro
                        </div>
                      )}

                      {/* Descrição informada */}
                      <div style={{
                        marginTop: '0.85rem',
                        background: 'var(--color-surface)',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                      }}>
                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                          {report.targetUserId || report.orderId ? 'Declaração da Loja / Parceiro Comercial:' : 'Relato do Consumidor:'}
                        </span>
                        <p style={{ margin: 0, fontSize: '0.925rem', color: 'var(--color-text)', lineHeight: '1.55', whiteSpace: 'pre-wrap' }}>
                          {report.details ? `"${report.details}"` : <em>Nenhuma observação textual foi fornecida.</em>}
                        </p>
                      </div>

                      {/* Metadados */}
                      <div className={styles.partnerMeta} style={{ marginTop: '0.85rem' }}>
                        {report.orderId && (
                          <span className={styles.metaItem}>
                            <PackageIcon size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                            <strong>Pedido:</strong> <code>#{report.orderId.substring(0, 12)}…</code>
                          </span>
                        )}
                        {report.targetUserId && (
                          <span className={styles.metaItem}>
                            <UserIcon size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                            <strong>Consumidor Alvo:</strong> <code>{report.targetUserId.substring(0, 12)}…</code>
                          </span>
                        )}
                        {report.productId && (
                          <span className={styles.metaItem}>
                            <PackageIcon size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                            <strong>Produto ID:</strong>{' '}
                            <Link href={`/products/${report.productId}`} style={{ color: 'var(--color-emerald)', textDecoration: 'underline' }}>
                              {report.productId.substring(0, 12)}…
                            </Link>
                          </span>
                        )}
                        {report.partnerId && (
                          <span className={styles.metaItem}>
                            <StoreIcon size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                            <strong>Parceiro ID:</strong>{' '}
                            <Link href={`/public-partners/${report.partnerId}`} style={{ color: 'var(--color-emerald)', textDecoration: 'underline' }}>
                              {report.partnerId.substring(0, 12)}…
                            </Link>
                          </span>
                        )}
                        <span className={styles.metaItem}>
                          <FileTextIcon size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                          <strong>Relator:</strong> <code>{report.reporterId.substring(0, 12)}…</code>
                        </span>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className={styles.cardActions} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnSecondary}`}
                        style={{ flex: '1 1 100%', marginBottom: '0.25rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                        onClick={() => setDetailReport(report)}
                      >
                        <EyeIcon size={15} /> Ver Detalhes Completos & Histórico
                      </button>

                      {report.status === 'PENDING' && (
                        <>
                          <button
                            type="button"
                            className={`${styles.btn}`}
                            style={{ flex: 1, background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                            onClick={() => requestActionConfirmation(report, 'IN_REVIEW')}
                            disabled={updating}
                            id={`review-${report.id}`}
                          >
                            <SearchIcon size={14} /> Em Análise
                          </button>
                          <button
                            type="button"
                            className={`${styles.btn} ${styles.btnPrimary}`}
                            style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                            onClick={() => requestActionConfirmation(report, 'RESOLVE')}
                            disabled={updating}
                            id={`resolve-${report.id}`}
                          >
                            <CheckIcon size={14} /> Resolver
                          </button>
                          <button
                            type="button"
                            className={`${styles.btn} ${styles.btnDanger}`}
                            style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                            onClick={() => requestActionConfirmation(report, 'DISMISS')}
                            disabled={updating}
                            id={`dismiss-${report.id}`}
                          >
                            <XCircleIcon size={14} /> Descartar
                          </button>
                        </>
                      )}

                      {report.status === 'IN_REVIEW' && (
                        <>
                          <button
                            type="button"
                            className={`${styles.btn} ${styles.btnPrimary}`}
                            style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                            onClick={() => requestActionConfirmation(report, 'RESOLVE')}
                            disabled={updating}
                            id={`resolve-${report.id}`}
                          >
                            <CheckIcon size={14} /> Concluir & Resolver
                          </button>
                          <button
                            type="button"
                            className={`${styles.btn} ${styles.btnDanger}`}
                            style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                            onClick={() => requestActionConfirmation(report, 'DISMISS')}
                            disabled={updating}
                            id={`dismiss-${report.id}`}
                          >
                            <XCircleIcon size={14} /> Descartar Denúncia
                          </button>
                        </>
                      )}

                      {(report.status === 'RESOLVED' || report.status === 'DISMISSED') && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '0.5rem', flexWrap: 'wrap', padding: '0.25rem 0' }}>
                          <span style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <LockIcon size={13} /> Encerrada ({report.status === 'RESOLVED' ? 'Resolvida' : 'Descartada'})
                          </span>
                          <button
                            type="button"
                            className={styles.btn}
                            style={{
                              background: 'rgba(202, 138, 4, 0.12)',
                              color: '#ca8a04',
                              border: '1px solid rgba(202, 138, 4, 0.35)',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              padding: '0.35rem 0.75rem',
                              borderRadius: 'var(--radius-full)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                            onClick={() => requestActionConfirmation(report, 'REOPEN')}
                            disabled={updating}
                            id={`reopen-${report.id}`}
                          >
                            <RefreshCwIcon size={13} /> Reabrir Denúncia
                          </button>
                        </div>
                      )}
                    </div>
                  </section>
                );
              })
            )}
          </div>
        )}

        {/* Modal Acessível de Detalhes da Denúncia */}
        {detailReport && (
          <div className={styles.dialogOverlay} onClick={() => setDetailReport(null)}>
            <div
              className={styles.dialogCard}
              style={{ maxWidth: '640px', width: '90%' }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="detail-report-heading"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <h2 id="detail-report-heading" className={styles.modalTitle} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangleIcon size={18} style={{ color: '#f87171' }} /> Protocolo #{detailReport.id.substring(0, 8)}
                  </h2>
                  {getStatusBadge(detailReport.status)}
                </div>
                <button
                  type="button"
                  ref={detailCloseRef}
                  onClick={() => setDetailReport(null)}
                  style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', opacity: 0.7, color: 'var(--color-text)' }}
                  aria-label="Fechar"
                >
                  ✕
                </button>
              </div>

              <div className={styles.detailSection}>
                {detailReport.isFoodSafetyRisk && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.85rem', borderRadius: '12px', color: '#f87171', marginBottom: '1rem' }}>
                    <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                      <AlertTriangleIcon size={16} /> Alerta de Segurança Alimentar (RN-CONSUMER-15)
                    </strong>
                    <span style={{ display: 'block' }}>Denúncia sinalizada com risco potencial à saúde do consumidor. Deve ser avaliada com máxima prioridade.</span>
                  </div>
                )}

                <div className={styles.detailBox}>
                  <span className={styles.detailLabel}>Motivo Registrado</span>
                  <p className={styles.detailValue} style={{ marginTop: '0.35rem', fontWeight: 600, color: 'var(--color-text)' }}>
                    {getReasonLabel(detailReport.reason)} ({detailReport.reason})
                  </p>
                </div>

                <div className={styles.detailBox}>
                  <span className={styles.detailLabel}>Descrição do Consumidor</span>
                  <p className={styles.detailValue} style={{ marginTop: '0.35rem', lineHeight: '1.6', whiteSpace: 'pre-wrap', color: 'var(--color-text)' }}>
                    {detailReport.details || 'Nenhuma descrição detalhada informada.'}
                  </p>
                </div>

                <div className={styles.infoGrid}>
                  <div className={styles.detailGroup}>
                    <span className={styles.detailLabel}>ID do Relator</span>
                    <p className={styles.detailValue}>{detailReport.reporterId}</p>
                  </div>
                  {detailReport.orderId && (
                    <div className={styles.detailGroup}>
                      <span className={styles.detailLabel}>Pedido Associado</span>
                      <p className={styles.detailValue}><code>#{detailReport.orderId}</code></p>
                    </div>
                  )}
                  {detailReport.targetUserId && (
                    <div className={styles.detailGroup}>
                      <span className={styles.detailLabel}>Consumidor Denunciado</span>
                      <p className={styles.detailValue}><code>{detailReport.targetUserId}</code></p>
                    </div>
                  )}
                  <div className={styles.detailGroup}>
                    <span className={styles.detailLabel}>Produto Alvo</span>
                    <p className={styles.detailValue}>{detailReport.productId || 'N/A'}</p>
                  </div>
                  <div className={styles.detailGroup}>
                    <span className={styles.detailLabel}>Parceiro Alvo / Relator</span>
                    <p className={styles.detailValue}>{detailReport.partnerId || 'N/A'}</p>
                  </div>
                  <div className={styles.detailGroup}>
                    <span className={styles.detailLabel}>Data de Envio</span>
                    <p className={styles.detailValue}>{new Date(detailReport.createdAt).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              </div>

              {detailReport.targetUserId && (
                <div style={{
                  marginTop: '1.25rem',
                  padding: '1rem',
                  borderRadius: '8px',
                  background: 'rgba(234, 179, 8, 0.08)',
                  border: '1px solid rgba(234, 179, 8, 0.25)',
                  fontSize: '0.85rem',
                  color: 'var(--color-text)',
                  lineHeight: '1.5',
                }}>
                  <ScaleIcon size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  <strong>Regra de Auditoria Administrativa:</strong> O consumidor só é bloqueado para pagamentos na entrega se você aceitar formalmente a denúncia da loja clicando em <em>"Aprovar & Resolver"</em>. Se julgar a denúncia improcedente ou justificada, clique em <em>"Descartar"</em> para manter o consumidor livre de restrições.
                </div>
              )}

              <div style={{ marginTop: '1.75rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                {detailReport.status === 'PENDING' && (
                  <>
                    <button
                      type="button"
                      className={`${styles.btn}`}
                      style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      onClick={() => requestActionConfirmation(detailReport, 'IN_REVIEW')}
                      disabled={updating}
                    >
                      <SearchIcon size={14} /> Em Análise
                    </button>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      onClick={() => requestActionConfirmation(detailReport, 'RESOLVE')}
                      disabled={updating}
                    >
                      <CheckIcon size={14} /> Aprovar & Resolver
                    </button>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnDanger}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      onClick={() => requestActionConfirmation(detailReport, 'DISMISS')}
                      disabled={updating}
                    >
                      <XCircleIcon size={14} /> Descartar
                    </button>
                  </>
                )}

                {detailReport.status === 'IN_REVIEW' && (
                  <>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      onClick={() => requestActionConfirmation(detailReport, 'RESOLVE')}
                      disabled={updating}
                    >
                      <CheckIcon size={14} /> Concluir & Resolver
                    </button>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnDanger}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      onClick={() => requestActionConfirmation(detailReport, 'DISMISS')}
                      disabled={updating}
                    >
                      <XCircleIcon size={14} /> Descartar Denúncia
                    </button>
                  </>
                )}

                {(detailReport.status === 'RESOLVED' || detailReport.status === 'DISMISSED') && (
                  <button
                    type="button"
                    className={styles.btn}
                    style={{
                      background: 'rgba(202, 138, 4, 0.15)',
                      color: '#ca8a04',
                      border: '1px solid rgba(202, 138, 4, 0.4)',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                    onClick={() => requestActionConfirmation(detailReport, 'REOPEN')}
                    disabled={updating}
                  >
                    <RefreshCwIcon size={14} /> Reabrir Denúncia
                  </button>
                )}

                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={() => setDetailReport(null)}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmação de Ação Administrativa */}
        {confirmModal && (
          <div className={styles.dialogOverlay} onClick={() => !updating && setConfirmModal(null)} style={{ zIndex: 1200 }}>
            <div
              className={styles.dialogCard}
              style={{ maxWidth: '540px', width: '90%' }}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h3 id="confirm-modal-title" className={styles.modalTitle} style={{ fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {confirmModal.action === 'RESOLVE' && <CheckIcon size={18} />}
                  {confirmModal.action === 'DISMISS' && <XCircleIcon size={18} />}
                  {confirmModal.action === 'IN_REVIEW' && <SearchIcon size={18} />}
                  {confirmModal.action === 'REOPEN' && <RefreshCwIcon size={18} />}
                  {confirmModal.title}
                </h3>
                <button
                  type="button"
                  onClick={() => !updating && setConfirmModal(null)}
                  style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', opacity: 0.7, color: 'var(--color-text)' }}
                  aria-label="Cancelar"
                  disabled={updating}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {confirmModal.isFoodSafetyRisk && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.65rem 0.85rem', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem', fontWeight: 600 }}>
                    <AlertTriangleIcon size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    Atenção: Esta denúncia envolve risco direto à segurança alimentar de celíacos.
                  </div>
                )}

                <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-text)', lineHeight: '1.5' }}>
                  {confirmModal.description}
                </p>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                    Justificativa / Parecer Administrativo (Opcional)
                  </label>
                  <textarea
                    className={styles.textarea}
                    placeholder={
                      confirmModal.action === 'RESOLVE'
                        ? 'Ex: Estabelecimento notificado e rotulagem corrigida no catálogo.'
                        : confirmModal.action === 'DISMISS'
                        ? 'Ex: Denúncia improcedente após verificação do laudo alimentar.'
                        : confirmModal.action === 'REOPEN'
                        ? 'Ex: Novas evidências de contaminação cruzada enviadas pelo consumidor.'
                        : 'Insira observações relevantes para o log de auditoria...'
                    }
                    value={adminJustification}
                    onChange={(e) => setAdminJustification(e.target.value)}
                    disabled={updating}
                    rows={3}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                  <small style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: '0.25rem' }}>
                    <LockIcon size={12} /> Este parecer ficará registrado no histórico permanente de auditoria da plataforma.
                  </small>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnSecondary}`}
                    onClick={() => setConfirmModal(null)}
                    disabled={updating}
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    className={`${styles.btn} ${
                      confirmModal.action === 'DISMISS'
                        ? styles.btnDanger
                        : confirmModal.action === 'REOPEN'
                        ? styles.btnPrimary
                        : styles.btnPrimary
                    }`}
                    style={
                      confirmModal.action === 'REOPEN'
                        ? { background: '#ca8a04', borderColor: '#a16207', color: '#ffffff' }
                        : confirmModal.action === 'IN_REVIEW'
                        ? { background: '#2563eb', borderColor: '#1d4ed8', color: '#ffffff' }
                        : undefined
                    }
                    onClick={handleConfirmAction}
                    disabled={updating}
                    id="confirm-action-btn"
                  >
                    {updating ? 'Processando…' : (
                      confirmModal.action === 'RESOLVE' ? 'Confirmar Resolução' :
                      confirmModal.action === 'DISMISS' ? 'Confirmar Descarte' :
                      confirmModal.action === 'IN_REVIEW' ? 'Iniciar Análise' :
                      'Confirmar Reabertura'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
