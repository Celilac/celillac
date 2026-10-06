'use client';
// frontend/web-app/src/app/dashboard/page.tsx
//
// ⚠️ REGRA ARQUITETURAL — FRONTEND_STRATEGY.md
//   ❌ Não usar fetch() diretamente
//   ❌ Não hardcodar userId
//   ✅ Usar catalogApi, compatibilityApi e o userId do AuthContext
//
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { catalogApi, ProductSummary } from '@/api/catalog';
import { compatibilityApi, CompatibilityResponse } from '@/api/compatibility';
import { foodProfileApi } from '@/api/food-profile';
import { partnerApi, PartnerSummary } from '@/api/partner';
import { ordersApi } from '@/api/orders';
import { apiClient, HttpError } from '@/api/client';
import { useToast } from '@/hooks/useToast';
import { Header } from '@/components/layout/Header';
import { RiskBadge } from '@/components/compatibility/RiskBadge';
import { CreateProductModal } from '@/components/common/CreateProductModal';
import { translateReasoning, translateConflictReason, translatePartnerType } from '@/utils/compatibilityTranslator';
import { saveRecentCheck } from '@/services/recentChecks';
import {
  PackageIcon,
  ChefHatIcon,
  BuildingIcon,
  BriefcaseIcon,
  MailIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  EditIcon,
  PlusIcon,
  SearchIcon,
  FlaskIcon,
  RefreshIcon,
  GlobeIcon,
  WheatIcon,
  ShieldCheckIcon,
  LeafIcon,
  StatusDot,
} from '@/components/layout/icons';
import styles from './dashboard.module.css';

interface ReportWithName extends CompatibilityResponse {
  productName: string;
  productId: string;
}

interface RestrictionItem {
  id?: string;
  allergen: string;
  severity: string;
  type?: string;
  notes?: string;
}

const ALLERGEN_LABELS: Record<string, string> = {
  GLUTEN: 'Glúten',
  LACTOSE: 'Lactose',
  NUTS: 'Castanhas / Amendoim',
  SOY: 'Soja',
  EGGS: 'Ovos',
  SHELLFISH: 'Frutos do Mar',
  FISH: 'Peixes',
  SESAME: 'Gergelim',
  OTHER: 'Outro',
};

