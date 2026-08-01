'use client';
// frontend/web-app/src/app/profile/page.tsx
import { useState, useEffect, ChangeEvent } from 'react';
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

  const [mounted, setMounted] = useState(false);

  // Dados Pessoais Estendidos
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('PREFIRO_NAO_INFORMAR');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [profileEvaluationStatus, setProfileEvaluationStatus] = useState('PENDING_EVALUATION');

  // Restrições Alimentares
  const [rows, setRows] = useState<Row[]>([{ allergen: 'GLUTEN', severity: 'FATAL', type: 'ALLERGY' }]);
  const [acceptsCrossContamination, setAcceptsCrossContamination] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [loadingInit, setLoadingInit] = useState(true);
  const [loading, setLoading] = useState(false);

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
          setWhatsappPhone(user.whatsappPhone || '');
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
      // 1. Atualiza Dados Pessoais do Usuário (IAM)
      await apiClient.put('/iam/profile', {
        fullName,
        birthDate: birthDate ? birthDate : undefined,
        gender,
        avatarUrl,
        whatsappPhone: whatsappPhone ? whatsappPhone : undefined,
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
        <main className="page-container profile-container">
          <p className="profile-loading" role="status">Carregando perfil…</p>
        </main>
      </div>
    );
  }

  const isApproved = profileEvaluationStatus === 'APPROVED';

  return (
    <div className="profile-page">
      <Header />

      <main className="page-container profile-container">
        <div className="profile-header">
          <div>
            <h1 className="page-title">Meu Perfil</h1>
            <p className="page-subtitle">Mantenha seus dados pessoais e restrições alimentares atualizados.</p>
          </div>
          <span className={`profile-status-badge ${isApproved ? 'is-approved' : 'is-pending'}`}>
            {isApproved ? 'Perfil aprovado' : 'Pendente de avaliação'}
          </span>
        </div>

        <form onSubmit={handleSave} id="profile-form" className="profile-form animate-slide">
          <div className="profile-grid">
            {/* Dados Pessoais & Foto */}
            <section className="card profile-panel">
              <h2 className="card-title">Dados pessoais</h2>

              <div className="avatar-row">
                <UserAvatar avatarUrl={avatarUrl} fullName={fullName} size={64} />
                <div>
                  <label className="btn btn-ghost avatar-upload-btn">
                    Selecionar foto (máx. 10MB)
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="sr-only-input" />
                  </label>
                  {avatarUrl && (
                    <button type="button" className="avatar-remove-btn" onClick={() => setAvatarUrl('')}>
                      Remover foto
                    </button>
                  )}
                </div>
              </div>

              <div className="profile-fields-grid">
                <div className="field profile-field-full">
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
                  <label className="field-label">WhatsApp</label>
                  <input
                    type="tel"
                    className="field-input"
                    placeholder="+5511987654321"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                  />
                  <span className="field-hint">Formato: +55DDDNNNNNNNNN</span>
                </div>
              </div>
            </section>

            {/* Restrições Alimentares */}
            <section className="card profile-panel">
              <div className="section-heading">
                <div>
                  <h2>Restrições alimentares</h2>
                  <p>Alérgeno, severidade e tipo de necessidade para cada um.</p>
                </div>
                <span className="restriction-count">{rows.length}</span>
              </div>

              <div className="allergen-list">
                {rows.map((row, idx) => (
                  <div key={idx} className="allergen-row">
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

              <button type="button" className="btn btn-ghost add-restriction-button" id="add-allergen-btn" onClick={addRow}>
                + Adicionar restrição
              </button>
            </section>
          </div>

          <div className="profile-footer-row">
            <label className="cross-contamination-note">
              <input
                type="checkbox"
                id="accept-cross-contamination-chk"
                checked={acceptsCrossContamination}
                onChange={(e) => setAcceptsCrossContamination(e.target.checked)}
              />
              <div>
                <strong>Aceito risco de contaminação cruzada (traços)</strong>
                <span>
                  Desmarcado por padrão. Se você for celíaco ou alérgico severo, mantenha desmarcado para bloquear produtos com avisos de &quot;pode conter traços&quot;.
                </span>
              </div>
            </label>

            <button type="submit" className="btn btn-em save-profile-button" id="save-profile-btn" disabled={loading || rows.length === 0}>
              {loading ? 'Salvando…' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
