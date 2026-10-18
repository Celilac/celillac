'use client';
// frontend/web-app/src/app/termos/page.tsx
// [RASCUNHO OFICIAL PARA APROVAÇÃO JURÍDICA / EVERTON] - Versão 1.0
import Link from 'next/link';
import { Header } from '@/components/layout/Header';

export default function TermsOfUsePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)' }}>
      <Header />

      <main style={{ flex: 1, maxWidth: '860px', margin: '0 auto', width: '100%', padding: '2.5rem 1.25rem 4rem' }}>
        {/* Banner de Rascunho Legal */}
        <div
          style={{
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>⚖️</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>
              Minuta dos Termos de Uso (Versão 1.0)
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              Este documento constitui o rascunho formal para validação e auditoria jurídica prévia ao lançamento público da plataforma CeLiLac.
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
              Termos de Uso da Plataforma CeLiLac
            </h1>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Última atualização: Outubro de 2026 • Versão 1.0 (Homologação com Usuários)
            </p>
          </header>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>1. Objeto e Propósito da Plataforma</h2>
            <p>
              A <strong>CeLiLac</strong> é uma plataforma tecnológica de segurança alimentar desenvolvida especificamente para apoiar pessoas com Doença Celíaca, intolerâncias alimentares severas (como lactose) e alergias alimentares (incluindo trigo, centeio, cevada, aveia, soja, oleaginosas, leite e derivados).
            </p>
            <p>
              Nossa missão é disponibilizar ferramentas de triagem rápida, leitura de ingredientes, guia comercial geolocalizado de estabelecimentos parceiros e pedidos seguros com proteção alimentar por software.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>2. Tratamento de Dados de Saúde e Consentimento Explícito (LGPD Art. 11)</h2>
            <p>
              Ao utilizar a plataforma, o Usuário declara estar ciente de que as informações relativas a suas restrições alimentares, alergias e diagnósticos (como condição celíaca) são classificadas legalmente como <strong>dados pessoais sensíveis de saúde</strong> pela Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD, Art. 11).
            </p>
            <p>
              O consentimento para o tratamento desses dados é concedido de forma <strong>específica, informada e destacada</strong> no ato do cadastro, tendo como finalidade exclusiva:
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>Execução do Motor Biológico de Compatibilidade Alimentar (Allergen Engine);</li>
              <li>Emissão de alertas preventivos contra contaminação cruzada e traços alergênicos;</li>
              <li>Bloqueio de pedidos e adição de produtos incompatíveis com a segurança do consumidor;</li>
              <li>Notificação a estabelecimentos parceiros sobre a severidade celíaca durante a preparação de alimentos.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>3. Caráter Tecnológico Preventivo e Limitações</h2>
            <p>
              O CeLiLac aplica regras implacáveis de conferência (incluindo a regra "FATAL" contra qualquer produto que apresente indicação de traços de glúten). No entanto, a plataforma opera como uma <strong>ferramenta complementar de assistência e prevenção</strong>:
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>
                A conferência visual final do rótulo físico ou embalagem do fabricante no momento do consumo é uma boa prática permanente recomendada a todo celíaco ou alérgico;
              </li>
              <li>
                Os estabelecimentos parceiros cadastrados são civilmente responsáveis pelas informações de composição, laudos laboratoriais, boas práticas de fabricação (BPF) e ausência de contaminação cruzada nas suas instalações;
              </li>
              <li>
                O CeLiLac não substitui aconselhamento, diagnóstico médico ou acompanhamento nutricional profissional individualizado.
              </li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>4. Cadastro, Segurança de Conta e Credenciais</h2>
            <p>
              O acesso à plataforma exige a criação de conta com e-mail válido e verificação obrigatória por código numérico de uso único (OTP). O usuário é o único responsável pela guarda e confidencialidade de suas credenciais de acesso.
            </p>
            <p>
              Tentativas de adulteração de perfil de alérgenos de terceiros, pedidos fraudulentos, cadastros fictícios ou ataques contra a disponibilidade do serviço ensejarão o bloqueio imediato da conta e eventual responsabilização legal.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>5. Pedidos, Pagamentos e Relatos de Irregularidades</h2>
            <p>
              A realização de pedidos através do CeLiLac segue rígido controle de prazos e conformidade:
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>
                <strong>Cancelamento Automático por Inação:</strong> Pedidos não respondidos pelo parceiro em tempo hábil ou com timeout de pagamento são cancelados automaticamente pelo sistema para resguardar o consumidor;
              </li>
              <li>
                <strong>Pagamento na Entrega:</strong> Opção sujeita à elegibilidade da conta e conduta idônea do consumidor. Reclamações fundamentadas de não-pagamento ou recusa injustificada resultarão na revogação do método presencial;
              </li>
              <li>
                <strong>Denúncias de Contaminação:</strong> Todo usuário tem o direito e o dever comunitário de reportar suspeitas de contaminação cruzada ou rotulagem incorreta através da ferramenta nativa de denúncia do app.
              </li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>6. Alterações nos Termos e Legislação Aplicável</h2>
            <p>
              Estes Termos podem ser atualizados periodicamente para refletir evoluções regulatórias ou novos recursos de proteção. Qualquer alteração estrutural será notificada com solicitação de novo aceite do usuário.
            </p>
            <p>
              Estes Termos são regidos pelas leis da República Federativa do Brasil, em especial o Código de Defesa do Consumidor (Lei nº 8.078/1990) e a LGPD (Lei nº 13.709/2018).
            </p>
          </section>

          <footer style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <Link href="/auth/register" style={{ color: 'var(--color-primary, #059669)', fontWeight: 600, textDecoration: 'none' }}>
              ← Voltar ao Cadastro
            </Link>
            <Link href="/privacidade" style={{ color: 'var(--color-primary, #059669)', fontWeight: 600, textDecoration: 'underline' }}>
              Ver Política de Privacidade →
            </Link>
          </footer>
        </article>
      </main>
    </div>
  );
}
