'use client';
// frontend/web-app/src/app/orders/page.tsx
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { Header } from '@/components/layout/Header';
import { ordersApi, OrderDTO } from '@/api/orders';
import { apiClient } from '@/api/client';
import {
  PackageIcon,
  ChefHatIcon,
  BanknoteIcon,
  CreditCardIcon,
  PixIcon,
  InfoIcon,
} from '@/components/layout/icons';
import styles from './orders.module.css';

function MyOrdersContent() {
  const { token, isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const targetOrderId = searchParams ? searchParams.get('orderId') : null;

  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Estado do Modal de Cancelamento
  const [cancellingOrder, setCancellingOrder] = useState<OrderDTO | null>(null);
  const [cancelReason, setCancelReason] = useState('Desistência antes da confirmação');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    try {
      const [ordersRes, meRes] = await Promise.allSettled([
        ordersApi.getMyOrders(token),
        apiClient.get<{ role?: string }>('/iam/me', token),
      ]);

      if (ordersRes.status === 'fulfilled') {
        setOrders(ordersRes.value);
      } else {
        toast.error(ordersRes.reason?.message || 'Erro ao buscar pedidos.', 'Erro');
      }

      if (meRes.status === 'fulfilled' && meRes.value?.role) {
        setUserRole(meRes.value.role);
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao buscar pedidos.', 'Erro');
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    if (isInitializing) return;
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    fetchOrders();
  }, [isAuthenticated, isInitializing, router, fetchOrders]);

  // Se houver um targetOrderId na query, efetua scroll automático e suave até o card correspondente
  useEffect(() => {
    if (!targetOrderId || orders.length === 0) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(`order-${targetOrderId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [orders, targetOrderId]);

  const handleConfirmCancel = async () => {
    if (!token || !cancellingOrder) return;
    setSubmittingCancel(true);

    try {
      const res = await ordersApi.cancelOrder(cancellingOrder.id, cancelReason, token);
      if (res.requiresRefund) {
        toast.success(
          'Pedido cancelado com sucesso! Seu estorno foi emitido automaticamente pelo gateway.',
          'Cancelamento com Reembolso'
        );
      } else {
        toast.success('Pedido cancelado.', 'Sucesso');
      }
      setCancellingOrder(null);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || 'Falha ao cancelar pedido.', 'Erro');
    } finally {
      setSubmittingCancel(false);
    }
  };

  const getStatusBadge = (order: OrderDTO) => {
    const isDelivery = order.paymentMethod === 'CASH_ON_DELIVERY' || order.paymentMethod === 'CARD_ON_DELIVERY';
    switch (order.status) {
      case 'CREATED':
      case 'AWAITING_PAYMENT':
        if (isDelivery) {
          return <span className={`${styles.statusBadge} ${styles.statusPaid}`}>Aguardando Aceite do Restaurante</span>;
        }
        return <span className={`${styles.statusBadge} ${styles.statusAwaitingPayment}`}>Aguardando Pagamento</span>;
      case 'PAID':
        return <span className={`${styles.statusBadge} ${styles.statusPaid}`}>Pago • Aguardando Aceite</span>;
      case 'CONFIRMED':
        return <span className={`${styles.statusBadge} ${styles.statusConfirmed}`}>Confirmado pelo Restaurante</span>;
      case 'PREPARING':
        return <span className={`${styles.statusBadge} ${styles.statusPreparing}`}>Em Preparo</span>;
      case 'READY_FOR_PICKUP':
        return <span className={`${styles.statusBadge} ${styles.statusPreparing}`}>Pronto p/ Retirada</span>;
      case 'OUT_FOR_DELIVERY':
        return <span className={`${styles.statusBadge} ${styles.statusPreparing}`}>Saiu para Entrega</span>;
      case 'DELIVERED':
        return <span className={`${styles.statusBadge} ${styles.statusDelivered}`}>Entregue</span>;
      case 'CANCELLED':
        return <span className={`${styles.statusBadge} ${styles.statusCancelled}`}>Cancelado</span>;
      default:
        return <span className={styles.statusBadge}>{order.status}</span>;
    }
  };

  if (loading || isInitializing) {
    return (
      <div className={styles.container}>
        <Header />
        <main className={styles.mainContent}>
          <p className="profile-loading" role="status">Carregando seus pedidos…</p>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Header />

      <main className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PackageIcon size={24} />
            <span>Meus Pedidos</span>
          </h1>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {(userRole === 'PARCEIRO' || userRole === 'ADMIN') && (
              <Link
                href="/partner/orders"
                className={styles.partnerActionBtn}
                title="Acessar painel e gerenciar pedidos recebidos pela sua cozinha"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <ChefHatIcon size={16} />
                <span>Pedidos da Cozinha</span>
              </Link>
            )}
            <Link href="/public-partners" className={styles.payActionBtn}>
              Fazer Novo Pedido
            </Link>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className={`${styles.orderCard} ${styles.emptyState}`}>
            <p className={styles.emptyText}>
              Você ainda não realizou nenhum pedido como cliente no CeLiLac.
            </p>
            <Link href="/public-partners" className={styles.payActionBtn}>
              Explorar Restaurantes Seguros
            </Link>

            {(userRole === 'PARCEIRO' || userRole === 'ADMIN') && (
              <div
                style={{
                  marginTop: '2rem',
                  padding: '1.25rem 1.5rem',
                  background: 'var(--color-bg)',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)',
                  maxWidth: '520px',
                  margin: '2rem auto 0',
                  textAlign: 'center',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                  <ChefHatIcon size={32} style={{ color: '#f59e0b' }} />
                </div>
                <div style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.35rem', fontSize: '1rem' }}>
                  Você possui uma conta de parceiro comercial
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0 0 1rem 0', lineHeight: 1.5 }}>
                  Esta tela exibe os pedidos que você realiza como cliente. Para acompanhar, aceitar e despachar os pedidos recebidos pela cozinha do seu restaurante, acesse o painel da cozinha.
                </p>
                <Link
                  href="/partner/orders"
                  className={styles.partnerActionBtn}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <ChefHatIcon size={16} />
                  <span>Ir para Pedidos da Cozinha</span>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.orderList}>
            {orders.map((order) => {
              const canCancel =
                order.status === 'CREATED' ||
                order.status === 'AWAITING_PAYMENT' ||
                order.status === 'PAID';

              return (
                <div
                  key={order.id}
                  id={`order-${order.id}`}
                  className={`${styles.orderCard} ${targetOrderId === order.id ? styles.highlightCard : ''}`}
                >
                  <div className={styles.cardHeader}>
                    <div>
                      <div className={styles.orderId}>
                        Pedido #{order.id.slice(-6).toUpperCase()}
                      </div>
                      <div className={styles.orderDate}>
                        {new Date(order.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      {order.paymentMethod && (
                        <div style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                          {order.paymentMethod === 'CASH_ON_DELIVERY' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <BanknoteIcon size={14} />
                              <span>Dinheiro na entrega {order.changeFor ? `(Troco p/ R$ ${Number(order.changeFor).toFixed(2).replace('.', ',')})` : '(Sem troco)'}</span>
                            </span>
                          ) : order.paymentMethod === 'CARD_ON_DELIVERY' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CreditCardIcon size={14} />
                              <span>Maquininha na entrega</span>
                            </span>
                          ) : order.paymentMethod === 'PIX' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <PixIcon size={14} />
                              <span>PIX</span>
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CreditCardIcon size={14} />
                              <span>Cartão de Crédito</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {getStatusBadge(order)}
                  </div>

                  <div className={styles.itemsSummary}>
                    {order.items.map((it) => (
                      <span key={it.id} style={{ display: 'block' }}>
                        • {it.productName} <strong>(x{it.quantity})</strong>
                      </span>
                    ))}
                  </div>

                  {order.status === 'CANCELLED' && order.cancelReason && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-blocked)', margin: '0.5rem 0' }}>
                      <strong>Motivo do cancelamento:</strong> {order.cancelReason}
                    </p>
                  )}

                  <div className={styles.cardFooter}>
                    <div className={styles.orderTotal}>
                      Total: R$ {order.totalAmount.toFixed(2).replace('.', ',')}
                    </div>

                    <div className={styles.actionsGroup}>
                      {(order.status === 'CREATED' || order.status === 'AWAITING_PAYMENT') && (
                        <>
                          <Link
                            href={`/checkout/${order.id}?method=PIX`}
                            className={styles.payActionBtn}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <PixIcon size={14} />
                            <span>Pagar com PIX</span>
                          </Link>
                          <Link
                            href={`/checkout/${order.id}?method=CREDIT_CARD`}
                            className={styles.payCardActionBtn}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <CreditCardIcon size={14} />
                            <span>Pagar com Cartão</span>
                          </Link>
                          <Link
                            href={`/checkout/${order.id}?method=DELIVERY`}
                            className={styles.payDeliveryActionBtn}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <BanknoteIcon size={14} />
                            <span>Pagar na Entrega</span>
                          </Link>
                        </>
                      )}

                      {canCancel && (
                        <button
                          type="button"
                          className={styles.cancelActionBtn}
                          onClick={() => setCancellingOrder(order)}
                        >
                          Cancelar Pedido
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal de Cancelamento com Aviso de Estorno Imediato */}
      {cancellingOrder && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>Cancelar Pedido</h2>
            <p className={styles.modalText}>
              Tem certeza de que deseja cancelar o pedido #{cancellingOrder.id.slice(-6).toUpperCase()}?
            </p>

            {cancellingOrder.status === 'PAID' && (
              <div className={styles.refundAlert} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <InfoIcon size={18} style={{ color: '#38bdf8', flexShrink: 0, marginTop: 2 }} />
                <span>
                  <strong>Estorno Imediato:</strong> Como o parceiro ainda não confirmou o início da produção, o valor integral de <strong>R$ {cancellingOrder.totalAmount.toFixed(2).replace('.', ',')}</strong> será reembolsado automaticamente.
                </span>
              </div>
            )}

            <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>
              Motivo do cancelamento:
            </label>
            <input
              type="text"
              className={styles.reasonInput}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Ex: Desisti da compra, endereço incorreto..."
            />

            <div className={styles.modalButtons}>
              <button
                type="button"
                className={styles.modalCancelBtn}
                onClick={() => setCancellingOrder(null)}
                disabled={submittingCancel}
              >
                Voltar
              </button>
              <button
                type="button"
                className={styles.modalConfirmBtn}
                onClick={handleConfirmCancel}
                disabled={submittingCancel}
              >
                {submittingCancel ? 'Cancelando…' : 'Confirmar Cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyOrdersPage() {
  return (
    <Suspense fallback={<p className="profile-loading" style={{ textAlign: 'center', padding: '3rem' }}>Carregando pedidos…</p>}>
      <MyOrdersContent />
    </Suspense>
  );
}
