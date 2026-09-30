'use client';
// frontend/web-app/src/app/partner/financial/page.tsx
import { useState, useEffect, useCallback, Suspense } from 'react';
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

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {partners.length > 0 && (
              <div className={styles.selectPartnerWrapper}>
                <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Local:</label>
                <select
                  className={styles.partnerSelect}
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                >
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Link
              href={`/partner/orders?partnerId=${selectedPartnerId}`}
              style={{
                padding: '0.6rem 1rem',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                borderRadius: '8px',
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: '0.9rem',
              }}
            >
              🍳 Ir para Pedidos
            </Link>
          </div>
        </div>

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

