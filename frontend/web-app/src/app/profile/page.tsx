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
  { value: 'LIFESTYLE', label: '🟣 Estilo de Vida' },
  { value: 'LOW',       label: '🟢 Severidade Baixa' },
  { value: 'MEDIUM',    label: '🟡 Severidade Média' },
  { value: 'HIGH',      label: '🟠 Severidade Alta' },
  { value: 'FATAL',     label: '🔴 Fatal (Celíaco)' },
];

const RESTRICTION_TYPE_OPTIONS = [
  { value: 'ALLERGY',            label: '⚠️ Alergia' },
  { value: 'INTOLERANCE',        label: '🥛 Intolerância' },
  { value: 'MEDICAL_RESTRICTION',label: '🏥 Restrição Médica' },
  { value: 'DIETARY_PREFERENCE', label: '🥗 Preferência' },
  { value: 'LIFESTYLE',          label: '🌱 Estilo de Vida' },
];

const GENDER_OPTIONS = [
  { value: 'PREFIRO_NAO_INFORMAR', label: 'Prefiro não informar' },
  { value: 'MASCULINO', label: 'Masculino' },
  { value: 'FEMININO', label: 'Feminino' },
  { value: 'OUTRO', label: 'Outro' },
];

function compressImage(file: File, maxWidth = 512, maxHeight = 512, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Não foi possível inicializar o Canvas.'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      let dataUrl = canvas.toDataURL('image/webp', quality);
      if (!dataUrl.startsWith('data:image/webp')) {
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }
      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Erro ao carregar a imagem.'));
    };
  });
}

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

function getMaxBirthDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 13);
  return d.toISOString().split('T')[0];
}

