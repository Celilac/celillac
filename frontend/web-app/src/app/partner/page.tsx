'use client';
// frontend/web-app/src/app/partner/page.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { partnerApi, PartnerSummary } from '@/api/partner';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/useToast';
import { HttpError } from '@/api/client';
import { Header } from '@/components/layout/Header';
import styles from './partner.module.css';

export default function PartnerDashboardPage() {
  const { token, isAuthenticated, isInitializing } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const toast = useToast();

  const [partners, setPartners] = useState<PartnerSummary[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (isInitializing) return;

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
  }, [isAuthenticated, token, isInitializing, router, toast]);

  if (loading || isInitializing) {
    return (
      <div className={styles.container}>
        <p className="profile-loading" role="status">Carregando seus estabelecimentos…</p>
      </div>
    );
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className={`${styles.badge} ${styles.badgeApproved}`}>Aprovado</span>;
      case 'PENDING_REVIEW':
        return <span className={`${styles.badge} ${styles.badgePending}`}>Pendente de Revisão</span>;
      case 'REJECTED':
        return <span className={`${styles.badge} ${styles.badgeRejected}`}>Rejeitado</span>;
      case 'SUSPENDED':
        return <span className={`${styles.badge} ${styles.badgeSuspended}`}>Suspenso</span>;
      default:
        return <span className={`${styles.badge} ${styles.badgeDraft}`}>Rascunho</span>;
    }
  };

  return (
    <div className="profile-page">
      <Header />

      <main className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>Meus Estabelecimentos</h1>
            <p className={styles.subtitle}>Gerencie suas marcas, informações e catálogo no ecossistema CeLiLac.</p>
          </div>
          <Link href="/partner/register" className={`${styles.btn} ${styles.btnPrimary}`} style={{ textDecoration: 'none' }}>
            ➕ Novo Estabelecimento
          </Link>
        </div>

        <div className={styles.grid}>
          {partners.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🏪</span>
              <h2>Nenhum estabelecimento comercial cadastrado</h2>
              <p>Cadastre sua marca para exibir produtos e conquistar clientes com restrições alimentares.</p>
              <Link href="/partner/register" className={`${styles.btn} ${styles.btnPrimary}`} style={{ marginTop: '1rem', textDecoration: 'none' }}>
                Cadastrar Agora
              </Link>
            </div>
          ) : (
            partners.map((partner) => (
              <section key={partner.id} className={styles.card}>
                <div className={styles.cardContent}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h2 className={styles.partnerName}>{partner.name}</h2>
                    {getStatusLabel(partner.approvalStatus)}
                  </div>
                  <p className={styles.partnerDescription}>{partner.description || 'Sem descrição cadastrada.'}</p>
                  
                  <div className={styles.partnerMeta}>
                    <span className={styles.metaItem}>📍 {partner.city ? `${partner.city} - ${partner.state}` : 'Sem cidade'}</span>
                    <span className={styles.metaItem}>📞 {partner.phone}</span>
                    <span className={styles.metaItem}>💼 {partner.type}</span>
                  </div>

                  {partner.approvalStatus === 'REJECTED' && partner.rejectionReason && (
                    <p style={{ fontSize: '0.8rem', color: '#f87171', background: 'rgba(239,68,68,0.05)', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.1)' }}>
                      <strong>Motivo da Rejeição:</strong> {partner.rejectionReason}
                    </p>
                  )}

                  {partner.approvalStatus === 'SUSPENDED' && partner.suspensionReason && (
                    <p style={{ fontSize: '0.8rem', color: '#a78bfa', background: 'rgba(139,92,246,0.05)', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(139,92,246,0.1)' }}>
                      <strong>Motivo da Suspensão:</strong> {partner.suspensionReason}
                    </p>
                  )}
                </div>

                <div className={styles.cardActions}>
                  <Link href={`/partner/${partner.id}`} className={`${styles.btn} ${styles.btnPrimary}`} style={{ textDecoration: 'none', textAlign: 'center' }}>
                    Gerenciar
                  </Link>
                  <Link href={`/partner/${partner.id}/edit`} className={`${styles.btn} ${styles.btnSecondary}`} style={{ textDecoration: 'none', textAlign: 'center' }}>
                    Editar Dados
                  </Link>
                </div>
              </section>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
