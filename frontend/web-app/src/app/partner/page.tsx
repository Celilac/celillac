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
import { translatePartnerType } from '@/utils/compatibilityTranslator';
import {
  PlusIcon,
  StoreIcon,
  MapPinIcon,
  PhoneIcon,
  BriefcaseIcon,
  ChefHatIcon,
  BanknoteIcon,
  StatusDot,
} from '@/components/layout/icons';
import styles from './partner.module.css';

const DEMO_PARTNERS: PartnerSummary[] = [
  {
    id: 'demo-partner-1',
    userId: 'user-demo',
    name: 'Sabor & Saúde Sem Glúten',
    companyName: 'Sabor e Saúde Alimentos Especiais LTDA',
    legalNature: 'PJ',
    documentType: 'CNPJ',
    documentNumber: '12.345.678/0001-90',
    cnpj: '12.345.678/0001-90',
    description: 'Restaurante e confeitaria 100% livre de glúten e contaminação cruzada. Cozinha dedicada e certificada.',
    address: 'Av. Paulista, 1500 - Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    phone: '(11) 98765-4321',
    type: 'RESTAURANT',
    approvalStatus: 'APPROVED',
    operationalStatus: 'ACTIVE',
    logoUrl: '/brand/logo_with_transparent_background.png',
  },
  {
    id: 'demo-partner-2',
    userId: 'user-demo',
    name: 'Fazenda Vale do Sol - Queijos Veganos',
    responsibleName: 'Carlos Eduardo Mendes',
    legalNature: 'PF',
    documentType: 'CPF',
    documentNumber: '123.456.789-00',
    description: 'Produção artesanal de queijos vegetais à base de castanhas e leites vegetais frescos. Zero lactose e caseína.',
    address: 'Estrada das Flores, Km 12',
    city: 'Atibaia',
    state: 'SP',
    phone: '(11) 97123-9876',
    type: 'PRODUCER',
    approvalStatus: 'APPROVED',
    operationalStatus: 'PAUSED',
  },
  {
    id: 'demo-partner-3',
    userId: 'user-demo',
    name: 'Padaria Artesanal Puro Trigo Zero',
    companyName: 'Panificadora Especial Zero Trigo EIRELI',
    legalNature: 'PJ',
    documentType: 'CNPJ',
    documentNumber: '98.765.432/0001-10',
    cnpj: '98.765.432/0001-10',
    description: 'Pães de fermentação natural, bolos e salgados preparados exclusivamente com farinhas sem glúten.',
    address: 'Rua das Camélias, 240',
    city: 'Campinas',
    state: 'SP',
    phone: '(19) 99876-1122',
    type: 'BAKERY',
    approvalStatus: 'PENDING',
    operationalStatus: 'INACTIVE',
  },
];

