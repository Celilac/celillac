'use client';
// frontend/web-app/src/app/admin/certifications/page.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { apiClient, HttpError } from '@/api/client';
import { certificationsApi, AdminCertificationItem } from '@/api/certifications';
import { Header } from '@/components/layout/Header';
import styles from '../../partner/partner.module.css';

export default function AdminCertificationsPage() {
  const { token, isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [items, setItems] = useState<AdminCertificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>('DECLARED_BY_PARTNER');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modais
  const [approvingItem, setApprovingItem] = useState<AdminCertificationItem | null>(null);
  const [approvalNotes, setApprovalNotes] = useState<string>('');

  const [rejectingItem, setRejectingItem] = useState<AdminCertificationItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const rejectCloseRef = useRef<HTMLButtonElement>(null);
  const approveCloseRef = useRef<HTMLButtonElement>(null);

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

  const fetchCertifications = useCallback(async () => {
    if (!token || isAdmin !== true) return;
    setLoading(true);
    try {
      const filters: { status?: string; limit: number } = { limit: 100 };
      if (statusFilter !== 'ALL') {
        filters.status = statusFilter;
      }

      const res = await certificationsApi.listAdmin(filters, token);
      setItems(res.items || []);
    } catch (err: any) {
      const msg = (err instanceof HttpError || err?.message) ? err.message : 'Erro ao listar certificações.';
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
      fetchCertifications();
    }
  }, [isAdmin, fetchCertifications]);

  const handleApprove = async () => {
    if (!token || !approvingItem) return;
    setUpdating(true);
    try {
      const updated = await certificationsApi.review(
        approvingItem.id,
        { action: 'APPROVE', notes: approvalNotes || undefined },
        token
      );
      setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      toast.success(`Certificação de ${updated.productName} homologada com sucesso!`, 'Selo Aprovado');
      setApprovingItem(null);
      setApprovalNotes('');
    } catch (err: any) {
      const msg = err?.message || 'Erro ao homologar certificação.';
      toast.error(msg, 'Erro');
    } finally {
      setUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!token || !rejectingItem) return;
    if (!rejectionReason.trim()) {
      toast.warning('Por favor, informe a justificativa da rejeição.', 'Campo Obrigatório');
      return;
    }
    setUpdating(true);
    try {
      const updated = await certificationsApi.review(
        rejectingItem.id,
        { action: 'REJECT', notes: rejectionReason.trim() },
        token
      );
      setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      toast.success(`Certificação de ${updated.productName} foi rejeitada.`, 'Selo Rejeitado');
      setRejectingItem(null);
      setRejectionReason('');
    } catch (err: any) {
      const msg = err?.message || 'Erro ao rejeitar certificação.';
      toast.error(msg, 'Erro');
    } finally {
      setUpdating(false);
    }
  };

  if (!mounted || isInitializing || isAdmin === null) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="skeleton-line" style={{ width: 140, height: 28 }} />
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <Header />
        <main className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>⛔</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-danger, #ef4444)' }}>
            403 — Acesso Proibido
          </h1>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: 460, margin: '12px auto 24px' }}>
            Esta área é de acesso exclusivo para Administradores do CeLiLac.
          </p>
          <Link href="/dashboard" className="btn btn-primary">
            Voltar ao Dashboard
          </Link>
        </main>
      </div>
    );
  }

  // Filtragem local por texto
  const filteredItems = items.filter((item) => {
    const q = searchTerm.toLowerCase();
    return (
      item.productName.toLowerCase().includes(q) ||
      item.certificationType.toLowerCase().includes(q) ||
      item.certifyingEntity.toLowerCase().includes(q) ||
      (item.certificateCode && item.certificateCode.toLowerCase().includes(q)) ||
      (item.partnerName && item.partnerName.toLowerCase().includes(q))
    );
  });

  const countPending = items.filter((i) => i.verificationStatus === 'DECLARED_BY_PARTNER').length;
  const countVerified = items.filter((i) => i.verificationStatus === 'VERIFIED_BY_CELILAC').length;
  const countRejected = items.filter((i) => i.verificationStatus === 'REJECTED').length;

  const isExpired = (validUntil?: string) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Header />

      <main className="container" style={{ padding: '32px 16px 80px', maxWidth: 1120, margin: '0 auto' }}>
        {/* Cabeçalho */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: '1.8rem' }}>🏅</span>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
              Moderação de Selos & Laudos Laboratoriais
            </h1>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', margin: 0 }}>
            Homologue laudos de glúten (&lt;20ppm), selos ACELBRA, Vegano e Orgânico submetidos pelos parceiros comerciais para conferir o selo de segurança alimentar auditada.
          </p>
        </div>

        {/* Métricas KPI */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
          <div style={{ background: 'var(--color-surface, #fff)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>PENDENTES DE REVISÃO</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>{countPending}</div>
          </div>
          <div style={{ background: 'var(--color-surface, #fff)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>HOMOLOGADOS (VERIFICADOS)</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: 4 }}>{countVerified}</div>
          </div>
          <div style={{ background: 'var(--color-surface, #fff)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>REJEITADOS</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ef4444', marginTop: 4 }}>{countRejected}</div>
          </div>
        </div>

        {/* Barra de Filtros e Busca */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          {/* Pills de Status */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { id: 'DECLARED_BY_PARTNER', label: '⏳ Pendentes' },
              { id: 'VERIFIED_BY_CELILAC', label: '✅ Homologados' },
              { id: 'REJECTED', label: '❌ Rejeitados' },
              { id: 'ALL', label: '📋 Todos' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 20,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  border: statusFilter === tab.id ? '1.5px solid var(--color-primary, #0284c7)' : '1px solid var(--color-border)',
                  background: statusFilter === tab.id ? 'rgba(2, 132, 199, 0.12)' : 'var(--color-surface)',
                  color: statusFilter === tab.id ? 'var(--color-primary, #0284c7)' : 'var(--color-text)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Campo de Busca */}
          <div style={{ minWidth: 260 }}>
            <input
              type="text"
              placeholder="Buscar por produto, tipo ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                fontSize: '0.88rem',
              }}
            />
          </div>
        </div>

        {/* Lista de Certificações */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div className="skeleton-line" style={{ width: 220, height: 24, margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Carregando selos e laudos...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--color-surface)', borderRadius: 12, border: '1px dashed var(--color-border)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🛡️</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 6px' }}>Nenhum selo/laudo encontrado</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', margin: 0 }}>
              {statusFilter === 'DECLARED_BY_PARTNER'
                ? 'Todos os selos e laudos enviados já foram analisados pela equipe!'
                : 'Nenhum registro corresponde aos filtros selecionados.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filteredItems.map((item) => {
              const expired = isExpired(item.validUntil);
              const isVerified = item.verificationStatus === 'VERIFIED_BY_CELILAC';
              const isRejected = item.verificationStatus === 'REJECTED';

              return (
                <div
                  key={item.id}
                  style={{
                    background: 'var(--color-surface, #fff)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 12,
                    padding: '18px 22px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 16,
                  }}
                >
                  <div style={{ flex: '1 1 400px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    {/* Miniatura da Foto do Laudo */}
                    {item.imageUrl ? (
                      <button
                        type="button"
                        onClick={() => setPreviewImage(item.imageUrl || null)}
                        title="Clique para ampliar o laudo/selo"
                        style={{
                          background: '#000',
                          border: '2px solid var(--color-border)',
                          borderRadius: 8,
                          width: 64,
                          height: 64,
                          padding: 0,
                          cursor: 'pointer',
                          overflow: 'hidden',
                          flexShrink: 0,
                          position: 'relative',
                        }}
                      >
                        <img
                          src={item.imageUrl}
                          alt="Laudo técnico"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <span style={{ position: 'absolute', bottom: 2, right: 2, fontSize: '0.65rem', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '1px 3px', borderRadius: 3 }}>
                          🔍 Zoom
                        </span>
                      </button>
                    ) : (
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 8,
                          background: 'rgba(0,0,0,0.04)',
                          border: '1px dashed var(--color-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.4rem',
                          flexShrink: 0,
                        }}
                      >
                        📄
                      </div>
                    )}

                    {/* Dados Cadastrais */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: item.certificationType === 'ACELBRA' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(2, 132, 199, 0.15)',
                            color: item.certificationType === 'ACELBRA' ? '#047857' : '#0369a1',
                          }}
                        >
                          {item.certificationType}
                        </span>

                        {isVerified && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', background: '#d1fae5', padding: '2px 7px', borderRadius: 6 }}>
                            🛡️ HOMOLOGADO
                          </span>
                        )}
                        {isRejected && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626', background: '#fee2e2', padding: '2px 7px', borderRadius: 6 }}>
                            ❌ REJEITADO
                          </span>
                        )}
                        {!isVerified && !isRejected && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d97706', background: '#fef3c7', padding: '2px 7px', borderRadius: 6 }}>
                            ⏳ AGUARDANDO REVISÃO
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '2px 0 4px', color: 'var(--color-text)' }}>
                        {item.productName} <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>({item.productBrand || 'Marca não informada'})</span>
                      </h3>

                      <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                        <span>🏢 <strong>Entidade:</strong> {item.certifyingEntity}</span>
                        {item.certificateCode && <span>🔢 <strong>Código/Nº:</strong> {item.certificateCode}</span>}
                        {item.validUntil && (
                          <span style={{ color: expired ? '#ef4444' : 'inherit', fontWeight: expired ? 700 : 400 }}>
                            📅 <strong>Validade:</strong> {new Date(item.validUntil).toLocaleDateString('pt-BR')} {expired && '(VENCIDO)'}
                          </span>
                        )}
                        {item.partnerName && <span>🏪 <strong>Estabelecimento:</strong> {item.partnerName}</span>}
                      </div>

                      {item.verificationNotes && (
                        <div style={{ marginTop: 6, fontSize: '0.8rem', background: 'rgba(0,0,0,0.03)', padding: '4px 8px', borderRadius: 6, color: 'var(--color-text)' }}>
                          <strong>Parecer:</strong> {item.verificationNotes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ações de Moderação */}
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    {!isVerified && (
                      <button
                        type="button"
                        onClick={() => {
                          setApprovingItem(item);
                          setApprovalNotes('');
                        }}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 8,
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          background: '#10b981',
                          color: '#fff',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        ✅ Homologar
                      </button>
                    )}

                    {!isRejected && (
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingItem(item);
                          setRejectionReason('');
                        }}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 8,
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          background: 'transparent',
                          color: '#ef4444',
                          border: '1px solid #ef4444',
                          cursor: 'pointer',
                        }}
                      >
                        ❌ Rejeitar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de Homologação */}
        {approvingItem && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent} style={{ maxWidth: 460 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 10px', color: '#10b981' }}>
                ✅ Homologar Selo / Laudo Técnico
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginBottom: 14 }}>
                Você está homologando o selo <strong>{approvingItem.certificationType}</strong> para o produto <strong>{approvingItem.productName}</strong>. Este produto passará a exibir o selo de segurança alimentar auditada pelo CeLiLac.
              </p>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>
                  Observações / Parecer do Auditor (Opcional):
                </label>
                <textarea
                  rows={3}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Ex: Laudo laboratorial consultado no sistema do emissor com resultado negativo para traços de glúten (<5ppm)."
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  ref={approveCloseRef}
                  type="button"
                  onClick={() => setApprovingItem(null)}
                  className="btn btn-secondary"
                  disabled={updating}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  className="btn btn-primary"
                  style={{ background: '#10b981', borderColor: '#10b981' }}
                  disabled={updating}
                >
                  {updating ? 'Homologando...' : 'Confirmar Homologação'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Rejeição */}
        {rejectingItem && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent} style={{ maxWidth: 460 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 10px', color: '#ef4444' }}>
                ❌ Rejeitar Selo / Laudo Técnico
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginBottom: 14 }}>
                Informe a justificativa da rejeição para o produto <strong>{rejectingItem.productName}</strong> ({rejectingItem.certificationType}):
              </p>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>
                  Justificativa Obrigatória:
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Ex: Foto do laudo cortada/ilegível ou certificado expirado. Reenviar foto com dados nítidos."
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  ref={rejectCloseRef}
                  type="button"
                  onClick={() => setRejectingItem(null)}
                  className="btn btn-secondary"
                  disabled={updating}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  className="btn btn-danger"
                  style={{ background: '#ef4444', borderColor: '#ef4444', color: '#fff' }}
                  disabled={updating}
                >
                  {updating ? 'Rejeitando...' : 'Confirmar Rejeição'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lightbox / Zoom da Foto do Laudo */}
        {previewImage && (
          <div
            className={styles.modalOverlay}
            onClick={() => setPreviewImage(null)}
            style={{ cursor: 'zoom-out', zIndex: 99999 }}
          >
            <div
              style={{
                position: 'relative',
                maxWidth: '90vw',
                maxHeight: '90vh',
                background: '#000',
                padding: 8,
                borderRadius: 12,
                boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                style={{
                  position: 'absolute',
                  top: 14,
                  right: 14,
                  background: 'rgba(0,0,0,0.7)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: 36,
                  height: 36,
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  zIndex: 2,
                }}
              >
                ✕
              </button>
              <img
                src={previewImage}
                alt="Documento comprobatório do laudo"
                style={{
                  maxWidth: '88vw',
                  maxHeight: '85vh',
                  objectFit: 'contain',
                  display: 'block',
                  borderRadius: 8,
                }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