export default function ProfilePage() {
  const { token, userId, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const toast = useToast();

  const [mounted, setMounted] = useState(false);

  // Dados Pessoais Estendidos
  const [fullName, setFullName] = useState('');
  const [userRole, setUserRole] = useState('CELIACO');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('PREFIRO_NAO_INFORMAR');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [whatsappDdi, setWhatsappDdi] = useState('+55');
  const [whatsappLocal, setWhatsappLocal] = useState('');
  const [profileEvaluationStatus, setProfileEvaluationStatus] = useState('PENDING_EVALUATION');
  const [isEmailVerified, setIsEmailVerified] = useState(true);

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
        if (!user) {
          setLoadingInit(false);
          return;
        }

        setFullName(user.fullName || '');
        const role = user.role || 'CELIACO';
        setUserRole(role);
        setIsEmailVerified(user.isEmailVerified !== false);
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

        // Contas corporativas e operacionais (ADMIN e PARCEIRO) não possuem
        // perfil alimentar de consumidor — mesma regra aplicada no Dashboard
        // (ver dashboard/page.tsx linhas 84-89, FEAT-040)
        if (role === 'ADMIN' || role === 'PARCEIRO') {
          setLoadingInit(false);
          return;
        }

        // Carrega status consolidado do consumidor (apenas CELIACO)
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

        // Carrega restrições alimentares (apenas CELIACO)
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
      })
      .catch(() => {
        setLoadingInit(false);
      });
  }, [isAuthenticated, token, userId, router]);

  async function handleToggleConsumerStatus(action: 'ACTIVATE' | 'DEACTIVATE') {
    if (!token) return;
    setLoadingConsumerStatus(true);

    try {
      const res = await apiClient.patch<any>(`/consumer/status`, { action }, token);
      if (res?.status) {
        setConsumerStatus(res.status);
        setStatusChangedAt(res.statusChangedAt || null);
        setStatusChangeReason(res.statusChangeReason || '');
      }
      toast.success(
        action === 'ACTIVATE' ? 'Perfil reativado com sucesso!' : 'Perfil desativado com sucesso.',
        'Status Atualizado'
      );
    } catch (err: any) {
      const msg = err instanceof HttpError ? err.message : 'Erro ao alterar status do consumidor.';
      toast.error(msg, 'Erro');
    } finally {
      setLoadingConsumerStatus(false);
    }
  }

  function addRow() {
    setRows((prev) => [...prev, { allergen: 'LACTOSE', severity: 'MEDIUM', type: 'INTOLERANCE' }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRow(index: number, key: keyof Row, value: string) {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [key]: value } : r))
    );
  }

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE_BYTES) {
      toast.error('A imagem excede o tamanho máximo de 2MB.', 'Arquivo Muito Grande');
      return;
    }

    try {
      const compressedDataUrl = await compressImage(file, 512, 512, 0.82);
      setAvatarUrl(compressedDataUrl);
      toast.info('Foto selecionada e otimizada! Clique em "Salvar alterações" para aplicar.', 'Foto Carregada');
    } catch {
      toast.error('Não foi possível processar a imagem selecionada.', 'Erro na Imagem');
    }
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !userId) return;

    // Previne envio duplicado
    if (loading) return;

    setLoading(true);

    try {
      // 1. Atualiza Dados de IAM / Perfil do Usuário
      const phoneRes = buildFullPhone(whatsappDdi, whatsappLocal);
      if (phoneRes.error) {
        toast.error(phoneRes.error, 'Erro ao salvar perfil');
        setLoading(false);
        return;
      }

      if (birthDate) {
        const [yearStr, monthStr, dayStr] = birthDate.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10) - 1;
        const day = parseInt(dayStr, 10);
        const selectedDate = new Date(year, month, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (isNaN(selectedDate.getTime()) || selectedDate.getFullYear() !== year || selectedDate.getMonth() !== month || selectedDate.getDate() !== day) {
          toast.error('Data de nascimento inválida.', 'Erro');
          setLoading(false);
          return;
        }

        if (selectedDate.getTime() === today.getTime()) {
          toast.error('A data de nascimento não pode ser o dia de hoje.', 'Erro');
          setLoading(false);
          return;
        }

        if (selectedDate.getTime() > today.getTime()) {
          toast.error('A data de nascimento não pode ser no futuro.', 'Erro');
          setLoading(false);
          return;
        }

        let age = today.getFullYear() - selectedDate.getFullYear();
        const monthDiff = today.getMonth() - selectedDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < selectedDate.getDate())) {
          age--;
        }

        if (age < 13) {
          toast.error('O usuário deve ter pelo menos 13 anos de idade (LGPD).', 'Idade Mínima');
          setLoading(false);
          return;
        }

        if (age > 120 || selectedDate.getFullYear() < 1900) {
          toast.error('Data de nascimento fora do limite permitido.', 'Erro');
          setLoading(false);
          return;
        }
      }

      await apiClient.put('/iam/profile', {
        fullName,
        birthDate: birthDate ? birthDate : undefined,
        gender,
        avatarUrl,
        whatsappPhone: phoneRes.phone,
      }, token);

      // 2. Atualiza ou Cria o Perfil Alimentar (apenas CELIACO)
      if (userRole === 'CELIACO') {
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
      }

      toast.success('Seu perfil foi atualizado com sucesso!', 'Salvo');
      router.push('/dashboard');
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
        <div className="profile-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="page-title">Meu Perfil</h1>
            <p className="page-subtitle">
              {userRole === 'PARCEIRO'
                ? 'Mantenha seus dados pessoais atualizados. Para gerenciar seu estabelecimento, acesse o Painel do Parceiro.'
                : userRole === 'ADMIN'
                ? 'Mantenha seus dados pessoais atualizados.'
                : 'Mantenha seus dados pessoais e restrições alimentares atualizados.'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, whiteSpace: 'nowrap' }}>
            <span style={{
              background: userRole === 'PARCEIRO' ? 'rgba(99, 102, 241, 0.15)' : userRole === 'ADMIN' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: userRole === 'PARCEIRO' ? '#818cf8' : userRole === 'ADMIN' ? '#facc15' : '#34d399',
              border: `1px solid ${userRole === 'PARCEIRO' ? 'rgba(99, 102, 241, 0.3)' : userRole === 'ADMIN' ? 'rgba(234, 179, 8, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              borderRadius: '9999px',
              padding: '4px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
            }}>
              {userRole === 'PARCEIRO' ? '🏢 Parceiro Comercial' : userRole === 'ADMIN' ? '👑 Administrador' : '👤 Consumidor'}
            </span>
            <span className={`profile-status-badge ${isApproved ? 'is-approved' : 'is-pending'}`} style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {isApproved ? '✅ Perfil aprovado' : '⏳ Pendente de avaliação'}
            </span>
          </div>
        </div>

        {/* Banner de contexto — PARCEIRO */}
        {userRole === 'PARCEIRO' && (
          <div style={{
            background: theme === 'dark' ? 'rgba(99, 102, 241, 0.08)' : 'linear-gradient(135deg, rgba(99, 102, 241, 0.06) 0%, rgba(139, 92, 246, 0.06) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: '16px',
            padding: '20px 24px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                flexShrink: 0,
              }}>
                🏢
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '1.05rem', color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>
                    Parceiro Comercial
                  </strong>
                  <span style={{
                    background: isApproved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                    color: isApproved ? '#10b981' : '#eab308',
                    border: `1px solid ${isApproved ? 'rgba(16, 185, 129, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
                    borderRadius: '9999px',
                    padding: '2px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    {isApproved ? '✅' : '⏳'} {isApproved ? 'Aprovado' : 'Pendente de avaliação'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: theme === 'dark' ? '#94a3b8' : '#64748b' }}>
                  Gerencie seus dados pessoais aqui. Para produtos e dados do estabelecimento, acesse o Painel do Parceiro.
                </p>
              </div>
            </div>
            <Link
              href="/partner"
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                background: '#6366f1',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.85rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap' as const,
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
              }}
            >
              💼 Painel do Parceiro
            </Link>
          </div>
        )}

        {/* Banner de contexto — ADMIN */}
        {userRole === 'ADMIN' && (
          <div style={{
            background: theme === 'dark' ? 'rgba(234, 179, 8, 0.08)' : 'linear-gradient(135deg, rgba(234, 179, 8, 0.06) 0%, rgba(245, 158, 11, 0.06) 100%)',
            border: '1px solid rgba(234, 179, 8, 0.25)',
            borderRadius: '16px',
            padding: '20px 24px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(234, 179, 8, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              flexShrink: 0,
            }}>
              👑
            </div>
            <div>
              <strong style={{ fontSize: '1.05rem', color: theme === 'dark' ? '#f8fafc' : '#0f172a', display: 'block', marginBottom: '4px' }}>
                Administrador
              </strong>
              <p style={{ margin: 0, fontSize: '0.85rem', color: theme === 'dark' ? '#94a3b8' : '#64748b' }}>
                Conta com privilégios de administração para moderar parceiros, usuários e denúncias na plataforma.
              </p>
            </div>
          </div>
        )}

        {/* Grid de Status da Conta & Alertas */}
        {((userRole === 'CELIACO') || (mounted && !isEmailVerified)) && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: (userRole === 'CELIACO' && mounted && !isEmailVerified) ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr',
            gap: '16px',
            marginBottom: '24px',
            alignItems: 'stretch',
          }}>
            {/* Card de Status do Consumidor — apenas CELIACO */}
            {userRole === 'CELIACO' && (
              <div style={{
                background: consumerStatus === 'INATIVO' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                border: `1px solid ${consumerStatus === 'INATIVO' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '1.2rem' }}>
                      {consumerStatus === 'INATIVO' ? '🔴' : '🟢'}
                    </span>
                    <strong style={{ fontSize: '1rem', color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>
                      {`Status do Consumidor: ${consumerStatus === 'INATIVO' ? 'INATIVO' : 'ATIVO'}`}
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
              </div>
            )}

            {/* Banner de E-mail Não Verificado */}
            {mounted && !isEmailVerified && (
              <div style={{
                background: 'var(--color-danger-bg, rgba(239, 68, 68, 0.08))',
                border: '1px solid var(--color-danger-border, rgba(239, 68, 68, 0.3))',
                color: 'var(--color-danger, #ef4444)',
                padding: '16px 20px',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap' as const,
              }}>
                <div>
                  <strong style={{ fontSize: '1rem', display: 'block', marginBottom: '4px' }}>
                    📩 Verifique seu e-mail para desbloquear todas as funções
                  </strong>
                  <span style={{ fontSize: '0.85rem', color: theme === 'dark' ? '#94a3b8' : '#64748b' }}>
                    Enviamos um código de verificação para o seu e-mail. Confirme seu e-mail para garantir a segurança da sua conta.
                  </span>
                </div>
                <Link
                  href="/auth/verify-email"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: 'var(--color-danger, #ef4444)',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap' as const,
                  }}
                >
                  Verificar E-mail Agora
                </Link>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSave} id="profile-form" className="profile-form animate-slide">
          <div className="profile-grid">
            {/* Dados Pessoais & Foto */}
            <section className="card profile-panel">
              <h2 className="card-title">Dados pessoais</h2>

              <div className="avatar-row">
                <UserAvatar avatarUrl={avatarUrl} fullName={fullName} size={64} />
                <div className="avatar-actions">
                  <label className="avatar-upload-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                      <circle cx="12" cy="13" r="3"/>
                    </svg>
                    <span>Selecionar foto (máx. 2MB)</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="sr-only-input" />
                  </label>
                  {avatarUrl && (
                    <button type="button" className="avatar-remove-btn" onClick={() => setAvatarUrl('')}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                      </svg>
                      <span>Remover foto</span>
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
                    max={getMaxBirthDate()}
                    min="1900-01-01"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                  <small style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#94a3b8' : '#64748b', marginTop: '4px', display: 'block' }}>
                    Idade mínima: 13 anos (LGPD)
                  </small>
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

                <div className="field profile-field-full">
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
            </section>

            {/* Restrições Alimentares — visível apenas para consumidores */}
            {userRole === 'CELIACO' && (
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
            )}
          </div>

          <div className="profile-footer-row">
            {userRole === 'CELIACO' && (
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
            )}

            <button type="submit" className="btn btn-em save-profile-button" id="save-profile-btn" disabled={loading || (userRole === 'CELIACO' && rows.length === 0)}>
              {loading ? 'Salvando…' : 'Salvar alterações'}
            </button>
          </div>
        </form>

        {/* Zona de Gerenciamento / Status da Conta */}
        {userRole === 'CELIACO' && (
          <section
            className="card profile-danger-zone animate-slide"
            style={{
              marginTop: '24px',
              border: consumerStatus === 'INATIVO' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
              background: consumerStatus === 'INATIVO'
                ? (theme === 'dark' ? 'rgba(16, 185, 129, 0.05)' : '#f0fdf4')
                : (theme === 'dark' ? 'rgba(239, 68, 68, 0.05)' : '#fff5f5'),
              borderRadius: '16px',
              padding: '20px 24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: consumerStatus === 'INATIVO' ? '#10b981' : '#ef4444' }}>
                  {consumerStatus === 'INATIVO' ? 'Reativar participação como consumidor' : 'Desativar participação como consumidor'}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: theme === 'dark' ? '#94a3b8' : '#64748b' }}>
                  {consumerStatus === 'INATIVO'
                    ? 'Seu perfil de consumidor está inativo. Reative para voltar a receber alertas de compatibilidade alimentar.'
                    : 'Ao desativar seu perfil, suas restrições não serão consideradas em alertas até que você o reative.'}
                </p>
              </div>

              <button
                type="button"
                disabled={loadingConsumerStatus}
                onClick={() => handleToggleConsumerStatus(consumerStatus === 'INATIVO' ? 'ACTIVATE' : 'DEACTIVATE')}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: loadingConsumerStatus ? 'not-allowed' : 'pointer',
                  background: consumerStatus === 'INATIVO' ? '#10b981' : '#ef4444',
                  color: '#ffffff',
                  transition: 'all 0.2s ease',
                  boxShadow: consumerStatus === 'INATIVO'
                    ? '0 4px 12px rgba(16, 185, 129, 0.25)'
                    : '0 4px 12px rgba(239, 68, 68, 0.25)',
                }}
              >
                {loadingConsumerStatus
                  ? 'Processando…'
                  : consumerStatus === 'INATIVO'
                    ? '🟢 Reativar participação'
                    : '🔴 Desativar participação'}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
