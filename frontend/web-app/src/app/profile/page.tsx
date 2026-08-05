'use client';
// frontend/web-app/src/app/profile/page.tsx
import { useState, useEffect, ChangeEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { foodProfileApi } from '@/api/food-profile';
import { apiClient } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/useToast';
import { Header } from '@/components/layout/Header';
import { UserAvatar } from '@/components/common/UserAvatar';
import { HttpError } from '@/api/client';

const ALLERGEN_OPTIONS = [
  { value: 'GLUTEN',    label: '🌾 Glúten (Celíaco)' },
  { value: 'LACTOSE',   label: '🥛 Lactose' },
  { value: 'NUTS',      label: '🥜 Castanhas / Amendoim' },
  { value: 'SOY',       label: '🫘 Soja' },
  { value: 'EGGS',      label: '🥚 Ovos' },
  { value: 'SHELLFISH', label: '🦐 Frutos do Mar' },
  { value: 'FISH',      label: '🐟 Peixes' },
  { value: 'SESAME',    label: '🌱 Gergelim' },
  { value: 'OTHER',     label: '⚠️ Outro' },
];

const SEVERITY_OPTIONS = [
  { value: 'LIFESTYLE', label: '🟣 Estilo de Vida (LIFESTYLE)' },
  { value: 'LOW',       label: '🟢 Baixo (LOW)' },
  { value: 'MEDIUM',    label: '🟡 Médio (MEDIUM)' },
  { value: 'HIGH',      label: '🟠 Alto (HIGH)' },
  { value: 'FATAL',     label: '🔴 Fatal — Celíaco (FATAL)' },
];

const RESTRICTION_TYPE_OPTIONS = [
  { value: 'ALLERGY',            label: '⚠️ Alergia' },
  { value: 'INTOLERANCE',        label: '🥛 Intolerância' },
  { value: 'MEDICAL_RESTRICTION',label: '🏥 Restrição Médica' },
  { value: 'DIETARY_PREFERENCE', label: '🥗 Preferência Alimentar' },
  { value: 'LIFESTYLE',          label: '🌱 Estilo de Vida' },
];

const GENDER_OPTIONS = [
  { value: 'PREFIRO_NAO_INFORMAR', label: 'Prefiro não informar' },
  { value: 'MASCULINO', label: 'Masculino' },
  { value: 'FEMININO', label: 'Feminino' },
  { value: 'OUTRO', label: 'Outro' },
];

interface Row {
  allergen: string;
  severity: string;
  type?: string;
  notes?: string;
}

function splitPhone(fullPhone: string): { ddi: string; local: string } {
  if (!fullPhone) return { ddi: '+55', local: '' };
  const trimmed = fullPhone.trim();
  if (trimmed.startsWith('+55')) {
    return { ddi: '+55', local: formatLocalPhone(trimmed.slice(3)) };
  }
  const match = trimmed.match(/^(\+\d{1,3})(\d+)$/);
  if (match) {
    return { ddi: match[1], local: formatLocalPhone(match[2]) };
  }
  return { ddi: '+55', local: formatLocalPhone(trimmed) };
}

function formatLocalPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

function buildFullPhone(ddi: string, local: string): { phone?: string; error?: string } {
  const ddiDigits = ddi.replace(/\D/g, '');
  const localDigits = local.replace(/\D/g, '');

  if (!localDigits) {
    return { phone: undefined };
  }

  if (!ddiDigits) {
    return { error: 'É obrigatório preencher o DDI se o número de WhatsApp for informado.' };
  }

  const cleanDdi = ddi.trim().startsWith('+') ? ddi.trim() : `+${ddi.trim()}`;
  return { phone: `${cleanDdi}${localDigits}` };
}

export default function ProfilePage() {
  const { token, userId, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const toast = useToast();

  const [mounted, setMounted] = useState(false);

  // Dados Pessoais Estendidos
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('PREFIRO_NAO_INFORMAR');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [whatsappDdi, setWhatsappDdi] = useState('+55');
  const [whatsappLocal, setWhatsappLocal] = useState('');
  const [profileEvaluationStatus, setProfileEvaluationStatus] = useState('PENDING_EVALUATION');

  // Restrições Alimentares
  const [rows, setRows] = useState<Row[]>([{ allergen: 'GLUTEN', severity: 'FATAL', type: 'ALLERGY' }]);
  const [acceptsCrossContamination, setAcceptsCrossContamination] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [loadingInit, setLoadingInit] = useState(true);
  const [loading, setLoading] = useState(false);

  // Status de Participação do Consumidor (Issue #30)
  const [consumerStatus, setConsumerStatus] = useState<string>('CONTA_CRIADA');
  const [statusChangedAt, setStatusChangedAt] = useState<string | null>(null);
  const [statusChangeReason, setStatusChangeReason] = useState<string>('');
  const [loadingConsumerStatus, setLoadingConsumerStatus] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const localToken = typeof window !== 'undefined' ? localStorage.getItem('celilac:token') : null;
    if (!isAuthenticated && !localToken) {
      router.push('/auth/login');
      return;
    }
    if (!token || !userId) {
      return;
    }

    // Carrega dados de IAM / Perfil do Usuário
    apiClient.get<any>('/iam/me', token)
      .then((user) => {
        if (user) {
          setFullName(user.fullName || '');
          if (user.birthDate) {
            setBirthDate(new Date(user.birthDate).toISOString().split('T')[0]);
          }
          setGender(user.gender || 'PREFIRO_NAO_INFORMAR');
          setAvatarUrl(user.avatarUrl || '');
          if (user.whatsappPhone) {
            const parsed = splitPhone(user.whatsappPhone);
            setWhatsappDdi(parsed.ddi);
            setWhatsappLocal(parsed.local);
          }
          setProfileEvaluationStatus(user.profileEvaluationStatus || 'PENDING_EVALUATION');
        }
      })
      .catch(() => {});

    // Carrega status consolidado do consumidor
    apiClient.get<any>('/consumer/me', token)
      .then((data) => {
        if (data?.consumer) {
          setConsumerStatus(data.consumer.status || 'CONTA_CRIADA');
          if (data.consumer.statusChangedAt) {
            setStatusChangedAt(data.consumer.statusChangedAt);
          }
          if (data.consumer.statusChangeReason) {
            setStatusChangeReason(data.consumer.statusChangeReason);
          }
        }
      })
      .catch(() => {});

    // Carrega restrições alimentares
    foodProfileApi.getByUserId(userId, token)
      .then((profile) => {
        if (profile?.restrictions?.length) {
          setRows(profile.restrictions.map((r: any) => ({
            allergen: r.allergen,
            severity: r.severity,
            type: r.type || 'ALLERGY',
            notes: r.notes || '',
          })));
        }
        setAcceptsCrossContamination(!!profile?.acceptsCrossContamination);
        setHasProfile(true);
      })
      .catch(() => {
        setHasProfile(false);
      })
      .finally(() => setLoadingInit(false));
  }, [isAuthenticated, token, userId, router]);

  async function handleToggleConsumerStatus(action: 'ACTIVATE' | 'DEACTIVATE') {
    if (!token) return;
    setLoadingConsumerStatus(true);
    try {
      const res = await apiClient.patch<any>('/consumer/status', {
        action,
        reason: action === 'DEACTIVATE' ? 'Desativado pelo próprio consumidor via painel' : 'Reativado pelo consumidor via painel',
      }, token);
      setConsumerStatus(res.status);
      if (res.statusChangedAt) setStatusChangedAt(res.statusChangedAt);
      if (res.statusChangeReason) setStatusChangeReason(res.statusChangeReason);
      toast.success(
        action === 'DEACTIVATE' ? 'Seu perfil de consumidor foi desativado.' : 'Seu perfil de consumidor foi reativado com sucesso!',
        'Status Atualizado'
      );
    } catch (err: any) {
      toast.error('Erro ao alterar status do consumidor.', 'Erro');
    } finally {
      setLoadingConsumerStatus(false);
    }
  }

  function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Trava de 10MB conforme solicitação do usuário
    const MAX_SIZE_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      toast.error('O tamanho da foto de perfil não pode ultrapassar 10MB.', 'Arquivo muito grande');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result as string);
      toast.info('Foto selecionada com sucesso! Clique em salvar para confirmar.', 'Foto alterada');
    };
    reader.readAsDataURL(file);
  }

  function addRow() {
    const availableOption = ALLERGEN_OPTIONS.find(
      (opt) => opt.value === 'OTHER' || !rows.some((row) => row.allergen === opt.value)
    );
    const nextAllergen = availableOption ? availableOption.value : 'OTHER';
    setRows((prev) => [...prev, { allergen: nextAllergen, severity: 'MEDIUM', type: 'ALLERGY' }]);
  }

  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateRow(idx: number, field: keyof Row, value: string) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!isAuthenticated || !token || !userId) {
      router.push('/auth/login');
      return;
    }
    setLoading(true);
    try {
      // 1. Atualiza Dados Pessoais do Usuário (IAM)
      const phoneRes = buildFullPhone(whatsappDdi, whatsappLocal);
      if (phoneRes.error) {
        toast.error(phoneRes.error, 'Erro ao salvar perfil');
        setLoading(false);
        return;
      }

      await apiClient.put('/iam/profile', {
        fullName,
        birthDate: birthDate ? birthDate : undefined,
        gender,
        avatarUrl,
        whatsappPhone: phoneRes.phone,
      }, token);

      // 2. Atualiza ou Cria o Perfil Alimentar
      const payload = {
        restrictions: rows,
        acceptsCrossContamination,
      };

      try {
        await foodProfileApi.update(userId, payload, token);
        setHasProfile(true);
      } catch (updateErr: any) {
        const errMsg = updateErr?.message || '';
        if (errMsg.includes('não encontrado') || updateErr?.status === 404 || updateErr?.status === 400) {
          await foodProfileApi.create({ userId, ...payload }, token);
          setHasProfile(true);
        } else {
          throw updateErr;
        }
      }

      // Re-busca o status atualizado do consumidor
      apiClient.get<any>('/consumer/me', token)
        .then((data) => {
          if (data?.consumer) {
            setConsumerStatus(data.consumer.status || 'CONTA_CRIADA');
          }
        })
        .catch(() => {});

      toast.success('Seu perfil foi atualizado com sucesso!', 'Salvo');
    } catch (err: any) {
      const msg = (err instanceof HttpError || err?.message) ? err.message : 'Erro ao salvar perfil.';
      toast.error(msg, 'Erro ao salvar perfil');
    } finally {
      setLoading(false);
    }
  }

  if (!mounted || loadingInit) {
    return (
      <div className="profile-page">
        <Header />
        <main className="auth-shell profile-shell">
          <div className="auth-split-card profile-split-card">
            <aside className="auth-brand-panel">
              <Image src="/brand/logo_with_transparent_background.png" alt="CeliLac" width={180} height={180} priority className="auth-brand-panel-logo" />
              <p className="auth-brand-panel-wordmark">Celi<span>Lac</span></p>
              <p className="auth-brand-panel-tagline">Seu perfil alimentar deixa cada escolha mais segura.</p>
            </aside>
            <div className="auth-form-panel profile-form-panel">
              <div className="auth-card profile-card animate-slide">
                <p className="profile-loading" role="status">Carregando perfil…</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Header />

      <main className="auth-shell profile-shell">
        <div className="auth-split-card profile-split-card">
          <aside className="auth-brand-panel">
            <Image src="/brand/logo_with_transparent_background.png" alt="CeliLac" width={180} height={180} priority className="auth-brand-panel-logo" />
            <p className="auth-brand-panel-wordmark">Celi<span>Lac</span></p>
            <p className="auth-brand-panel-tagline">Seu perfil alimentar deixa cada escolha mais segura.</p>
          </aside>

          <div className="auth-form-panel profile-form-panel">
            <div className="auth-card profile-card animate-slide">
              <div className="profile-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p className="eyebrow">Personalização & Segurança</p>
                  <h1 className="auth-title">Meu Perfil</h1>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-label)', fontWeight: 'bold', background: profileEvaluationStatus === 'APPROVED' ? 'var(--color-status-approved-bg)' : 'var(--color-status-pending-bg)', color: profileEvaluationStatus === 'APPROVED' ? 'var(--color-status-approved)' : 'var(--color-status-pending)' }}>
                  {profileEvaluationStatus === 'APPROVED' ? '✅ Perfil Aprovado' : '⏳ Pendente de Avaliação'}
                </div>
              </div>

              <p className="auth-subtitle profile-intro">
                Mantenha seus dados pessoais e restrições alimentares atualizados.
              </p>

              {/* Card de Status de Participação do Consumidor (Issue #30) */}
              <div style={{
                background: consumerStatus === 'INATIVO' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                border: `1px solid ${consumerStatus === 'INATIVO' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '1.2rem' }}>{consumerStatus === 'INATIVO' ? '🔴' : '🟢'}</span>
                    <strong style={{ fontSize: '1rem', color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>
                      Status do Consumidor: {consumerStatus === 'INATIVO' ? 'INATIVO' : 'ATIVO'}
                    </strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: theme === 'dark' ? '#94a3b8' : '#64748b' }}>
                    {consumerStatus === 'INATIVO'
                      ? 'Seu perfil de consumidor está inativo. Você pode reativá-lo a qualquer momento.'
                      : 'Seu perfil de consumidor está ativo e configurado na plataforma.'}
                  </p>
                  {statusChangedAt && (
                    <span style={{ display: 'block', marginTop: '4px', fontSize: '0.75rem', color: theme === 'dark' ? '#64748b' : '#94a3b8' }}>
                      Última alteração: {new Date(statusChangedAt).toLocaleString('pt-BR')} {statusChangeReason ? `— ${statusChangeReason}` : ''}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={loadingConsumerStatus}
                  onClick={() => handleToggleConsumerStatus(consumerStatus === 'INATIVO' ? 'ACTIVATE' : 'DEACTIVATE')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    background: consumerStatus === 'INATIVO' ? '#10b981' : '#ef4444',
                    color: '#ffffff',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {loadingConsumerStatus
                    ? 'Processando…'
                    : consumerStatus === 'INATIVO'
                      ? '🟢 Reativar Perfil'
                      : '🔴 Desativar Perfil'}
                </button>
              </div>

              <form onSubmit={handleSave} id="profile-form">
                {/* Seção 1: Dados Pessoais & Foto */}
                <div className="restriction-section" style={{ marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: 'var(--text-title)', marginBottom: 'var(--space-4)' }}>👤 Dados Pessoais</h2>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.25rem' }}>
                    <UserAvatar avatarUrl={avatarUrl} fullName={fullName} size={72} />
                    <div>
                      <label className="btn btn-ghost" style={{ cursor: 'pointer', padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-body)' }}>
                        📷 Selecionar Foto (Máx 10MB)
                        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                      </label>
                      {avatarUrl && (
                        <button type="button" onClick={() => setAvatarUrl('')} style={{ display: 'block', marginTop: 'var(--space-2)', color: 'var(--color-status-rejected)', background: 'none', border: 'none', fontSize: 'var(--text-label)', cursor: 'pointer' }}>
                          Remover foto
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="field">
                      <label className="field-label">Nome Completo</label>
                      <input
                        type="text"
                        className="field-input"
                        placeholder="Seu nome completo"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>

                    <div className="field">
                      <label className="field-label">Data de Nascimento</label>
                      <input
                        type="date"
                        className="field-input"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                      />
                    </div>

                    <div className="field">
                      <label className="field-label">Gênero</label>
                      <select
                        className="field-input field-select"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                      >
                        {GENDER_OPTIONS.map((g) => (
                          <option key={g.value} value={g.value}>{g.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="field">
                      <label className="field-label" htmlFor="whatsapp-phone-input">WhatsApp</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="text"
                          className="field-input"
                          style={{ width: '80px', textAlign: 'center', flexShrink: 0, fontWeight: 600 }}
                          placeholder="+55"
                          value={whatsappDdi}
                          onChange={(e) => {
                            let val = e.target.value;
                            if (val && !val.startsWith('+')) val = '+' + val;
                            setWhatsappDdi(val);
                          }}
                        />
                        <input
                          id="whatsapp-phone-input"
                          type="text"
                          className="field-input"
                          style={{ flex: 1 }}
                          placeholder="(79) 99999-9999"
                          value={whatsappLocal}
                          onChange={(e) => setWhatsappLocal(formatLocalPhone(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seção 2: Restrições Alimentares */}
                <div className="restriction-section">
                  <div className="section-heading">
                    <div>
                      <h2>🥗 Restrições Alimentares</h2>
                      <p>Informe alérgenos, severidade e o tipo de necessidade para cada um.</p>
                    </div>
                    <span className="restriction-count">{rows.length}</span>
                  </div>

                  <div className="allergen-list">
                    {rows.map((row, idx) => (
                      <div key={idx} className="allergen-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <select
                          id={`allergen-select-${idx}`}
                          className="field-input field-select"
                          value={row.allergen}
                          onChange={(e) => updateRow(idx, 'allergen', e.target.value)}
                        >
                          {ALLERGEN_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>

                        <select
                          id={`severity-select-${idx}`}
                          className="field-input field-select"
                          value={row.severity}
                          onChange={(e) => updateRow(idx, 'severity', e.target.value)}
                        >
                          {SEVERITY_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>

                        <select
                          id={`type-select-${idx}`}
                          className="field-input field-select"
                          value={row.type || 'ALLERGY'}
                          onChange={(e) => updateRow(idx, 'type', e.target.value)}
                        >
                          {RESTRICTION_TYPE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>

                        <button
                          type="button"
                          className="remove-btn"
                          id={`remove-allergen-${idx}`}
                          onClick={() => removeRow(idx)}
                          aria-label={`Remover ${row.allergen}`}
                          disabled={rows.length === 1}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '1.25rem', marginBottom: '1.25rem', padding: 'var(--space-4)', background: 'var(--color-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      id="accept-cross-contamination-chk"
                      checked={acceptsCrossContamination}
                      onChange={(e) => setAcceptsCrossContamination(e.target.checked)}
                      style={{ marginTop: '0.25rem' }}
                    />
                    <div>
                      <strong style={{ fontSize: 'var(--text-body)', display: 'block' }}>Aceito risco de contaminação cruzada (traços)</strong>
                      <span style={{ fontSize: 'var(--text-label)', color: 'var(--color-text-muted)' }}>
                        Desmarcado por padrão. Se você for celíaco ou alérgico severo, mantenha desmarcado para bloquear produtos com avisos de "pode conter traços".
                      </span>
                    </div>
                  </label>
                </div>

                <button type="button" className="btn btn-ghost add-restriction-button" id="add-allergen-btn" onClick={addRow}>
                  + Adicionar restrição
                </button>

                <button type="submit" className="btn btn-em save-profile-button" id="save-profile-btn" disabled={loading || rows.length === 0}>
                  {loading ? 'Salvando…' : '💾 Salvar alterações do perfil'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
