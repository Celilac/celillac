'use client';
// frontend/web-app/src/app/partner/[id]/page.tsx
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { partnerApi, PartnerSummary } from '@/api/partner';
import { catalogApi, ProductSummary } from '@/api/catalog';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/useToast';
import { HttpError } from '@/api/client';
import { Header } from '@/components/layout/Header';
import { CreateProductModal } from '@/components/common/CreateProductModal';
import styles from '../partner.module.css';

interface PageProps {
  params?: { id?: string };
}

export default function PartnerDetailPage({ params }: PageProps) {
  const routeParams = useParams();
  const id = (typeof routeParams?.id === 'string' ? routeParams.id : params?.id) || '';
  const { token, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const toast = useToast();

  const [partner, setPartner] = useState<PartnerSummary | null>(null);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loadProducts = useCallback(() => {
    if (!id || !token) return;
    setLoadingProducts(true);
    catalogApi.listByPartner(id, token)
      .then((res) => {
        if (res?.data) {
          setProducts(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  }, [id, token]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.push('/auth/login');
      return;
    }

    partnerApi.get(id)
      .then((data) => {
        setPartner(data);
        loadProducts();
      })
      .catch((err) => {
        toast.error(
          err instanceof HttpError ? err.message : 'Erro ao carregar dados do estabelecimento.',
          'Erro'
        );
        router.push('/partner');
      })
      .finally(() => setLoading(false));
  }, [id, isAuthenticated, token, router, toast, loadProducts]);

  async function handleToggleOperationalStatus() {
    if (!partner || !token) return;

    const nextStatus = partner.operationalStatus === 'ACTIVE' ? 'TEMPORARILY_CLOSED' : 'ACTIVE';
    setUpdating(true);
    try {
      await partnerApi.updateOperationalStatus(partner.id, nextStatus, token);
      setPartner({ ...partner, operationalStatus: nextStatus });
      toast.success(`Status operacional alterado para: ${nextStatus === 'ACTIVE' ? 'Aberto' : 'Temporariamente Fechado'}`);
    } catch (err) {
      toast.error(
        err instanceof HttpError ? err.message : 'Erro ao atualizar status operacional.',
        'Erro na atualização'
      );
    } finally {
      setUpdating(false);
    }
  }

  async function handleSubmitForReview() {
    if (!partner || !token) return;

    setUpdating(true);
    try {
      await partnerApi.submit(partner.id, token);
      setPartner({ ...partner, approvalStatus: 'PENDING_REVIEW' });
      toast.success('Estabelecimento submetido para revisão com sucesso!');
    } catch (err) {
      toast.error(
        err instanceof HttpError ? err.message : 'Erro ao submeter para revisão.',
        'Erro na submissão'
      );
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <p className="profile-loading" role="status">Carregando painel do estabelecimento…</p>
      </div>
    );
  }

  if (!partner) return null;

  const getStatusAlert = () => {
    if (partner.approvalStatus === 'REJECTED') {
      return (
        <div className={`${styles.alertBanner} ${styles.alertBannerDanger}`}>
          <span style={{ fontSize: '1.25rem' }}>⚠️</span>
          <div>
            <strong>Cadastro Rejeitado pela Administração</strong>
            <p style={{ marginTop: '0.25rem' }}>
              Motivo: <em>"{partner.rejectionReason || 'Não informado.'}"</em>
            </p>
            <Link href={`/partner/${partner.id}/edit`} style={{ display: 'inline-block', fontSize: 'var(--text-label)', marginTop: '0.5rem', textDecoration: 'underline' }}>
              Clique aqui para corrigir os dados e enviar novamente.
            </Link>
          </div>
        </div>
      );
    }

    if (partner.approvalStatus === 'SUSPENDED') {
      return (
        <div className={`${styles.alertBanner} ${styles.alertBannerDanger}`}>
          <span style={{ fontSize: '1.25rem' }}>🚫</span>
          <div>
            <strong>Estabelecimento Suspenso</strong>
            <p style={{ marginTop: '0.25rem' }}>
              Motivo da suspensão: <em>"{partner.suspensionReason || 'Não informado.'}"</em>
            </p>
            <p style={{ fontSize: 'var(--text-label)', marginTop: '0.5rem' }}>
              Sua listagem pública e produtos associados estão temporariamente ocultados. Entre em contato com o suporte para regularizar sua situação.
            </p>
          </div>
        </div>
      );
    }

    if (partner.approvalStatus === 'PENDING_REVIEW') {
      return (
        <div className={`${styles.alertBanner} ${styles.alertBannerWarning}`}>
          <span style={{ fontSize: '1.25rem' }}>⏳</span>
          <div>
            <strong>Aguardando Revisão Administrativa</strong>
            <p style={{ marginTop: '0.25rem' }}>
              Seus dados comerciais estão sendo avaliados pela governança da plataforma. O estabelecimento ficará visível publicamente assim que for aprovado e aberto.
            </p>
          </div>
        </div>
      );
    }

    if (partner.approvalStatus === 'DRAFT') {
      return (
        <div className={`${styles.alertBanner} ${styles.alertBannerInfo}`}>
          <span style={{ fontSize: '1.25rem' }}>📝</span>
          <div>
            <strong>Cadastro em Rascunho</strong>
            <p style={{ marginTop: '0.25rem' }}>
              Complete seus dados e clique no botão de submissão para enviar à equipe administrativa para revisão.
            </p>
            <button 
              type="button" 
              className={`${styles.btn} ${styles.btnPrimary}`} 
              style={{ marginTop: '0.75rem', padding: '0.45rem 1rem', fontSize: '0.8rem' }}
              onClick={handleSubmitForReview}
              disabled={updating}
            >
              🚀 Enviar para Revisão
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={`${styles.alertBanner} ${styles.alertBannerInfo}`} style={{ background: 'var(--color-status-approved-bg)', color: 'var(--color-status-approved)', borderColor: 'var(--color-status-approved-border)' }}>
        <span style={{ fontSize: '1.25rem' }}>✅</span>
        <div>
          <strong>Cadastro Aprovado e Homologado</strong>
          <p style={{ marginTop: '0.25rem' }}>
            Seu estabelecimento está em conformidade com as diretrizes do CeLiLac. Se estiver "Aberto", seus produtos ativos estão visíveis para os consumidores na busca.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="profile-page">
      <Header />

      <main className={styles.container}>
        <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <div className={styles.titleArea} style={{ flex: '1 1 300px' }}>
            <h1 className={styles.title} style={{ margin: 0, fontSize: 'clamp(1.5rem, 2.5vw, 2.25rem)' }}>{partner.name}</h1>
            <p className={styles.subtitle} style={{ margin: '4px 0 0 0' }}>Gestão operacional do perfil `{partner.type}`</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link 
              href="/partner" 
              className="btn btn-secondary"
              style={{ textDecoration: 'none', whiteSpace: 'nowrap', fontSize: '0.875rem', padding: '0.5rem 1rem' }}
            >
              ⬅️ Meus Estabelecimentos
            </Link>
            <button
              type="button"
              className="btn btn-em"
              onClick={() => setIsCreateModalOpen(true)}
              style={{ whiteSpace: 'nowrap', fontSize: '0.875rem', padding: '0.5rem 1.1rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              ➕ Publicar Produto
            </button>
            <Link 
              href={`/partner/${partner.id}/edit`}
              className="btn btn-secondary"
              style={{ textDecoration: 'none', whiteSpace: 'nowrap', fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              id="edit-partner-btn"
            >
              ✏️ Editar Cadastro
            </Link>
          </div>
        </div>

        {getStatusAlert()}

        <div className={styles.dashboardLayout} style={{ marginTop: '2rem' }}>
          <section className={styles.mainPanel}>
            <div className={styles.card} style={{ gap: '1rem' }}>
              <h2 className={styles.sectionTitle}>🏢 Informações Cadastrais</h2>
              <div className={styles.infoGrid}>
                <div>
                  <p className={styles.infoRow}><strong>Razão/Nome Fantasia:</strong> <span>{partner.name}</span></p>
                  <p className={styles.infoRow}><strong>CNPJ:</strong> <span>{partner.cnpj || 'Não informado (Pessoa Física)'}</span></p>
                  <p className={styles.infoRow}><strong>Tipo:</strong> <span>{partner.type}</span></p>
                </div>
                <div>
                  <p className={styles.infoRow}><strong>Cidade/Estado:</strong> <span>{partner.city ? `${partner.city} - ${partner.state}` : 'Não cadastrado'}</span></p>
                  <p className={styles.infoRow}><strong>Região Atendimento:</strong> <span>{partner.deliveryRegion || 'Local'}</span></p>
                  <p className={styles.infoRow}><strong>Telefone de Contato:</strong> <span>{partner.phone}</span></p>
                </div>
              </div>
              <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                <p><strong>Descrição Comercial:</strong></p>
                <p style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem', fontSize: 'var(--text-body)', lineHeight: '1.6' }}>
                  {partner.description || 'Nenhuma descrição adicionada.'}
                </p>
              </div>
            </div>

            {/* SEÇÃO DE PRODUTOS DO ESTABELECIMENTO */}
            <div className={styles.card} style={{ gap: '1.25rem', marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 className={styles.sectionTitle} style={{ margin: 0 }}>📦 Produtos do Estabelecimento</h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    Itens fabricados ou fornecidos por {partner.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="btn btn-em"
                  style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  ➕ Novo Produto
                </button>
              </div>

              {loadingProducts ? (
                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem 0' }}>Carregando produtos…</p>
              ) : products.length === 0 ? (
                <div style={{
                  padding: '2rem',
                  textAlign: 'center',
                  background: 'var(--color-elevated, rgba(255,255,255,0.02))',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)',
                }}>
                  <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    Nenhum produto cadastrado para este estabelecimento ainda.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="btn btn-em"
                    style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                  >
                    ➕ Cadastrar Primeiro Produto
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {products.map((p) => {
                    const statusInfo: Record<string, { label: string; bg: string; color: string; border: string }> = {
                      APPROVED: { label: '✅ Aprovado', bg: 'var(--color-safe-bg)', color: 'var(--color-safe)', border: 'var(--color-safe-border)' },
                      PENDING_ANALYSIS: { label: '⏳ Pendente', bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', border: 'var(--color-warning-border)' },
                      FLAGGED: { label: '⚠️ Sinalizado', bg: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: 'var(--color-danger-border)' },
                    };
                    const st = statusInfo[p.analysisStatus] || statusInfo['PENDING_ANALYSIS'];

                    return (
                      <div
                        key={p.id}
                        style={{
                          padding: '1rem',
                          borderRadius: '10px',
                          background: 'var(--color-elevated)',
                          border: '1px solid var(--color-border)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '12px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: '240px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '1rem', color: 'var(--color-text)' }}>{p.name}</strong>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: st.bg,
                              color: st.color,
                              border: `1px solid ${st.border}`,
                            }}>
                              {st.label}
                            </span>
                          </div>

                          <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                            <strong>Marca:</strong> {p.brand || 'Própria'}
                          </p>

                          {p.ingredients && (
                            <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                              <strong>Ingredientes:</strong> {p.ingredients}
                            </p>
                          )}

                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {p.hasGluten ? (
                              <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, background: 'var(--color-blocked-bg)', color: 'var(--color-blocked)', border: '1px solid var(--color-blocked-border, rgba(239,68,68,0.3))' }}>
                                🌾 Contém Glúten
                              </span>
                            ) : (
                              <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, background: 'var(--color-safe-bg)', color: 'var(--color-safe)', border: '1px solid var(--color-safe-border)' }}>
                                ✨ Sem Glúten
                              </span>
                            )}

                            {p.crossContamination && p.crossContamination !== 'NONE' && (
                              <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, background: 'var(--color-warning-bg)', color: 'var(--color-warning)', border: '1px solid var(--color-warning-border)' }}>
                                ⚠️ Contaminação Cruzada
                              </span>
                            )}
                          </div>
                        </div>

                        <Link
                          href={`/products/${p.id}`}
                          className="btn btn-ghost"
                          style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', whiteSpace: 'nowrap' }}
                        >
                          📦 Ver no Catálogo
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <aside className={styles.sidePanel}>
            <div className={styles.card} style={{ gap: '1.25rem' }}>
              <h2 className={styles.sectionTitle}>⚙️ Status Operacional</h2>
              
              <div className={styles.toggleContainer}>
                <div>
                  <p style={{ fontWeight: '600', color: 'var(--color-text)' }}>
                    {partner.operationalStatus === 'ACTIVE' ? '🟢 Aberto' :
                     partner.operationalStatus === 'TEMPORARILY_CLOSED' ? '🟡 Temporariamente Fechado' : '🔴 Inativo'}
                  </p>
                  <p style={{ fontSize: 'var(--text-label)', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    {partner.operationalStatus === 'ACTIVE' ? 'Visível na busca e apto a operar.' : 'Exibe aviso de fechamento aos clientes.'}
                  </p>
                </div>
                <label className={styles.switch}>
                  <input 
                    type="checkbox" 
                    checked={partner.operationalStatus === 'ACTIVE'}
                    onChange={handleToggleOperationalStatus}
                    disabled={updating}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>

              {partner.approvalStatus === 'SUSPENDED' && (
                <p style={{ fontSize: 'var(--text-label)', color: 'var(--color-status-rejected)', fontStyle: 'italic' }}>
                  * Controle operacional bloqueado devido a suspensão administrativa.
                </p>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* Modal de Publicação de Produto no Estabelecimento */}
      <CreateProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        partnerId={partner.id}
        partnerName={partner.name}
        onSuccess={loadProducts}
      />
    </div>
  );
}
