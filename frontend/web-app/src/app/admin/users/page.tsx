'use client';
// frontend/web-app/src/app/admin/users/page.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { apiClient, HttpError } from '@/api/client';
import { Header } from '@/components/layout/Header';
import { UserAvatar } from '@/components/common/UserAvatar';
import styles from '../../partner/partner.module.css';

export interface UserSummary {
  id: string;
  email: string;
  role: string;
  fullName?: string;
  birthDate?: string;
  gender?: string;
  avatarUrl?: string;
  accountStatus: string;
  profileEvaluationStatus: string;
  isEmailVerified: boolean;
}

interface DeleteConfirmModalProps {
  user: UserSummary;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

function DeleteConfirmModal({ user, onConfirm, onCancel, isDeleting }: DeleteConfirmModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: 'var(--color-surface, #1e293b)',
          border: '1px solid #ef4444',
          borderRadius: '16px',
          padding: '2rem',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '2rem' }}>🗑️</span>
          <h2
            id="delete-modal-title"
            style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#f87171' }}
          >
            Excluir Conta do Usuário
          </h2>
        </div>

        <p style={{ color: 'var(--color-text-muted, #94a3b8)', marginBottom: '0.5rem', lineHeight: 1.6 }}>
          Você está prestes a <strong style={{ color: '#f87171' }}>excluir permanentemente</strong> a conta de:
        </p>

        <div
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
          }}
        >
          <p style={{ margin: 0, fontWeight: 600, color: '#fff', wordBreak: 'break-all' }}>
            {user.fullName ? `${user.fullName} ` : ''}<span style={{ color: '#94a3b8', fontWeight: 400 }}>({user.email})</span>
          </p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
            Role: {user.role} · Status: {user.accountStatus}
          </p>
        </div>

        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          ⚠️ Esta ação <strong>não pode ser desfeita</strong>. Todos os dados vinculados (perfil alimentar, favoritos, avaliações) serão removidos. O e-mail ficará livre para novo cadastro.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            id="delete-confirm-cancel"
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--color-border, #334155)',
              background: 'transparent',
              color: 'var(--color-text-muted, #94a3b8)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            Cancelar
          </button>
          <button
            id="delete-confirm-proceed"
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: '8px',
              border: 'none',
              background: isDeleting ? '#7f1d1d' : '#ef4444',
              color: '#fff',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              fontSize: '0.9rem',
            }}
          >
            {isDeleting ? 'Excluindo…' : 'Sim, excluir conta'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const { token, userId: currentUserId, isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isInitializing) return;
    if (!isAuthenticated || !token) {
      router.push('/auth/login');
      return;
    }
    apiClient.get<UserSummary[]>('/admin/users', token)
      .then((data) => setUsers(data))
      .catch((err: any) => {
        const msg = (err instanceof HttpError || err?.message) ? err.message : 'Erro ao carregar lista de usuários.';
        toast.error(msg, 'Erro');
        router.push('/');
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, token, isInitializing, router, toast]);

  async function handleApproveAdmin(userId: string) {
    if (!token) return;
    setUpdating(true);
    try {
      await apiClient.patch(`/admin/users/${userId}/approve`, {}, token);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, accountStatus: 'ACTIVE' } : u)));
      toast.success('Conta de administrador aprovada com sucesso!');
    } catch (err: any) {
      const msg = (err instanceof HttpError || err?.message) ? err.message : 'Erro ao aprovar conta de administrador.';
      toast.error(msg, 'Erro');
    } finally { setUpdating(false); }
  }

  async function handlePromoteToAdmin(userId: string) {
    if (!token) return;
    setUpdating(true);
    try {
      await apiClient.patch(`/admin/users/${userId}/promote`, {}, token);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: 'ADMIN', accountStatus: 'ACTIVE', profileEvaluationStatus: 'APPROVED' } : u))
      );
      toast.success('Usuário promovido a Administrador com sucesso!');
    } catch (err: any) {
      const msg = (err instanceof HttpError || err?.message) ? err.message : 'Erro ao promover usuário a administrador.';
      toast.error(msg, 'Erro');
    } finally { setUpdating(false); }
  }

  async function handleDemoteAdmin(userId: string) {
    if (!token) return;
    setUpdating(true);
    try {
      await apiClient.patch(`/admin/users/${userId}/demote`, {}, token);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, role: 'CELIACO', profileEvaluationStatus: 'PENDING_EVALUATION' } : u
        )
      );
      toast.success('Privilégio de Administrador removido. Usuário retornou para CELIACO.');
    } catch (err: any) {
      const msg = (err instanceof HttpError || err?.message) ? err.message : 'Erro ao rebaixar administrador.';
      toast.error(msg, 'Erro');
    } finally { setUpdating(false); }
  }

  async function handleConfirmDelete() {
    if (!token || !deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/admin/users/${deleteTarget.id}`, token);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      toast.success(`Conta de ${deleteTarget.email} excluída permanentemente.`);
      setDeleteTarget(null);
    } catch (err: any) {
      const msg = (err instanceof HttpError || err?.message) ? err.message : 'Erro ao excluir conta.';
      toast.error(msg, 'Erro');
    } finally { setIsDeleting(false); }
  }

  async function handleEvaluateProfile(userId: string, newStatus: 'APPROVED' | 'REJECTED') {
    if (!token) return;
    setUpdating(true);
    try {
      await apiClient.patch(`/admin/users/${userId}/evaluate`, { status: newStatus }, token);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, profileEvaluationStatus: newStatus } : u)));
      toast.success(`Perfil ${newStatus === 'APPROVED' ? 'aprovado' : 'rejeitado'} com sucesso!`);
    } catch (err: any) {
      const msg = (err instanceof HttpError || err?.message) ? err.message : 'Erro ao atualizar avaliação de perfil.';
      toast.error(msg, 'Erro');
    } finally { setUpdating(false); }
  }

  if (loading || isInitializing) {
    return (
      <div className={styles.container}>
        <p className="profile-loading" role="status">Carregando gestão de usuários…</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {deleteTarget && (
        <DeleteConfirmModal
          user={deleteTarget}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
          isDeleting={isDeleting}
        />
      )}

      <Header />

      <main className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>Gestão de Usuários &amp; Administradores</h1>
            <p className={styles.subtitle}>
              Modere cadastros, avalie perfis, promova ou rebaixe administradores e gerencie contas da plataforma.
            </p>
          </div>
        </div>

        <div className={styles.grid}>
          {users.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>👥</span>
              <h2>Nenhum usuário cadastrado no sistema</h2>
            </div>
          ) : (
            users.map((user) => {
              const isSelf = currentUserId === user.id;
              return (
                <section key={user.id} className={styles.card}>
                  <div className={styles.cardContent}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <UserAvatar avatarUrl={user.avatarUrl} fullName={user.fullName} email={user.email} size={48} />
                      <div>
                        <h2 className={styles.partnerName} style={{ fontSize: 'var(--text-title)', margin: 0 }}>
                          {user.fullName || 'Sem nome cadastrado'}
                          {isSelf && (
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>
                              você
                            </span>
                          )}
                        </h2>
                        <p style={{ fontSize: 'var(--text-label)', color: 'var(--color-text-muted)', margin: 0 }}>{user.email}</p>
                      </div>
                    </div>

                    <div className={styles.partnerMeta} style={{ marginTop: '0.5rem' }}>
                      <span className={styles.metaItem}>🔑 <strong>Função:</strong> {user.role}</span>
                      <span className={styles.metaItem}>
                        📌 <strong>Conta:</strong>{' '}
                        {user.accountStatus === 'ACTIVE'
                          ? <span style={{ color: '#4ade80' }}>Ativa</span>
                          : <span style={{ color: '#facc15' }}>⏳ Pendente de Aprovação</span>}
                      </span>
                      <span className={styles.metaItem}>
                        📋 <strong>Perfil:</strong>{' '}
                        {user.profileEvaluationStatus === 'APPROVED'
                          ? <span style={{ color: '#4ade80' }}>✅ Aprovado</span>
                          : user.profileEvaluationStatus === 'REJECTED'
                            ? <span style={{ color: '#f87171' }}>❌ Rejeitado</span>
                            : <span style={{ color: '#facc15' }}>⏳ Pendente de Avaliação</span>}
                      </span>
                      <span className={styles.metaItem}>✉️ <strong>E-mail:</strong> {user.isEmailVerified ? 'Verificado' : 'Não verificado'}</span>
                    </div>
                  </div>

                  <div className={styles.cardActions} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                    {user.role === 'ADMIN' && user.accountStatus === 'PENDING_APPROVAL' && (
                      <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} style={{ flex: 1 }}
                        onClick={() => handleApproveAdmin(user.id)} disabled={updating} id={`approve-admin-${user.id}`}>
                        ✔️ Aprovar Acesso Admin
                      </button>
                    )}

                    {user.role !== 'ADMIN' && !isSelf && (
                      <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} style={{ flex: '1 1 100%' }}
                        onClick={() => handlePromoteToAdmin(user.id)} disabled={updating} id={`promote-admin-${user.id}`}>
                        👑 Promover a Administrador
                      </button>
                    )}

                    {user.role === 'ADMIN' && !isSelf && (
                      <button type="button" className={`${styles.btn} ${styles.btnDanger}`} style={{ flex: '1 1 100%', opacity: 0.85 }}
                        onClick={() => handleDemoteAdmin(user.id)} disabled={updating} id={`demote-admin-${user.id}`}>
                        ⬇️ Remover Acesso Admin
                      </button>
                    )}

                    {user.profileEvaluationStatus === 'PENDING_EVALUATION' && (
                      <>
                        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} style={{ flex: 1 }}
                          onClick={() => handleEvaluateProfile(user.id, 'APPROVED')} disabled={updating} id={`approve-profile-${user.id}`}>
                          ✅ Aprovar Perfil
                        </button>
                        <button type="button" className={`${styles.btn} ${styles.btnDanger}`} style={{ flex: 1 }}
                          onClick={() => handleEvaluateProfile(user.id, 'REJECTED')} disabled={updating} id={`reject-profile-${user.id}`}>
                          ❌ Rejeitar Perfil
                        </button>
                      </>
                    )}

                    {user.profileEvaluationStatus === 'REJECTED' && (
                      <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} style={{ flex: 1 }}
                        onClick={() => handleEvaluateProfile(user.id, 'APPROVED')} disabled={updating} id={`reapprove-profile-${user.id}`}>
                        🔄 Desfazer Rejeição &amp; Aprovar
                      </button>
                    )}

                    {user.profileEvaluationStatus === 'APPROVED' && user.role !== 'ADMIN' && (
                      <button type="button" className={`${styles.btn} ${styles.btnDanger}`} style={{ flex: 1 }}
                        onClick={() => handleEvaluateProfile(user.id, 'REJECTED')} disabled={updating} id={`re-reject-profile-${user.id}`}>
                        🚫 Alterar para Rejeitado
                      </button>
                    )}

                    {!isSelf && (
                      <button
                        type="button"
                        id={`delete-user-${user.id}`}
                        onClick={() => setDeleteTarget(user)}
                        disabled={updating || isDeleting}
                        style={{
                          flex: '1 1 100%',
                          marginTop: '0.25rem',
                          padding: '0.6rem 1rem',
                          borderRadius: '8px',
                          border: '1px solid rgba(239,68,68,0.4)',
                          background: 'rgba(239,68,68,0.08)',
                          color: '#f87171',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                        }}
                      >
                        🗑️ Excluir Conta do Usuário
                      </button>
                    )}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}

