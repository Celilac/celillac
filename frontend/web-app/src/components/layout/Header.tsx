'use client';
// frontend/web-app/src/components/layout/Header.tsx
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Header — Cabeçalho unificado de navegação global.
 * Centraliza os botões de controle de tema, navegação interna (Estabelecimentos, Parceiro, Moderação, Perfil) e Logout.
 */
export function Header() {
  const { isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  return (
    <header className="topbar">
      <span className="topbar-title brand-lockup" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
        <Image src="/brand/logo_with_transparent_background.png" alt="CeliLac" width={32} height={32} priority />
        <span className="brand-wordmark">Celi<span>Lac</span></span>
        <span className="brand-tagline">Vivendo bem a vida</span>
      </span>
      <nav className="topbar-actions">
        {isAuthenticated && (
          <Link href="/" className="btn btn-ghost home-button" id="header-home-btn">
            🏠 Início
          </Link>
        )}

        <button type="button" onClick={toggleTheme} className="btn btn-ghost theme-button" aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        <Link href="/public-partners" className="btn btn-ghost" style={{ padding: '0.4rem 1rem' }}>
          🏢 Estabelecimentos
        </Link>
        
        {isAuthenticated && (
          <Link href="/partner" className="btn btn-ghost" style={{ padding: '0.4rem 1rem' }}>
            💼 Parceiro
          </Link>
        )}
        
        {isAuthenticated && (
          <Link href="/admin/partners" className="btn btn-ghost" style={{ padding: '0.4rem 1rem' }}>
            🛡️ Moderação
          </Link>
        )}
        
        {isAuthenticated && (
          <Link href="/profile" className="btn btn-ghost" style={{ padding: '0.4rem 1rem' }}>
            ⚙️ Perfil
          </Link>
        )}
        
        {isAuthenticated && (
          <button onClick={() => logout().then(() => router.push('/auth/login'))} className="btn btn-ghost" style={{ padding: '0.4rem 1rem', border: 'none', background: 'none', cursor: 'pointer' }} id="btn-logout">
            🚪 Sair
          </button>
        )}
        
        {!isAuthenticated && (
          <Link href="/auth/login" className="btn btn-em" style={{ padding: '0.4rem 1rem' }}>
            Entrar
          </Link>
        )}
      </nav>
    </header>
  );
}
