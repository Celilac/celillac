'use client';
// frontend/web-app/src/components/layout/Header.tsx
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { UserAvatar } from '@/components/common/UserAvatar';
import { apiClient } from '@/api/client';

export function Header() {
  const { token, userId, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<{ avatarUrl?: string; fullName?: string; email?: string; role?: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated && token && userId) {
      apiClient.get<{ avatarUrl?: string; fullName?: string; email?: string; role?: string }>('/iam/me', token)
        .then((res) => setUserInfo(res))
        .catch(() => setUserInfo(null));
    }
  }, [isAuthenticated, token, userId]);

  return (
    <header className="topbar">
      <Link href="/" className="topbar-title brand-lockup">
        <Image src="/brand/logo_with_transparent_background.png" alt="CeliLac" width={32} height={32} priority />
        <span className="brand-wordmark">Celi<span>Lac</span></span>
        <span className="brand-tagline">Vivendo bem a vida</span>
      </Link>
      <button
        type="button"
        className="topbar-nav-toggle"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={menuOpen}
        aria-controls="topbar-nav"
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      <nav
        id="topbar-nav"
        className={`topbar-actions${menuOpen ? ' topbar-actions--open' : ''}`}
      >
        <button type="button" onClick={toggleTheme} className="btn btn-ghost theme-button" aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {mounted && isAuthenticated && (
          <Link href="/" className="btn btn-ghost home-button" id="header-home-btn" onClick={() => setMenuOpen(false)}>
            🏠 Início
          </Link>
        )}

        {mounted && isAuthenticated && (
          <Link href="/dashboard" className="btn btn-ghost" onClick={() => setMenuOpen(false)}>
            📊 Dashboard
          </Link>
        )}

        <Link href="/public-partners" className="btn btn-ghost" onClick={() => setMenuOpen(false)}>
          🏢 Estabelecimentos
        </Link>

        {mounted && isAuthenticated && (userInfo?.role === 'PARCEIRO' || userInfo?.role === 'ADMIN') && (
          <Link href="/partner" className="btn btn-ghost" onClick={() => setMenuOpen(false)}>
            💼 Parceiro
          </Link>
        )}

        {mounted && isAuthenticated && userInfo?.role === 'ADMIN' && (
          <Link href="/admin/partners" className="btn btn-ghost" onClick={() => setMenuOpen(false)}>
            🛡️ Moderação
          </Link>
        )}

        {mounted && isAuthenticated && userInfo?.role === 'ADMIN' && (
          <Link href="/admin/users" className="btn btn-ghost" onClick={() => setMenuOpen(false)}>
            👥 Usuários
          </Link>
        )}

        {mounted && isAuthenticated && (
          <Link href="/profile" className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} id="topbar-profile-link" onClick={() => setMenuOpen(false)}>
            <UserAvatar avatarUrl={userInfo?.avatarUrl} fullName={userInfo?.fullName} email={userInfo?.email} size={30} />
            <span>Perfil</span>
          </Link>
        )}

        {mounted && isAuthenticated && (
          <button
            onClick={() => { setMenuOpen(false); logout().then(() => router.push('/auth/login')); }}
            className="btn btn-ghost"
            style={{ border: 'none', background: 'none', cursor: 'pointer' }}
            id="btn-logout"
          >
            🚪 Sair
          </button>
        )}

        {mounted && !isAuthenticated && (
          <Link href="/auth/login" className="btn btn-em" onClick={() => setMenuOpen(false)}>
            Entrar
          </Link>
        )}
      </nav>
    </header>
  );
}
