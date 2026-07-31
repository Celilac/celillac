'use client';
// frontend/web-app/src/app/partner/[id]/page.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { partnerApi, PartnerSummary } from '@/api/partner';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/useToast';
import { HttpError } from '@/api/client';
import styles from '../partner.module.css';

interface PageProps {
  params: { id: string };
}

export default function PartnerDashboardPage({ params }: PageProps) {
  const { id } = params;
  const { token, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const toast = useToast();

  const [partner, setPartner] = useState<PartnerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.push('/auth/login');
      return;
    }

    partnerApi.get(id)
      .then((data) => setPartner(data))
      .catch((err) => {
        toast.error(
          err instanceof HttpError ? err.message : 'Erro ao carregar dados do estabelecimento.',
          'Erro'
        );
        router.push('/partner');
      })
      .finally(() => setLoading(false));
  }, [id, isAuthenticated, token, router, toast]);

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
            <p style={{ fontSize: 'var(--text-label)', marginTop: '0.5rem', textDecoration: 'underline', cursor: 'pointer' }} onClick={() => router.push(`/partner/${partner.id}/edit`)}>
              Clique aqui para corrigir os dados e enviar novamente.
            </p>
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
      <header className="topbar">
        <Link href="/partner" className="topbar-title brand-lockup">
          <Image src="/brand/logo_with_transparent_background.png" alt="CeliLac" width={32} height={32} priority />
          <span className="brand-wordmark">Celi<span>Lac</span></span>
          <span className="brand-tagline">Painel de Controle</span>
        </Link>
        <nav className="topbar-actions">
          <button type="button" onClick={toggleTheme} className="btn btn-ghost theme-button" aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </nav>
      </header>

      <main className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>{partner.name}</h1>
            <p className={styles.subtitle}>Gestão operacional do perfil `{partner.type}`</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              type="button" 
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={() => router.push('/partner')}
            >
              ⬅️ Meus Negócios
            </button>
            <button 
              type="button" 
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => router.push(`/partner/${partner.id}/edit`)}
              id="edit-partner-btn"
            >
              ✏️ Editar Cadastro
            </button>
          </div>
        </div>

        {getStatusAlert()}

        <div className={styles.dashboardLayout} style={{ marginTop: '2rem' }}>
          <section className={styles.mainPanel}>
            <div className={styles.card} style={{ gap: '1rem' }}>
              <h2 className={styles.sectionTitle}>🏢 Informações Cadastrais</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: 'var(--text-body)', color: 'var(--color-text-muted)' }}>
                <div>
                  <p style={{ marginBottom: '0.5rem' }}><strong>Razão/Nome Fantasia:</strong> {partner.name}</p>
                  <p style={{ marginBottom: '0.5rem' }}><strong>CNPJ:</strong> {partner.cnpj || 'Não informado (Pessoa Física)'}</p>
                  <p style={{ marginBottom: '0.5rem' }}><strong>Tipo:</strong> {partner.type}</p>
                </div>
                <div>
                  <p style={{ marginBottom: '0.5rem' }}><strong>Cidade/Estado:</strong> {partner.city ? `${partner.city} - ${partner.state}` : 'Não cadastrado'}</p>
                  <p style={{ marginBottom: '0.5rem' }}><strong>Região Atendimento:</strong> {partner.deliveryRegion || 'Local'}</p>
                  <p style={{ marginBottom: '0.5rem' }}><strong>Telefone de Contato:</strong> {partner.phone}</p>
                </div>
              </div>
              <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                <p><strong>Descrição Comercial:</strong></p>
                <p style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem', fontSize: 'var(--text-body)', lineHeight: '1.6' }}>
                  {partner.description || 'Nenhuma descrição adicionada.'}
                </p>
              </div>
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
                <label className={styles.switch} id="operational-toggle">
                  <input 
                    type="checkbox" 
                    checked={partner.operationalStatus === 'ACTIVE'}
                    onChange={handleToggleOperationalStatus}
                    disabled={partner.approvalStatus === 'SUSPENDED' || updating}
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
    </div>
  );
}
