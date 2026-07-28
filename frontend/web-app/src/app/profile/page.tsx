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

export default function ProfilePage() {
  const { token, userId, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const toast = useToast();

  // Dados Pessoais Estendidos
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('PREFIRO_NAO_INFORMAR');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [profileEvaluationStatus, setProfileEvaluationStatus] = useState('PENDING_EVALUATION');

  // Restrições Alimentares
  const [rows, setRows] = useState<Row[]>([{ allergen: 'GLUTEN', severity: 'FATAL', type: 'ALLERGY' }]);
  const [acceptsCrossContamination, setAcceptsCrossContamination] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [loadingInit, setLoadingInit] = useState(true);
  const [loading, setLoading] = useState(false);

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
          setProfileEvaluationStatus(user.profileEvaluationStatus || 'PENDING_EVALUATION');
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
      (opt) => !rows.some((row) => row.allergen === opt.value)
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
      // 1. Atualiza Dados Pessoais do Usuário
      await apiClient.put('/iam/profile', {
        fullName,
        birthDate: birthDate ? birthDate : undefined,
        gender,
        avatarUrl,
      }, token);

      // 2. Atualiza/Cria Perfil Alimentar
      const payload = {
        restrictions: rows,
        acceptsCrossContamination,
      };
      
      try {
        if (hasProfile) {
          await foodProfileApi.update(userId, payload, token);
        } else {
          await foodProfileApi.create({ userId, ...payload }, token);
          setHasProfile(true);
        }
      } catch (err: any) {
        // Fallback de criação caso o update retorne 400/404
        await foodProfileApi.create({ userId, ...payload }, token);
        setHasProfile(true);
      }

      toast.success('Seu perfil foi atualizado com sucesso!', 'Salvo');
    } catch (err: any) {
      const msg = (err instanceof HttpError || err?.message) ? err.message : 'Erro ao salvar perfil.';
      toast.error(msg, 'Erro ao salvar perfil');
    } finally {
      setLoading(false);
    }
  }

  if (loadingInit) {
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', background: profileEvaluationStatus === 'APPROVED' ? '#d1fae5' : '#fef3c7', color: profileEvaluationStatus === 'APPROVED' ? '#065f46' : '#92400e' }}>
                  {profileEvaluationStatus === 'APPROVED' ? '✅ Perfil Aprovado' : '⏳ Pendente de Avaliação'}
                </div>
              </div>

              <p className="auth-subtitle profile-intro">
                Mantenha seus dados pessoais e restrições alimentares atualizados.
              </p>

              <form onSubmit={handleSave} id="profile-form">
                {/* Seção 1: Dados Pessoais & Foto */}
                <div className="restriction-section" style={{ marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>👤 Dados Pessoais</h2>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.25rem' }}>
                    <UserAvatar avatarUrl={avatarUrl} fullName={fullName} size={72} />
                    <div>
                      <label className="btn btn-ghost" style={{ cursor: 'pointer', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                        📷 Selecionar Foto (Máx 10MB)
                        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                      </label>
                      {avatarUrl && (
                        <button type="button" onClick={() => setAvatarUrl('')} style={{ display: 'block', marginTop: '0.4rem', color: '#ef4444', background: 'none', border: 'none', fontSize: '0.8rem', cursor: 'pointer' }}>
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

                    <div className="field" style={{ gridColumn: 'span 2' }}>
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

                <div style={{ marginTop: '1.25rem', marginBottom: '1.25rem', padding: '1rem', background: 'var(--bg-secondary, #f8f9fa)', borderRadius: '8px', border: '1px solid var(--border-color, #e9ecef)' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      id="accept-cross-contamination-chk"
                      checked={acceptsCrossContamination}
                      onChange={(e) => setAcceptsCrossContamination(e.target.checked)}
                      style={{ marginTop: '0.25rem' }}
                    />
                    <div>
                      <strong style={{ fontSize: '0.95rem', display: 'block' }}>Aceito risco de contaminação cruzada (traços)</strong>
                      <span style={{ fontSize: '0.85rem', color: '#6c757d' }}>
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
