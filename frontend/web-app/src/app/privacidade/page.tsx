'use client';
// frontend/web-app/src/app/privacidade/page.tsx
// [RASCUNHO OFICIAL PARA APROVAÇÃO JURÍDICA / EVERTON] - Versão 1.0
import Link from 'next/link';
import { Header } from '@/components/layout/Header';

export default function PrivacyPolicyPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)' }}>
      <Header />

      <main style={{ flex: 1, maxWidth: '860px', margin: '0 auto', width: '100%', padding: '2.5rem 1.25rem 4rem' }}>
        {/* Banner de Rascunho Legal */}
        <div
          style={{
            backgroundColor: 'rgba(5, 150, 105, 0.1)',
            border: '1px solid rgba(5, 150, 105, 0.3)',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>🛡️</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>
              Política de Privacidade e Proteção de Dados Sensíveis (Versão 1.0)
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              Elaborada em estrita conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 - LGPD), com foco especial em Dados Pessoais Sensíveis de Saúde (Art. 11).
            </div>
          </div>
        </div>

        <article
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '2.5rem 2rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            lineHeight: 1.7,
            color: 'var(--color-text)',
          }}
        >
          <header style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem', color: 'var(--color-primary, #059669)' }}>
              Política de Privacidade CeLiLac
            </h1>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Vigência: Homologação com Usuários • Versão 1.0 (Outubro/2026)
            </p>
          </header>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>1. Compromisso com a Sua Privacidade</h2>
            <p>
              A <strong>CeLiLac</strong> reconhece a gravidade e o caráter confidencial das condições alimentares dos seus usuários. Entendemos que a informação sobre uma restrição alimentar ou alergia anafilática não é um dado comum: é uma informação vital de saúde humana.
            </p>
            <p>
              Por essa razão, adotamos o princípio da <strong>Privacidade por Padrão e desde a Concepção (Privacy by Design and by Default)</strong> em toda a nossa arquitetura tecnológica.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>2. Tratamento de Dados Pessoais Sensíveis (LGPD Art. 11)</h2>
            <p>
              Nos termos do Art. 11 da LGPD, os dados referentes à saúde ou à vida sexual, dado genético ou biométrico, são classificados como dados pessoais sensíveis. Na CeLiLac:
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>
                <strong>Quais dados de saúde coletamos:</strong> Registro de condição celíaca (Doença Celíaca, dermatite herpetiforme ou sensibilidade ao glúten não celíaca), histórico de alergias alimentares (leite, soja, castanhas, etc.), grau de severidade clínica (moderado, grave, anafilático) e histórico de reações adversas;
              </li>
              <li>
                <strong>Base legal utilizada:</strong> Consentimento do titular fornecido de forma específica e destacada (LGPD, art. 11, I) e proteção da vida ou da incolumidade física do titular ou de terceiro (LGPD, art. 11, II, "e");
              </li>
              <li>
                <strong>Finalidade restrita:</strong> Alimentar o motor biológico de cruzamento de ingredientes em tempo real, alertar o consumidor antes da compra de qualquer produto inseguro e bloquear o envio de refeições com glúten para celíacos.
              </li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>3. Vedação Absoluta de Comercialização de Dados de Saúde</h2>
            <p>
              <strong>A CeLiLac NUNCA comercializa, aluga, cede ou monetiza dados de saúde ou perfis alimentares com anunciantes, seguradoras, indústrias farmacêuticas ou corretores de dados (data brokers).</strong>
            </p>
            <p>
              O compartilhamento de dados ocorre única e exclusivamente no contexto operacional do pedido:
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>
                <strong>Com o Estabelecimento Parceiro:</strong> Apenas os alertas de alergia estritamente necessários para a preparação segura do prato (ex.: <em>"Consumidor Celíaco - Alerta de Contaminação Cruzada"</em>), sem exposição de dados desnecessários;
              </li>
              <li>
                <strong>Com Gateways de Pagamento (Asaas):</strong> Apenas dados cadastrais e financeiros indispensáveis para o processamento da transação (dados de cartão e Pix são criptografados de ponta a ponta e protegidos pelo padrão PCI-DSS).
              </li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>4. Segurança da Informação, Criptografia e Mascaramento</h2>
            <p>
              Empregamos salvaguardas técnicas avançadas para proteger seus dados contra acessos não autorizados:
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>Senhas criptografadas com hash irreversível de alto custo computacional (Bcrypt salt rounds 10);</li>
              <li>Toda comunicação trafega sob criptografia TLS 1.3 / HTTPS com cabeçalhos rigorosos de segurança (HSTS, CSP, X-Frame-Options);</li>
              <li>Camada interna de mascaramento (DataMasker) que expurga e-mails, telefones e credenciais de qualquer log de servidor;</li>
              <li>Proteção contra bots maliciosos, web scrapers e ataques volumétricos L7.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>5. Seus Direitos como Titular de Dados (LGPD Art. 18)</h2>
            <p>
              Você possui total controle sobre suas informações. A qualquer momento, é possível exercer seus direitos legais diretamente pelo app ou por solicitação expressa:
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li><strong>Confirmação e Acesso:</strong> Verificar quais dados de saúde e preferências estão cadastrados;</li>
              <li><strong>Correção:</strong> Atualizar suas alergias e contatos a qualquer momento nas configurações do seu perfil;</li>
              <li><strong>Revogação do Consentimento e Eliminação:</strong> Revogar o consentimento para o tratamento de dados de saúde e solicitar a exclusão definitiva da sua conta;</li>
              <li><strong>Portabilidade:</strong> Solicitar cópia estruturada dos seus dados cadastrais.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>6. Canal de Atendimento do Encarregado de Dados (DPO)</h2>
            <p>
              Para dúvidas sobre esta Política, solicitações de privacidade ou exercício de direitos de titular, entre em contato com nosso Encarregado pelo e-mail:
            </p>
            <p style={{ fontWeight: 600, color: 'var(--color-primary, #059669)' }}>
              📧 privacidade@celilac.com.br (ou contato@celilac.com.br)
            </p>
          </section>

          <footer style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <Link href="/auth/register" style={{ color: 'var(--color-primary, #059669)', fontWeight: 600, textDecoration: 'none' }}>
              ← Voltar ao Cadastro
            </Link>
            <Link href="/termos" style={{ color: 'var(--color-primary, #059669)', fontWeight: 600, textDecoration: 'underline' }}>
              Ver Termos de Uso →
            </Link>
          </footer>
        </article>
      </main>
    </div>
  );
}
