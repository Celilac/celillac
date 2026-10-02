'use client';
// frontend/web-app/src/app/partner/orders/page.tsx
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { Header } from '@/components/layout/Header';
import { partnerApi, PartnerSummary } from '@/api/partner';
import { ordersApi, OrderDTO, OrderProblemReason } from '@/api/orders';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import styles from './partner-orders.module.css';

const PROBLEM_OPTIONS: Array<{
  reason: OrderProblemReason;
  icon: string;
  title: string;
  desc: string;
  isSevere: boolean;
}> = [
  {
    reason: 'CLIENT_ABSENT',
    icon: '🏃',
    title: 'Cliente ausente / Não atende entregador',
    desc: 'Entregador aguardou no local e não conseguiu contato por telefone ou interfone.',
    isSevere: true,
  },
  {
    reason: 'CLIENT_REFUSED_PAYMENT',
    icon: '💳',
    title: 'Cliente recusou o pagamento na entrega',
    desc: 'Cliente se negou a realizar o pagamento na maquininha ou em dinheiro.',
    isSevere: true,
  },
  {
    reason: 'ADDRESS_UNREACHABLE',
    icon: '📍',
    title: 'Endereço incorreto, incompleto ou inacessível',
    desc: 'Endereço inexistente, sem número, fora da rota ou sem acesso de segurança.',
    isSevere: false,
  },
  {
    reason: 'FRAUDULENT_ORDER',
    icon: '🎭',
    title: 'Suspeita de trote ou pedido fraudulento',
    desc: 'Telefone inválido, dados falsos ou comportamento suspeito do cliente.',
    isSevere: true,
  },
  {
    reason: 'CLIENT_REQUESTED_CANCELLATION',
    icon: '✋',
    title: 'Cliente solicitou o cancelamento',
    desc: 'O cliente entrou em contato com a loja pedindo expressamente o cancelamento.',
    isSevere: false,
  },
  {
    reason: 'OUT_OF_STOCK',
    icon: '🍳',
    title: 'Item ou ingrediente esgotado na cozinha',
    desc: 'A cozinha não possui insumos seguros disponíveis para atender ao pedido.',
    isSevere: false,
  },
  {
    reason: 'OTHER',
    icon: '💬',
    title: 'Outro problema com o cliente ou entrega',
    desc: 'Outra ocorrência não listada acima (detalhar no campo abaixo).',
    isSevere: false,
  },
];

const STATUS_LABELS: Record<string, string> = {
  CREATED: 'Aguardando Pagamento',
  AWAITING_PAYMENT: 'Aguardando Pagamento',
  PAID: 'Pago • Novo',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Em Preparo',
  READY_FOR_PICKUP: 'Pronto p/ Retirada',
  OUT_FOR_DELIVERY: 'Saiu para Entrega',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
};

