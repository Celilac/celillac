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
import { maskCnpj, validateCnpj, maskCep } from '@/utils/mask';
import { fetchAddressByCep } from '@/services/viaCep';
import InternationalPhoneInput from '@/components/common/InternationalPhoneInput';
import PartnerLocationMap from '@/components/common/PartnerLocationMap';
import styles from '../partner.module.css';

const TYPE_OPTIONS = [
  { value: 'RESTAURANT',           label: '🍽️ Estabelecimento Alimentício (Lanchonete/Restaurante)' },
  { value: 'MARKET',               label: '🛒 Comércio Alimentar (Mercado/Empório)' },
  { value: 'INDEPENDENT_PRODUCER', label: '👩‍🍳 Produtor Independente (Artesanal/Fábrica)' },
];

export default function RegisterPartnerPage() {
  const { token, isAuthenticated } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name,           setName]           = useState('');
  const [cnpj,           setCnpj]           = useState('');
  const [cnpjError,      setCnpjError]      = useState('');
  const [description,    setDescription]    = useState('');
  const [address,        setAddress]        = useState('');
  const [phone,          setPhone]          = useState('');
  const [type,           setType]           = useState('RESTAURANT');
  const [country,        setCountry]        = useState('BR');
  const [cep,            setCep]            = useState('');
  const [loadingCep,     setLoadingCep]     = useState(false);
  const [city,           setCity]           = useState('');
  const [state,          setState]          = useState('');
  const [deliveryRegion, setDeliveryRegion] = useState('');
  const [logoUrl,        setLogoUrl]        = useState('');
  const [isDragging,     setIsDragging]     = useState(false);
  const [loading,        setLoading]        = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
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

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!isAuthenticated || !token) return;

    if (!name.trim() || !address.trim() || !phone.trim() || !type) {
      toast.warning('Por favor, preencha todos os campos obrigatórios (*).', 'Campos incompletos');
      return;
    }

    if (cnpj.trim().length > 0) {
      const validation = validateCnpj(cnpj);
      if (!validation.valid) {
        toast.error(validation.error || 'CNPJ inválido. Verifique os dígitos informados.', 'Validação Fiscal');
        return;
      }
    }

    setLoading(true);
    try {
      await partnerApi.register({
        name,
        cnpj: cnpj || undefined,
        description,
        address,
        phone,
        type,
        city: city || undefined,
        state: state || undefined,
        deliveryRegion: deliveryRegion || undefined,
        logoUrl: logoUrl || undefined,
      }, token);

      toast.success({
        description: 'Estabelecimento cadastrado com sucesso! Envie para revisão para poder ativá-lo.',
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

                <div className={styles.formGroup}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className={styles.label} htmlFor="partner-cnpj">CNPJ (Opcional)</label>
                    {cnpj.replace(/\D/g, '').length === 14 && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: cnpjError ? 'var(--color-danger, #EF4444)' : 'var(--color-success, #10B981)' }}>
                        {cnpjError ? `❌ ${cnpjError}` : '✅ CNPJ Válido'}
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
                    style={cnpjError ? { borderColor: 'var(--color-danger, #EF4444)' } : undefined}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #64748B)' }}>
                    Opcional para produtor artesanal ou pessoa física sem registro de pessoa jurídica.
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
                      <span className={styles.brandDropzoneIcon}>🖼️</span>
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
                        >
                          🔄 Alterar imagem
                        </button>
                        <button
                          type="button"
                          className={`${styles.brandBtnAction} ${styles.brandBtnRemove}`}
                          onClick={handleRemoveLogo}
                          disabled={loading}
                        >
                          🗑️ Remover
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
              <h2 className={styles.formSectionTitle}>
                📍 Localização e Atendimento
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
                    <option value="BR">🇧🇷 Brasil</option>
                    <option value="PT">🇵🇹 Portugal</option>
                    <option value="US">🇺🇸 Estados Unidos</option>
                    <option value="ES">🇪🇸 Espanha</option>
                    <option value="AR">🇦🇷 Argentina</option>
                    <option value="OTHER">🌐 Outro País</option>
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
                        ⏳ Buscando...
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
                <label className={styles.label} style={{ marginBottom: '8px', display: 'block' }}>
                  🗺️ Localização no Mapa (Google Maps)
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

            {/* ── RODAPÉ DE AÇÕES ── */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
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
                style={{ flex: 2 }}
                disabled={loading}
                id="submit-register-btn"
              >
                {loading ? 'Salvando...' : '💾 Cadastrar Estabelecimento'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
