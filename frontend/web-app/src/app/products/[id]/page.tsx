'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { catalogApi, ProductDetails } from '@/api/catalog';
import { partnerApi, PartnerSummary } from '@/api/partner';
import { compatibilityApi, CompatibilityResponse } from '@/api/compatibility';
import { ordersApi } from '@/api/orders';
import { apiClient } from '@/api/client';
import { Header } from '@/components/layout/Header';
import { RiskBadge } from '@/components/compatibility/RiskBadge';
import { FavoriteButton } from '@/components/common/FavoriteButton';
import { ReportModal } from '@/components/common/ReportModal';
import { ReviewsList } from '@/components/common/ReviewsList';
import { CreateProductModal } from '@/components/common/CreateProductModal';
import { useToast } from '@/hooks/useToast';
import { translateReasoning, translateConflictReason, translateAllergen } from '@/utils/compatibilityTranslator';
import { saveRecentCheck } from '@/services/recentChecks';
import {
  ShieldCheckIcon,
  ShieldIcon,
  AlertTriangleIcon,
  BuildingIcon,
  BanIcon,
  InfoIcon,
  LockIcon,
  ClockIcon,
  ShoppingCartIcon,
  ScrollIcon,
  WheatIcon,
  MilkIcon,
  FlaskIcon,
  FileTextIcon,
  CheckCircleIcon,
} from '@/components/layout/icons';
import styles from '../../dashboard/dashboard.module.css';

interface PageProps {
  params: { id: string };
}

