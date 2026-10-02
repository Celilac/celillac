'use client';
// frontend/web-app/src/app/partner/financial/page.tsx
import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { Header } from '@/components/layout/Header';
import { partnerApi, PartnerSummary } from '@/api/partner';
import { ordersApi, OrderDTO } from '@/api/orders';
import { paymentsApi, PartnerFinancialAccountDTO } from '@/api/payments';
import styles from './partner-financial.module.css';

function PartnerFinancialPageContent() {
  const { token, isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [partners, setPartners] = useState<PartnerSummary[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [account, setAccount] = useState<PartnerFinancialAccountDTO | null>(null);
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Form de Chave PIX
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState<'CNPJ' | 'CPF' | 'EMAIL' | 'PHONE' | 'RANDOM'>('CNPJ');
  const [bankCode, setBankCode] = useState('260'); // Nubank padrão ou outro
  const [agencyNumber, setAgencyNumber] = useState('0001');
  const [accountNumber, setAccountNumber] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);

  // Dropdown customizado e espaçoso para seleção de local/estabelecimento
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  // 1. Carregar lista de parceiros do usuário
  useEffect(() => {
    if (isInitializing) return;
    if (!isAuthenticated || !token) {
      router.replace('/auth/login');
      return;
    }

    partnerApi.listUserPartners(token)
      .then((data) => {
        setPartners(data);
        const queryPartnerId = searchParams.get('partnerId');
        if (queryPartnerId && data.some((p) => p.id === queryPartnerId)) {
          setSelectedPartnerId(queryPartnerId);
        } else if (data.length > 0) {
          setSelectedPartnerId(data[0].id);
        }
      })
      .catch((err) => {
        toast.error(err.message || 'Erro ao carregar parceiros.', 'Erro');
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, isInitializing, token, router, searchParams, toast]);

  // 2. Carregar dados financeiros e pedidos do parceiro selecionado
  const fetchPartnerFinancialData = useCallback(async () => {
    if (!token || !selectedPartnerId) return;

    try {
      // Buscar dados da subconta
      try {
        const accData = await paymentsApi.getPartnerFinancialAccount(selectedPartnerId, token);
        setAccount(accData);
        setPixKey(accData.pixKey);
        setPixKeyType(accData.pixKeyType);
        if (accData.bankCode) setBankCode(accData.bankCode);
        if (accData.agencyNumber) setAgencyNumber(accData.agencyNumber);
        if (accData.accountNumber) setAccountNumber(accData.accountNumber);
      } catch {
        setAccount(null);
      }

      // Buscar pedidos para cálculo do extrato
      const ordersData = await ordersApi.getPartnerOrders(selectedPartnerId, token);
      setOrders(ordersData);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao carregar dados financeiros.', 'Erro');
    }
  }, [selectedPartnerId, token, toast]);

  useEffect(() => {
    if (selectedPartnerId) {
      fetchPartnerFinancialData();
    }
  }, [selectedPartnerId, fetchPartnerFinancialData]);

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedPartnerId) return;
    setSavingAccount(true);

    try {
      const saved = await paymentsApi.setupPartnerFinancialAccount(
        selectedPartnerId,
        {
          pixKey,
          pixKeyType,
          bankCode,
          agencyNumber,
          accountNumber,
          accountType: 'CHECKING',
        },
        token
      );

      setAccount(saved);
      toast.success('Chave PIX e subconta Asaas configuradas com sucesso!', 'Sucesso');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao configurar recebimento.', 'Erro');
    } finally {
      setSavingAccount(false);
    }
  };

  // Métricas de faturamento estilo iFood
  const paidOrders = orders.filter((o) => o.status !== 'CANCELLED' && o.status !== 'AWAITING_PAYMENT');
  const grossTotal = paidOrders.reduce((acc, o) => acc + o.totalAmount, 0);
  const platformFeeTotal = paidOrders.reduce((acc, o) => acc + o.subtotalAmount * 0.12, 0);
  const netPartnerTotal = grossTotal - platformFeeTotal;

  if (loading || isInitializing) {
    return (
      <div className={styles.container}>
        <Header />
        <main className={styles.mainContent}>
          <p className="profile-loading" role="status">Carregando painel financeiro…</p>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Header />

      <main className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>
            💰 Painel Financeiro & Repasses
          </h1>

          <div className={styles.headerControls}>
            {partners.length > 0 && (
              <div className={styles.selectPartnerContainer} ref={dropdownRef}>
                <button
                  type="button"
                  className={`${styles.selectPartnerTrigger} ${isDropdownOpen ? styles.selectPartnerTriggerActive : ''}`}
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  aria-haspopup="listbox"
                  aria-expanded={isDropdownOpen}
                  id="partner-financial-select-btn"
                  title="Clique para alternar entre seus estabelecimentos"
                >
                  <span className={styles.selectPartnerLabel}>Local:</span>
                  <span className={styles.selectPartnerValue}>
                    <span className={styles.partnerNameText}>
                      {partners.find((p) => p.id === selectedPartnerId)?.name || 'Selecione um local'}
                    </span>
                  </span>
                  <svg
                    className={`${styles.selectPartnerArrow} ${isDropdownOpen ? styles.selectPartnerArrowOpen : ''}`}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <ul className={styles.partnerDropdownMenu} role="listbox" aria-labelledby="partner-financial-select-btn">
                    {partners.map((p) => {
                      const isSelected = p.id === selectedPartnerId;
                      return (
                        <li
                          key={p.id}
                          role="option"
                          aria-selected={isSelected}
                          className={`${styles.partnerDropdownItem} ${isSelected ? styles.partnerDropdownItemSelected : ''}`}
                          onClick={() => {
                            setSelectedPartnerId(p.id);
                            setIsDropdownOpen(false);
                          }}
                        >
                          <div className={styles.partnerItemInfo}>
                            <span className={styles.partnerItemName}>{p.name}</span>
                            {p.city && <span className={styles.partnerItemCity}>{p.city}</span>}
                          </div>
                          {isSelected && (
                            <svg className={styles.itemCheckIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            <Link
              href={`/partner/orders?partnerId=${selectedPartnerId}`}
              className={styles.ordersLink}
            >
              🍳 Ir para Pedidos
            </Link>
          </div>
        </div>

        {partners.length === 0 ? (
          <div className={styles.card} style={{ textAlign: 'center', padding: '3.5rem 1.5rem', marginTop: '1rem' }}>
            <p style={{ color: 'var(--color-text)', marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 700 }}>
              Nenhum estabelecimento comercial vinculado a esta conta
            </p>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '1rem', maxWidth: '600px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
              O Painel Financeiro e Repasses é exclusivo para estabelecimentos parceiros. Se você deseja testar este painel com a subconta e pedidos semeados, faça login com a conta do parceiro:
            </p>
            <div style={{ background: 'var(--color-elevated)', padding: '1.25rem 1.5rem', borderRadius: '12px', display: 'inline-block', marginBottom: '2rem', textAlign: 'left', border: '1px solid var(--color-border)' }}>
              <div style={{ color: 'var(--color-text)', fontSize: '0.95rem' }}><strong>E-mail:</strong> parceiro.restaurante@seed.celilac.dev</div>
              <div style={{ color: 'var(--color-text)', fontSize: '0.95rem', marginTop: '0.4rem' }}><strong>Senha:</strong> Seed@123456</div>
            </div>
            <div>
              <Link href="/partner/register" className={styles.saveButton} style={{ display: 'inline-block', width: 'auto', padding: '0.85rem 2rem', textDecoration: 'none' }}>
                Cadastrar Novo Estabelecimento
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Métricas Financeiras — Modelo iFood */}
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>
              <span>Vendas Brutas</span>
              <span>💵</span>
            </div>
            <div className={styles.metricValue}>
              R$ {grossTotal.toFixed(2).replace('.', ',')}
            </div>
            <div className={styles.metricSubtitle}>
              {paidOrders.length} pedido(s) faturado(s)
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>
              <span>Comissão CeLiLac (12%)</span>
              <span>🛡️</span>
            </div>
            <div className={styles.metricValue} style={{ color: 'var(--color-warning)' }}>
              - R$ {platformFeeTotal.toFixed(2).replace('.', ',')}
            </div>
            <div className={styles.metricSubtitle}>
              Manutenção da plataforma e auditoria alimentar
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>
              <span>Repasse Líquido</span>
              <span>⚡</span>
            </div>
            <div className={styles.metricValue} style={{ color: 'var(--color-emerald)' }}>
              R$ {netPartnerTotal.toFixed(2).replace('.', ',')}
            </div>
            <div className={styles.metricSubtitle}>
              Disponível via Split Asaas na sua conta
            </div>
          </div>
        </div>

        <div className={styles.sectionsGrid}>
          {/* Configuração de Chave PIX e Subconta */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              🏦 Dados de Recebimento
            </h2>

            {account?.isVerified && (
              <div className={styles.accountStatusBadge}>
                ✅ Subconta Asaas ativa ({account.gatewaySubaccountId})
              </div>
            )}

            <form onSubmit={handleSaveAccount}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Tipo de Chave PIX</label>
                <select
                  className={styles.select}
                  value={pixKeyType}
                  onChange={(e: any) => setPixKeyType(e.target.value)}
                >
                  <option value="CNPJ">CNPJ</option>
                  <option value="CPF">CPF</option>
                  <option value="EMAIL">E-mail</option>
                  <option value="PHONE">Telefone</option>
                  <option value="RANDOM">Chave Aleatória</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Chave PIX</label>
                <input
                  type="text"
                  required
                  placeholder="Informe a chave PIX para repasse"
                  className={styles.input}
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Código do Banco (COMPE)</label>
                <input
                  type="text"
                  placeholder="Ex: 260 (Nubank), 001 (BB), 237 (Bradesco)"
                  className={styles.input}
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Agência</label>
                  <input
                    type="text"
                    placeholder="0001"
                    className={styles.input}
                    value={agencyNumber}
                    onChange={(e) => setAgencyNumber(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Conta Corrente</label>
                  <input
                    type="text"
                    placeholder="12345-6"
                    className={styles.input}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className={styles.saveButton}
                disabled={savingAccount}
              >
                {savingAccount ? 'Salvando…' : 'Salvar Dados de Recebimento'}
              </button>
            </form>
          </div>

          {/* Extrato Transacional com Split */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              📄 Extrato Transacional de Vendas
            </h2>

            {paidOrders.length === 0 ? (
              <p style={{ color: '#94a3b8', padding: '2rem 0', textAlign: 'center' }}>
                Nenhuma venda liquidada neste estabelecimento até o momento.
              </p>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Pedido</th>
                      <th>Data</th>
                      <th>Bruto</th>
                      <th>CeLiLac (12%)</th>
                      <th>Líquido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paidOrders.map((order) => {
                      const platformFee = Number((order.subtotalAmount * 0.12).toFixed(2));
                      const netAmount = Number((order.totalAmount - platformFee).toFixed(2));

                      return (
                        <tr key={order.id}>
                          <td>#{order.id.slice(0, 8)}</td>
                          <td>
                            {new Date(order.createdAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </td>
                          <td>R$ {order.totalAmount.toFixed(2).replace('.', ',')}</td>
                          <td style={{ color: 'var(--color-warning)' }}>
                            - R$ {platformFee.toFixed(2).replace('.', ',')}
                          </td>
                          <td style={{ color: 'var(--color-emerald)', fontWeight: 700 }}>
                            R$ {netAmount.toFixed(2).replace('.', ',')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function PartnerFinancialPage() {
  return (
    <Suspense fallback={<p className="profile-loading">Carregando painel financeiro…</p>}>
      <PartnerFinancialPageContent />
    </Suspense>
  );
}