// Cores acompanham a mesma escala de gravidade do veredito do AllergenEngine
// (ver DESIGN.md) — reforça que vermelho/laranja/amarelo/verde significam a
// mesma coisa em toda a aplicação, seja no veredito de um produto ou na
// severidade da própria restrição do usuário.
const SEVERITY_BADGES: Record<string, { label: string; dot: 'red' | 'orange' | 'yellow' | 'green' | 'purple'; bg: string; color: string; border: string }> = {
  FATAL: { label: 'Fatal (Celíaco)', dot: 'red', bg: 'var(--color-blocked-bg)', color: 'var(--color-blocked)', border: 'var(--color-blocked-border)' },
  HIGH: { label: 'Risco Alto', dot: 'orange', bg: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: 'var(--color-danger-border)' },
  MEDIUM: { label: 'Risco Médio', dot: 'yellow', bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', border: 'var(--color-warning-border)' },
  LOW: { label: 'Risco Baixo', dot: 'green', bg: 'var(--color-safe-bg)', color: 'var(--color-safe)', border: 'var(--color-safe-border)' },
  LIFESTYLE: { label: 'Estilo de Vida', dot: 'purple', bg: 'var(--color-status-suspended-bg)', color: 'var(--color-status-suspended)', border: 'var(--color-status-suspended-border)' },
};

export default function DashboardPage() {
  const { token, userId, isAuthenticated } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<'CELIACO' | 'PARCEIRO' | 'ADMIN' | string>('CELIACO');
  const [searchQuery, setSearchQuery] = useState('');
  const [reports, setReports] = useState<Record<string, ReportWithName>>({});
  const [checkingProductId, setCheckingProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(true);
  const [userRestrictions, setUserRestrictions] = useState<RestrictionItem[]>([]);
  const [acceptsCrossContamination, setAcceptsCrossContamination] = useState(false);
  const [publishedProducts, setPublishedProducts] = useState<ProductSummary[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Estados específicos para perfil PARCEIRO
  const [userPartners, setUserPartners] = useState<PartnerSummary[]>([]);
  const [partnerProducts, setPartnerProducts] = useState<ProductSummary[]>([]);
  const [partnerPendingOrdersCount, setPartnerPendingOrdersCount] = useState<number>(0);
  const [loadingPartnerData, setLoadingPartnerData] = useState(false);
  const [isCreateProductModalOpen, setIsCreateProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductSummary | null>(null);
  const [activePartnerTab, setActivePartnerTab] = useState<'MY_PRODUCTS' | 'ALL_CATALOG'>('MY_PRODUCTS');

  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setIsCreateProductModalOpen(true);
  };

  const handleOpenEditProduct = (e: React.MouseEvent, prod: ProductSummary) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingProduct(prod);
    setIsCreateProductModalOpen(true);
  };

  const handleCloseProductModal = () => {
    setIsCreateProductModalOpen(false);
    setEditingProduct(null);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [mounted, isAuthenticated, router]);

  const loadData = useCallback(() => {
    if (!isAuthenticated || !token || !userId) return;

    // Checa os dados do usuário para verificar role e status de e-mail
    apiClient.get<any>('/iam/me', token)
      .then((u) => {
        setIsEmailVerified(u?.isEmailVerified !== false);
        const role = u?.role || 'CELIACO';
        setUserRole(role);

        // Se for PARCEIRO ou ADMIN, carrega estabelecimentos e produtos do parceiro
        if (role === 'PARCEIRO' || role === 'ADMIN') {
          setIsProfileIncomplete(false);
          setLoadingPartnerData(true);

          partnerApi.listUserPartners(token)
            .then(async (partners) => {
              setUserPartners(partners || []);
              if (partners && partners.length > 0) {
                // Carrega produtos e conta pedidos pendentes de ação na cozinha
                const allPartnerProds: ProductSummary[] = [];
                let pendingCount = 0;

                for (const p of partners) {
                  try {
                    const res = await catalogApi.listByPartner(p.id, token);
                    if (res?.data) {
                      allPartnerProds.push(...res.data);
                    }
                  } catch {}

                  try {
                    const ords = await ordersApi.getPartnerOrders(p.id, token);
                    if (ords && ords.length > 0) {
                      const pending = ords.filter((o) =>
                        o.status === 'PAID' || o.status === 'CONFIRMED' || o.status === 'PREPARING'
                      );
                      pendingCount += pending.length;
                    }
                  } catch {}
                }
                setPartnerProducts(allPartnerProds);
                setPartnerPendingOrdersCount(pendingCount);
              } else {
                setPartnerProducts([]);
                setPartnerPendingOrdersCount(0);
              }
            })
            .catch(() => {})
            .finally(() => setLoadingPartnerData(false));
          return;
        }

        // Para consumidores e celíacos, verifica as restrições cadastradas
        foodProfileApi.getByUserId(userId, token)
          .then((profile) => {
            if (!profile || !profile.restrictions || profile.restrictions.length === 0) {
              setIsProfileIncomplete(true);
              setUserRestrictions([]);
            } else {
              setIsProfileIncomplete(false);
              setUserRestrictions(profile.restrictions);
            }
            setAcceptsCrossContamination(!!profile?.acceptsCrossContamination);
          })
          .catch(() => {
            setIsProfileIncomplete(true);
            setUserRestrictions([]);
          });
      })
      .catch(() => {});

    // Carrega produtos publicados do catálogo geral
    setLoadingProducts(true);
    catalogApi.search('', token)
      .then((result) => {
        if (result?.data) {
          setPublishedProducts(result.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  }, [isAuthenticated, token, userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const [searchResults, setSearchResults] = useState<ProductSummary[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (!isAuthenticated || !token || !userId) {
      router.replace('/auth/login');
      return;
    }

    setLoading(true);
    setReports({});
    setSearchResults([]);

    try {
      const result = await catalogApi.search(searchQuery, token);
      const products = result.data;

      if (!products || products.length === 0) {
        toast.warning('Nenhum produto encontrado com este nome.', 'Aviso');
        return;
      }

      setSearchResults(products);

      // Preenche imediatamente a compatibilidade de produtos já calculados
      const initialReports: Record<string, ReportWithName> = {};
      for (const prod of products) {
        if (prod.compatibilityReport) {
          initialReports[prod.id] = {
            ...prod.compatibilityReport,
            productName: prod.name,
            productId: prod.id,
          };
        }
      }
      setReports(initialReports);

      // Opção B: Checagem automática e em paralelo para o perfil alimentar do usuário
      if (userRole === 'CELIACO' && userId && token) {
        products.forEach((prod) => {
          if (!initialReports[prod.id]) {
            checkProductCompatibility(prod);
          }
        });
      }
    } catch (err) {
      const message = err instanceof HttpError ? err.message : (err as Error).message ?? 'Erro desconhecido.';
      toast.error(message, 'Erro ao buscar produtos');
    } finally {
      setLoading(false);
    }
  };

  const checkProductCompatibility = async (product: ProductSummary) => {
    if (!token || !userId) return;
    setCheckingProductId(product.id);
    try {
      const compatibility = await compatibilityApi.check(
        { userId, productId: product.id },
        token,
      );
      setReports((prev) => ({
        ...prev,
        [product.id]: { ...compatibility, productName: product.name, productId: product.id },
      }));
      saveRecentCheck(
        {
          productId: product.id,
          productName: product.name,
          riskLevel: compatibility.riskLevel,
        },
        userId
      );
    } catch (err) {
      const message = err instanceof HttpError ? err.message : (err as Error).message ?? 'Erro desconhecido.';
      toast.error(message, 'Erro ao analisar produto');
    } finally {
      setCheckingProductId(null);
    }
  };

  if (mounted && !isAuthenticated) {
    return (
      <div className="dashboard-page-wrapper">
        <Header />
      </div>
    );
  }

  return (
    <div className="dashboard-page-wrapper">
      <Header />

      <main className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            {userRole === 'PARCEIRO' ? 'Meu Dashboard do Parceiro' : 'Meu Dashboard'}
          </h1>
          <p className={styles.subtitle}>
            {userRole === 'PARCEIRO'
              ? 'Gerencie seus estabelecimentos, perfil produtivo e publique produtos com segurança alimentar.'
              : 'Verifique seus produtos com transparência e segurança alimentar.'}
          </p>
        </header>

        {/* Banner de E-mail Não Verificado */}
        {mounted && !isEmailVerified && (
          <div className={`${styles.banner} ${styles.bannerDanger}`}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <strong style={{ fontSize: 'var(--text-title)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 'var(--space-1)' }}>
                <MailIcon size={18} style={{ color: 'var(--color-danger)' }} />
                <span>Verifique seu e-mail para desbloquear todas as funções</span>
              </strong>
              <span style={{ fontSize: 'var(--text-body)' }}>
                Enviamos um código de verificação para o seu e-mail. Confirme seu e-mail para garantir a segurança da sua conta.
              </span>
            </div>
            <Link href="/auth/verify-email?send=true" className="btn btn-em" style={{ whiteSpace: 'nowrap', padding: 'var(--space-3) var(--space-6)', textDecoration: 'none', background: 'var(--color-danger)' }}>
              Verificar E-mail Agora
            </Link>
          </div>
        )}

        {/* Banner de Perfil Incompleto (Apenas Consumidor) */}
        {mounted && isProfileIncomplete && userRole === 'CELIACO' && (
          <div className={`${styles.banner} ${styles.bannerWarning}`}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <strong style={{ fontSize: 'var(--text-title)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 'var(--space-1)' }}>
                <AlertTriangleIcon size={18} style={{ color: 'var(--color-warning)' }} />
                <span>Perfil Alimentar Incompleto</span>
              </strong>
              <span style={{ fontSize: 'var(--text-body)' }}>
                Seu perfil alimentar ainda não possui restrições configuradas. A análise de compatibilidade alimentar será limitada até que você configure seu perfil.
              </span>
            </div>
            <Link href="/profile" className="btn btn-em" style={{ whiteSpace: 'nowrap', padding: 'var(--space-3) var(--space-6)', textDecoration: 'none' }}>
              Configurar Agora
            </Link>
          </div>
        )}

        {/* Banner de Destaque: Cozinha & Pedidos em Aberto (Visão Parceiro) */}
        {mounted && userRole === 'PARCEIRO' && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.05) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-5) var(--space-6)',
            marginBottom: 'var(--space-6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
            flexWrap: 'wrap',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '260px', flex: 1 }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '16px',
                background: 'var(--color-emerald)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                flexShrink: 0,
                color: '#ffffff',
              }}>
                <ChefHatIcon size={28} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>
                    Cozinha & Pedidos em Aberto
                  </h2>
                  {partnerPendingOrdersCount > 0 ? (
                    <span style={{
                      background: '#ef4444',
                      color: '#fff',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '2px 9px',
                      borderRadius: '9999px',
                      animation: 'pulseBadge 2s infinite',
                    }}>
                      {partnerPendingOrdersCount} {partnerPendingOrdersCount === 1 ? 'pedido aguardando' : 'pedidos aguardando'}
                    </span>
                  ) : (
                    <span style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: 'var(--color-emerald)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                    }}>
                      Cozinha em dia
                    </span>
                  )}
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: 'var(--text-body)', color: 'var(--color-text-muted)' }}>
                  Aceite novos pedidos pagos, inicie o preparo e despache para entrega com segurança alimentar.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/partner/orders"
                className="btn btn-em"
                id="dashboard-kitchen-orders-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.75rem 1.4rem',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
                }}
              >
                <ChefHatIcon size={18} />
                <span>Ver Pedidos da Cozinha</span>
                <span>➔</span>
              </Link>
            </div>
          </div>
        )}

        {/* GRID PRINCIPAL */}
        <div className={styles.grid}>
          {/* =================================================== */}
          {/* VISÃO PARCEIRO: Card 1 - Perfil de Produção / Negócio */}
          {/* =================================================== */}
          {userRole === 'PARCEIRO' ? (
            <section className={styles.card} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <h2 className={styles.cardTitle} style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BuildingIcon size={20} />
                    <span>{userPartners.length > 1 ? `Meus Estabelecimentos (${userPartners.length})` : 'Meu Estabelecimento & Produção'}</span>
                  </h2>
                  <Link
                    href="/partner"
                    className={styles.btnManagePartner}
                    style={{
                      fontSize: 'var(--text-label)',
                      padding: '0.35rem 0.75rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <BriefcaseIcon size={14} />
                    <span>Meus Negócios</span>
                  </Link>
                </div>

                {loadingPartnerData ? (
                  <p style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-muted)' }}>Carregando dados comerciais…</p>
                ) : userPartners.length === 1 ? (
                  /* Caso 1 único estabelecimento */
                  <div style={{
                    padding: 'var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-elevated)',
                    border: '1px solid var(--color-border)',
                    marginBottom: '1rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--color-text)' }}>
                        {userPartners[0].name}
                      </strong>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: userPartners[0].approvalStatus === 'APPROVED' ? 'var(--color-safe-bg)' : 'var(--color-warning-bg)',
                        color: userPartners[0].approvalStatus === 'APPROVED' ? 'var(--color-safe)' : 'var(--color-warning)',
                        border: `1px solid ${userPartners[0].approvalStatus === 'APPROVED' ? 'var(--color-safe-border)' : 'var(--color-warning-border)'}`,
                        whiteSpace: 'nowrap',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        {userPartners[0].approvalStatus === 'APPROVED' ? (
                          <>
                            <CheckCircleIcon size={12} />
                            <span>Homologado</span>
                          </>
                        ) : (
                          <>
                            <ClockIcon size={12} />
                            <span>Em Avaliação</span>
                          </>
                        )}
                      </span>
                    </div>

                    <p style={{ fontSize: 'var(--text-label)', color: 'var(--color-text-muted)', margin: '0 0 4px 0' }}>
                      <strong>Ramo:</strong> {translatePartnerType(userPartners[0].type)} • <strong>Região:</strong> {userPartners[0].deliveryRegion || userPartners[0].city || 'Local'}
                    </p>

                    <p style={{ fontSize: 'var(--text-label)', color: 'var(--color-text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <strong>Status Operacional:</strong>
                      <StatusDot color={userPartners[0].operationalStatus === 'ACTIVE' ? 'green' : 'yellow'} size={8} />
                      <span>{userPartners[0].operationalStatus === 'ACTIVE' ? 'Aberto' : 'Temporariamente Fechado'}</span>
                    </p>
                  </div>
                ) : userPartners.length > 1 ? (
                  /* Caso múltiplos estabelecimentos */
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    maxHeight: '260px',
                    overflowY: 'auto',
                    paddingRight: '4px',
                    marginBottom: '1rem',
                  }}>
                    {userPartners.map((pt) => (
                      <div
                        key={pt.id}
                        style={{
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--color-elevated)',
                          border: '1px solid var(--color-border)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '10px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: '180px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            <strong style={{ fontSize: '0.95rem', color: 'var(--color-text)' }}>{pt.name}</strong>
                            <span style={{
                              padding: '1px 6px',
                              borderRadius: '9999px',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              background: pt.approvalStatus === 'APPROVED' ? 'var(--color-safe-bg)' : 'var(--color-warning-bg)',
                              color: pt.approvalStatus === 'APPROVED' ? 'var(--color-safe)' : 'var(--color-warning)',
                              border: `1px solid ${pt.approvalStatus === 'APPROVED' ? 'var(--color-safe-border)' : 'var(--color-warning-border)'}`,
                              whiteSpace: 'nowrap',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}>
                              {pt.approvalStatus === 'APPROVED' ? <CheckCircleIcon size={11} /> : <ClockIcon size={11} />}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>{translatePartnerType(pt.type)} • {pt.city || 'Local'} •</span>
                            <StatusDot color={pt.operationalStatus === 'ACTIVE' ? 'green' : 'yellow'} size={7} />
                            <span>{pt.operationalStatus === 'ACTIVE' ? 'Aberto' : 'Fechado'}</span>
                          </p>
                        </div>

                        <Link
                          href={`/partner/${pt.id}`}
                          className={styles.btnManagePartner}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <EditIcon size={12} />
                          <span>Gerenciar</span>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                    Você ainda não cadastrou seu estabelecimento comercial. Cadastre sua marca para publicar itens no catálogo seguro da CeLiLac.
                  </p>
                )}
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                {userPartners.length === 1 ? (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Link
                      href={`/partner/${userPartners[0].id}`}
                      className="btn btn-em"
                      style={{ fontSize: 'var(--text-label)', padding: '0.5rem 1rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <EditIcon size={13} />
                      <span>Gerenciar Estabelecimento</span>
                    </Link>
                    <Link
                      href="/partner/register"
                      className="btn btn-ghost"
                      style={{ fontSize: 'var(--text-label)', padding: '0.5rem 0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <PlusIcon size={13} />
                      <span>Novo Estabelecimento</span>
                    </Link>
                  </div>
                ) : userPartners.length > 1 ? (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Link
                      href="/partner"
                      className="btn btn-em"
                      style={{ fontSize: 'var(--text-label)', padding: '0.5rem 1rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <BriefcaseIcon size={13} />
                      <span>Gerenciar Todos ({userPartners.length})</span>
                    </Link>
                    <Link
                      href="/partner/register"
                      className="btn btn-ghost"
                      style={{ fontSize: 'var(--text-label)', padding: '0.5rem 0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <PlusIcon size={13} />
                      <span>Novo Estabelecimento</span>
                    </Link>
                  </div>
                ) : (
                  <Link
                    href="/partner/register"
                    className="btn btn-em"
                    style={{ fontSize: 'var(--text-label)', padding: '0.6rem 1.2rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <BuildingIcon size={14} />
                    <span>Cadastrar Meu Estabelecimento</span>
                  </Link>
                )}
              </div>
            </section>
          ) : (
            /* =================================================== */
            /* VISÃO CONSUMIDOR: Card 1 - Perfil Alimentar         */
            /* =================================================== */
            <section className={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '12px' }}>
                <h2 className={styles.cardTitle} style={{ margin: 0, minWidth: 0, flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <LeafIcon size={18} style={{ color: 'var(--color-emerald)' }} />
                  <span>Meu Perfil Alimentar</span>
                </h2>
                {mounted && isAuthenticated && (
                  <Link
                    href="/profile"
                    className={styles.editProfileBtn}
                    id="dashboard-edit-profile-btn"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    <span>Editar</span>
                  </Link>
                )}
              </div>

              {mounted && isAuthenticated ? (
                userRestrictions.length > 0 ? (
                  <div>
                    <p style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
                      Alérgenos ativos configurados para sua proteção:
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                      {userRestrictions.map((res, index) => {
                        const allergenLabel = ALLERGEN_LABELS[res.allergen] || res.allergen;
                        const badgeInfo = SEVERITY_BADGES[res.severity] || { label: res.severity, bg: 'var(--color-elevated)', color: 'var(--color-text-muted)' };

                        return (
                          <div key={index} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: 'var(--space-3) var(--space-4)',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--color-elevated)',
                            border: '1px solid var(--color-border)',
                          }}>
                            <span style={{
                              fontWeight: '600',
                              fontSize: 'var(--text-body)',
                              flex: 1,
                              minWidth: 0,
                              wordBreak: 'break-word',
                            }}>
                              {allergenLabel}
                            </span>
                            <span style={{
                              padding: '0.3rem 0.75rem',
                              borderRadius: 'var(--radius-full)',
                              fontSize: 'var(--text-label)',
                              fontWeight: '600',
                              background: badgeInfo.bg,
                              color: badgeInfo.color,
                              border: `1px solid ${badgeInfo.border || 'transparent'}`,
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              lineHeight: 1.2,
                              gap: '6px',
                            }}>
                              <StatusDot color={badgeInfo.dot} size={7} />
                              <span>{badgeInfo.label}</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-label)',
                      background: acceptsCrossContamination ? 'var(--color-warning-bg)' : 'var(--color-safe-bg)',
                      border: acceptsCrossContamination ? '1px solid var(--color-warning-border)' : '1px solid var(--color-safe-border)',
                      color: acceptsCrossContamination ? 'var(--color-warning)' : 'var(--color-safe)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      lineHeight: 1.4,
                    }}>
                      {acceptsCrossContamination ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <AlertTriangleIcon size={16} />
                          <span><strong style={{ color: 'var(--color-text)' }}>Contaminação Cruzada:</strong> Aceita risco de traços.</span>
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <ShieldCheckIcon size={16} />
                          <span><strong style={{ color: 'var(--color-text)' }}>Contaminação Cruzada:</strong> Bloqueada (Segurança Máxima).</span>
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className={styles.reason}>
                    Nenhuma restrição alimentar cadastrada. Acesse o{' '}
                    <Link href="/profile" style={{ color: 'var(--color-emerald)', textDecoration: 'underline' }}>
                      seu perfil
                    </Link>{' '}
                    para adicionar alérgenos.
                  </p>
                )
              ) : (
                <p className={styles.reason}>
                  <Link href="/auth/login" style={{ color: 'var(--color-emerald)' }}>Faça login</Link> para ver seu perfil alimentar.
                </p>
              )}
            </section>
          )}

          {/* =================================================== */}
          {/* VISÃO PARCEIRO: Card 2 - Publicação & Catálogo      */}
          {/* =================================================== */}
          {userRole === 'PARCEIRO' ? (
            <section className={styles.card} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <h2 className={styles.cardTitle} style={{ margin: '0 0 var(--space-2) 0', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PackageIcon size={20} />
                  <span>Publicação & Catálogo</span>
                </h2>

                <p style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-muted)', margin: '0 0 1.25rem 0', lineHeight: 1.5 }}>
                  Publique novos produtos no catálogo oficial para alcançar celíacos e pessoas com restrições em busca de opções seguras.
                </p>

                <button
                  type="button"
                  onClick={handleOpenCreateProduct}
                  className="btn btn-em"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.75rem 1rem',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    margin: '0 0 1.25rem 0',
                    borderRadius: 'var(--radius-full)',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
                    cursor: 'pointer',
                  }}
                  id="dashboard-publish-product-btn"
                >
                  <PlusIcon size={16} />
                  <span>Publicar Novo Produto no Catálogo</span>
                </button>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                textAlign: 'center',
                marginTop: 'auto',
              }}>
                <div style={{ padding: 'var(--space-3)', background: 'var(--color-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-text)', display: 'block' }}>
                    {partnerProducts.length}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Meus Produtos</span>
                </div>

                <div style={{ padding: 'var(--space-3)', background: 'var(--color-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-safe)', display: 'block' }}>
                    {partnerProducts.filter((p) => !p.hasGluten).length}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Sem Glúten</span>
                </div>

                <div style={{ padding: 'var(--space-3)', background: 'var(--color-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-warning)', display: 'block' }}>
                    {partnerProducts.filter((p) => p.analysisStatus === 'PENDING_ANALYSIS' || p.analysisStatus === 'PENDENTE_DE_ANALISE').length}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Em Análise</span>
                </div>
              </div>
            </section>
          ) : (
            /* =================================================== */
            /* VISÃO CONSUMIDOR: Card 2 - Buscador & Analisador    */
            /* =================================================== */
            <section className={styles.card}>
              <h2 className={styles.cardTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SearchIcon size={18} />
                <span>Analisar Produto</span>
              </h2>

              <form className={styles.searchForm} onSubmit={handleSearch}>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Digite o nome (ex: pão, leite, biscoito)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={loading}
                  id="dashboard-search-input"
                />
                <button
                  type="submit"
                  className={styles.searchButton}
                  disabled={loading}
                  id="dashboard-search-btn"
                >
                  {loading ? 'Buscando...' : 'Buscar Produtos'}
                </button>
              </form>

              {mounted && !isAuthenticated && (
                <p style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-label)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <AlertTriangleIcon size={14} style={{ color: 'var(--color-warning)' }} />
                  <span>
                    Faça <Link href="/auth/login" style={{ color: 'var(--color-emerald)' }}>login</Link> para verificar compatibilidade com seu perfil.
                  </span>
                </p>
              )}

              {/* Lista de Resultados Encontrados */}
              {searchResults.length > 0 && (
                <div style={{ marginTop: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <h3 style={{ fontSize: 'var(--text-title)', color: 'var(--color-text)' }}>
                    Resultados encontrados ({searchResults.length}):
                  </h3>
                  {searchResults.map((product) => {
                    const productReport = reports[product.id];
                    const isCheckingThis = checkingProductId === product.id;
                    return (
                      <div
                        key={product.id}
                        style={{
                          padding: 'var(--space-4)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border)',
                          background: 'var(--color-elevated)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 'var(--space-3)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <strong style={{ fontSize: '1.1rem', color: 'var(--color-text)', display: 'block' }}>
                              {product.name}
                            </strong>
                            <span style={{ fontSize: 'var(--text-label)', color: 'var(--color-text-muted)' }}>
                              Marca: {product.brand}
                            </span>
                          </div>
                          <Link
                            href={`/products/${product.id}?from=dashboard`}
                            className="btn btn-ghost"
                            style={{
                              fontSize: 'var(--text-label)',
                              padding: 'var(--space-2) var(--space-3)',
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                            }}
                          >
                            <PackageIcon size={14} />
                            <span>Ver Detalhes</span>
                          </Link>
                        </div>

                        {product.ingredients && (
                          <p style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-muted)', margin: 0 }}>
                            <strong>Ingredientes:</strong> {product.ingredients}
                          </p>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            {productReport ? (
                              <RiskBadge riskLevel={productReport.riskLevel} showDescription={true} />
                            ) : isCheckingThis ? (
                              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <ClockIcon size={14} />
                                <span>Analisando compatibilidade…</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => checkProductCompatibility(product)}
                                className="btn btn-em"
                                style={{ fontSize: 'var(--text-label)', padding: 'var(--space-2) var(--space-4)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              >
                                <FlaskIcon size={14} />
                                <span>Checar Compatibilidade</span>
                              </button>
                            )}
                          </div>

                          {productReport && (
                            <button
                              type="button"
                              onClick={() => checkProductCompatibility(product)}
                              disabled={loading || isCheckingThis}
                              title="Reavaliar compatibilidade"
                              style={{
                                background: 'transparent',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text-muted)',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: 'var(--radius-full)',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--color-emerald)';
                                e.currentTarget.style.color = 'var(--color-emerald)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--color-border)';
                                e.currentTarget.style.color = 'var(--color-text-muted)';
                              }}
                            >
                              {isCheckingThis ? (
                                <>
                                  <ClockIcon size={12} />
                                  <span>Atualizando…</span>
                                </>
                              ) : (
                                <>
                                  <RefreshIcon size={12} />
                                  <span>Reavaliar</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {productReport && (
                          <div style={{ padding: 'var(--space-3)', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                            <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--color-text)' }}>
                              {translateReasoning(productReport.reasoning)}
                            </p>
                            {productReport.conflicts?.map((c, index) => (
                              <p key={index} style={{ margin: '4px 0 0 0', fontSize: 'var(--text-label)', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <AlertTriangleIcon size={13} />
                                <span>{translateConflictReason(c.reason)}</span>
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </div>

        {/* =================================================== */}
        {/* SEÇÃO INFERIOR DE PRODUTOS                         */}
        {/* =================================================== */}
        {mounted && isAuthenticated && (
          <section style={{
            width: '100%',
            maxWidth: '1000px',
            marginTop: 'var(--space-6)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: '12px' }}>
              {userRole === 'PARCEIRO' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setActivePartnerTab('MY_PRODUCTS')}
                    style={{
                      background: activePartnerTab === 'MY_PRODUCTS' ? 'var(--color-emerald, #10b981)' : 'var(--color-elevated)',
                      color: activePartnerTab === 'MY_PRODUCTS' ? '#ffffff' : 'var(--color-text)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-2) var(--space-4)',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <PackageIcon size={16} />
                    <span>Meus Produtos Fabricados ({partnerProducts.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivePartnerTab('ALL_CATALOG')}
                    style={{
                      background: activePartnerTab === 'ALL_CATALOG' ? 'var(--color-emerald, #10b981)' : 'var(--color-elevated)',
                      color: activePartnerTab === 'ALL_CATALOG' ? '#ffffff' : 'var(--color-text)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-2) var(--space-4)',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <GlobeIcon size={16} />
                    <span>Catálogo Geral ({publishedProducts.length})</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h2 style={{ fontSize: 'var(--text-title)', fontWeight: 600, color: 'var(--color-text)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PackageIcon size={18} />
                    <span>Produtos Publicados</span>
                  </h2>
                  <span style={{
                    fontSize: 'var(--text-label)',
                    color: 'var(--color-text-muted)',
                    background: 'var(--color-elevated)',
                    padding: 'var(--space-1) var(--space-3)',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--color-border)',
                  }}>
                    {publishedProducts.length} {publishedProducts.length === 1 ? 'produto' : 'produtos'}
                  </span>
                </div>
              )}

              {userRole === 'PARCEIRO' && (
                <button
                  type="button"
                  onClick={handleOpenCreateProduct}
                  className="btn btn-em"
                  style={{ fontSize: '0.85rem', padding: 'var(--space-2) var(--space-4)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Publicar Novo Produto
                </button>
              )}
            </div>

            {/* Listagem de produtos (Parceiro vs Geral) */}
            {(() => {
              const displayList = (userRole === 'PARCEIRO' && activePartnerTab === 'MY_PRODUCTS')
                ? partnerProducts
                : publishedProducts;

              if (loadingProducts || loadingPartnerData) {
                return (
                  <div style={{
                    padding: 'var(--space-8)',
                    textAlign: 'center',
                    color: 'var(--color-text-muted)',
                    fontSize: 'var(--text-body)',
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                  }}>
                    Carregando produtos…
                  </div>
                );
              }

              if (displayList.length === 0) {
                return (
                  <div style={{
                    padding: 'var(--space-8)',
                    textAlign: 'center',
                    color: 'var(--color-text-muted)',
                    fontSize: 'var(--text-body)',
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                  }}>
                    {userRole === 'PARCEIRO' && activePartnerTab === 'MY_PRODUCTS' ? (
                      <div>
                        <p style={{ marginBottom: '1rem' }}>Você ainda não cadastrou nenhum produto para seu estabelecimento.</p>
                        <button
                          type="button"
                          onClick={handleOpenCreateProduct}
                          className="btn btn-em"
                          style={{ padding: 'var(--space-2) var(--space-4)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                          Publicar Primeiro Produto
                        </button>
                      </div>
                    ) : (
                      'Nenhum produto publicado no catálogo ainda.'
                    )}
                  </div>
                );
              }

              return (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
                  gap: 'var(--space-6)',
                }}>
                  {displayList.map((product) => {
                    const statusInfo: Record<string, { label: string; dot: 'green' | 'yellow' | 'red'; bg: string; color: string; border: string }> = {
                      ANALISADO: { label: 'Analisado', dot: 'green', bg: 'var(--color-safe-bg)', color: 'var(--color-safe)', border: 'var(--color-safe-border)' },
                      APPROVED: { label: 'Aprovado', dot: 'green', bg: 'var(--color-safe-bg)', color: 'var(--color-safe)', border: 'var(--color-safe-border)' },
                      PENDENTE_DE_ANALISE: { label: 'Pendente', dot: 'yellow', bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', border: 'var(--color-warning-border)' },
                      PENDING_ANALYSIS: { label: 'Pendente', dot: 'yellow', bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', border: 'var(--color-warning-border)' },
                      FLAGGED: { label: 'Sinalizado', dot: 'red', bg: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: 'var(--color-danger-border)' },
                    };
                    const status = statusInfo[product.analysisStatus] || statusInfo['PENDENTE_DE_ANALISE'];

                    return (
                      <Link
                        key={product.id}
                        href={`/products/${product.id}?from=dashboard`}
                        style={{
                          textDecoration: 'none',
                          color: 'inherit',
                          display: 'block',
                        }}
                      >
                        <div
                          style={{
                            padding: 'var(--space-6)',
                            borderRadius: 'var(--radius-xl, 16px)',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-surface)',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                            transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                            cursor: 'pointer',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: 'var(--space-3)',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-emerald)';
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                            (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.12)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
                            (e.currentTarget as HTMLElement).style.transform = 'none';
                            (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px 0', lineHeight: 1.3 }}>
                                  {product.name}
                                </h3>
                                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>
                                  {product.brand}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {userRole === 'PARCEIRO' && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleOpenEditProduct(e, product)}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '3px 8px',
                                      borderRadius: '6px',
                                      fontSize: '0.75rem',
                                      fontWeight: 600,
                                      background: 'var(--color-elevated, rgba(255, 255, 255, 0.08))',
                                      color: 'var(--color-text)',
                                      border: '1px solid var(--color-border)',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.borderColor = 'var(--color-emerald, #10b981)';
                                      e.currentTarget.style.color = 'var(--color-emerald, #10b981)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.borderColor = 'var(--color-border)';
                                      e.currentTarget.style.color = 'var(--color-text)';
                                    }}
                                    title="Editar informações do produto"
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M12 20h9" />
                                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                    </svg>
                                    Editar
                                  </button>
                                )}
                                <span style={{
                                  padding: '4px 10px',
                                  borderRadius: '9999px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  background: status.bg,
                                  color: status.color,
                                  border: `1px solid ${status.border}`,
                                  whiteSpace: 'nowrap',
                                  flexShrink: 0,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                }}>
                                  <StatusDot color={status.dot} size={7} />
                                  <span>{status.label}</span>
                                </span>
                              </div>
                            </div>

                            {product.ingredients && (
                              <div style={{
                                margin: 'var(--space-3) 0 0 0',
                                padding: 'var(--space-3) var(--space-4)',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--color-elevated)',
                                border: '1px solid var(--color-border)',
                                fontSize: '0.85rem',
                                lineHeight: 1.5,
                                color: 'var(--color-text-muted)',
                                wordBreak: 'break-word',
                              }}>
                                <strong style={{ color: 'var(--color-text)' }}>Ingredientes:</strong> {product.ingredients}
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: 'auto', paddingTop: 'var(--space-2)' }}>
                            {product.hasGluten ? (
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                background: 'var(--color-blocked-bg)',
                                color: 'var(--color-blocked)',
                                border: '1px solid var(--color-blocked-border, rgba(239, 68, 68, 0.3))',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                              }}>
                                <WheatIcon size={13} />
                                <span>Contém Glúten</span>
                              </span>
                            ) : (
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                background: 'var(--color-safe-bg)',
                                color: 'var(--color-safe)',
                                border: '1px solid var(--color-safe-border)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                              }}>
                                <ShieldCheckIcon size={13} />
                                <span>Sem Glúten</span>
                              </span>
                            )}

                            {(() => {
                              const cc = (product.crossContamination || '').trim().toLowerCase();
                              const envRisk = product.crossContaminationDetails?.environmentRisk;
                              const isFree =
                                !cc ||
                                cc === 'none' ||
                                cc === 'nenhum' ||
                                cc.startsWith('nenhum') ||
                                cc.startsWith('livre') ||
                                cc.includes('100% livre') ||
                                envRisk === 'EXCLUSIVE_ENVIRONMENT';

                              if (isFree) return null;

                              return (
                                <span style={{
                                  padding: '4px 10px',
                                  borderRadius: '9999px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  background: 'var(--color-warning-bg)',
                                  color: 'var(--color-warning)',
                                  border: '1px solid var(--color-warning-border)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                }}>
                                  <AlertTriangleIcon size={13} />
                                  <span>Contaminação Cruzada</span>
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              );
            })()}
          </section>
        )}
      </main>

      {/* Modal de Publicação / Edição de Produto */}
      <CreateProductModal
        isOpen={isCreateProductModalOpen}
        onClose={handleCloseProductModal}
        productToEdit={editingProduct}
        onSuccess={loadData}
      />
    </div>
  );
}
