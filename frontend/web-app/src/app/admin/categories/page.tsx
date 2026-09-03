'use client';
// frontend/web-app/src/app/admin/categories/page.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { apiClient, HttpError } from '@/api/client';
import { categoryApi, CategorySummary, ReviewCategoryInput } from '@/api/category';
import { Header } from '@/components/layout/Header';
import styles from '../../partner/partner.module.css';

export default function AdminCategoriesPage() {
  const { token, isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal de Rejeição
  const [rejectingCategory, setRejectingCategory] = useState<CategorySummary | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const rejectCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Trava de Segurança de Acesso — Verifica papel no backend/IAM
  useEffect(() => {
    if (isInitializing) return;

    if (!isAuthenticated || !token) {
      router.push('/auth/login');
      return;
    }

    apiClient.get<{ role?: string }>('/iam/me', token)
      .then((res) => {
        if (res?.role === 'ADMIN') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          toast.error('Acesso negado: Página restrita a Administradores.', '403 Proibido');
        }
      })
      .catch(() => {
        setIsAdmin(false);
      });
  }, [isAuthenticated, token, isInitializing, router, toast]);

  const fetchCategories = useCallback(async () => {
    if (!token || isAdmin !== true) return;
    setLoading(true);
    try {
      const filter: { status?: string } = {};
      if (statusFilter !== 'ALL') {
        filter.status = statusFilter;
      }

      const data = await categoryApi.listAdmin(token, filter);
      setCategories(data);
    } catch (err: any) {
      const msg = (err instanceof HttpError || err?.message) ? err.message : 'Erro ao listar categorias.';
      toast.error(msg, 'Erro');
      if (err instanceof HttpError && (err.status === 401 || err.status === 403)) {
        setIsAdmin(false);
      }
    } finally {
      setLoading(false);
    }
  }, [token, isAdmin, statusFilter, toast]);

  useEffect(() => {
    if (isAdmin === true) {
      fetchCategories();
    }
  }, [isAdmin, fetchCategories]);

  // Acessibilidade no modal de rejeição
  useEffect(() => {
    if (rejectingCategory) {
      rejectCloseRef.current?.focus();
    }
  }, [rejectingCategory]);

  const handleReviewAction = async (category: CategorySummary, decision: ReviewCategoryInput) => {
    if (!token) return;
    setUpdating(true);
    try {
      const updated = await categoryApi.review(category.id, decision, token);
      setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));

      let actionLabel = 'Categoria revisada com sucesso!';
      if (decision.action === 'APPROVE_GLOBAL') {
        actionLabel = `A categoria "${updated.name}" foi aprovada como GLOBAL para todos os parceiros e clientes.`;
      } else if (decision.action === 'APPROVE_RESTRICTED') {
        actionLabel = `A categoria "${updated.name}" foi aprovada exclusivamente para o estabelecimento que a registrou.`;
      } else if (decision.action === 'REJECT') {
        actionLabel = `A categoria "${updated.name}" foi rejeitada.`;
      }

      toast.success(actionLabel, 'Moderação Concluída');
      setRejectingCategory(null);
      setRejectionReason('');
    } catch (err: any) {
      const msg = (err instanceof HttpError || err?.message) ? err.message : 'Erro ao revisar categoria.';
      toast.error(msg, 'Erro na Moderação');
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingCategory) return;
    if (!rejectionReason.trim()) {
      toast.warning('Informe o motivo da rejeição da categoria.', 'Justificativa Obrigatória');
      return;
    }

    handleReviewAction(rejectingCategory, {
      action: 'REJECT',
      rejectionReason: rejectionReason.trim(),
    });
  };

  if (!mounted || isInitializing || isAdmin === null) {
    return (
      <div className="profile-page">
        <Header />
        <main className={styles.container}>
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>⏳</span>
            <h2>Verificando permissões administrativas…</h2>
          </div>
        </main>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="profile-page">
        <Header />
        <main className={styles.container}>
          <div className={styles.emptyState} style={{ borderColor: 'var(--color-danger, #ef4444)' }}>
            <span className={styles.emptyIcon}>🚫</span>
            <h2 style={{ color: 'var(--color-danger, #ef4444)' }}>403 Forbidden — Acesso Proibido</h2>
            <p>Você não tem autorização para acessar o painel de moderação de categorias.</p>
            <div style={{ marginTop: '1.5rem' }}>
              <Link href="/dashboard" className="btn btn-primary">
                Voltar ao Dashboard
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Filtragem local por termo de busca
  const filteredCategories = categories.filter((cat) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      cat.name.toLowerCase().includes(term) ||
      cat.normalizedName.toLowerCase().includes(term) ||
      (cat.rejectionReason && cat.rejectionReason.toLowerCase().includes(term))
    );
  });

  // Contadores
  const countTotal = categories.length;
  const countPending = categories.filter((c) => c.status === 'PENDING_APPROVAL').length;
  const countApprovedGlobal = categories.filter((c) => c.status === 'APPROVED' && c.visibility === 'GLOBAL').length;
  const countApprovedRestricted = categories.filter((c) => c.status === 'APPROVED' && c.visibility === 'RESTRICTED').length;
  const countRejected = categories.filter((c) => c.status === 'REJECTED').length;

  return (
    <div className="profile-page">
      <Header />

      <main className={styles.container}>
        {/* Cabeçalho */}
        <div className={styles.header} style={{ marginBottom: '1.5rem' }}>
          <div className={styles.titleArea}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '2rem' }}>🏷️</span>
              <div>
                <h1 className={styles.title} style={{ margin: 0 }}>Moderação de Categorias</h1>
                <p className={styles.subtitle} style={{ margin: '4px 0 0 0' }}>
                  Gerencie categorias cadastradas por parceiros e defina sua visibilidade no catálogo.
                </p>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link href="/admin/partners" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
              🏪 Moderação de Parceiros
            </Link>
            <Link href="/admin/reports" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
              🚨 Denúncias
            </Link>
          </div>
        </div>

        {/* Métricas / Cards de Resumo */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <div className={styles.card} style={{ padding: '1rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total de Categorias
            </span>
            <strong style={{ fontSize: '1.75rem', display: 'block', marginTop: '0.25rem' }}>{countTotal}</strong>
          </div>

          <div
            className={styles.card}
            style={{
              padding: '1rem',
              textAlign: 'center',
              borderLeft: '4px solid var(--color-warning, #eab308)',
              background: countPending > 0 ? 'rgba(234, 179, 8, 0.05)' : undefined,
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--color-warning, #eab308)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ⏳ Pendentes
            </span>
            <strong style={{ fontSize: '1.75rem', display: 'block', marginTop: '0.25rem', color: 'var(--color-warning, #eab308)' }}>
              {countPending}
            </strong>
          </div>

          <div className={styles.card} style={{ padding: '1rem', textAlign: 'center', borderLeft: '4px solid #3b82f6' }}>
            <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🌍 Aprovadas Globais
            </span>
            <strong style={{ fontSize: '1.75rem', display: 'block', marginTop: '0.25rem', color: '#3b82f6' }}>
              {countApprovedGlobal}
            </strong>
          </div>

          <div className={styles.card} style={{ padding: '1rem', textAlign: 'center', borderLeft: '4px solid var(--color-primary, #059669)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-primary, #059669)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🔒 Aprovadas Restritas
            </span>
            <strong style={{ fontSize: '1.75rem', display: 'block', marginTop: '0.25rem', color: 'var(--color-primary, #059669)' }}>
              {countApprovedRestricted}
            </strong>
          </div>

          <div className={styles.card} style={{ padding: '1rem', textAlign: 'center', borderLeft: '4px solid var(--color-danger, #ef4444)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-danger, #ef4444)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ❌ Rejeitadas
            </span>
            <strong style={{ fontSize: '1.75rem', display: 'block', marginTop: '0.25rem', color: 'var(--color-danger, #ef4444)' }}>
              {countRejected}
            </strong>
          </div>
        </div>

        {/* Filtros e Barra de Busca */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '1.5rem',
          }}
        >
          {/* Segmented Filter Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={statusFilter === 'ALL' ? 'btn btn-primary' : 'btn btn-secondary'}
              onClick={() => setStatusFilter('ALL')}
              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            >
              Todas ({countTotal})
            </button>
            <button
              type="button"
              className={statusFilter === 'PENDING_APPROVAL' ? 'btn btn-primary' : 'btn btn-secondary'}
              onClick={() => setStatusFilter('PENDING_APPROVAL')}
              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            >
              ⏳ Pendentes ({countPending})
            </button>
            <button
              type="button"
              className={statusFilter === 'APPROVED' ? 'btn btn-primary' : 'btn btn-secondary'}
              onClick={() => setStatusFilter('APPROVED')}
              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            >
              ✅ Aprovadas ({countApprovedGlobal + countApprovedRestricted})
            </button>
            <button
              type="button"
              className={statusFilter === 'REJECTED' ? 'btn btn-primary' : 'btn btn-secondary'}
              onClick={() => setStatusFilter('REJECTED')}
              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            >
              ❌ Rejeitadas ({countRejected})
            </button>
          </div>

          {/* Campo de Busca */}
          <div style={{ minWidth: '260px', flex: '0 1 320px' }}>
            <input
              type="text"
              placeholder="🔍 Buscar por nome da categoria…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.input}
              style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem', width: '100%' }}
            />
          </div>
        </div>

        {/* Lista de Categorias */}
        {loading ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>⏳</span>
            <h2>Carregando categorias…</h2>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🏷️</span>
            <h2>Nenhuma categoria encontrada</h2>
            <p>Nenhuma categoria corresponde ao filtro selecionado.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredCategories.map((cat) => {
              const isPending = cat.status === 'PENDING_APPROVAL';
              const isApproved = cat.status === 'APPROVED';
              const isRejected = cat.status === 'REJECTED';
              const isGlobal = cat.visibility === 'GLOBAL';

              return (
                <div
                  key={cat.id}
                  className={styles.card}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    padding: '1.25rem',
                    borderLeft: isPending
                      ? '4px solid var(--color-warning, #eab308)'
                      : isRejected
                      ? '4px solid var(--color-danger, #ef4444)'
                      : isGlobal
                      ? '4px solid #3b82f6'
                      : '4px solid var(--color-primary, #059669)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>{cat.name}</h2>
                        
                        {/* Status Badge */}
                        {isPending && (
                          <span className={`${styles.badge} ${styles.badgePending}`}>
                            ⏳ Pendente de Moderação
                          </span>
                        )}
                        {isApproved && (
                          <span className={`${styles.badge} ${styles.badgeApproved}`}>
                            ✅ Aprovada
                          </span>
                        )}
                        {isRejected && (
                          <span className={`${styles.badge} ${styles.badgeDanger}`}>
                            ❌ Rejeitada
                          </span>
                        )}

                        {/* Visibility Badge */}
                        {isGlobal ? (
                          <span
                            style={{
                              padding: '0.2rem 0.6rem',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: 'rgba(59, 130, 246, 0.15)',
                              color: '#3b82f6',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                            }}
                          >
                            🌍 Visibilidade Global (Pública)
                          </span>
                        ) : (
                          <span
                            style={{
                              padding: '0.2rem 0.6rem',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: 'rgba(234, 179, 8, 0.12)',
                              color: 'var(--color-warning, #eab308)',
                              border: '1px solid rgba(234, 179, 8, 0.3)',
                            }}
                          >
                            🔒 Restrita ao Parceiro Criador
                          </span>
                        )}
                      </div>

                      <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        <span>Identificador normalizado: <code>{cat.normalizedName}</code></span>
                        <span style={{ margin: '0 8px' }}>•</span>
                        <span>Cadastrada em: {new Date(cat.createdAt).toLocaleDateString('pt-BR')}</span>
                        {cat.partnerId && (
                          <>
                            <span style={{ margin: '0 8px' }}>•</span>
                            <span>ID do Parceiro: <code>{cat.partnerId}</code></span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Botões de Ação de Moderação */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleReviewAction(cat, { action: 'APPROVE_GLOBAL' })}
                        disabled={updating || (isApproved && isGlobal)}
                        className="btn btn-primary"
                        style={{
                          fontSize: '0.8rem',
                          padding: '0.4rem 0.85rem',
                          background: isApproved && isGlobal ? 'rgba(59, 130, 246, 0.2)' : undefined,
                        }}
                        title="Torna a categoria pública para todos os parceiros e clientes"
                      >
                        🌍 Tornar Global
                      </button>

                      <button
                        type="button"
                        onClick={() => handleReviewAction(cat, { action: 'APPROVE_RESTRICTED' })}
                        disabled={updating || (isApproved && !isGlobal)}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                        title="Aprova apenas para o parceiro criador utilizar"
                      >
                        🔒 Aprovar Restrita
                      </button>

                      {!isRejected && (
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingCategory(cat);
                            setRejectionReason('');
                          }}
                          disabled={updating}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.4rem 0.85rem',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            borderRadius: '0.75rem',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            cursor: 'pointer',
                          }}
                        >
                          ❌ Rejeitar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Justificativa de Rejeição se houver */}
                  {isRejected && cat.rejectionReason && (
                    <div
                      style={{
                        padding: '0.75rem',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        fontSize: '0.85rem',
                        color: 'var(--color-danger, #ef4444)',
                      }}
                    >
                      <strong>Motivo da Rejeição:</strong> {cat.rejectionReason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de Rejeição com Justificativa */}
        {rejectingCategory && (
          <div
            className={styles.dialogOverlay}
            onClick={() => setRejectingCategory(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-modal-title"
          >
            <div
              className={styles.dialogCard}
              style={{ maxWidth: '480px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h3 id="reject-modal-title" className={styles.modalTitle}>
                  ❌ Rejeitar Categoria
                </h3>
                <button
                  ref={rejectCloseRef}
                  type="button"
                  onClick={() => setRejectingCategory(null)}
                  className={styles.modalCloseBtn}
                  aria-label="Fechar modal"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleConfirmReject} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                  Informe o motivo da rejeição da categoria <strong>"{rejectingCategory.name}"</strong>:
                </p>

                <textarea
                  rows={3}
                  className={styles.textarea}
                  placeholder="Ex: Categoria fora do escopo ou nome inapropriado para o guia alimentar..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                  autoFocus
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setRejectingCategory(null)}
                    className="btn btn-ghost"
                    disabled={updating}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-danger"
                    style={{
                      background: '#ef4444',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.5rem 1.2rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                    disabled={updating}
                  >
                    {updating ? 'Rejeitando…' : 'Confirmar Rejeição'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
