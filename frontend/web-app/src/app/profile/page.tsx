'use client';
// frontend/web-app/src/app/profile/page.tsx
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { foodProfileApi } from '@/api/food-profile';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/useToast';
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
  { value: 'LOW',    label: '🟢 Baixo (LOW)' },
  { value: 'MEDIUM', label: '🟡 Médio (MEDIUM)' },
  { value: 'HIGH',   label: '🟠 Alto (HIGH)' },
  { value: 'FATAL',  label: '🔴 Fatal — Celíaco (FATAL)' },
];

interface Row { allergen: string; severity: string; }

export default function ProfilePage() {
  const { token, userId, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const toast = useToast();

  const [rows,        setRows]        = useState<Row[]>([{ allergen: 'GLUTEN', severity: 'FATAL' }]);
  const [hasProfile,  setHasProfile]  = useState(false);
  const [loadingInit, setLoadingInit] = useState(true);
  const [loading,     setLoading]     = useState(false);

  // Carrega perfil existente ao montar a página
  useEffect(() => {
    if (!isAuthenticated || !token || !userId) {
      setLoadingInit(false);
      return;
    }
    foodProfileApi.getByUserId(userId, token)
      .then((profile) => {
        if (profile?.restrictions?.length) {
          setRows(profile.restrictions.map((r) => ({ allergen: r.allergen, severity: r.severity })));
        }
        setHasProfile(true);
      })
      .catch(() => {
        // 404 = sem perfil ainda — estado padrão (create)
        setHasProfile(false);
      })
      .finally(() => setLoadingInit(false));
  }, [isAuthenticated, token, userId]);

  function addRow() {
    setRows((prev) => [...prev, { allergen: 'LACTOSE', severity: 'MEDIUM' }]);
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
      if (hasProfile) {
        await foodProfileApi.update(userId, { restrictions: rows }, token);
      } else {
        await foodProfileApi.create({ userId, restrictions: rows }, token);
        setHasProfile(true);
      }
      router.push('/');
    } catch (err) {
      toast.error(err instanceof HttpError ? err.message : 'Erro ao salvar perfil.', 'Erro ao salvar perfil');
    } finally {
      setLoading(false);
    }
  }

  if (loadingInit) {
    return (
      <div className="profile-page">
        <header className="topbar">
          <span className="topbar-title brand-lockup">
            <Image src="/brand/logo_with_transparent_background.png" alt="CeliLac" width={32} height={32} priority />
            <span className="brand-wordmark">Celi<span>Lac</span></span>
            <span className="brand-tagline">Vivendo bem a vida</span>
          </span>
          <nav className="topbar-actions">
            <button type="button" onClick={toggleTheme} className="btn btn-ghost theme-button" aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </nav>
        </header>
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
      <header className="topbar">
        <span className="topbar-title brand-lockup">
          <Image src="/brand/logo_with_transparent_background.png" alt="CeliLac" width={32} height={32} priority />
          <span className="brand-wordmark">Celi<span>Lac</span></span>
          <span className="brand-tagline">Vivendo bem a vida</span>
        </span>
        <nav className="topbar-actions">
          <button type="button" onClick={toggleTheme} className="btn btn-ghost theme-button" aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </nav>
      </header>

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
                  <p className="eyebrow">Personalização</p>
                  <h1 className="auth-title">Perfil Alimentar</h1>
                </div>
              </div>

              <p className="auth-subtitle profile-intro">
                Configure seus alérgenos e o nível de severidade. Esta informação alimenta o motor de compatibilidade no servidor.
              </p>

              {hasProfile && (
                <div role="note" className="profile-edit-note">
                  <span aria-hidden="true">✏️</span>
                  <span>Editando perfil existente — alterações substituirão as restrições atuais.</span>
                </div>
              )}

              <form onSubmit={handleSave} id="profile-form">
                <div className="restriction-section">
                  <div className="section-heading">
                    <div>
                      <h2>Suas restrições</h2>
                      <p>Adicione pelo menos uma restrição para ativar seu perfil.</p>
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
