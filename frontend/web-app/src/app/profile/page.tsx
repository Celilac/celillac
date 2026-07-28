'use client';
// frontend/web-app/src/app/profile/page.tsx
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { foodProfileApi } from '@/api/food-profile';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/useToast';
import { Header } from '@/components/layout/Header';
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
      const payload = {
        restrictions: rows,
        acceptsCrossContamination,
      };
      if (hasProfile) {
        await foodProfileApi.update(userId, payload, token);
      } else {
        await foodProfileApi.create({ userId, ...payload }, token);
        setHasProfile(true);
      }
      toast.success('Perfil alimentar atualizado com sucesso!', 'Salvo');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err instanceof HttpError ? err.message : 'Erro ao salvar perfil.', 'Erro ao salvar perfil');
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
              <div className="profile-heading">
                <div>
                  <p className="eyebrow">Personalização de Segurança</p>
                  <h1 className="auth-title">Perfil Alimentar</h1>
                </div>
              </div>

              <p className="auth-subtitle profile-intro">
                Configure suas restrições, severidades e tolerâncias. O CeliLac usa estes dados para orientar suas buscas e emitir alertas de compatibilidade.
              </p>

              {hasProfile && (
                <div role="note" className="profile-edit-note">
                  <span aria-hidden="true">✏️</span>
                  <span>Editando perfil existente — alterações impactarão as próximas análises de compatibilidade.</span>
                </div>
              )}

              <form onSubmit={handleSave} id="profile-form">
                <div className="restriction-section">
                  <div className="section-heading">
                    <div>
                      <h2>Suas restrições alimentares</h2>
                      <p>Informe alérgenos, a severidade e o tipo de necessidade para cada um.</p>
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
                  {loading ? 'Salvando…' : hasProfile ? '💾 Atualizar perfil' : '💾 Criar perfil'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
