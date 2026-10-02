'use client';
// frontend/web-app/src/app/partner/orders/page.tsx
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { Header } from '@/components/layout/Header';
import { partnerApi, PartnerSummary } from '@/api/partner';
import { ordersApi, OrderDTO } from '@/api/orders';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import styles from './partner-orders.module.css';

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

  const [partners, setPartners] = useState<PartnerSummary[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'NEW' | 'PREPARING' | 'READY' | 'COMPLETED'>('NEW');

  // Estado do Modal de Denúncia / Não Pagamento
  const [reportingOrder, setReportingOrder] = useState<OrderDTO | null>(null);
  const [reportReason, setReportReason] = useState<'CLIENT_REFUSED_PAYMENT' | 'CLIENT_ABSENT' | 'FRAUDULENT_ORDER'>('CLIENT_REFUSED_PAYMENT');
  const [reportDetails, setReportDetails] = useState<string>('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Carregar pedidos do estabelecimento selecionado
  const fetchPartnerOrders = useCallback(async () => {
    if (!token || !selectedPartnerId) return;
    try {
      const data = await ordersApi.getPartnerOrders(selectedPartnerId, token);
      setOrders(data);
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
      toast.info(
        `Novo pedido pago recebido! #${payload.orderId.slice(0, 8)} • R$ ${Number(payload.totalAmount).toFixed(2)}`,
        'Novo Pedido Pago! 🔔'
      );
      fetchPartnerOrders();
    },
    onStatusUpdated: () => {
      fetchPartnerOrders();
    },
  });

  // Carregar estabelecimentos do parceiro
  useEffect(() => {
    if (isInitializing) return;
    if (!isAuthenticated || !token) {
      router.replace('/auth/login');
      return;
    }

    partnerApi.listUserPartners(token)
      .then((data) => {
        setPartners(data);
        if (data.length > 0) {
          const urlParamId = typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('partnerId')
            : null;
          const found = urlParamId && data.some((p) => p.id === urlParamId);
          setSelectedPartnerId(found ? (urlParamId as string) : data[0].id);
        }
      })
      .catch((err) => {
        toast.error(err.message || 'Erro ao carregar parceiros.', 'Erro');
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, isInitializing, token, router, toast]);

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
    setReportReason('CLIENT_REFUSED_PAYMENT');
    setReportDetails('');
  };

  const handleCloseReportModal = () => {
    setReportingOrder(null);
    setReportReason('CLIENT_REFUSED_PAYMENT');
    setReportDetails('');
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !reportingOrder) return;

    setIsSubmittingReport(true);
    try {
      await ordersApi.reportNonPayment(
        reportingOrder.id,
        { reason: reportReason, details: reportDetails },
        token
      );
      toast.success(
        'Denúncia registrada com sucesso. O pedido foi cancelado e a comissão da plataforma foi isentada.',
        'Sucesso'
      );
      handleCloseReportModal();
      fetchPartnerOrders();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao registrar denúncia.', 'Erro');
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
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.35rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 600,
                backgroundColor: isConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                color: isConnected ? '#10b981' : '#f87171',
                border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              }}
              title={isConnected ? 'Conectado em tempo real: novos pedidos pagos aparecem instantaneamente' : 'Conectando ao canal em tempo real...'}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isConnected ? '#10b981' : '#f87171',
                  boxShadow: isConnected ? '0 0 8px #10b981' : 'none',
                }}
              />
              {isConnected ? 'Tempo Real Ativo' : 'Reconectando...'}
            </div>
          </div>

          <div className={styles.headerControls}>
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
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <Link
              href={`/partner/financial?partnerId=${selectedPartnerId}`}
              className={styles.financialLink}
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
            {/* Abas de Produção */}
            <div className={styles.tabsBar}>
              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'NEW' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('NEW')}
              >
                Novos Pedidos
                <span className={styles.badgeCount}>
                  {orders.filter((o) => o.status === 'PAID' || o.status === 'AWAITING_PAYMENT' || o.status === 'CREATED').length}
                </span>
              </button>

              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'PREPARING' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('PREPARING')}
              >
                Em Preparo
                <span className={styles.badgeCount}>
                  {orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'PREPARING').length}
                </span>
              </button>

              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'READY' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('READY')}
              >
                Prontos / Despachados
                <span className={styles.badgeCount}>
                  {orders.filter((o) => o.status === 'READY_FOR_PICKUP' || o.status === 'OUT_FOR_DELIVERY').length}
                </span>
              </button>

              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'COMPLETED' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('COMPLETED')}
              >
                Histórico / Entregues
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

                        {/* Denúncia de Não Pagamento / Cliente Ausente para pedidos na entrega que já foram aceitos/despachados */}
                        {isDelivery &&
                          order.status !== 'CREATED' &&
                          order.status !== 'AWAITING_PAYMENT' &&
                          order.status !== 'DELIVERED' &&
                          order.status !== 'CANCELLED' && (
                            <button
                              type="button"
                              className={styles.btnReportNonPayment}
                              onClick={() => handleOpenReportModal(order)}
                              title="Reportar cliente ausente ou recusa de pagamento na entrega"
                            >
                              🚨 Reportar Não Pagamento
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

        {/* Modal de Denúncia / Não Pagamento */}
        {reportingOrder && (
          <div className={styles.modalOverlay} onClick={handleCloseReportModal}>
            <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                  🚨 Denunciar Não Pagamento / Fraude
                </h2>
                <button
                  type="button"
                  className={styles.modalClose}
                  onClick={handleCloseReportModal}
                >
                  ✕
                </button>
              </div>

              <div className={styles.modalWarning}>
                <strong>Atenção:</strong> Ao reportar esta ocorrência, o pedido <code>#{reportingOrder.id.slice(0, 8)}</code> será cancelado imediatamente. A comissão de intermediação da plataforma (12%) será <strong>estornada e zerada</strong> para o seu restaurante e o cliente perderá o direito de realizar novos pedidos com pagamento na entrega.
              </div>

              <form onSubmit={handleSubmitReport}>
                <div className={styles.modalFormGroup}>
                  <label className={styles.modalLabel}>Motivo da Ocorrência:</label>
                  <select
                    className={styles.modalSelect}
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value as 'CLIENT_REFUSED_PAYMENT' | 'CLIENT_ABSENT' | 'FRAUDULENT_ORDER')}
                  >
                    <option value="CLIENT_REFUSED_PAYMENT">
                      Cliente se recusou a pagar na entrega
                    </option>
                    <option value="CLIENT_ABSENT">
                      Cliente ausente / Não atendeu o entregador
                    </option>
                    <option value="FRAUDULENT_ORDER">
                      Pedido suspeito de trote ou fraude
                    </option>
                  </select>
                </div>

                <div className={styles.modalFormGroup}>
                  <label className={styles.modalLabel}>Detalhes do Ocorrido (opcional):</label>
                  <textarea
                    className={styles.modalTextarea}
                    rows={3}
                    placeholder="Ex: Entregador aguardou 20 minutos no local, cliente visualizou as mensagens mas recusou o pagamento..."
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                  />
                </div>

                <div className={styles.modalFooter}>
                  <button
                    type="button"
                    className={styles.btnCancel}
                    onClick={handleCloseReportModal}
                    disabled={isSubmittingReport}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={styles.btnDangerConfirm}
                    disabled={isSubmittingReport}
                  >
                    {isSubmittingReport ? 'Processando...' : 'Confirmar Denúncia e Cancelar'}
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