function PartnerOrdersContent() {
  const { token, isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const targetOrderId = searchParams ? searchParams.get('orderId') : null;
  const targetPartnerId = searchParams ? searchParams.get('partnerId') : null;

  const [partners, setPartners] = useState<PartnerSummary[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({});
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'NEW' | 'PREPARING' | 'READY' | 'COMPLETED'>('NEW');

  // Estado do Modal de Reportar Problema / Cancelamento
  const [reportingOrder, setReportingOrder] = useState<OrderDTO | null>(null);
  const [reportReason, setReportReason] = useState<OrderProblemReason>('CLIENT_ABSENT');
  const [reportDetails, setReportDetails] = useState<string>('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Buscar contagem de pedidos pendentes em todos os estabelecimentos do usuário
  const fetchAllPendingCounts = useCallback(async (partnerList: PartnerSummary[]) => {
    if (!token || partnerList.length === 0) return;
    try {
      const counts: Record<string, number> = {};
      await Promise.all(
        partnerList.map(async (p) => {
          try {
            const partnerOrders = await ordersApi.getPartnerOrders(p.id, token);
            const pending = partnerOrders.filter(
              (o) => o.status === 'AWAITING_PAYMENT' || o.status === 'CREATED' || o.status === 'PAID'
            ).length;
            counts[p.id] = pending;
          } catch {
            counts[p.id] = 0;
          }
        })
      );
      setPendingCounts(counts);
    } catch {
      // Silencia falha em contagens globais
    }
  }, [token]);

  // Carregar pedidos do estabelecimento selecionado
  const fetchPartnerOrders = useCallback(async () => {
    if (!token || !selectedPartnerId) return;
    try {
      const data = await ordersApi.getPartnerOrders(selectedPartnerId, token);
      setOrders(data);
      const currentPending = data.filter(
        (o) => o.status === 'AWAITING_PAYMENT' || o.status === 'CREATED' || o.status === 'PAID'
      ).length;
      setPendingCounts((prev) => ({ ...prev, [selectedPartnerId]: currentPending }));
    } catch (err: any) {
      toast.error(err.message || 'Erro ao carregar pedidos.', 'Erro');
    }
  }, [selectedPartnerId, token, toast]);

  // Conexão SSE em tempo real para novos pedidos pagos e mudanças de status
  const { isConnected } = useOrderNotifications({
    partnerId: selectedPartnerId,
    token,
    enabled: Boolean(token && selectedPartnerId),
    onPaymentConfirmed: (payload) => {
      const isForCurrent = !payload.partnerId || payload.partnerId === selectedPartnerId;
      const targetPartner = partners.find((p) => p.id === payload.partnerId);
      const locName = targetPartner?.name || payload.partnerName;

      if (isForCurrent) {
        toast.info(
          `Novo pedido recebido! #${payload.orderId.slice(0, 8)} • R$ ${Number(payload.totalAmount).toFixed(2)}`,
          'Novo Pedido! 🔔'
        );
        fetchPartnerOrders();
      } else {
        toast.info(
          `Novo pedido em ${locName || 'outro estabelecimento'}! #${payload.orderId.slice(0, 8)}`,
          'Novo Pedido! 🔔'
        );
      }
      fetchAllPendingCounts(partners);
    },
    onStatusUpdated: () => {
      fetchPartnerOrders();
      fetchAllPendingCounts(partners);
    },
    onPollSync: () => {
      fetchPartnerOrders();
      fetchAllPendingCounts(partners);
    },
  });

  // Ouvir evento disparado pelo dropdown de notificações para troca imediata
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleSwitch = (e: any) => {
      const detail = e.detail;
      if (detail?.partnerId && detail.partnerId !== selectedPartnerId) {
        setSelectedPartnerId(detail.partnerId);
      }
    };

    window.addEventListener('celilac:switch-partner-order', handleSwitch);
    return () => {
      window.removeEventListener('celilac:switch-partner-order', handleSwitch);
    };
  }, [selectedPartnerId]);

  // Carregar estabelecimentos do parceiro
  useEffect(() => {
    if (isInitializing) return;
    if (!isAuthenticated || !token) {
      router.replace('/auth/login');
      return;
    }

    partnerApi.listUserPartners(token)
      .then(async (data) => {
        setPartners(data);
        if (data.length > 0) {
          const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
          const urlPartnerId = urlParams ? urlParams.get('partnerId') : null;
          const urlOrderId = urlParams ? urlParams.get('orderId') : null;
          const found = urlPartnerId && data.some((p) => p.id === urlPartnerId);

          if (found) {
            setSelectedPartnerId(urlPartnerId as string);
            fetchAllPendingCounts(data);
          } else if (urlOrderId) {
            // Se veio apenas orderId na URL, descobre em qual estabelecimento o pedido reside
            let matchingPartnerId = data[0].id;
            for (const p of data) {
              try {
                const pOrders = await ordersApi.getPartnerOrders(p.id, token);
                if (pOrders.some((o) => o.id === urlOrderId)) {
                  matchingPartnerId = p.id;
                  break;
                }
              } catch {}
            }
            setSelectedPartnerId(matchingPartnerId);
            fetchAllPendingCounts(data);
          } else {
            // Se não veio parâmetro na URL, seleciona preferencialmente o restaurante com pedidos pendentes
            let bestPartnerId = data[0].id;
            try {
              const counts: Record<string, number> = {};
              for (const p of data) {
                try {
                  const pOrders = await ordersApi.getPartnerOrders(p.id, token);
                  const pending = pOrders.filter(
                    (o) => o.status === 'AWAITING_PAYMENT' || o.status === 'CREATED' || o.status === 'PAID'
                  ).length;
                  counts[p.id] = pending;
                  if (pending > 0 && bestPartnerId === data[0].id) {
                    bestPartnerId = p.id;
                  }
                } catch {
                  counts[p.id] = 0;
                }
              }
              setPendingCounts(counts);
            } catch {}
            setSelectedPartnerId(bestPartnerId);
          }
        }
      })
      .catch((err) => {
        toast.error(err.message || 'Erro ao carregar parceiros.', 'Erro');
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, isInitializing, token, router, toast, fetchAllPendingCounts]);

  // Sincronizar reativamente caso a URL mude o partnerId (ex: clique no sino ou toast)
  useEffect(() => {
    if (targetPartnerId && partners.length > 0) {
      const exists = partners.some((p) => p.id === targetPartnerId);
      if (exists && targetPartnerId !== selectedPartnerId) {
        setSelectedPartnerId(targetPartnerId);
      }
    }
  }, [targetPartnerId, partners, selectedPartnerId]);

  // Se houver um targetOrderId mas o pedido não estiver no estabelecimento atual,
  // varre todos os estabelecimentos do usuário para encontrar e selecionar o correto automaticamente!
  useEffect(() => {
    if (!targetOrderId || !token || partners.length === 0) return;

    if (orders.some((o) => o.id === targetOrderId)) return;

    let isMounted = true;
    (async () => {
      for (const p of partners) {
        if (p.id === selectedPartnerId) continue;
        try {
          const pOrders = await ordersApi.getPartnerOrders(p.id, token);
          if (pOrders.some((o) => o.id === targetOrderId)) {
            if (isMounted) {
              setSelectedPartnerId(p.id);
            }
            break;
          }
        } catch {}
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [targetOrderId, token, partners, selectedPartnerId, orders]);

  useEffect(() => {
    if (selectedPartnerId) {
      fetchPartnerOrders();
    }
  }, [selectedPartnerId, fetchPartnerOrders]);

  // Se houver um targetOrderId na query, descobre a aba correta e efetua scroll até o card
  useEffect(() => {
    if (!targetOrderId || orders.length === 0) return;
    const target = orders.find((o) => o.id === targetOrderId);
    if (target) {
      if (target.status === 'CREATED' || target.status === 'AWAITING_PAYMENT' || target.status === 'PAID') {
        setActiveTab('NEW');
      } else if (target.status === 'CONFIRMED' || target.status === 'PREPARING') {
        setActiveTab('PREPARING');
      } else if (target.status === 'READY_FOR_PICKUP' || target.status === 'OUT_FOR_DELIVERY') {
        setActiveTab('READY');
      } else {
        setActiveTab('COMPLETED');
      }

      const timer = setTimeout(() => {
        const el = document.getElementById(`order-${targetOrderId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [orders, targetOrderId]);

  const handleAction = async (orderId: string, action: any) => {
    if (!token) return;
    try {
      await ordersApi.updateOrderStatus(orderId, action, token);
      toast.success('Status do pedido atualizado!', 'Sucesso');
      fetchPartnerOrders();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar pedido.', 'Erro');
    }
  };

  const handleOpenReportModal = (order: OrderDTO) => {
    setReportingOrder(order);
    setReportReason('CLIENT_ABSENT');
    setReportDetails('');
  };

  const handleCloseReportModal = () => {
    setReportingOrder(null);
    setReportReason('CLIENT_ABSENT');
    setReportDetails('');
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !reportingOrder) return;

    if (reportReason === 'OTHER' && !reportDetails.trim()) {
      toast.error('Por favor, descreva os detalhes do ocorrido para a opção "Outro".', 'Atenção');
      return;
    }

    setIsSubmittingReport(true);
    try {
      await ordersApi.reportProblem(
        reportingOrder.id,
        { reason: reportReason, details: reportDetails.trim() || undefined },
        token
      );
      toast.success(
        'Ocorrência registrada com sucesso. O pedido foi cancelado e a comissão da plataforma foi isentada.',
        'Pedido Cancelado'
      );
      handleCloseReportModal();
      fetchPartnerOrders();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao registrar ocorrência.', 'Erro');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const filterOrders = () => {
    switch (activeTab) {
      case 'NEW':
        return orders.filter((o) => o.status === 'PAID' || o.status === 'AWAITING_PAYMENT' || o.status === 'CREATED');
      case 'PREPARING':
        return orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'PREPARING');
      case 'READY':
        return orders.filter((o) => o.status === 'READY_FOR_PICKUP' || o.status === 'OUT_FOR_DELIVERY');
      case 'COMPLETED':
        return orders.filter((o) => o.status === 'DELIVERED' || o.status === 'CANCELLED');
      default:
        return orders;
    }
  };

  const filtered = filterOrders();

  const renderStatusBadge = (order: OrderDTO) => {
    const isDelivery = order.paymentMethod === 'CASH_ON_DELIVERY' || order.paymentMethod === 'CARD_ON_DELIVERY';

    if (order.status === 'CREATED' || order.status === 'AWAITING_PAYMENT') {
      if (isDelivery) {
        return (
          <span className={`${styles.statusBadge} ${styles.badgePendingAccept}`}>
            🔔 Aguardando Aceite
          </span>
        );
      }
      return (
        <span className={`${styles.statusBadge} ${styles.badgeAwaitingPayment}`}>
          ⏳ Aguardando Pagamento
        </span>
      );
    }

    if (order.status === 'PAID') {
      return (
        <span className={`${styles.statusBadge} ${styles.badgeNewPaid}`}>
          ✨ Novo • Pago
        </span>
      );
    }

    if (order.status === 'CONFIRMED') {
      return (
        <span className={`${styles.statusBadge} ${styles.badgeConfirmed}`}>
          ✔️ Confirmado
        </span>
      );
    }

    if (order.status === 'PREPARING') {
      return (
        <span className={`${styles.statusBadge} ${styles.badgePreparing}`}>
          🔥 Em Preparo
        </span>
      );
    }

    if (order.status === 'READY_FOR_PICKUP') {
      return (
        <span className={`${styles.statusBadge} ${styles.badgeReady}`}>
          📦 Pronto p/ Retirada
        </span>
      );
    }

    if (order.status === 'OUT_FOR_DELIVERY') {
      return (
        <span className={`${styles.statusBadge} ${styles.badgeDelivery}`}>
          🛵 Saiu para Entrega
        </span>
      );
    }

    if (order.status === 'DELIVERED') {
      return (
        <span className={`${styles.statusBadge} ${styles.badgeDelivered}`}>
          🏁 Entregue
        </span>
      );
    }

    if (order.status === 'CANCELLED') {
      return (
        <span className={`${styles.statusBadge} ${styles.badgeCancelled}`}>
          ✕ Cancelado
        </span>
      );
    }

    return (
      <span className={`${styles.statusBadge} ${styles.badgeDefault}`}>
        {STATUS_LABELS[order.status] || order.status}
      </span>
    );
  };

  if (loading || isInitializing) {
    return (
      <div className={styles.container}>
        <Header />
        <main className={styles.mainContent}>
          <p className="profile-loading" role="status">Carregando painel de pedidos…</p>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Header />

      <main className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <h1 className={styles.pageTitle} style={{ margin: 0 }}>
              🍳 Gestão de Pedidos
            </h1>

            <div
              className={styles.statusPill}
              style={{
                backgroundColor: isConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                color: isConnected ? '#10b981' : '#f59e0b',
                border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              }}
              title={
                isConnected
                  ? 'Conectado em tempo real: novos pedidos pagos aparecem instantaneamente'
                  : 'Canal em tempo real conectando... Sincronização automática ativa.'
              }
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isConnected ? '#10b981' : '#f59e0b',
                  boxShadow: isConnected ? '0 0 8px #10b981' : '0 0 6px #f59e0b',
                }}
              />
              {isConnected ? 'Tempo Real Ativo' : 'Sincronização Ativa'}
            </div>
          </div>

          <div className={styles.headerActions}>
            {partners.length > 0 && (
              <label
                className={styles.selectPartnerWrapper}
                htmlFor="partner-orders-select"
                title="Clique em qualquer lugar da caixa para trocar o local"
              >
                <span className={styles.selectPartnerLabel}>Local:</span>
                <span className={styles.selectPartnerValue}>
                  <span className={styles.partnerNameText}>
                    {partners.find((p) => p.id === selectedPartnerId)?.name || 'Selecione um local'}
                  </span>
                  <svg
                    className={styles.selectPartnerArrow}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
                <select
                  id="partner-orders-select"
                  className={styles.partnerSelect}
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                  aria-label="Selecionar estabelecimento"
                >
                  {partners.map((p) => {
                    const count = pendingCounts[p.id] || 0;
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name}{count > 0 ? ` 🔔 (${count} ${count === 1 ? 'novo' : 'novos'})` : ''}
                      </option>
                    );
                  })}
                </select>
              </label>
            )}

            <Link
              href={`/partner/financial?partnerId=${selectedPartnerId}`}
              className={styles.financialButton}
            >
              💰 Painel Financeiro & PIX
            </Link>
          </div>
        </div>

        {partners.length === 0 ? (
          <div className={styles.emptyCard}>
            <p className={styles.emptyTitle}>Nenhum restaurante parceiro vinculado a esta conta.</p>
            <p className={styles.emptyText}>
              Para visualizar a cozinha e despachar pedidos, faça login com a conta parceira de teste:
            </p>
            <div className={styles.credentialBox}>
              <p><strong>E-mail:</strong> parceiro.restaurante@seed.celilac.dev</p>
              <p><strong>Senha:</strong> Seed@123456</p>
            </div>
            <p className={styles.emptyText} style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
              Se você é um cliente celíaco fazendo pedidos, acesse <Link href="/orders" style={{ color: 'var(--color-primary, #059669)', textDecoration: 'underline' }}>Meus Pedidos</Link>.
            </p>
          </div>
        ) : (
          <>
            {/* Alerta de Pedidos em Outros Estabelecimentos */}
            {partners.filter((p) => p.id !== selectedPartnerId && (pendingCounts[p.id] || 0) > 0).length > 0 && (
              <div className={styles.multiPartnerAlert}>
                <div className={styles.multiPartnerAlertContent}>
                  <span className={styles.multiPartnerAlertIcon}>🔔</span>
                  <span>
                    Atenção: Você possui{' '}
                    <strong>
                      {partners
                        .filter((p) => p.id !== selectedPartnerId && (pendingCounts[p.id] || 0) > 0)
                        .reduce((acc, p) => acc + (pendingCounts[p.id] || 0), 0)}{' '}
                      pedido(s) pendente(s)
                    </strong>{' '}
                    aguardando aceite em outro estabelecimento:
                  </span>
                </div>
                <div className={styles.multiPartnerAlertActions}>
                  {partners
                    .filter((p) => p.id !== selectedPartnerId && (pendingCounts[p.id] || 0) > 0)
                    .map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className={styles.switchPartnerBtn}
                        onClick={() => setSelectedPartnerId(p.id)}
                      >
                        Ver {p.name} ({pendingCounts[p.id]}) →
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Abas de Produção */}
            <div className={styles.tabsBar}>
              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'NEW' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('NEW')}
              >
                <span className={styles.tabLabelDesktop}>Novos Pedidos</span>
                <span className={styles.tabLabelMobile}>Novos</span>
                <span className={styles.badgeCount}>
                  {orders.filter((o) => o.status === 'PAID' || o.status === 'AWAITING_PAYMENT' || o.status === 'CREATED').length}
                </span>
              </button>

              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'PREPARING' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('PREPARING')}
              >
                <span className={styles.tabLabelDesktop}>Em Preparo</span>
                <span className={styles.tabLabelMobile}>Preparo</span>
                <span className={styles.badgeCount}>
                  {orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'PREPARING').length}
                </span>
              </button>

              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'READY' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('READY')}
              >
                <span className={styles.tabLabelDesktop}>Prontos / Despachados</span>
                <span className={styles.tabLabelMobile}>Prontos</span>
                <span className={styles.badgeCount}>
                  {orders.filter((o) => o.status === 'READY_FOR_PICKUP' || o.status === 'OUT_FOR_DELIVERY').length}
                </span>
              </button>

              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'COMPLETED' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('COMPLETED')}
              >
                <span className={styles.tabLabelDesktop}>Histórico / Entregues</span>
                <span className={styles.tabLabelMobile}>Histórico</span>
                <span className={styles.badgeCount}>
                  {orders.filter((o) => o.status === 'DELIVERED' || o.status === 'CANCELLED').length}
                </span>
              </button>
            </div>

            {/* Lista de Pedidos da Aba Ativa */}
            {filtered.length === 0 ? (
              <div className={styles.emptyTabMsg}>
                Nenhum pedido nesta etapa no momento.
              </div>
            ) : (
              <div className={styles.ordersGrid}>
                {filtered.map((order) => {
                  const isDelivery = order.paymentMethod === 'CASH_ON_DELIVERY' || order.paymentMethod === 'CARD_ON_DELIVERY';

                  return (
                    <div
                      key={order.id}
                      id={`order-${order.id}`}
                      className={`${styles.orderCard} ${targetOrderId === order.id ? styles.highlightCard : ''}`}
                    >
                      {/* Top Header: ID, Data/Hora e Badge de Status */}
                      <div className={styles.cardHeader}>
                        <div className={styles.orderMeta}>
                          <span className={styles.orderId}>#{order.id.slice(0, 8)}</span>
                          <span className={styles.orderTimeDot}>•</span>
                          <span className={styles.orderTime}>
                            {new Date(order.createdAt).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {renderStatusBadge(order)}
                      </div>

                      {/* Banner de Forma de Pagamento em Largura Total */}
                      <div className={styles.paymentSection}>
                        {order.paymentMethod === 'CARD_ON_DELIVERY' ? (
                          <div className={`${styles.paymentBanner} ${styles.paymentBannerCard}`}>
                            <div className={styles.paymentBannerMain}>
                              <span className={styles.paymentIcon}>💳</span>
                              <span className={styles.paymentTitle}>Maquininha na Entrega</span>
                            </div>
                            <span className={styles.paymentSubtitle}>Cartão Débito / Crédito</span>
                          </div>
                        ) : order.paymentMethod === 'CASH_ON_DELIVERY' ? (
                          <div className={`${styles.paymentBanner} ${styles.paymentBannerCash}`}>
                            <div className={styles.paymentBannerMain}>
                              <span className={styles.paymentIcon}>💵</span>
                              <span className={styles.paymentTitle}>Dinheiro na Entrega</span>
                            </div>
                            <span className={styles.paymentSubtitle}>
                              {order.changeFor ? `Troco p/ R$ ${Number(order.changeFor).toFixed(2).replace('.', ',')}` : 'Sem troco'}
                            </span>
                          </div>
                        ) : (
                          <div className={`${styles.paymentBanner} ${styles.paymentBannerOnline}`}>
                            <div className={styles.paymentBannerMain}>
                              <span className={styles.paymentIcon}>🛡️</span>
                              <span className={styles.paymentTitle}>Pagamento Online</span>
                            </div>
                            <span className={styles.paymentSubtitle}>
                              {order.status === 'PAID' ? 'Pago via App' : 'Aguardando Pagamento'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className={styles.itemsBox}>
                        {order.items.map((it) => (
                          <div key={it.id} className={styles.itemLine}>
                            <span className={styles.itemName}>
                              {it.quantity}x {it.productName}
                            </span>
                            <span className={styles.itemPrice}>
                              R$ {it.totalPrice.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.notes && (
                        <div className={styles.orderNotes}>
                          📝 {order.notes}
                        </div>
                      )}

                      <div className={styles.cardBottom}>
                        <div className={styles.amountLine}>
                          <span>Total</span>
                          <span style={{ color: 'var(--color-emerald)' }}>
                            R$ {order.totalAmount.toFixed(2).replace('.', ',')}
                          </span>
                        </div>

                        {/* Ações por Status */}
                        {(order.status === 'PAID' || (
                          (order.paymentMethod === 'CASH_ON_DELIVERY' || order.paymentMethod === 'CARD_ON_DELIVERY') &&
                          (order.status === 'CREATED' || order.status === 'AWAITING_PAYMENT')
                        )) && (
                          <button
                            type="button"
                            className={`${styles.actionButton} ${styles.actionConfirm}`}
                            onClick={() => handleAction(order.id, 'CONFIRM')}
                          >
                            ✅ Aceitar Pedido
                          </button>
                        )}

                        {order.status === 'CONFIRMED' && (
                          <button
                            type="button"
                            className={`${styles.actionButton} ${styles.actionPrepare}`}
                            onClick={() => handleAction(order.id, 'START_PREPARING')}
                          >
                            🔥 Iniciar Preparo
                          </button>
                        )}

                        {order.status === 'PREPARING' && (
                          <button
                            type="button"
                            className={`${styles.actionButton} ${styles.actionReady}`}
                            onClick={() => handleAction(order.id, 'READY_FOR_PICKUP')}
                          >
                            📦 Marcar como Pronto
                          </button>
                        )}

                        {order.status === 'READY_FOR_PICKUP' && (
                          <button
                            type="button"
                            className={`${styles.actionButton} ${styles.actionReady}`}
                            onClick={() => handleAction(order.id, 'OUT_FOR_DELIVERY')}
                          >
                            🛵 Despachar para Entrega
                          </button>
                        )}

                        {order.status === 'OUT_FOR_DELIVERY' && (
                          <button
                            type="button"
                            className={`${styles.actionButton} ${styles.actionDeliver}`}
                            onClick={() => handleAction(order.id, 'DELIVER')}
                          >
                            🏁 Concluir Entrega
                          </button>
                        )}

                        {/* Reportar Problema com o Pedido / Cliente (Referência iFood) */}
                        {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                          <button
                            type="button"
                            className={styles.btnReportNonPayment}
                            onClick={() => handleOpenReportModal(order)}
                            title="Reportar ocorrência ou problema com este pedido ou cliente"
                          >
                            🚨 Reportar Problema
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Modal de Reportar Problema / Ocorrência com Pedido (Referência iFood) */}
        {reportingOrder && (
          <div className={styles.modalOverlay} onClick={handleCloseReportModal}>
            <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                  🚨 Reportar Problema com o Pedido
                </h2>
                <button
                  type="button"
                  className={styles.modalClose}
                  onClick={handleCloseReportModal}
                  aria-label="Fechar"
                >
                  ✕
                </button>
              </div>

              {/* Resumo do Pedido Afetado */}
              <div className={styles.modalOrderSummary}>
                <span>
                  Pedido: <strong>#{reportingOrder.id.slice(0, 8)}</strong>
                </span>
                <span>
                  Total: <strong>R$ {Number(reportingOrder.totalAmount).toFixed(2).replace('.', ',')}</strong>
                </span>
                <span>
                  Forma:{' '}
                  <strong>
                    {reportingOrder.paymentMethod === 'CARD_ON_DELIVERY'
                      ? 'Maquininha na Entrega'
                      : reportingOrder.paymentMethod === 'CASH_ON_DELIVERY'
                      ? 'Dinheiro na Entrega'
                      : 'Pagamento Online'}
                  </strong>
                </span>
              </div>

              <form onSubmit={handleSubmitReport}>
                <div className={styles.modalFormGroup}>
                  <label className={styles.modalLabel}>Selecione o motivo da ocorrência:</label>
                  <div className={styles.problemOptionsList}>
                    {PROBLEM_OPTIONS.map((opt) => {
                      const isSelected = reportReason === opt.reason;
                      return (
                        <div
                          key={opt.reason}
                          className={`${styles.problemOptionCard} ${isSelected ? styles.problemOptionCardSelected : ''}`}
                          onClick={() => setReportReason(opt.reason)}
                        >
                          <span className={styles.problemOptionIcon}>{opt.icon}</span>
                          <div className={styles.problemOptionInfo}>
                            <span className={styles.problemOptionTitle}>{opt.title}</span>
                            <span className={styles.problemOptionDesc}>{opt.desc}</span>
                          </div>
                          <input
                            type="radio"
                            name="problemReason"
                            className={styles.problemOptionRadio}
                            checked={isSelected}
                            onChange={() => setReportReason(opt.reason)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.modalFormGroup}>
                  <label className={styles.modalLabel}>
                    Observações e detalhes do ocorrido {reportReason === 'OTHER' ? '(obrigatório)' : '(opcional)'}:
                  </label>
                  <textarea
                    className={styles.modalTextarea}
                    rows={2}
                    placeholder={
                      reportReason === 'CLIENT_ABSENT'
                        ? 'Ex: Entregador aguardou 15 min no endereço, tentou ligar 3 vezes e ninguém atendeu...'
                        : reportReason === 'CLIENT_REFUSED_PAYMENT'
                        ? 'Ex: Cliente se recusou a pagar com a maquininha ao receber a entrega...'
                        : reportReason === 'ADDRESS_UNREACHABLE'
                        ? 'Ex: Número não existe na rua informada e cliente não responde mensagens...'
                        : 'Descreva informações adicionais que auxiliem na ocorrência...'
                    }
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    required={reportReason === 'OTHER'}
                  />
                </div>

                <div className={styles.modalWarning}>
                  <strong>Impacto do Cancelamento:</strong> O pedido será cancelado imediatamente e a comissão de intermediação da plataforma (12%) será <strong>estornada e zerada</strong> para seu estabelecimento.
                  {PROBLEM_OPTIONS.find((o) => o.reason === reportReason)?.isSevere && (
                    <span> Por se tratar de infração de pagamento ou ausência do cliente, a conta do consumidor será prevenida de novos pedidos presenciais.</span>
                  )}
                </div>

                <div className={styles.modalFooter}>
                  <button
                    type="button"
                    className={styles.btnCancel}
                    onClick={handleCloseReportModal}
                    disabled={isSubmittingReport}
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className={styles.btnDangerConfirm}
                    disabled={isSubmittingReport}
                  >
                    {isSubmittingReport ? 'Processando...' : '🚨 Confirmar e Cancelar Pedido'}
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

export default function PartnerOrdersPage() {
  return (
    <Suspense fallback={<p className="profile-loading" style={{ textAlign: 'center', padding: '3rem' }}>Carregando pedidos da cozinha…</p>}>
      <PartnerOrdersContent />
    </Suspense>
  );
}
