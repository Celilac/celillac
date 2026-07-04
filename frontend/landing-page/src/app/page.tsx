import styles from './page.module.css';

export default function LandingPage() {
  return (
    <main className={styles.main}>
      <div className={styles.backgroundGlow}></div>

      <header className={styles.header}>
        <div className={styles.logo}>CeLiLac</div>
        <nav className={styles.nav}>
          <a href="#funcionalidades" className={styles.navLink}>Como Funciona</a>
          <a href="#motor" className={styles.navLink}>O Motor</a>
          <a href="http://localhost:3001/dashboard" className={styles.navButton}>Entrar no App</a>
        </nav>
      </header>

      <section className={styles.hero}>
        <h1 className={styles.title}>
          A Segurança Alimentar <br />
          <span className={styles.highlight}>que o Celíaco Merece</span>
        </h1>
        <p className={styles.description}>
          Chega de ler rótulos minúsculos com medo de contaminação cruzada.
          O CeLiLac analisa os ingredientes reais e te dá a resposta em um segundo.
        </p>
        <div className={styles.ctaGroup}>
          <a href="http://localhost:3001/dashboard" className={styles.primaryCta}>Proteger minha saúde agora</a>
          <a href="#funcionalidades" className={styles.secondaryCta}>Entender o motor</a>
        </div>
      </section>

      <section id="funcionalidades" className={styles.features}>
        <h2 className={styles.sectionTitle}>Por que o CeLiLac é diferente?</h2>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🔍</div>
            <h3>Scanner Ultra-Rápido</h3>
            <p>Aponte a câmera para o código de barras no supermercado e saiba instantaneamente se o produto é seguro.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🛡️</div>
            <h3>Regra "FATAL" Implacável</h3>
            <p>Se você tem Doença Celíaca, nosso motor bloqueia sumariamente qualquer produto com "pode conter traços de glúten". Sem falsos positivos.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🧑‍⚕️</div>
            <h3>Perfil Alimentar Único</h3>
            <p>Cadastre intolerâncias a lactose, soja ou oleaginosas simultaneamente. O motor calcula o risco cruzado.</p>
          </div>
        </div>
      </section>

      <section id="motor" className={styles.socialProof}>
        <h2 className={styles.sectionTitle}>Comunidade Segura</h2>
        <div className={styles.testimonialContainer}>
          <div className={styles.testimonial}>
            <p>"Desde o diagnóstico da minha filha, ir ao mercado era um pesadelo de 2 horas. Com o CeLiLac, as compras voltaram a ser tranquilas."</p>
            <span className={styles.author}>— Mariana T., Mãe de Celíaca</span>
          </div>
          <div className={styles.testimonial}>
            <p>"O que mais gosto é que ele entende a contaminação cruzada. Outros apps só leem a palavra 'glúten', o CeLiLac entende 'traços'."</p>
            <span className={styles.author}>— João P., Diagnosticado há 5 anos</span>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} CeLiLac Platform. Protegendo vidas celíacas.</p>
      </footer>
    </main>
  );
}
