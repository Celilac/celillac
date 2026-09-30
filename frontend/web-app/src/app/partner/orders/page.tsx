'use client';
// frontend/web-app/src/app/partner/orders/page.tsx
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { Header } from '@/components/layout/Header';
import { partnerApi, PartnerSummary } from '@/api/partner';
import { ordersApi, OrderDTO } from '@/api/orders';
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

export default function PartnerOrdersPage() {
  const { token, isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [partners, setPartners] = useState<PartnerSummary[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'NEW' | 'PREPARING' | 'READY' | 'COMPLETED'>('NEW');

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
          setSelectedPartnerId(data[0].id);
        }
      })
      .catch((err) => {
        toast.error(err.message || 'Erro ao carregar parceiros.', 'Erro');
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, isInitializing, token, router, toast]);

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

  useEffect(() => {
    if (selectedPartnerId) {
      fetchPartnerOrders();
    }
  }, [selectedPartnerId, fetchPartnerOrders]);

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
          <h1 className={styles.pageTitle}>
            🍳 Gestão de Pedidos
          </h1>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {partners.length > 0 && (
              <div className={styles.selectPartnerWrapper}>
                <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Local:</label>
                <select
                  className={styles.partnerSelect}
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                >
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Link
              href={`/partner/financial?partnerId=${selectedPartnerId}`}
              style={{
                padding: '0.6rem 1rem',
                background: 'var(--color-emerald-dim)',
                color: 'var(--color-emerald)',
                border: '1px solid var(--color-emerald)',
                borderRadius: '8px',
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: '0.9rem',
              }}
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
                  {orders.filter((o) => o.status === 'PAID' || o.status === 'AWAITING_PAYMENT').length}
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
                {filtered.map((order) => (
                  <div key={order.id} className={styles.orderCard}>
                    <div className={styles.cardTop}>
                      <div>
                        <div className={styles.orderId}>#{order.id.slice(0, 8)}</div>
                        <div className={styles.orderTime}>
                          {new Date(order.createdAt).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                      <span className={styles.statusBadge}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>

                <div className={styles.itemsBox}>
                  {order.items.map((it) => (
                    <div key={it.id} className={styles.itemLine}>
                      <span>
                        {it.quantity}x {it.productName}
                      </span>
                      <span>R$ {it.totalPrice.toFixed(2).replace('.', ',')}</span>
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
                  {order.status === 'PAID' && (
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
                </div>
              </div>
            ))}
          </div>
        )}
        </>
      )}
      </main>
    </div>
  );
}
