'use client';
// frontend/web-app/src/app/checkout/[orderId]/page.tsx
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { Header } from '@/components/layout/Header';
import { ordersApi, OrderDTO } from '@/api/orders';
import { paymentsApi, PaymentDetailsDTO } from '@/api/payments';
import {
  CreditCardIcon,
  PixIcon,
  BikeIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ClockIcon,
  RefreshIcon,
  LockIcon,
  AlertTriangleIcon,
  BanknoteIcon,
} from '@/components/layout/icons';
import styles from './checkout.module.css';

function CheckoutPageContent() {
  const { orderId } = useParams() as { orderId: string };
  const searchParams = useSearchParams();
  const initialMethod =
    searchParams.get('method') === 'CREDIT_CARD'
      ? 'CREDIT_CARD'
      : searchParams.get('method') === 'DELIVERY'
      ? 'DELIVERY'
      : 'PIX';
  const { token, isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [payment, setPayment] = useState<PaymentDetailsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'PIX' | 'CREDIT_CARD' | 'DELIVERY'>(initialMethod);
  const [deliveryType, setDeliveryType] = useState<'CARD_ON_DELIVERY' | 'CASH_ON_DELIVERY'>('CARD_ON_DELIVERY');
  const [changeFor, setChangeFor] = useState('');
  const [deliveryBlockedReason, setDeliveryBlockedReason] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrLoadFailed, setQrLoadFailed] = useState(false);

  useEffect(() => {
    const methodParam = searchParams.get('method');
    if (methodParam === 'CREDIT_CARD') {
      setSelectedMethod('CREDIT_CARD');
    } else if (methodParam === 'DELIVERY') {
      setSelectedMethod('DELIVERY');
    } else if (methodParam === 'PIX') {
      setSelectedMethod('PIX');
    }
  }, [searchParams]);

  // Estados do Cartão
  const [cardType, setCardType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [installments, setInstallments] = useState(1);

  const detectCardBrand = (num: string): string => {
    const clean = num.replace(/\D/g, '');
    if (clean.startsWith('4')) return 'Visa';
    if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[01]|2720)/.test(clean)) return 'Mastercard';
    if (/^(4011|4389|5041|5067|5090|6277|6362|6363|650|6516|6550)/.test(clean)) return 'Elo';
    if (/^3[47]/.test(clean)) return 'Amex';
    if (/^(606282|3841)/.test(clean)) return 'Hipercard';
    return clean.length >= 4 ? 'Cartão' : '';
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 16) val = val.slice(0, 16);
    const parts = val.match(/.{1,4}/g);
    setCardNumber(parts ? parts.join(' ') : val);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.slice(0, 4);
    if (val.length >= 3) {
      setCardExpiry(`${val.slice(0, 2)}/${val.slice(2)}`);
    } else {
      setCardExpiry(val);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardCvv(val);
  };

  const getQrCodeSrc = () => {
    if (!payment) return '';
    if (qrLoadFailed && payment.pixCopyPaste) {
      return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(payment.pixCopyPaste)}`;
    }
    if (payment.pixQrCode) {
      if (payment.pixQrCode.startsWith('http') || payment.pixQrCode.startsWith('data:')) {
        return payment.pixQrCode;
      }
      return `data:image/png;base64,${payment.pixQrCode}`;
    }
    if (payment.pixCopyPaste) {
      return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(payment.pixCopyPaste)}`;
    }
    return '';
  };

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

  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number | null>(null);

  // Countdown timer regressivo de 10 minutos para seleção e pagamento
  useEffect(() => {
    if (!order || (order.status !== 'CREATED' && order.status !== 'AWAITING_PAYMENT')) {
      setTimeLeftSeconds(null);
      return;
    }

    const calculateRemaining = () => {
      const createdTime = new Date(order.createdAt).getTime();
      const expirationTime = createdTime + 10 * 60 * 1000; // 10 minutos limite
      const remaining = Math.max(0, Math.floor((expirationTime - Date.now()) / 1000));
      return remaining;
    };

    setTimeLeftSeconds(calculateRemaining());

    const timer = setInterval(() => {
      const remaining = calculateRemaining();
      setTimeLeftSeconds(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        fetchOrderData();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [order?.createdAt, order?.status, fetchOrderData]);

  // Polling reativo em tempo real para detectar quando o PIX for pago ou cancelado
  useEffect(() => {
    if (!token || !orderId || order?.status === 'PAID' || order?.status === 'CANCELLED') return;

    const interval = setInterval(async () => {
      try {
        const updatedOrder = await ordersApi.getOrderById(orderId, token);
        if (updatedOrder.status === 'PAID' || updatedOrder.status === 'CONFIRMED') {
          setOrder(updatedOrder);
          toast.success('Pagamento confirmado com sucesso!', 'Sucesso');
          clearInterval(interval);
        } else if (updatedOrder.status === 'CANCELLED') {
          setOrder(updatedOrder);
          toast.error(
            updatedOrder.cancelReason || 'Este pedido foi cancelado automaticamente por expiração.',
            'Pedido Cancelado'
          );
          clearInterval(interval);
        }
      } catch {
        // Silencioso no polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [token, orderId, order?.status, toast]);

  const handleGeneratePix = async (forceNew = false) => {
    if (!token || !order) return;
    if (order.totalAmount <= 0) {
      toast.error('O valor do pedido deve ser maior que zero para gerar o PIX.', 'Valor Inválido');
      return;
    }
    setProcessing(true);

    try {
      const paymentResult = await paymentsApi.checkout(
        {
          orderId: order.id,
          method: 'PIX',
          forceNew,
        },
        token
      );

      setPayment(paymentResult);
      setQrLoadFailed(false);
      toast.success(
        forceNew ? 'Novo QR Code PIX gerado com sucesso!' : 'Código PIX gerado! Efetue o pagamento no seu banco.',
        'PIX Gerado'
      );
    } catch (err: any) {
      toast.error(err.message || 'Falha ao gerar cobrança PIX.', 'Erro');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayWithCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !order) return;
    if (order.totalAmount <= 0) {
      toast.error('O valor do pedido deve ser maior que zero para processar pagamento com cartão.', 'Valor Inválido');
      return;
    }

    const cleanCard = cardNumber.replace(/\D/g, '');
    if (cleanCard.length < 13) {
      toast.error('Número de cartão inválido (mínimo 13 dígitos).', 'Erro no Cartão');
      return;
    }
    if (!cardHolder.trim()) {
      toast.error('Informe o nome do titular como impresso no cartão.', 'Erro no Cartão');
      return;
    }
    if (cardExpiry.length < 5) {
      toast.error('Validade deve estar no formato MM/AA.', 'Erro no Cartão');
      return;
    }
    const [month] = cardExpiry.split('/').map(Number);
    if (!month || month < 1 || month > 12) {
      toast.error('Mês de validade inválido.', 'Erro no Cartão');
      return;
    }
    if (cardCvv.length < 3) {
      toast.error('Código CVV inválido (3 ou 4 dígitos).', 'Erro no Cartão');
      return;
    }

    setProcessing(true);
    try {
      const brand = detectCardBrand(cleanCard) || 'card';
      const fakeToken = `tok_${brand.toLowerCase()}_${cleanCard.slice(-4)}_${Date.now()}`;
      const paymentResult = await paymentsApi.checkout(
        {
          orderId: order.id,
          method: 'CREDIT_CARD',
          creditCardToken: fakeToken,
        },
        token
      );

      setPayment(paymentResult);
      setOrder((prev) => (prev ? { ...prev, status: 'PAID' } : null));
      toast.success(
        cardType === 'DEBIT' ? 'Pagamento com Cartão de Débito aprovado!' : 'Pagamento com Cartão de Crédito aprovado!',
        'Pagamento Confirmado'
      );
    } catch (err: any) {
      toast.error(err.message || 'Falha ao processar pagamento com cartão.', 'Erro');
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckoutDelivery = async () => {
    if (!token || !order) return;
    if (order.totalAmount <= 0) {
      toast.error('O valor do pedido deve ser maior que zero para confirmar o pedido na entrega.', 'Valor Inválido');
      return;
    }
    setProcessing(true);
    setDeliveryBlockedReason(null);

    const changeVal = changeFor.trim() ? parseFloat(changeFor.replace(',', '.')) : undefined;
    if (deliveryType === 'CASH_ON_DELIVERY' && changeVal !== undefined && changeVal < order.totalAmount) {
      toast.error('O valor para troco deve ser maior ou igual ao total do pedido.', 'Atenção ao Troco');
      setProcessing(false);
      return;
    }

    try {
      const paymentResult = await paymentsApi.checkout(
        {
          orderId: order.id,
          method: deliveryType,
          changeFor: changeVal,
        },
        token
      );

      setPayment(paymentResult);
      setOrder((prev) => (prev ? { ...prev, status: 'CONFIRMED' } : null));
      toast.success(
        deliveryType === 'CARD_ON_DELIVERY'
          ? 'Pedido confirmado! Pague na maquininha ao receber.'
          : 'Pedido confirmado! Pague em dinheiro na entrega.',
        'Pedido Confirmado'
      );
    } catch (err: any) {
      const msg = err.message || 'Falha ao processar pagamento na entrega.';
      if (msg.includes('indisponível para esta conta') || msg.includes('indisponível')) {
        setDeliveryBlockedReason(msg);
      }
      toast.error(msg, 'Erro');
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
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className={styles.container}>
      <Header />

      <main className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCardIcon size={24} />
            <span>Finalizar Pagamento</span>
          </h1>
          <p className={styles.pageSubtitle}>
            Pedido #{order.id.slice(0, 8)} • Conclua sua compra segura
          </p>
        </div>

        {isCancelled ? (
          <div className={`${styles.card} ${styles.paidState}`}>
            <div className={styles.paidIcon} style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
              <AlertTriangleIcon size={48} style={{ color: '#ef4444' }} />
            </div>
            <h2 className={styles.paidTitle} style={{ color: '#ef4444' }}>Pedido Cancelado</h2>
            <p className={styles.paidText}>
              {order.cancelReason || 'Este pedido foi cancelado automaticamente por expiração de tempo.'}
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <Link href="/orders" className={styles.trackOrderBtn}>
                Ver Meus Pedidos
              </Link>
              <Link href="/public-partners" className={styles.trackOrderBtn} style={{ background: 'var(--color-primary, #059669)', color: '#ffffff' }}>
                Novo Pedido no Catálogo
              </Link>
            </div>
          </div>
        ) : isPaid ? (
          <div className={`${styles.card} ${styles.paidState}`}>
            <div className={styles.paidIcon}>
              <CheckCircleIcon size={48} style={{ color: '#10b981' }} />
            </div>
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
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <ShieldCheckIcon size={14} />
                  <span>{order.allergenCheckVerdict === 'SAFE' ? 'Verificado Seguro' : 'Atenção Traços'}</span>
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

            {/* Lado Direito: Opções de Pagamento e Abas */}
            <div className={styles.card}>
              {timeLeftSeconds !== null && timeLeftSeconds > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    backgroundColor: timeLeftSeconds < 180 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                    border: `1px solid ${timeLeftSeconds < 180 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                    color: timeLeftSeconds < 180 ? '#ef4444' : '#d97706',
                    marginBottom: '1.25rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ClockIcon size={18} />
                    <span>Tempo para concluir o pagamento:</span>
                  </div>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {Math.floor(timeLeftSeconds / 60)}:{(timeLeftSeconds % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              )}

              <h2 className={styles.cardTitle}>Forma de Pagamento</h2>

              {/* Seletor de Métodos (Abas) */}
              <div className={styles.methodSelector}>
                <button
                  type="button"
                  className={`${styles.methodBtn} ${
                    selectedMethod === 'PIX' ? styles.methodBtnSelected : ''
                  }`}
                  onClick={() => setSelectedMethod('PIX')}
                >
                  <PixIcon size={22} />
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
                  <CreditCardIcon size={22} />
                  <span>Cartão</span>
                  <small style={{ fontSize: '0.75rem' }}>Crédito ou Débito</small>
                </button>

                <button
                  type="button"
                  className={`${styles.methodBtn} ${
                    selectedMethod === 'DELIVERY' ? styles.methodBtnSelected : ''
                  }`}
                  onClick={() => setSelectedMethod('DELIVERY')}
                >
                  <BikeIcon size={22} />
                  <span>Na Entrega</span>
                  <small style={{ fontSize: '0.75rem' }}>Dinheiro / Maquininha</small>
                </button>
              </div>

              {/* Conteúdo da Aba PIX */}
              {selectedMethod === 'PIX' && (
                payment && payment.method === 'PIX' && (payment.pixQrCode || payment.pixCopyPaste) ? (
                  <div className={styles.pixContainer}>
                    <div className={styles.pixQrWrapper}>
                      <img
                        src={getQrCodeSrc()}
                        alt="QR Code PIX para pagamento"
                        width={220}
                        height={220}
                        onError={() => setQrLoadFailed(true)}
                        style={{ display: 'block', margin: '0 auto', borderRadius: '8px' }}
                      />
                    </div>

                    <div className={styles.pixTimer} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <ClockIcon size={14} />
                      <span>Aguardando confirmação do banco em tempo real…</span>
                    </div>

                    {payment.pixCopyPaste && (
                      <div className={styles.copyPasteBox}>
                        <label className={styles.label}>
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

                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                      Abra o app do seu banco, escolha a opção "PIX Copia e Cola" ou aponte a câmera para o QR Code.
                    </p>

                    <button
                      type="button"
                      className={styles.regeneratePixBtn}
                      onClick={() => handleGeneratePix(true)}
                      disabled={processing}
                      title="Clique aqui para atualizar ou gerar um novo QR Code caso tenha expirado ou falhado na leitura"
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      {processing ? 'Atualizando…' : (
                        <>
                          <RefreshIcon size={14} />
                          <span>Gerar Novamente o QR Code</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
                      Pague instantaneamente via PIX com aprovação imediata e sem taxas adicionais.
                    </p>
                    <button
                      type="button"
                      className={styles.payButton}
                      onClick={() => handleGeneratePix(false)}
                      disabled={processing}
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      {processing ? 'Gerando…' : (
                        <>
                          <PixIcon size={16} />
                          <span>Gerar Código PIX (R$ {order.totalAmount.toFixed(2).replace('.', ',')})</span>
                        </>
                      )}
                    </button>
                  </div>
                )
              )}

              {/* Conteúdo da Aba Cartão de Crédito / Débito */}
              {selectedMethod === 'CREDIT_CARD' && (
                <form onSubmit={handlePayWithCard} className={styles.cardForm}>
                  <div className={styles.typeSelector}>
                    <button
                      type="button"
                      className={`${styles.typePill} ${cardType === 'CREDIT' ? styles.typePillActive : ''}`}
                      onClick={() => setCardType('CREDIT')}
                    >
                      Crédito
                    </button>
                    <button
                      type="button"
                      className={`${styles.typePill} ${cardType === 'DEBIT' ? styles.typePillActive : ''}`}
                      onClick={() => setCardType('DEBIT')}
                    >
                      Débito
                    </button>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Número do Cartão</label>
                    <div className={styles.cardInputWrapper}>
                      <input
                        type="text"
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        className={styles.input}
                        maxLength={19}
                        required
                      />
                      {cardNumber.length >= 4 && (
                        <span className={styles.brandBadge}>
                          {detectCardBrand(cardNumber)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Nome Impresso no Cartão</label>
                    <input
                      type="text"
                      placeholder="EX: MARIA S SILVA"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                      className={styles.input}
                      required
                    />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Validade</label>
                      <input
                        type="text"
                        placeholder="MM/AA"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        className={styles.input}
                        maxLength={5}
                        autoComplete="cc-exp"
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>CVV</label>
                      <input
                        type="password"
                        placeholder="123"
                        value={cardCvv}
                        onChange={handleCvvChange}
                        className={styles.input}
                        maxLength={4}
                        autoComplete="cc-csc"
                        required
                      />
                    </div>
                  </div>

                  {cardType === 'CREDIT' && (
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Parcelas</label>
                      <select
                        className={styles.input}
                        value={installments}
                        onChange={(e) => setInstallments(Number(e.target.value))}
                      >
                        <option value={1}>
                          1x de R$ {order.totalAmount.toFixed(2).replace('.', ',')} sem juros
                        </option>
                        {order.totalAmount >= 60 && (
                          <option value={2}>
                            2x de R$ {(order.totalAmount / 2).toFixed(2).replace('.', ',')} sem juros
                          </option>
                        )}
                        {order.totalAmount >= 90 && (
                          <option value={3}>
                            3x de R$ {(order.totalAmount / 3).toFixed(2).replace('.', ',')} sem juros
                          </option>
                        )}
                      </select>
                    </div>
                  )}

                  <button
                    type="submit"
                    className={styles.payCardSubmitButton}
                    disabled={processing}
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    {processing ? 'Processando…' : (
                      <>
                        <LockIcon size={14} />
                        <span>Pagar R$ {order.totalAmount.toFixed(2).replace('.', ',')} com Cartão</span>
                      </>
                    )}
                  </button>

                  <div className={styles.securityNote} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <LockIcon size={13} />
                    <span>Ambiente criptografado e seguro (PCI-DSS)</span>
                  </div>
                </form>
              )}

              {/* Conteúdo da Aba Pagamento na Entrega */}
              {selectedMethod === 'DELIVERY' && (
                <div className={styles.deliveryContainer}>
                  {deliveryBlockedReason ? (
                    <div className={styles.blockedAlert}>
                      <span className={styles.blockedAlertIcon}>
                        <AlertTriangleIcon size={20} />
                      </span>
                      <div>
                        <strong>Pagamento na Entrega Indisponível</strong>
                        <p style={{ marginTop: '0.35rem', fontSize: '0.85rem', lineHeight: '1.4' }}>
                          Esta conta não está autorizada a pagar na entrega devido a ocorrências anteriores de não pagamento.
                          Por favor, utilize as abas <strong>PIX Dinâmico</strong> ou <strong>Cartão</strong> acima para concluir seu pedido.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        Escolha como deseja pagar ao entregador no momento do recebimento:
                      </p>

                      <div className={styles.deliveryOptionsGrid}>
                        <div
                          className={`${styles.deliveryCard} ${
                            deliveryType === 'CARD_ON_DELIVERY' ? styles.deliveryCardSelected : ''
                          }`}
                          onClick={() => setDeliveryType('CARD_ON_DELIVERY')}
                        >
                          <CreditCardIcon size={26} />
                          <span style={{ fontWeight: 700 }}>Maquininha</span>
                          <small style={{ fontSize: '0.75rem', opacity: 0.8 }}>Crédito ou Débito</small>
                        </div>

                        <div
                          className={`${styles.deliveryCard} ${
                            deliveryType === 'CASH_ON_DELIVERY' ? styles.deliveryCardSelected : ''
                          }`}
                          onClick={() => setDeliveryType('CASH_ON_DELIVERY')}
                        >
                          <BanknoteIcon size={26} />
                          <span style={{ fontWeight: 700 }}>Dinheiro</span>
                          <small style={{ fontSize: '0.75rem', opacity: 0.8 }}>Com ou sem troco</small>
                        </div>
                      </div>

                      {deliveryType === 'CASH_ON_DELIVERY' && (
                        <div className={styles.changeBox}>
                          <label className={styles.label} htmlFor="changeForInput">
                            Precisa de troco? Para quanto?
                          </label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 700, color: 'var(--color-text-muted)' }}>R$</span>
                            <input
                              id="changeForInput"
                              type="text"
                              inputMode="decimal"
                              placeholder={`Ex: ${(order.totalAmount + 20).toFixed(2).replace('.', ',')} (ou deixe vazio se não precisar)`}
                              value={changeFor}
                              onChange={(e) => setChangeFor(e.target.value)}
                              className={styles.input}
                              style={{ width: '100%' }}
                            />
                          </div>
                          <small style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                            Total do pedido: R$ {order.totalAmount.toFixed(2).replace('.', ',')}. Se você tiver o valor exato em dinheiro, pode deixar este campo vazio.
                          </small>
                        </div>
                      )}

                      {order.totalAmount <= 0 ? (
                        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <AlertTriangleIcon size={14} />
                          <span>Este pedido possui valor R$ 0,00 e não pode ser finalizado.</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className={styles.payButton}
                          onClick={handleCheckoutDelivery}
                          disabled={processing || order.totalAmount <= 0}
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                          {processing ? (
                            'Confirmando pedido…'
                          ) : (
                            <>
                              <BikeIcon size={16} />
                              <span>Confirmar Pedido na Entrega (R$ {order.totalAmount.toFixed(2).replace('.', ',')})</span>
                            </>
                          )}
                        </button>
                      )}

                      <div className={styles.securityNote} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <ShieldCheckIcon size={14} />
                        <span>Ao confirmar, o estabelecimento iniciará o preparo imediatamente. Pagamento no ato da entrega.</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<p className="profile-loading">Carregando checkout do pedido…</p>}>
      <CheckoutPageContent />
    </Suspense>
  );
}
