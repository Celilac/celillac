'use client';
// frontend/web-app/src/app/partner/[id]/page.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', textDecoration: 'underline', cursor: 'pointer' }} onClick={() => router.push(`/partner/${partner.id}/edit`)}>
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
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
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
      <div className={`${styles.alertBanner} ${styles.alertBannerInfo}`} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
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
        <span className="topbar-title brand-lockup" onClick={() => router.push('/partner')} style={{ cursor: 'pointer' }}>
          <Image src="/brand/logo_with_transparent_background.png" alt="CeliLac" width={32} height={32} priority />
          <span className="brand-wordmark">Celi<span>Lac</span></span>
          <span className="brand-tagline">Painel de Controle</span>
        </span>
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
              <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
                <p className={styles.infoRow}><strong>Descrição Comercial:</strong></p>
                <p className={styles.partnerDescription} style={{ marginTop: '0.25rem' }}>
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
                  <strong>{partner.operationalStatus === 'ACTIVE' ? '🟢 Aberto' : '🔴 Fechado'}</strong>
                  <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }} className={styles.subtitle}>
                    {partner.operationalStatus === 'ACTIVE' 
                      ? 'Visível para clientes e aceitando pedidos.' 
                      : 'Exibe aviso de fechamento aos clientes.'}
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
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
