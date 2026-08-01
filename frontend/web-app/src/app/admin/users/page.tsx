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

export default function AdminUsersPage() {
  const { token, isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

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
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, accountStatus: 'ACTIVE' } : u))
      );
      toast.success('Conta de administrador aprovada com sucesso!');
    } catch (err: any) {
      const msg = (err instanceof HttpError || err?.message) ? err.message : 'Erro ao aprovar conta de administrador.';
      toast.error(msg, 'Erro');
    } finally {
      setUpdating(false);
    }
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
    } finally {
      setUpdating(false);
    }
  }

  async function handleEvaluateProfile(userId: string, newStatus: 'APPROVED' | 'REJECTED') {
    if (!token) return;
    setUpdating(true);
    try {
      await apiClient.patch(`/admin/users/${userId}/evaluate`, { status: newStatus }, token);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, profileEvaluationStatus: newStatus } : u))
      );
      toast.success(`Perfil ${newStatus === 'APPROVED' ? 'aprovado' : 'rejeitado'} com sucesso!`);
    } catch (err: any) {
      const msg = (err instanceof HttpError || err?.message) ? err.message : 'Erro ao atualizar avaliação de perfil.';
      toast.error(msg, 'Erro');
    } finally {
      setUpdating(false);
    }
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
      <Header />

      <main className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>Gestão de Usuários & Administradores</h1>
            <p className={styles.subtitle}>
              Modere cadastros, avalie perfis e promova colaboradores a Administradores da plataforma.
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
            users.map((user) => (
              <section key={user.id} className={styles.card}>
                <div className={styles.cardContent}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <UserAvatar avatarUrl={user.avatarUrl} fullName={user.fullName} email={user.email} size={48} />
                    <div>
                      <h2 className={styles.partnerName} style={{ fontSize: '1.1rem', margin: 0 }}>
                        {user.fullName || 'Sem nome cadastrado'}
                      </h2>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted, #9ca3af)', margin: 0 }}>{user.email}</p>
                    </div>
                  </div>

                  <div className={styles.partnerMeta} style={{ marginTop: '0.5rem' }}>
                    <span className={styles.metaItem}>
                      🔑 <strong>Função:</strong> {user.role}
                    </span>
                    <span className={styles.metaItem}>
                      📌 <strong>Conta:</strong>{' '}
                      {user.accountStatus === 'ACTIVE' ? (
                        <span style={{ color: '#4ade80' }}>Ativa</span>
                      ) : (
                        <span style={{ color: '#facc15' }}>⏳ Pendente de Aprovação</span>
                      )}
                    </span>
                    <span className={styles.metaItem}>
                      📋 <strong>Perfil:</strong>{' '}
                      {user.profileEvaluationStatus === 'APPROVED' ? (
                        <span style={{ color: '#4ade80' }}>✅ Aprovado</span>
                      ) : user.profileEvaluationStatus === 'REJECTED' ? (
                        <span style={{ color: '#f87171' }}>❌ Rejeitado</span>
                      ) : (
                        <span style={{ color: '#facc15' }}>⏳ Pendente de Avaliação</span>
                      )}
                    </span>
                    <span className={styles.metaItem}>
                      ✉️ <strong>E-mail:</strong> {user.isEmailVerified ? 'Verificado' : 'Não verificado'}
                    </span>
                  </div>
                </div>

                <div className={styles.cardActions} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                  {user.role === 'ADMIN' && user.accountStatus === 'PENDING_APPROVAL' && (
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      style={{ flex: 1 }}
                      onClick={() => handleApproveAdmin(user.id)}
                      disabled={updating}
                      id={`approve-admin-${user.id}`}
                    >
                      ✔️ Aprovar Acesso Admin
                    </button>
                  )}

                  {user.role !== 'ADMIN' && (
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnSecondary}`}
                      style={{ flex: '1 1 100%' }}
                      onClick={() => handlePromoteToAdmin(user.id)}
                      disabled={updating}
                      id={`promote-admin-${user.id}`}
                    >
                      👑 Promover a Administrador
                    </button>
                  )}

                  {user.profileEvaluationStatus === 'PENDING_EVALUATION' && (
                    <>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        style={{ flex: 1 }}
                        onClick={() => handleEvaluateProfile(user.id, 'APPROVED')}
                        disabled={updating}
                        id={`approve-profile-${user.id}`}
                      >
                        ✅ Aprovar Perfil
                      </button>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnDanger}`}
                        style={{ flex: 1 }}
                        onClick={() => handleEvaluateProfile(user.id, 'REJECTED')}
                        disabled={updating}
                        id={`reject-profile-${user.id}`}
                      >
                        ❌ Rejeitar Perfil
                      </button>
                    </>
                  )}

                  {user.profileEvaluationStatus === 'REJECTED' && (
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      style={{ flex: 1 }}
                      onClick={() => handleEvaluateProfile(user.id, 'APPROVED')}
                      disabled={updating}
                      id={`reapprove-profile-${user.id}`}
                    >
                      🔄 Desfazer Rejeição & Aprovar
                    </button>
                  )}

                  {user.profileEvaluationStatus === 'APPROVED' && user.role !== 'ADMIN' && (
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnDanger}`}
                      style={{ flex: 1 }}
                      onClick={() => handleEvaluateProfile(user.id, 'REJECTED')}
                      disabled={updating}
                      id={`re-reject-profile-${user.id}`}
                    >
                      🚫 Alterar para Rejeitado
                    </button>
                  )}
                </div>
              </section>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