function ProductDetailsContent({ params }: PageProps) {
  const productId = params?.id;

  const { token, userId, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const fromParam = searchParams.get('from');

  const handleBack = () => {
    if (fromParam === 'public-partners') {
      router.push('/public-partners?tab=products');
    } else if (fromParam === 'dashboard') {
      router.push('/dashboard');
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  };

  const backLabel = fromParam === 'public-partners'
    ? '← Voltar aos Produtos Ofertados'
    : fromParam === 'dashboard'
    ? '← Voltar ao Dashboard'
    : '← Voltar';

  const [userRole, setUserRole] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [sellerPartner, setSellerPartner] = useState<PartnerSummary | null>(null);
  const [compatibility, setCompatibility] = useState<CompatibilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [submittingOrder, setSubmittingOrder] = useState<boolean>(false);

  useEffect(() => {
    if (isAuthenticated && token) {
      apiClient.get<any>('/iam/me', token)
        .then((u) => {
          setUserRole(u?.role || null);
        })
        .catch(() => {});
    }
  }, [isAuthenticated, token]);

  const canEdit = isAuthenticated && (userRole === 'ADMIN' || userRole === 'PARCEIRO');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let role = userRole;
      if (isAuthenticated && token && !role) {
        try {
          const u = await apiClient.get<any>('/iam/me', token);
          role = u?.role || null;
          setUserRole(role);
        } catch (_) {}
      }

      const prodData = await catalogApi.getById(productId, token || undefined);
      setProduct(prodData);

      if (prodData?.partnerId) {
        try {
          const partnerData = await partnerApi.get(prodData.partnerId, token || undefined);
          setSellerPartner(partnerData);
        } catch {
          setSellerPartner(null);
        }
      } else {
        setSellerPartner(null);
      }

      // A análise de compatibilidade pertence exclusivamente a consumidores (CELIACO)
      // Parceiros e administradores gerenciam o catálogo e não possuem restrições pessoais
      if (isAuthenticated && token && userId && role === 'CELIACO') {
        try {
          const comp = await compatibilityApi.check({ userId, productId }, token);
          setCompatibility(comp);
          if (prodData) {
            saveRecentCheck(
              {
                productId: prodData.id,
                productName: prodData.name,
                riskLevel: comp.riskLevel,
              },
              userId
            );
          }
        } catch (_) {
          // Perfil incompleto do celíaco
          setCompatibility(null);
        }
      } else {
        setCompatibility(null);
      }
    } catch (err: any) {
      toast.error('Erro ao carregar detalhes do produto.', 'Erro');
    } finally {
      setLoading(false);
    }
  }, [productId, token, userId, isAuthenticated, userRole, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div>
        <Header />
        <main className={styles.container} style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <p>Carregando informações do produto...</p>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div>
        <Header />
        <main className={styles.container} style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <h2>Produto não encontrado</h2>
          <p>O produto solicitado não foi localizado no catálogo.</p>
          <button
            type="button"
            onClick={handleBack}
            className="btn btn-em"
            style={{ marginTop: '1rem', display: 'inline-block', cursor: 'pointer' }}
          >
            {backLabel}
          </button>
        </main>
      </div>
    );
  }

  const handleBuyNow = async () => {
    if (!isAuthenticated || !token) {
      router.push(`/auth/login?redirect=/products/${productId}`);
      return;
    }

    if (!product?.partnerId) {
      toast.error('Este produto não possui estabelecimento parceiro cadastrado para envio.');
      return;
    }

    if (unitPrice <= 0) {
      toast.error('Este produto está com valor sob consulta e não pode ser adquirido diretamente pelo checkout online.');
      return;
    }

    try {
      setSubmittingOrder(true);
      const res = await ordersApi.createOrder(
        {
          partnerId: product.partnerId,
          items: [{ productId: product.id, quantity }],
        },
        token
      );

      const targetOrderId = (res as any).orderId || res.id;
      toast.success('Pedido iniciado com sucesso! Redirecionando para o pagamento...');
      router.push(`/checkout/${targetOrderId}`);
    } catch (err: any) {
      toast.error(
        err?.message || 'Não foi possível iniciar o pedido deste produto. Verifique sua conexão ou tente novamente.',
        'Erro ao Fazer Pedido'
      );
    } finally {
      setSubmittingOrder(false);
    }
  };

  const isCeliaco = userRole === 'CELIACO';
  const isPurchaseBlocked =
    isCeliaco &&
    compatibility !== null &&
    (!compatibility.isCompatible ||
      compatibility.riskLevel === 'BLOCKED' ||
      compatibility.riskLevel === 'DANGER');

  const unitPrice = typeof product.price === 'number' && product.price > 0 ? product.price : 0;
  const subtotal = unitPrice * quantity;

  const handleOpenReport = async () => {
    if (!isAuthenticated || !token) {
      alert('Você precisa estar autenticado para denunciar um produto.');
      return;
    }

    try {
      const me = await apiClient.get<any>('/iam/me', token);
      if (me && me.isEmailVerified === false) {
        alert('É obrigatório validar seu endereço de e-mail com o código OTP antes de denunciar qualquer produto.');
        return;
      }
    } catch {
      // prossegue em caso de falha de rede temporária
    }

    setIsReportModalOpen(true);
  };

  return (
    <div>
      <Header />

      <main className={styles.container} style={{ maxWidth: '900px', width: '100%', boxSizing: 'border-box', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ width: '100%', marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={handleBack}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              color: 'var(--color-emerald)',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
            id="product-back-btn"
          >
            {backLabel}
          </button>
        </div>

        {/* Card Principal do Produto */}
        <div className={styles.card} style={{ width: '100%', boxSizing: 'border-box', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {product.category || 'Alimentos e Bebidas'}
              </span>
              <h1 style={{ fontSize: '1.8rem', color: 'var(--color-text)', margin: '0.25rem 0 0.5rem 0' }}>
                {product.name}
              </h1>
              <div style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span>Marca: <strong style={{ color: 'var(--color-text)' }}>{product.brand}</strong></span>
                {sellerPartner && (
                  <>
                    <span>•</span>
                    <span>
                      Estabelecimento:{' '}
                      <Link href={`/public-partners/${sellerPartner.id}`} style={{ color: 'var(--color-emerald)', fontWeight: 600, textDecoration: 'none' }}>
                        {sellerPartner.name}
                      </Link>
                    </span>
                  </>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="btn btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '999px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  title="Editar informações do produto"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  Editar
                </button>
              )}
              <FavoriteButton productId={product.id} />
              <button
                type="button"
                onClick={handleOpenReport}
                className="btn btn-ghost"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '999px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-danger)',
                  border: '1px solid var(--color-danger-border)',
                  background: 'var(--color-danger-bg)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                title="Denunciar Produto"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
                Denunciar
              </button>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '1.5rem 0' }} />

          {/* Veredito de Compatibilidade Alimentar (Condicional por Papel do Usuário) */}
          {isAuthenticated && userRole === 'CELIACO' ? (
            <div style={{ background: 'var(--color-elevated)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheckIcon size={18} /> Análise de Compatibilidade Alimentar
              </h3>
              {compatibility ? (
                <>
                  <RiskBadge riskLevel={compatibility.riskLevel} showDescription={true} />
                  <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px dotted var(--color-border)' }}>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-text)' }}>
                      {translateReasoning(compatibility.reasoning)}
                    </p>
                    {compatibility.conflicts?.map((conflict, index) => (
                      <div key={index} style={{ marginTop: '0.5rem', color: 'var(--color-danger)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangleIcon size={14} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
                        <span><strong>{translateAllergen(conflict.allergen)}:</strong> {translateConflictReason(conflict.reason)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div>
                  <RiskBadge riskLevel="UNEVALUATED" showDescription={true} />
                  <div style={{ marginTop: '0.75rem' }}>
                    <Link href="/profile" style={{ color: 'var(--color-emerald)', fontSize: '0.875rem', fontWeight: 600 }}>
                      Configurar restrições no perfil alimentar →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : isAuthenticated && userRole === 'PARCEIRO' ? (
            <div
              style={{
                background: 'var(--color-elevated)',
                padding: '1.1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem',
                borderLeft: '4px solid var(--color-brand-gold)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <BuildingIcon size={20} style={{ color: 'var(--color-brand-gold)' }} />
                <h3 style={{ fontSize: '1rem', color: 'var(--color-text)', margin: 0 }}>
                  Visão do Estabelecimento Parceiro
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                Como parceiro comercial, você gerencia as especificações e laudos técnicos deste produto. A compatibilidade alimentar é avaliada automaticamente para cada consumidor que visualiza o item no catálogo.
              </p>
            </div>
          ) : isAuthenticated && userRole === 'ADMIN' ? (
            <div
              style={{
                background: 'var(--color-elevated)',
                padding: '1.1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem',
                borderLeft: '4px solid #3b82f6',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <ShieldIcon size={20} style={{ color: '#3b82f6' }} />
                <h3 style={{ fontSize: '1rem', color: 'var(--color-text)', margin: 0 }}>
                  Visão Administrativa (Moderação)
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                Produto cadastrado no catálogo geral da plataforma. O veredito de segurança alimentar é calculado individualmente de acordo com as restrições de cada consumidor.
              </p>
            </div>
          ) : !isAuthenticated ? (
            <div style={{ background: 'var(--color-elevated)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheckIcon size={18} /> Análise de Compatibilidade Alimentar
              </h3>
              <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                Faça login como consumidor para verificar se este produto é seguro para o seu perfil e restrições alimentares.
              </p>
              <Link href="/auth/login" className="btn btn-em" style={{ fontSize: '0.8rem', padding: '0.45rem 1rem', textDecoration: 'none', display: 'inline-block' }}>
                Entrar para verificar compatibilidade
              </Link>
            </div>
          ) : null}

          {/* Card de Preço, Quantidade e Ação de Compra com Trava Biológica */}
          <div className={styles.purchaseCard}>
            {sellerPartner && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.6rem',
                  paddingBottom: '0.9rem',
                  marginBottom: '1.25rem',
                  borderBottom: '1px solid var(--color-border)',
                  fontSize: '0.875rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text)', flexWrap: 'wrap' }}>
                  <BuildingIcon size={16} style={{ color: 'var(--color-emerald)', flexShrink: 0 }} />
                  <span>
                    Vendido e entregue por:{' '}
                    <Link
                      href={`/public-partners/${sellerPartner.id}`}
                      style={{ color: 'var(--color-text)', fontWeight: 700, textDecoration: 'underline' }}
                    >
                      {sellerPartner.name}
                    </Link>
                  </span>
                  {sellerPartner.city && (
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                      ({sellerPartner.city}{sellerPartner.state ? `, ${sellerPartner.state}` : ''})
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: 'rgba(16, 185, 129, 0.12)',
                      color: 'var(--color-emerald)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                    }}
                  >
                    <CheckCircleIcon size={12} /> Homologado
                  </span>
                  <Link
                    href={`/public-partners/${sellerPartner.id}`}
                    style={{ fontSize: '0.8rem', color: 'var(--color-emerald)', fontWeight: 600, textDecoration: 'none' }}
                  >
                    Ver catálogo do parceiro →
                  </Link>
                </div>
              </div>
            )}

            <div className={styles.purchaseHeader}>
              <div className={styles.purchasePriceGroup}>
                <span className={styles.purchasePriceLabel}>
                  {product.partnerId ? 'Preço do Item' : 'Preço de Referência Médio'}
                </span>
                <span className={styles.purchasePriceValue}>
                  {unitPrice > 0 ? (
                    `R$ ${unitPrice.toFixed(2).replace('.', ',')}`
                  ) : (
                    <span style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>Sob Consulta</span>
                  )}
                </span>
              </div>

              {!isPurchaseBlocked && product.partnerId && unitPrice > 0 && (
                <div className={styles.quantityGroup}>
                  <span className={styles.quantityLabel}>Quantidade:</span>
                  <div className={styles.quantityControls}>
                    <button
                      type="button"
                      className={styles.quantityBtn}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1 || submittingOrder}
                      aria-label="Diminuir quantidade"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      inputMode="numeric"
                      aria-label="Quantidade"
                      className={styles.quantityInput}
                      value={quantity}
                      min={1}
                      max={50}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val >= 1 && val <= 50) {
                          setQuantity(val);
                        }
                      }}
                      onBlur={() => {
                        if (!quantity || quantity < 1) setQuantity(1);
                        else if (quantity > 50) setQuantity(50);
                      }}
                      disabled={submittingOrder}
                    />
                    <button
                      type="button"
                      className={styles.quantityBtn}
                      onClick={() => setQuantity((q) => Math.min(50, q + 1))}
                      disabled={quantity >= 50 || submittingOrder}
                      aria-label="Aumentar quantidade"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Condições de Compra / Trava Biológica */}
            {isPurchaseBlocked ? (
              <div>
                <button type="button" className={styles.btnOrderBlocked} disabled>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <BanIcon size={16} /> Compra Bloqueada por Incompatibilidade Alimentar
                  </span>
                </button>
                <div className={styles.biologicalLockNotice}>
                  <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheckIcon size={16} style={{ color: 'var(--color-danger)' }} /> Trava de Segurança Biológica CeLiLac:
                  </strong>{' '}
                  Para resguardar sua saúde contra reações alérgicas graves e contaminação cruzada, o sistema impede a realização de pedidos de produtos avaliados como não seguros para o seu perfil.
                </div>
              </div>
            ) : !product.partnerId ? (
              <div
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text)' }}>
                  <InfoIcon size={18} style={{ color: 'var(--color-emerald)', flexShrink: 0 }} />
                  <strong style={{ fontSize: '0.95rem' }}>Produto Cadastrado para Consulta de Rótulo</strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                  Este item está catalogado na base geral de alimentos para verificação de alérgenos, checagem de ingredientes e conferência de rotulagem. Ele não possui um estabelecimento comercial parceiro cadastrado para entrega direta pelo aplicativo no momento.
                </p>
                <div
                  style={{
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    Para pedir alimentos com entrega segura e laudos verificados:
                  </span>
                  <Link
                    href="/public-partners"
                    className="btn btn-em"
                    style={{ fontSize: '0.85rem', padding: '0.45rem 1rem', textDecoration: 'none' }}
                  >
                    Explorar Estabelecimentos Homologados →
                  </Link>
                </div>
              </div>
            ) : !isAuthenticated ? (
              <div className={styles.purchaseFooter}>
                <div className={styles.subtotalInfo}>
                  Faça login para adicionar ao seu pedido e pagar via PIX ou Cartão.
                </div>
                <Link
                  href={`/auth/login?redirect=/products/${productId}`}
                  className={styles.btnOrderNow}
                  style={{ textDecoration: 'none' }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <LockIcon size={15} /> Entrar para Comprar
                  </span>
                </Link>
              </div>
            ) : userRole === 'PARCEIRO' || userRole === 'ADMIN' ? (
              <div className={styles.catalogOnlyNotice} style={{ borderLeft: '4px solid var(--color-brand-gold)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <BuildingIcon size={16} style={{ color: 'var(--color-brand-gold)' }} /> <strong>Visão de Gestão:</strong>
                </span>{' '}
                Pedidos com entrega e pagamento são realizados exclusivamente por consumidores. Como parceiro ou moderador, utilize este painel para verificar a apresentação do produto.
              </div>
            ) : unitPrice <= 0 ? (
              <div className={styles.catalogOnlyNotice}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <InfoIcon size={16} style={{ color: 'var(--color-primary)' }} /> <strong>Produto com Valor Sob Consulta:</strong>
                </span>{' '}
                Este item está cadastrado com valor sob consulta e não está disponível para compra direta no checkout online. Entre em contato com o estabelecimento parceiro para cotações e encomendas.
              </div>
            ) : (
              <div className={styles.purchaseFooter}>
                <div className={styles.subtotalInfo}>
                  Subtotal ({quantity} {quantity === 1 ? 'item' : 'itens'}):
                  <span className={styles.subtotalAmount}>
                    R$ {subtotal.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.btnOrderNow}
                  onClick={handleBuyNow}
                  disabled={submittingOrder}
                >
                  {submittingOrder ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <ClockIcon size={15} /> Processando Pedido...
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <ShoppingCartIcon size={15} /> Fazer Pedido / Comprar Agora
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Ficha Técnica / Detalhes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div>
              <h4 style={{ color: 'var(--color-text)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ScrollIcon size={16} /> Ingredientes
              </h4>
              <p style={{ background: 'var(--color-surface)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', color: 'var(--color-text)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                {product.ingredients || 'Ingredientes não informados.'}
              </p>
            </div>

            <div>
              <h4 style={{ color: 'var(--color-text)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangleIcon size={16} style={{ color: '#f59e0b' }} /> Classificações & Alérgenos
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li style={{ padding: '0.5rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                  <WheatIcon size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> <strong>Contém Glúten:</strong> {
                    product.hasGluten ||
                    product.declaredAllergens?.['GLUTEN'] === 'CONTAINS' ||
                    product.declaredAllergens?.['WHEAT'] === 'CONTAINS'
                      ? 'Sim'
                      : 'Não'
                  }
                </li>
                <li style={{ padding: '0.5rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                  <MilkIcon size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> <strong>Declaração de Leite:</strong> {(() => {
                    const ing = (product.ingredients || '').toLowerCase();
                    const cross = (product.crossContamination || '').toLowerCase();
                    const milkTerms = ['leite', 'lactose', 'queijo', 'manteiga', 'creme', 'whey', 'soro'];
                    if (milkTerms.some((t) => ing.includes(t))) return 'Contém Leite / Derivados';
                    if (milkTerms.some((t) => cross.includes(t))) return 'Pode conter traços de leite';
                    return 'Não contém leite nem traços (Livre)';
                  })()}
                </li>
                <li style={{ padding: '0.5rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                  <FlaskIcon size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> <strong>Contaminação Cruzada:</strong> {(() => {
                    const cc = product.crossContamination || '';
                    if (!cc || cc === 'NONE' || cc === 'NENHUM') return 'Nenhum (Ambiente 100% livre)';
                    if (cc === 'TRACES' || cc === 'TRACOS') return 'Pode conter traços (Alerta preventivo no rótulo)';
                    if (cc === 'SHARED_EQUIPMENT' || cc === 'MAQUINARIO_COMPARTILHADO') return 'Compartilha maquinário / linhas de produção';
                    return cc;
                  })()}
                </li>
                <li style={{ padding: '0.5rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                  <FileTextIcon size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> <strong>Status da Análise:</strong> {
                    product.analysisStatus === 'ANALISADO' || product.analysisStatus === 'APPROVED'
                      ? 'Analisado'
                      : product.analysisStatus === 'PENDENTE_DE_ANALISE' || product.analysisStatus === 'PENDING_ANALYSIS'
                      ? 'Pendente de Análise'
                      : product.analysisStatus || 'VERIFICADO'
                  }
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Seção de Avaliações de Consumidores (Item 14.5 + Issue #36) */}
        <div className={styles.card}>
          <ReviewsList productId={product.id} targetName={product.name} />
        </div>

        {/* Modal de Edição de Produto */}
        {canEdit && (
          <CreateProductModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            productToEdit={product}
            onSuccess={loadData}
          />
        )}
      </main>

      {/* Modal de Denúncia */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        productId={product.id}
        targetName={product.name}
        onSuccess={() => toast.success('Denúncia registrada com sucesso.')}
      />
    </div>
  );
}

export default function ProductDetailsPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div>
          <Header />
          <main className={styles.container} style={{ textAlign: 'center', paddingTop: '4rem' }}>
            <p>Carregando informações do produto...</p>
          </main>
        </div>
      }
    >
      <ProductDetailsContent {...props} />
    </Suspense>
  );
}
