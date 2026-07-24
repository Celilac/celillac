'use client';
// frontend/web-app/src/app/partner/register/page.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { partnerApi } from '@/api/partner';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/useToast';
import { HttpError } from '@/api/client';
import styles from '../partner.module.css';

const TYPE_OPTIONS = [
  { value: 'RESTAURANT',           label: '🍽️ Estabelecimento Alimentício (Lanchonete/Restaurante)' },
  { value: 'MARKET',               label: '🛒 Comércio Alimentar (Mercado/Empório)' },
  { value: 'INDEPENDENT_PRODUCER', label: '👩‍🍳 Produtor Independente (Artesanal/Fábrica)' },
];

export default function RegisterPartnerPage() {
  const { token, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const toast = useToast();

  const [name,           setName]           = useState('');
  const [cnpj,           setCnpj]           = useState('');
  const [description,    setDescription]    = useState('');
  const [address,        setAddress]        = useState('');
  const [phone,          setPhone]          = useState('');
  const [type,           setType]           = useState('RESTAURANT');
  const [city,           setCity]           = useState('');
  const [state,          setState]          = useState('');
  const [deliveryRegion, setDeliveryRegion] = useState('');
  const [loading,        setLoading]        = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!isAuthenticated || !token) return;

    if (!name.trim() || !address.trim() || !phone.trim() || !type) {
      toast.warning('Por favor, preencha todos os campos obrigatórios.', 'Campos incompletos');
      return;
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
      }, token);

      toast.success({
        description: 'Perfil comercial cadastrado com sucesso! Envie para revisão para poder ativá-lo.',
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
      <header className="topbar">
        <span className="topbar-title brand-lockup" onClick={() => router.push('/partner')} style={{ cursor: 'pointer' }}>
          <Image src="/brand/logo_with_transparent_background.png" alt="CeliLac" width={32} height={32} priority />
          <span className="brand-wordmark">Celi<span>Lac</span></span>
          <span className="brand-tagline">Novo Perfil Comercial</span>
        </span>
        <nav className="topbar-actions">
          <button type="button" onClick={toggleTheme} className="btn btn-ghost theme-button" aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </nav>
      </header>

      <main className={styles.container}>
        <div className={styles.formShell}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 className={styles.title} style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Cadastrar Estabelecimento</h1>
            <p className={styles.subtitle}>Insira as informações do seu negócio. As informações serão analisadas pela administração.</p>
          </div>

          <form onSubmit={handleRegister}>
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
              <label className={styles.label} htmlFor="partner-cnpj">CNPJ (Opcional)</label>
              <input
                id="partner-cnpj"
                type="text"
                className={styles.input}
                placeholder="Ex: 12.345.678/0001-95"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="partner-description">Descrição Comercial</label>
              <textarea
                id="partner-description"
                className={styles.textarea}
                placeholder="Fale um pouco sobre seu estabelecimento, especialidades e cuidados alimentares..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="partner-address">Endereço Completo *</label>
              <input
                id="partner-address"
                type="text"
                className={styles.input}
                placeholder="Ex: Av. Paulista, 1000, Bloco B"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                disabled={loading}
              />
            </div>

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
                <label className={styles.label} htmlFor="partner-state">Estado</label>
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
                placeholder="Ex: Zona Sul, Centro, Campinas e região"
                value={deliveryRegion}
                onChange={(e) => setDeliveryRegion(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="partner-phone">Telefone / WhatsApp de Contato *</label>
              <input
                id="partner-phone"
                type="text"
                className={styles.input}
                placeholder="Ex: (11) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
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
