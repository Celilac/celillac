'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { catalogApi, ProductDetails } from '@/api/catalog';
import { compatibilityApi, CompatibilityResponse } from '@/api/compatibility';
import { Header } from '@/components/layout/Header';
import { RiskBadge } from '@/components/compatibility/RiskBadge';
import { FavoriteButton } from '@/components/common/FavoriteButton';
import { ReportModal } from '@/components/common/ReportModal';
import { ReviewsList } from '@/components/common/ReviewsList';
import { useToast } from '@/hooks/useToast';
import styles from '../../dashboard/dashboard.module.css';

interface PageProps {
  params: { id: string };
}

export default function ProductDetailsPage({ params }: PageProps) {
  const productId = params?.id;

  const { token, userId, isAuthenticated } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [compatibility, setCompatibility] = useState<CompatibilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const prodData = await catalogApi.getById(productId, token || undefined);
        setProduct(prodData);

        if (isAuthenticated && token && userId) {
          try {
            const comp = await compatibilityApi.check({ userId, productId }, token);
            setCompatibility(comp);
          } catch (_) {
            // Ignora erro de compatibilidade se perfil incompleto
          }
        }
      } catch (err: any) {
        toast.error('Erro ao carregar detalhes do produto.', 'Erro');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [productId, token, userId, isAuthenticated, toast]);

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
          <Link href="/dashboard" className="btn btn-em" style={{ marginTop: '1rem', display: 'inline-block' }}>
            Voltar ao Dashboard
          </Link>
        </main>
      </div>
    );
  }

  const activeRiskLevel = compatibility?.riskLevel || product.compatibilityReport?.riskLevel || 'UNEVALUATED';

  return (
    <div>
      <Header />

      <main className={styles.container} style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <Link href="/dashboard" style={{ color: 'var(--color-emerald)', textDecoration: 'none', fontWeight: 600 }}>
            ← Voltar ao Dashboard
          </Link>
        </div>

        {/* Card Principal do Produto */}
        <div className={styles.card} style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {product.category || 'Alimentos e Bebidas'}
              </span>
              <h1 style={{ fontSize: '1.8rem', color: 'var(--color-text)', margin: '0.25rem 0 0.5rem 0' }}>
                {product.name}
              </h1>
              <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '1rem' }}>
                Marca / Parceiro: <strong>{product.brand}</strong>
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <FavoriteButton productId={product.id} />
              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
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
                  background: 'transparent',
                }}
                title="Denunciar Produto"
              >
                🚩 Denunciar
              </button>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '1.5rem 0' }} />

          {/* Veredito de Compatibilidade Alimentar */}
          <div style={{ background: 'var(--color-elevated)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text)', marginBottom: '0.75rem' }}>
              🛡️ Análise de Compatibilidade Alimentar
            </h3>
            <RiskBadge riskLevel={activeRiskLevel} showDescription={true} />

            {compatibility && (
              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px dotted var(--color-border)' }}>
                <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-text)' }}>
                  {compatibility.reasoning}
                </p>
                {compatibility.conflicts?.map((conflict, index) => (
                  <div key={index} style={{ marginTop: '0.5rem', color: 'var(--color-danger)', fontSize: '0.9rem' }}>
                    ⚠️ <strong>{conflict.allergen}:</strong> {conflict.reason}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ficha Técnica / Detalhes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div>
              <h4 style={{ color: 'var(--color-text)', marginBottom: '0.5rem' }}>📜 Ingredientes</h4>
              <p style={{ background: 'var(--color-surface)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', color: 'var(--color-text)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                {product.ingredients || 'Ingredientes não informados.'}
              </p>
            </div>

            <div>
              <h4 style={{ color: 'var(--color-text)', marginBottom: '0.5rem' }}>⚠️ Classificações & Alérgenos</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li style={{ padding: '0.5rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                  🌾 <strong>Contém Glúten:</strong> {product.hasGluten ? 'Sim' : 'Não'}
                </li>
                <li style={{ padding: '0.5rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                  🧪 <strong>Contaminação Cruzada:</strong> {product.crossContamination || 'Não informada'}
                </li>
                <li style={{ padding: '0.5rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                  📋 <strong>Status da Análise:</strong> {product.analysisStatus || 'VERIFICADO'}
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Seção de Avaliações de Consumidores (Item 14.5 + Issue #36) */}
        <div className={styles.card}>
          <ReviewsList productId={product.id} targetName={product.name} />
        </div>
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
