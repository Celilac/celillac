'use client';
// frontend/web-app/src/app/orders/page.tsx
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { Header } from '@/components/layout/Header';
import { ordersApi, OrderDTO } from '@/api/orders';
import styles from './orders.module.css';

export default function MyOrdersPage() {
  const { token, isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado do Modal de Cancelamento
  const [cancellingOrder, setCancellingOrder] = useState<OrderDTO | null>(null);
  const [cancelReason, setCancelReason] = useState('Desistência antes da confirmação');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    try {
      const data = await ordersApi.getMyOrders(token);
      setOrders(data);
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

  const getStatusBadge = (status: OrderDTO['status']) => {
    switch (status) {
      case 'CREATED':
      case 'AWAITING_PAYMENT':
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
        return <span className={styles.statusBadge}>{status}</span>;
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
          <h1 className={styles.pageTitle}>
            📦 Meus Pedidos
          </h1>
          <Link href="/public-partners" className={styles.payActionBtn}>
            Fazer Novo Pedido
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className={`${styles.orderCard} ${styles.emptyState}`}>
            <p className={styles.emptyText}>
              Você ainda não realizou nenhum pedido no CeLiLac.
            </p>
            <Link href="/public-partners" className={styles.payActionBtn}>
              Explorar Restaurantes Seguros
            </Link>
            <div style={{ marginTop: '1.5rem', padding: '0.75rem 1rem', background: 'var(--color-bg)', borderRadius: '8px', border: '1px dashed var(--color-border)', maxWidth: '440px' }}>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.4 }}>
                💡 <strong>Dica para testes locais:</strong> Faça login com a conta <strong style={{ color: 'var(--color-primary, #059669)' }}>celiaco.classico@seed.celilac.dev</strong> (senha: <code>Seed@123456</code>) para visualizar os pedidos previamente semeados.
              </p>
            </div>
          </div>
        ) : (
          <div className={styles.orderList}>
            {orders.map((order) => {
              const canCancel =
                order.status === 'CREATED' ||
                order.status === 'AWAITING_PAYMENT' ||
                order.status === 'PAID';

              return (
                <div key={order.id} className={styles.orderCard}>
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
                            <span>💵 Dinheiro na entrega {order.changeFor ? `(Troco p/ R$ ${Number(order.changeFor).toFixed(2).replace('.', ',')})` : '(Sem troco)'}</span>
                          ) : order.paymentMethod === 'CARD_ON_DELIVERY' ? (
                            <span>💳 Maquininha na entrega</span>
                          ) : order.paymentMethod === 'PIX' ? (
                            <span>⚡ PIX</span>
                          ) : (
                            <span>💳 Cartão de Crédito</span>
                          )}
                        </div>
                      )}
                    </div>
                    {getStatusBadge(order.status)}
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
                          >
                            ⚡ Pagar com PIX
                          </Link>
                          <Link
                            href={`/checkout/${order.id}?method=CREDIT_CARD`}
                            className={styles.payCardActionBtn}
                          >
                            💳 Pagar com Cartão
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
              <div className={styles.refundAlert}>
                💡 <strong>Estorno Imediato:</strong> Como o parceiro ainda não confirmou o início da produção, o valor integral de <strong>R$ {cancellingOrder.totalAmount.toFixed(2).replace('.', ',')}</strong> será reembolsado automaticamente.
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
