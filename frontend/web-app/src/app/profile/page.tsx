'use client';
// frontend/web-app/src/app/profile/page.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { foodProfileApi } from '@/api/food-profile';
import { useAuth } from '@/contexts/AuthContext';
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
  const router = useRouter();

  const [rows,    setRows]    = useState<Row[]>([{ allergen: 'GLUTEN', severity: 'FATAL' }]);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

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
    setError('');
    setLoading(true);
    try {
      await foodProfileApi.create({ userId, restrictions: rows }, token);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Erro ao salvar perfil.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container" style={{ alignItems: 'flex-start', paddingTop: '4rem' }}>
      <div className="auth-card animate-slide" style={{ maxWidth: 540 }}>
        <div className="auth-logo" style={{ textAlign: 'left', marginBottom: '1rem' }}>
          Celi<span>Lac</span>
        </div>

        <h1 className="auth-title">Perfil Alimentar</h1>
        <p className="auth-subtitle">
          Configure seus alérgenos e o nível de severidade. Esta informação alimenta o motor de
          compatibilidade no servidor.
        </p>

        {success && (
          <div className="alert alert-success" role="status" style={{ marginBottom: '1rem' }}>
            ✅ Perfil salvo com sucesso! <Link href="/" style={{ color: 'inherit', textDecoration: 'underline' }}>Ver Dashboard →</Link>
          </div>
        )}
        {error && <div className="alert alert-error" role="alert" style={{ marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleSave} id="profile-form">
          <div className="allergen-list" style={{ marginBottom: '1rem' }}>
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

          <button
            type="button"
            className="btn btn-ghost"
            id="add-allergen-btn"
            onClick={addRow}
            style={{ marginBottom: '1.5rem', width: '100%', justifyContent: 'center' }}
          >
            + Adicionar restrição
          </button>

          <button
            type="submit"
            className="btn btn-em"
            id="save-profile-btn"
            disabled={loading || rows.length === 0}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading ? 'Salvando…' : '💾 Salvar perfil'}
          </button>
        </form>
      </div>
    </div>
  );
}
