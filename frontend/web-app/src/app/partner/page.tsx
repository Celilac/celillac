'use client';
// frontend/web-app/src/app/partner/page.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { partnerApi, PartnerSummary } from '@/api/partner';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/useToast';
import { HttpError } from '@/api/client';
import { Header } from '@/components/layout/Header';
import styles from './partner.module.css';

export default function PartnerListPage() {
  const { token, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const toast = useToast();

  const [partners, setPartners] = useState<PartnerSummary[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.push('/auth/login');
      return;
    }

    partnerApi.listUserPartners(token)
      .then((data) => setPartners(data))
      .catch((err) => {
        toast.error(
          err instanceof HttpError ? err.message : 'Erro ao listar seus estabelecimentos.',
          'Erro'
        );
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, token, router, toast]);

  if (loading) {
    return (
      <div className={styles.container}>
        <p className="profile-loading" role="status">Carregando seus estabelecimentos…</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className={`${styles.badge} ${styles.badgeApproved}`}>✔️ Aprovado</span>;
      case 'PENDING_REVIEW':
        return <span className={`${styles.badge} ${styles.badgePending}`}>⏳ Sob Análise</span>;
      case 'REJECTED':
        return <span className={`${styles.badge} ${styles.badgeRejected}`}>❌ Rejeitado</span>;
      case 'SUSPENDED':
        return <span className={`${styles.badge} ${styles.badgeSuspended}`}>🚫 Suspenso</span>;
      default:
        return <span className={`${styles.badge} ${styles.badgeDraft}`}>📝 Rascunho</span>;
    }
  };

  const getOperationalBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className={`${styles.badge} ${styles.badgeActive}`}>Aberto</span>;
      case 'TEMPORARILY_CLOSED':
        return <span className={`${styles.badge} ${styles.badgeClosed}`}>Temporariamente Fechado</span>;
      default:
        return <span className={`${styles.badge} ${styles.badgeInactive}`}>Inativo</span>;
    }
  };

  return (
    <div className="profile-page">
      <Header />

      <main className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>Meus Estabelecimentos</h1>
            <p className={styles.subtitle}>Gerencie seus perfis comerciais e listagens de produtos.</p>
          </div>
          <button 
            type="button" 
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => router.push('/partner/register')}
            id="register-partner-btn"
          >
            🏢 Cadastrar Estabelecimento
          </button>
        </div>

        <div className={styles.grid}>
          {partners.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🏢</span>
              <h2>Nenhum estabelecimento cadastrado</h2>
              <p>Comece criando o perfil comercial da sua lanchonete, mercado ou produção artesanal.</p>
              <button 
                type="button" 
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => router.push('/partner/register')}
              >
                Criar Primeiro Perfil
              </button>
            </div>
          ) : (
            partners.map((partner) => (
              <section key={partner.id} className={styles.card}>
                <div className={styles.cardContent}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h2 className={styles.partnerName}>{partner.name}</h2>
                    {getStatusBadge(partner.approvalStatus)}
                  </div>
                  <p className={styles.partnerDescription}>{partner.description || 'Sem descrição cadastrada.'}</p>
                  
                  <div className={styles.partnerMeta}>
                    <span className={styles.metaItem}>📍 {partner.city ? `${partner.city} - ${partner.state}` : 'Sem endereço detalhado'}</span>
                    <span className={styles.metaItem}>📞 {partner.phone}</span>
                    <span className={styles.metaItem}>💼 {partner.type}</span>
                  </div>

                  <div style={{ marginTop: '0.5rem' }}>
                    Status Operacional: {getOperationalBadge(partner.operationalStatus)}
                  </div>
                </div>

                <div className={styles.cardActions}>
                  <button 
                    type="button" 
                    className={`${styles.btn} ${styles.btnPrimary}`} 
                    style={{ flex: 1 }}
                    onClick={() => router.push(`/partner/${partner.id}`)}
                    id={`manage-partner-${partner.id}`}
                  >
                    ⚙️ Gerenciar Painel
                  </button>
                </div>
              </section>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
