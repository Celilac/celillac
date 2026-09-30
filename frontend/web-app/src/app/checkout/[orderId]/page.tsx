'use client';
// frontend/web-app/src/app/checkout/[orderId]/page.tsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { Header } from '@/components/layout/Header';
import { ordersApi, OrderDTO } from '@/api/orders';
import { paymentsApi, PaymentDetailsDTO } from '@/api/payments';
import styles from './checkout.module.css';

export default function CheckoutPage() {
  const { orderId } = useParams() as { orderId: string };
  const { token, isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [payment, setPayment] = useState<PaymentDetailsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX');
  const [copied, setCopied] = useState(false);

  const fetchOrderData = useCallback(async () => {
    if (!token || !orderId) return;
    try {
      const orderData = await ordersApi.getOrderById(orderId, token);
      setOrder(orderData);

      // Tenta buscar pagamento existente
      try {
        const paymentData = await paymentsApi.getPaymentByOrderId(orderId, token);
        setPayment(paymentData);
      } catch {
        // Sem pagamento anterior ainda
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao carregar detalhes do pedido.', 'Erro');
    } finally {
      setLoading(false);
    }
  }, [orderId, token, toast]);

  useEffect(() => {
    if (isInitializing) return;
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    fetchOrderData();
  }, [isAuthenticated, isInitializing, router, fetchOrderData]);

  // Polling reativo em tempo real para detectar quando o PIX for pago
  useEffect(() => {
    if (!token || !orderId || !payment || order?.status === 'PAID') return;

    const interval = setInterval(async () => {
      try {
        const updatedOrder = await ordersApi.getOrderById(orderId, token);
        if (updatedOrder.status === 'PAID' || updatedOrder.status === 'CONFIRMED') {
          setOrder(updatedOrder);
          toast.success('Pagamento confirmado com sucesso!', 'Sucesso');
          clearInterval(interval);
        }
      } catch {
        // Silencioso no polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [token, orderId, payment, order?.status, toast]);

  const handleGeneratePayment = async () => {
    if (!token || !order) return;
    setProcessing(true);

    try {
      const paymentResult = await paymentsApi.checkout(
        {
          orderId: order.id,
          method: selectedMethod,
        },
        token
      );

      setPayment(paymentResult);
      toast.success(
        selectedMethod === 'PIX'
          ? 'Código PIX gerado! Efetue o pagamento no seu banco.'
          : 'Pagamento processado!',
        'Pronto'
      );
    } catch (err: any) {
      toast.error(err.message || 'Falha ao processar pagamento.', 'Erro');
    } finally {
      setProcessing(false);
    }
  };

  const handleCopyPix = () => {
    if (!payment?.pixCopyPaste) return;
    navigator.clipboard.writeText(payment.pixCopyPaste);
    setCopied(true);
    toast.success('Chave PIX Copia e Cola copiada!', 'Copiado');
    setTimeout(() => setCopied(false), 3000);
  };

  if (loading || isInitializing) {
    return (
      <div className={styles.container}>
        <Header />
        <main className={styles.mainContent}>
          <p className="profile-loading" role="status">Carregando checkout do pedido…</p>
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.container}>
        <Header />
        <main className={styles.mainContent}>
          <div className={styles.card}>
            <h2>Pedido não encontrado</h2>
            <Link href="/orders" className={styles.trackOrderBtn}>Voltar aos Meus Pedidos</Link>
          </div>
        </main>
      </div>
    );
  }

  const isPaid = order.status === 'PAID' || order.status === 'CONFIRMED' || order.status === 'PREPARING';

  return (
    <div className={styles.container}>
      <Header />

      <main className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>
            💳 Finalizar Pagamento
          </h1>
          <p className={styles.pageSubtitle}>
            Pedido #{order.id.slice(0, 8)} • Conclua sua compra segura
          </p>
        </div>

        {isPaid ? (
          <div className={`${styles.card} ${styles.paidState}`}>
            <div className={styles.paidIcon}>🎉</div>
            <h2 className={styles.paidTitle}>Pagamento Confirmado!</h2>
            <p className={styles.paidText}>
              Seu pedido já foi pago e aguarda confirmação do estabelecimento parceiro.
            </p>
            <Link href="/orders" className={styles.trackOrderBtn}>
              Acompanhar Meus Pedidos
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {/* Lado Esquerdo: Resumo do Pedido com Trava AllergenEngine */}
            <div className={styles.card}>
              <div className={styles.cardTitle}>
                <span>Resumo da Cesta</span>
                <span
                  className={`${styles.safetyBadge} ${
                    order.allergenCheckVerdict === 'SAFE'
                      ? styles.safetyBadgeSafe
                      : styles.safetyBadgeWarning
                  }`}
                >
                  🛡️ {order.allergenCheckVerdict === 'SAFE' ? 'Verificado Seguro' : 'Atenção Traços'}
                </span>
              </div>

              <ul className={styles.itemList}>
                {order.items.map((item) => (
                  <li key={item.id} className={styles.itemRow}>
                    <div>
                      <span className={styles.itemName}>{item.productName}</span>
                      <span className={styles.itemQuantity}>x{item.quantity}</span>
                    </div>
                    <span className={styles.itemPrice}>
                      R$ {item.totalPrice.toFixed(2).replace('.', ',')}
                    </span>
                  </li>
                ))}
              </ul>

              {order.notes && (
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}>
                  <strong>Observação:</strong> {order.notes}
                </p>
              )}

              <div className={styles.costBreakdown}>
                <div className={styles.costRow}>
                  <span>Subtotal de Produtos</span>
                  <span>R$ {order.subtotalAmount.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className={styles.costRow}>
                  <span>Taxa de Entrega</span>
                  <span>R$ {order.deliveryFee.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className={styles.totalRow}>
                  <span>Total do Pedido</span>
                  <span className={styles.totalPrice}>
                    R$ {order.totalAmount.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </div>

            {/* Lado Direito: Opções de Pagamento e PIX Dinâmico */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Forma de Pagamento</h2>

              {!payment ? (
                <div>
                  <div className={styles.methodSelector}>
                    <button
                      type="button"
                      className={`${styles.methodBtn} ${
                        selectedMethod === 'PIX' ? styles.methodBtnSelected : ''
                      }`}
                      onClick={() => setSelectedMethod('PIX')}
                    >
                      <span style={{ fontSize: '1.5rem' }}>⚡</span>
                      <span>PIX Dinâmico</span>
                      <small style={{ fontSize: '0.75rem', color: 'var(--color-emerald)' }}>
                        Aprovação Imediata
                      </small>
                    </button>

                    <button
                      type="button"
                      className={`${styles.methodBtn} ${
                        selectedMethod === 'CREDIT_CARD' ? styles.methodBtnSelected : ''
                      }`}
                      onClick={() => setSelectedMethod('CREDIT_CARD')}
                    >
                      <span style={{ fontSize: '1.5rem' }}>💳</span>
                      <span>Cartão de Crédito</span>
                      <small style={{ fontSize: '0.75rem' }}>Token Seguro</small>
                    </button>
                  </div>

                  <button
                    type="button"
                    className={styles.payButton}
                    onClick={handleGeneratePayment}
                    disabled={processing}
                  >
                    {processing ? 'Processando…' : `Gerar Cobrança (R$ ${order.totalAmount.toFixed(2).replace('.', ',')})`}
                  </button>
                </div>
              ) : (
                <div className={styles.pixContainer}>
                  {payment.pixQrCode && (
                    <div className={styles.pixQrWrapper}>
                      {/* Exibe o QR Code dinâmico do Asaas */}
                      {payment.pixQrCode.startsWith('http') || payment.pixQrCode.startsWith('data:') ? (
                        <img
                          src={payment.pixQrCode}
                          alt="QR Code PIX para pagamento"
                          width={200}
                          height={200}
                          style={{ display: 'block' }}
                        />
                      ) : (
                        <img
                          src={`data:image/png;base64,${payment.pixQrCode}`}
                          alt="QR Code PIX para pagamento"
                          width={200}
                          height={200}
                          style={{ display: 'block' }}
                        />
                      )}
                    </div>
                  )}

                  <div className={styles.pixTimer}>
                    ⏳ Aguardando confirmação do banco em tempo real…
                  </div>

                  {payment.pixCopyPaste && (
                    <div className={styles.copyPasteBox}>
                      <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                        PIX Copia e Cola:
                      </label>
                      <div className={styles.copyInputWrapper}>
                        <input
                          type="text"
                          readOnly
                          value={payment.pixCopyPaste}
                          className={styles.pixCodeInput}
                        />
                        <button
                          type="button"
                          className={styles.copyBtn}
                          onClick={handleCopyPix}
                        >
                          {copied ? 'Copiado!' : 'Copiar'}
                        </button>
                      </div>
                    </div>
                  )}

                  <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Abra o app do seu banco, escolha a opção "PIX Copia e Cola" ou aponte a câmera para o QR Code.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
