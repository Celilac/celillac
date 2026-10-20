'use client';
// frontend/web-app/src/app/partner/register/page.tsx
import { useState, useEffect, useRef, ChangeEvent, DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { partnerApi } from '@/api/partner';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { HttpError } from '@/api/client';
import { Header } from '@/components/layout/Header';
import { validateImageFile, compressImage } from '@/utils/image';
import { maskCnpj, validateCnpj, maskCpf, validateCpf, maskCep } from '@/utils/mask';
import { fetchAddressByCep } from '@/services/viaCep';
import InternationalPhoneInput from '@/components/common/InternationalPhoneInput';
import PartnerLocationMap from '@/components/common/PartnerLocationMap';
import {
  CheckCircleIcon,
  XCircleIcon,
  CameraIcon,
  RefreshIcon,
  TrashIcon,
  MapPinIcon,
  SaveIcon,
  CompassIcon,
  BuildingIcon,
  UserIcon,
} from '@/components/layout/icons';
import styles from '../partner.module.css';

const TYPE_OPTIONS = [
  { value: 'RESTAURANT',           label: 'Estabelecimento Alimentício (Lanchonete/Restaurante)' },
  { value: 'MARKET',               label: 'Comércio Alimentar (Mercado/Empório)' },
  { value: 'INDEPENDENT_PRODUCER', label: 'Produtor Independente (Artesanal/Fábrica)' },
];

export default function RegisterPartnerPage() {
  const { token, isAuthenticated } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  const [name,            setName]            = useState('');
  const [legalNature,     setLegalNature]     = useState<'PJ' | 'PF'>('PJ');
  const [companyName,     setCompanyName]     = useState('');
  const [cnpj,            setCnpj]            = useState('');
  const [cnpjError,       setCnpjError]       = useState('');
  const [responsibleName, setResponsibleName] = useState('');
  const [cpf,             setCpf]             = useState('');
  const [cpfError,        setCpfError]        = useState('');
  const [documentUrl,     setDocumentUrl]     = useState('');
  const [description,     setDescription]     = useState('');
  const [address,         setAddress]         = useState('');
  const [phone,           setPhone]           = useState('');
  const [type,            setType]            = useState('RESTAURANT');
  const [country,         setCountry]         = useState('BR');
  const [cep,             setCep]             = useState('');
  const [loadingCep,      setLoadingCep]      = useState(false);
  const [city,            setCity]            = useState('');
  const [state,           setState]           = useState('');
  const [deliveryRegion,  setDeliveryRegion]  = useState('');
  const [logoUrl,         setLogoUrl]         = useState('');
  const [isDragging,      setIsDragging]      = useState(false);
  const [loading,         setLoading]         = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, router]);

  async function handleCepChange(rawCep: string) {
    const formatted = maskCep(rawCep);
    setCep(formatted);
    const clean = formatted.replace(/\D/g, '');
    if (clean.length === 8) {
      setLoadingCep(true);
      try {
        const addr = await fetchAddressByCep(clean);
        if (addr) {
          setCity(addr.localidade);
          setState(addr.uf);
          const base = [addr.logradouro, addr.bairro].filter(Boolean).join(', ');
          setAddress(base);
          toast.success(`Endereço localizado: ${addr.localidade} - ${addr.uf}`, 'CEP Encontrado');
        } else {
          toast.info('CEP não localizado automaticamente. Preencha o endereço manualmente.', 'Aviso');
        }
      } catch {
        // silencioso
      } finally {
        setLoadingCep(false);
      }
    }
  }

  function handleCnpjChange(val: string) {
    const formatted = maskCnpj(val);
    setCnpj(formatted);
    const validation = validateCnpj(formatted);
    if (!validation.valid && formatted.replace(/\D/g, '').length === 14) {
      setCnpjError(validation.error || 'CNPJ inválido');
    } else {
      setCnpjError('');
    }
  }

  function handleCpfChange(val: string) {
    const formatted = maskCpf(val);
    setCpf(formatted);
    const validation = validateCpf(formatted);
    if (!validation.valid && formatted.replace(/\D/g, '').length === 11) {
      setCpfError(validation.error || 'CPF inválido');
    } else {
      setCpfError('');
    }
  }

  async function processDocFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('O documento deve ter no máximo 5MB.', 'Arquivo Muito Grande');
      return;
    }
    try {
      if (file.type.startsWith('image/')) {
        const compressed = await compressImage(file, 1600, 1600, 0.9);
        setDocumentUrl(compressed);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          setDocumentUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
      toast.info('Documento comprobatório anexado com sucesso!', 'Documentação');
    } catch {
      toast.error('Não foi possível processar o documento. Tente novamente.', 'Erro no Envio');
    }
  }

  function handleDocFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      processDocFile(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  }

  async function processImageFile(file: File) {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Arquivo de imagem inválido.', 'Formato Não Suportado');
      return;
    }

    try {
      const compressedDataUrl = await compressImage(file, 1024, 1024, 0.85);
      setLogoUrl(compressedDataUrl);
      toast.info('Marca do estabelecimento selecionada com sucesso!', 'Identidade Visual');
    } catch {
      toast.error('Não foi possível processar a imagem selecionada. Tente novamente com outro arquivo.', 'Erro no Envio');
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    // Limpa o input para permitir selecionar o mesmo arquivo novamente se desejado
    if (e.target) {
      e.target.value = '';
    }
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  }

  function handleRemoveLogo() {
    setLogoUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.info('Marca do estabelecimento removida.', 'Removido');
  }

  function handleRemoveDoc() {
    setDocumentUrl('');
    if (docFileInputRef.current) {
      docFileInputRef.current.value = '';
    }
    toast.info('Documento comprobatório removido.', 'Removido');
  }

  // Validação reativa rigorosa dos campos obrigatórios
  const cleanPhone = phone.replace(/\D/g, '');
  const isDocValid = legalNature === 'PJ'
    ? (cnpj.replace(/\D/g, '').length === 14 && !cnpjError && companyName.trim().length >= 2)
    : (cpf.replace(/\D/g, '').length === 11 && !cpfError && responsibleName.trim().length >= 2);

  const isFormValid = Boolean(
    name.trim().length >= 2 &&
    type &&
    cleanPhone.length >= 8 &&
    address.trim().length >= 3 &&
    city.trim().length >= 2 &&
    state.trim().length >= 2 &&
    isDocValid
  );

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!isAuthenticated || !token) return;

    if (!isFormValid) {
      toast.warning('Por favor, preencha todos os campos obrigatórios (*).', 'Campos incompletos');
      return;
    }

    setLoading(true);
    try {
      const created = await partnerApi.register({
        name,
        legalNature,
        documentNumber: legalNature === 'PJ' ? cnpj : cpf,
        documentType: legalNature === 'PJ' ? 'CNPJ' : 'CPF',
        companyName: legalNature === 'PJ' ? companyName : undefined,
        responsibleName: legalNature === 'PF' ? responsibleName : undefined,
        documentUrl: documentUrl || undefined,
        cnpj: legalNature === 'PJ' ? cnpj : undefined,
        description,
        address,
        phone,
        type,
        city: city || undefined,
        state: state || undefined,
        deliveryRegion: deliveryRegion || undefined,
        logoUrl: logoUrl || undefined,
      }, token);

      const isApproved = created?.approvalStatus === 'APPROVED';
      const isPending = created?.approvalStatus === 'PENDING_REVIEW';

      toast.success({
        description: isApproved
          ? 'Estabelecimento cadastrado e ativado com sucesso!'
          : isPending
          ? 'Estabelecimento cadastrado com sucesso! Enviado para análise e moderação da plataforma.'
          : 'Estabelecimento cadastrado como rascunho com sucesso!',
        actionLabel: 'Ver Estabelecimentos',
        onAction: () => router.push('/partner'),
      });
      router.push('/partner');
    } catch (err) {
      toast.error(
        err instanceof HttpError ? err.message : 'Erro ao cadastrar perfil comercial.',
        'Erro no cadastro'
      );
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="profile-page">
        <Header />
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Header />

      <main className={styles.container}>
        <div className={styles.formShellLarge}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 className={styles.title} style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Cadastrar Estabelecimento</h1>
            <p className={styles.subtitle}>Insira as informações do seu negócio. As informações serão analisadas pela administração.</p>
          </div>

          <form onSubmit={handleRegister}>
            {/* ── PARTE SUPERIOR (2 Colunas em Desktop) ── */}
            <div className={styles.formTwoCols}>
              {/* Coluna Esquerda — Identificação do estabelecimento */}
              <div className={styles.colLeft}>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="partner-name">Nome Fantasia (Comercial) *</label>
                  <input
                    id="partner-name"
                    type="text"
                    className={styles.input}
                    placeholder="Ex: Cantina Sem Glúten"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="partner-type">Tipo de Fornecedor *</label>
                  <select
                    id="partner-type"
                    className={styles.select}
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    required
                    disabled={loading}
                  >
                    {TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* ── SELETOR DE REGIME FISCAL: PJ vs PF (Feedback do Professor) ── */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Regime de Atuação do Estabelecimento *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.35rem' }}>
                    <button
                      type="button"
                      onClick={() => { setLegalNature('PJ'); setCpfError(''); }}
                      disabled={loading}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--radius-md, 8px)',
                        border: legalNature === 'PJ' ? '2px solid var(--color-primary, #10B981)' : '1px solid var(--color-border, #334155)',
                        backgroundColor: legalNature === 'PJ' ? 'rgba(16, 185, 129, 0.08)' : 'var(--color-surface, #1E293B)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                      }}
                      id="select-pj-btn"
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem', color: legalNature === 'PJ' ? 'var(--color-primary, #10B981)' : 'var(--color-text, #F8FAFC)' }}>
                        <BuildingIcon size={16} /> Pessoa Jurídica (PJ)
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #94A3B8)', marginTop: '0.35rem', lineHeight: 1.3 }}>
                        Restaurantes, indústrias, empórios e comércios com CNPJ
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setLegalNature('PF'); setCnpjError(''); }}
                      disabled={loading}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--radius-md, 8px)',
                        border: legalNature === 'PF' ? '2px solid var(--color-primary, #10B981)' : '1px solid var(--color-border, #334155)',
                        backgroundColor: legalNature === 'PF' ? 'rgba(16, 185, 129, 0.08)' : 'var(--color-surface, #1E293B)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                      }}
                      id="select-pf-btn"
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem', color: legalNature === 'PF' ? 'var(--color-primary, #10B981)' : 'var(--color-text, #F8FAFC)' }}>
                        <UserIcon size={16} /> Pessoa Física (PF)
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #94A3B8)', marginTop: '0.35rem', lineHeight: 1.3 }}>
                        Produtores artesanais, confeiteiras caseiras e autônomos com CPF
                      </span>
                    </button>
                  </div>
                </div>

                {/* ── CAMPOS ESPECÍFICOS PARA PESSOA JURÍDICA (PJ) ── */}
                {legalNature === 'PJ' && (
                  <>
                    <div className={styles.formGroup}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className={styles.label} htmlFor="partner-cnpj">CNPJ do Estabelecimento *</label>
                        {cnpj.replace(/\D/g, '').length === 14 && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: cnpjError ? 'var(--color-danger, #EF4444)' : 'var(--color-success, #10B981)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            {cnpjError ? <><XCircleIcon size={12} /> {cnpjError}</> : <><CheckCircleIcon size={12} /> CNPJ Válido</>}
                          </span>
                        )}
                      </div>
                      <input
                        id="partner-cnpj"
                        type="text"
                        className={styles.input}
                        placeholder="00.000.000/0000-00"
                        value={cnpj}
                        maxLength={18}
                        onChange={(e) => handleCnpjChange(e.target.value)}
                        disabled={loading}
                        required
                        style={cnpjError ? { borderColor: 'var(--color-danger, #EF4444)' } : undefined}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label} htmlFor="partner-company-name">Razão Social *</label>
                      <input
                        id="partner-company-name"
                        type="text"
                        className={styles.input}
                        placeholder="Ex: Cantina Sem Glúten Alimentos LTDA"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </>
                )}

                {/* ── CAMPOS ESPECÍFICOS PARA PESSOA FÍSICA (PF) ── */}
                {legalNature === 'PF' && (
                  <>
                    <div className={styles.formGroup}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className={styles.label} htmlFor="partner-cpf">CPF do Produtor / Responsável *</label>
                        {cpf.replace(/\D/g, '').length === 11 && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: cpfError ? 'var(--color-danger, #EF4444)' : 'var(--color-success, #10B981)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            {cpfError ? <><XCircleIcon size={12} /> {cpfError}</> : <><CheckCircleIcon size={12} /> CPF Válido</>}
                          </span>
                        )}
                      </div>
                      <input
                        id="partner-cpf"
                        type="text"
                        className={styles.input}
                        placeholder="000.000.000-00"
                        value={cpf}
                        maxLength={14}
                        onChange={(e) => handleCpfChange(e.target.value)}
                        disabled={loading}
                        required
                        style={cpfError ? { borderColor: 'var(--color-danger, #EF4444)' } : undefined}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label} htmlFor="partner-responsible-name">Nome do Produtor Responsável *</label>
                      <input
                        id="partner-responsible-name"
                        type="text"
                        className={styles.input}
                        placeholder="Ex: Everton Coimbra de Araújo"
                        value={responsibleName}
                        onChange={(e) => setResponsibleName(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </>
                )}

                {/* ── UPLOAD DE DOCUMENTO COMPROBATÓRIO (ALVARÁ / DOC COM FOTO) ── */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    {legalNature === 'PJ' ? 'Documento / Alvará Sanitário / Cartão CNPJ' : 'Documento com Foto do Produtor (RG / CNH)'}
                  </label>
                  <input
                    ref={docFileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    style={{ display: 'none' }}
                    onChange={handleDocFileChange}
                    disabled={loading}
                    id="doc-file-input"
                  />
                  {!documentUrl ? (
                    <div
                      onClick={() => docFileInputRef.current?.click()}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') docFileInputRef.current?.click(); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        border: '1px dashed var(--color-border, #334155)',
                        borderRadius: 'var(--radius-md, 8px)',
                        cursor: 'pointer',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        transition: 'border-color 0.2s',
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted, #94A3B8)' }}>
                        Clique para anexar comprovante (PDF ou Imagem, máx 5MB)
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary, #10B981)' }}>
                        + Anexar
                      </span>
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.9rem',
                      border: '1px solid var(--color-primary, #10B981)',
                      borderRadius: 'var(--radius-md, 8px)',
                      backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--color-primary, #10B981)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                        <CheckCircleIcon size={14} /> Documento anexado com sucesso
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveDoc}
                        disabled={loading}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-danger, #EF4444)',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                        }}
                      >
                        <TrashIcon size={13} /> Remover
                      </button>
                    </div>
                  )}
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #64748B)', marginTop: '0.35rem', display: 'block' }}>
                    {legalNature === 'PJ' 
                      ? 'Recomendado para agilizar a homologação do estabelecimento pela administração.' 
                      : 'Necessário para comprovação de autenticidade do produtor artesanal.'}
                  </span>
                </div>

                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label className={styles.label} htmlFor="partner-description">Descrição Comercial</label>
                  <textarea
                    id="partner-description"
                    className={styles.textarea}
                    placeholder="Fale um pouco sobre seu estabelecimento, especialidades e cuidados alimentares..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={loading}
                    rows={4}
                  />
                </div>
              </div>

              {/* Coluna Direita — Marca e contato */}
              <div className={styles.colRight}>
                <div className={styles.brandField}>
                  <label className={styles.label}>Marca do estabelecimento</label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    disabled={loading}
                    id="brand-file-input"
                  />

                  {!logoUrl ? (
                    <div
                      className={`${styles.brandDropzone} ${isDragging ? styles.brandDropzoneActive : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      role="button"
                      tabIndex={0}
                      aria-label="Selecionar imagem da marca do estabelecimento"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          fileInputRef.current?.click();
                        }
                      }}
                    >
                      <span className={styles.brandDropzoneIcon}><CameraIcon size={32} /></span>
                      <span className={styles.brandDropzoneTitle}>Adicione a marca do negócio</span>
                      <span className={styles.brandDropzoneSubtitle}>Arraste uma imagem ou clique para selecionar</span>
                      <span className={styles.brandDropzoneMeta}>PNG, JPG ou WebP • Máx. 5 MB</span>
                    </div>
                  ) : (
                    <div className={styles.brandPreviewWrapper}>
                      <div className={styles.brandPreviewBox}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={logoUrl}
                          alt="Pré-visualização da marca do estabelecimento"
                          className={styles.brandPreviewImg}
                        />
                      </div>
                      <div className={styles.brandActions}>
                        <button
                          type="button"
                          className={styles.brandBtnAction}
                          onClick={() => fileInputRef.current?.click()}
                          disabled={loading}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <RefreshIcon size={14} /> Alterar imagem
                        </button>
                        <button
                          type="button"
                          className={`${styles.brandBtnAction} ${styles.brandBtnRemove}`}
                          onClick={handleRemoveLogo}
                          disabled={loading}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <TrashIcon size={14} /> Remover
                        </button>
                      </div>
                    </div>
                  )}

                  <p className={styles.brandHelpText}>
                    Envie o logotipo ou imagem que representa seu estabelecimento. Ela poderá ser exibida no CeliLac junto às informações do negócio.
                  </p>
                </div>

                <div className={styles.formGroup} style={{ marginBottom: 0, marginTop: 'auto' }}>
                  <InternationalPhoneInput
                    id="partner-phone"
                    value={phone}
                    onChange={setPhone}
                    required
                    disabled={loading}
                    label="Telefone / WhatsApp de Contato"
                  />
                </div>
              </div>
            </div>

            {/* ── PARTE INFERIOR — SEÇÃO DE LOCALIZAÇÃO E ATENDIMENTO (Largura Integral) ── */}
            <div className={styles.formSectionDivider}>
              <h2 className={styles.formSectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPinIcon size={18} /> Localização e Atendimento
              </h2>

              {/* Seletor de País e CEP */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label className={styles.label} htmlFor="partner-country">País do Estabelecimento</label>
                  <select
                    id="partner-country"
                    className={styles.select}
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    disabled={loading}
                  >
                    <option value="BR">Brasil (+55)</option>
                    <option value="PT">Portugal (+351)</option>
                    <option value="US">Estados Unidos (+1)</option>
                    <option value="ES">Espanha (+34)</option>
                    <option value="AR">Argentina (+54)</option>
                    <option value="OTHER">Outro País</option>
                  </select>
                </div>

                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label className={styles.label} htmlFor="partner-cep">
                    {country === 'BR' ? 'CEP (Auto-completar)' : 'Código Postal / Zip Code'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="partner-cep"
                      type="text"
                      className={styles.input}
                      placeholder={country === 'BR' ? '00000-000' : 'Zip / Postal Code'}
                      value={cep}
                      maxLength={country === 'BR' ? 9 : 15}
                      onChange={(e) => {
                        if (country === 'BR') {
                          handleCepChange(e.target.value);
                        } else {
                          setCep(e.target.value);
                        }
                      }}
                      disabled={loading || loadingCep}
                    />
                    {loadingCep && (
                      <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: 'var(--color-accent)' }}>
                        Buscando CEP...
                      </span>
                    )}
                  </div>
                  {country === 'BR' && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      Digite os 8 dígitos para preencher rua, bairro, cidade e estado via ViaCEP.
                    </span>
                  )}
                </div>
              </div>

              {/* Endereço Completo */}
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="partner-address">Logradouro / Endereço Completo *</label>
                <input
                  id="partner-address"
                  type="text"
                  className={styles.input}
                  placeholder="Ex: Av. Paulista, 1000, Bloco B, Bela Vista"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {/* Cidade e Estado */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="partner-city">Cidade</label>
                  <input
                    id="partner-city"
                    type="text"
                    className={styles.input}
                    placeholder="Ex: São Paulo"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="partner-state">Estado / UF</label>
                  <input
                    id="partner-state"
                    type="text"
                    className={styles.input}
                    placeholder="Ex: SP"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="partner-region">Região de Atendimento/Entrega</label>
                <input
                  id="partner-region"
                  type="text"
                  className={styles.input}
                  placeholder="Ex: Zona Sul, Centro, Campinas e região metropolitana"
                  value={deliveryRegion}
                  onChange={(e) => setDeliveryRegion(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Pré-visualização do Google Maps */}
              <div style={{ marginTop: '1.25rem' }}>
                <label className={styles.label} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CompassIcon size={16} /> Localização no Mapa (Google Maps)
                </label>
                <PartnerLocationMap
                  address={address}
                  city={city}
                  state={state}
                  name={name}
                  height={240}
                  showDirectionsButton={true}
                />
              </div>
            </div>

            {/* ── RODAPÉ DE AÇÕES COM VALIDAÇÃO REATIVA (Feedback do Professor) ── */}
            <div style={{ marginTop: '2.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  style={{ flex: 1 }}
                  onClick={() => router.push('/partner')}
                  disabled={loading}
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  style={{
                    flex: 2,
                    opacity: !isFormValid || loading ? 0.45 : 1,
                    cursor: !isFormValid || loading ? 'not-allowed' : 'pointer',
                    filter: !isFormValid || loading ? 'grayscale(35%)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                  disabled={!isFormValid || loading}
                  id="submit-register-btn"
                  title={!isFormValid ? 'Preencha todos os campos obrigatórios (*) para habilitar o cadastro' : 'Cadastrar Estabelecimento'}
                >
                  {loading ? 'Salvando...' : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      <SaveIcon size={16} /> Cadastrar Estabelecimento
                    </span>
                  )}
                </button>
              </div>

              {!isFormValid && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.6rem 0.9rem',
                  borderRadius: 'var(--radius-sm, 6px)',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: 'var(--color-danger, #EF4444)',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  lineHeight: 1.4,
                }}>
                  <XCircleIcon size={14} />
                  <span>
                    <strong>Campos obrigatórios pendentes:</strong> Preencha o nome fantasia, tipo, endereço, telefone e os dados fiscais ({legalNature === 'PJ' ? 'CNPJ válido e Razão Social' : 'CPF válido e Nome do Produtor'}) para habilitar o envio.
                  </span>
                </div>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