export default function PartnerListPage() {
  const { token, isAuthenticated, isInitializing } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const toast = useToast();

  const [partners, setPartners] = useState<PartnerSummary[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (isInitializing) return;

    const isDemo = typeof window !== 'undefined' && (new URLSearchParams(window.location.search).get('demo') === 'multi' || window.location.hash.includes('demo=multi'));

    if (!isAuthenticated || !token) {
      if (isDemo) {
        setPartners(DEMO_PARTNERS);
        setLoading(false);
        return;
      }
      router.replace('/auth/login');
      return;
    }

    partnerApi.listUserPartners(token)
      .then((data) => {
        if (data && data.length > 0) {
          setPartners(data);
        } else if (isDemo) {
          setPartners(DEMO_PARTNERS);
        } else {
          setPartners([]);
        }
      })
      .catch((err) => {
        if (isDemo) {
          setPartners(DEMO_PARTNERS);
        } else {
          toast.error(
            err instanceof HttpError ? err.message : 'Erro ao listar seus estabelecimentos.',
            'Erro'
          );
        }
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, token, isInitializing, router, toast]);

  if (loading || (isInitializing && !partners.length)) {
    return (
      <div className={styles.container}>
        <Header />
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 className={styles.title}>Meus Estabelecimentos</h1>
              {partners.length > 0 && (
                <span className={styles.countBadge}>
                  {partners.length} {partners.length === 1 ? 'cadastrado' : 'cadastrados'}
                </span>
              )}
            </div>
            <p className={styles.subtitle}>Gerencie suas marcas, informações e catálogo no ecossistema CeLiLac.</p>
          </div>
          <Link href="/partner/register" className={`${styles.btn} ${styles.btnPrimary}`} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <PlusIcon size={16} /> Novo Estabelecimento
          </Link>
        </div>

        <div className={styles.grid}>
          {partners.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}><StoreIcon size={44} /></span>
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
                  <div className={styles.cardHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                      {partner.logoUrl ? (
                        <img
                          src={partner.logoUrl}
                          alt={partner.name}
                          className={styles.partnerThumb}
                        />
                      ) : (
                        <div className={styles.partnerThumbFallback}>
                          <StoreIcon size={22} />
                        </div>
                      )}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h2 className={styles.partnerName} title={partner.name}>{partner.name}</h2>
                        {partner.companyName && (partner.legalNature === 'PJ' || !partner.legalNature) && (
                          <span className={styles.partnerSubName}>{partner.companyName}</span>
                        )}
                        {partner.responsibleName && partner.legalNature === 'PF' && (
                          <span className={styles.partnerSubName}>Produtor: {partner.responsibleName}</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                      {getStatusLabel(partner.approvalStatus)}
                      {partner.approvalStatus === 'APPROVED' && (
                        <span className={partner.operationalStatus === 'ACTIVE' ? styles.operationalActive : styles.operationalPaused}>
                          <StatusDot color={partner.operationalStatus === 'ACTIVE' ? 'green' : 'amber'} size={8} />
                          {partner.operationalStatus === 'ACTIVE' ? 'Aberto' : 'Pausado'}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className={styles.partnerDescription}>{partner.description || 'Sem descrição cadastrada.'}</p>
                  
                  <div className={styles.partnerMeta}>
                    <span className={styles.metaLegalBadge}>
                      {partner.legalNature === 'PF' || partner.documentType === 'CPF' ? (
                        <><strong>PF</strong> • Produtor Individual {partner.documentNumber ? `(${partner.documentNumber})` : ''}</>
                      ) : (
                        <><strong>PJ</strong> • Empresa {partner.documentNumber || partner.cnpj ? `(${partner.documentNumber || partner.cnpj})` : ''}</>
                      )}
                    </span>
                    <span className={styles.metaItem}><MapPinIcon size={14} /> {partner.city ? `${partner.city} - ${partner.state}` : 'Sem cidade'}</span>
                    <span className={styles.metaItem}><PhoneIcon size={14} /> {partner.phone}</span>
                    <span className={styles.metaItem}><BriefcaseIcon size={14} /> {translatePartnerType(partner.type)}</span>
                  </div>

                  {partner.approvalStatus === 'REJECTED' && partner.rejectionReason && (
                    <p style={{ fontSize: 'var(--text-label)', color: 'var(--color-status-rejected)', background: 'rgba(248,113,113,0.08)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(248,113,113,0.2)' }}>
                      <strong>Motivo da Rejeição:</strong> {partner.rejectionReason}
                    </p>
                  )}

                  {partner.approvalStatus === 'SUSPENDED' && partner.suspensionReason && (
                    <p style={{ fontSize: 'var(--text-label)', color: 'var(--color-status-suspended)', background: 'rgba(167,139,250,0.08)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(167,139,250,0.2)' }}>
                      <strong>Motivo da Suspensão:</strong> {partner.suspensionReason}
                    </p>
                  )}
                </div>

                <div className={styles.cardActions}>
                  <Link href={`/partner/${partner.id}`} className={`${styles.btn} ${styles.btnPrimary}`} style={{ textDecoration: 'none', textAlign: 'center' }}>
                    Gerenciar
                  </Link>
                  <Link href={`/partner/orders?partnerId=${partner.id}`} className={`${styles.btn} ${styles.btnSecondary}`} style={{ textDecoration: 'none', textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                    <ChefHatIcon size={14} /> Pedidos
                  </Link>
                  <Link href={`/partner/financial?partnerId=${partner.id}`} className={`${styles.btn} ${styles.btnSecondary}`} style={{ textDecoration: 'none', textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                    <BanknoteIcon size={14} /> Financeiro
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
