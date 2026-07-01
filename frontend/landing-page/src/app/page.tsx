// frontend/landing-page/src/app/page.tsx
// Landing Page CeLiLac — SEO + Conversão
// ⚠️ REGRA FUNDAMENTAL (FRONTEND_STRATEGY.md):
//    Esta página NÃO faz chamadas de API.
//    NÃO importa lógica do AllergenEngine.
//    Toda verificação de compatibilidade é feita EXCLUSIVAMENTE pelo Backend.

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CeLiLac — Segurança Alimentar para Celíacos',
  description: 'Plataforma de verificação de alérgenos para celíacos. Configure seu perfil e verifique qualquer produto em segundos.',
};

// URL da aplicação principal — injetada via env ou fallback de desenvolvimento
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001';

export default function LandingPage() {
  return (
    <>
      {/* ── NAVBAR ── */}
      <nav className="navbar" aria-label="Navegação principal">
        <div className="container navbar-inner">
          <span className="navbar-logo">Celi<span>Lac</span></span>
          <a href={`${APP_URL}/auth/register`} className="navbar-cta" id="navbar-cta-register">
            Criar conta grátis →
          </a>
        </div>
      </nav>

      <main>
        {/* ── HERO ── */}
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-bg" aria-hidden="true" />
          <div className="hero-grid" aria-hidden="true" />
          <div className="container hero-content">
            <div className="hero-badge" role="note">
              🛡️ Motor de Alérgenos com Detecção de Traços
            </div>

            <h1 id="hero-title" className="hero-title">
              Coma com{' '}
              <span className="highlight">segurança</span>.
              <br />
              Sem surpresas.
            </h1>

            <p className="hero-subtitle">
              A primeira plataforma que detecta alérgenos em produtos — incluindo
              <strong> traços de contaminação cruzada</strong> — e avisa antes de você consumir.
              Desenvolvida especialmente para celíacos e pessoas com restrições alimentares.
            </p>

            <div className="hero-actions">
              <a href={`${APP_URL}/auth/register`} className="btn-primary" id="hero-cta-primary">
                ✨ Começar gratuitamente
              </a>
              <a href="#como-funciona" className="btn-secondary" id="hero-cta-learn">
                Ver como funciona
              </a>
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <div className="stats-bar" aria-label="Estatísticas da plataforma">
          <div className="container stats-grid">
            <div>
              <div className="stat-value">9+</div>
              <div className="stat-label">Tipos de alérgenos monitorados</div>
            </div>
            <div>
              <div className="stat-value">4</div>
              <div className="stat-label">Níveis de risco classificados</div>
            </div>
            <div>
              <div className="stat-value">100%</div>
              <div className="stat-label">Gratuito para celíacos</div>
            </div>
            <div>
              <div className="stat-value">⚡</div>
              <div className="stat-label">Verificação em tempo real</div>
            </div>
          </div>
        </div>

        {/* ── COMO FUNCIONA ── */}
        <section className="section" id="como-funciona" aria-labelledby="how-title">
          <div className="container">
            <p className="section-label">Como funciona</p>
            <h2 id="how-title" className="section-title">3 passos para comer com segurança</h2>
            <p className="section-subtitle">
              Configure uma vez, verifique sempre. Seu perfil alimentar é o coração do sistema.
            </p>

            <div className="steps-grid">
              <article className="step-card">
                <div className="step-number">1</div>
                <h3 className="step-title">Crie sua conta</h3>
                <p className="step-desc">
                  Cadastre-se em menos de 1 minuto. Seus dados são protegidos e nunca
                  compartilhados com terceiros.
                </p>
              </article>

              <article className="step-card">
                <div className="step-number">2</div>
                <h3 className="step-title">Configure seu perfil alimentar</h3>
                <p className="step-desc">
                  Defina seus alérgenos e o nível de severidade de cada um: de LOW (baixo) a
                  FATAL (Celíaco). O sistema respeitará cada configuração.
                </p>
              </article>

              <article className="step-card">
                <div className="step-number">3</div>
                <h3 className="step-title">Verifique qualquer produto</h3>
                <p className="step-desc">
                  Nosso motor analisa ingredientes <em>e traços de contaminação cruzada</em>,
                  retornando um relatório claro de compatibilidade.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* ── SEGURANÇA ── */}
        <section className="security-section" id="seguranca" aria-labelledby="security-title">
          <div className="container security-inner">
            <div>
              <p className="section-label">Segurança alimentar</p>
              <h2 id="security-title" className="section-title">
                4 níveis de risco.<br />Zero ambiguidade.
              </h2>
              <p className="section-subtitle">
                Nosso motor classifica cada produto em um dos 4 níveis de risco. Para celíacos,
                qualquer traço de glúten — mesmo em contaminação cruzada — é automaticamente
                classificado como <strong style={{ color: '#FCA5A5' }}>BLOQUEADO</strong>.
              </p>
            </div>

            <div className="risk-demo" aria-label="Exemplos de níveis de risco">
              <div className="risk-item blocked" style={{ animationDelay: '0s' }}>
                <span className="risk-icon">⛔</span>
                <div>
                  <strong>BLOQUEADO</strong> — Celíaco + produto com glúten ou traços
                </div>
              </div>
              <div className="risk-item danger" style={{ animationDelay: '0.1s' }}>
                <span className="risk-icon">⚠️</span>
                <div>
                  <strong>PERIGO</strong> — Alérgeno de alta severidade detectado
                </div>
              </div>
              <div className="risk-item warning" style={{ animationDelay: '0.2s' }}>
                <span className="risk-icon">🟡</span>
                <div>
                  <strong>ATENÇÃO</strong> — Alérgeno de severidade média/baixa
                </div>
              </div>
              <div className="risk-item safe" style={{ animationDelay: '0.3s' }}>
                <span className="risk-icon">✅</span>
                <div>
                  <strong>SEGURO</strong> — Nenhum alérgeno do seu perfil encontrado
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section className="cta-section" aria-labelledby="cta-title">
          <div className="container cta-content">
            <h2 id="cta-title" className="cta-title">
              Pronto para comer<br />sem medo?
            </h2>
            <p className="cta-subtitle">
              Crie sua conta agora. É gratuito para sempre para celíacos.
            </p>
            <a href={`${APP_URL}/auth/register`} className="btn-primary" id="footer-cta-register">
              🚀 Criar minha conta agora
            </a>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="footer" aria-label="Rodapé">
        <div className="container footer-inner">
          <span className="footer-logo">Celi<span>Lac</span></span>
          <p className="footer-copy">
            © {new Date().getFullYear()} CeLiLac. Desenvolvido com ❤️ para a comunidade celíaca.
          </p>
        </div>
      </footer>
    </>
  );
}
