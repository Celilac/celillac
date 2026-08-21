'use client';
// frontend/web-app/src/components/layout/Header.tsx
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { UserAvatar } from '@/components/common/UserAvatar';
import { apiClient, HttpError } from '@/api/client';
import { HomeIcon, DashboardIcon, BuildingIcon, BriefcaseIcon, ShieldIcon, UsersIcon, LogoutIcon, SunIcon, MoonIcon, MenuIcon, CloseIcon } from './icons';

export function Header() {
  const { token, userId, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<{ avatarUrl?: string; fullName?: string; email?: string; role?: string } | null>(null);

  const navLinkClass = (href: string) => `nav-link${pathname === href ? ' is-active' : ''}`;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated && token && userId) {
      apiClient.get<{ avatarUrl?: string; fullName?: string; email?: string; role?: string }>('/iam/me', token)
        .then((res) => setUserInfo(res))
        .catch((err) => {
          setUserInfo(null);
          if (err instanceof HttpError && err.status === 401) {
            logout();
          }
        });
    }
  }, [isAuthenticated, token, userId, logout]);

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
        {menuOpen ? <CloseIcon /> : <MenuIcon />}
      </button>

      <nav
        id="topbar-nav"
        className={`topbar-actions${menuOpen ? ' topbar-actions--open' : ''}`}
      >

        {mounted && isAuthenticated && (
          <Link href="/" className={navLinkClass('/')} id="header-home-btn" onClick={() => setMenuOpen(false)}>
            <HomeIcon /> Início
          </Link>
        )}

        {mounted && isAuthenticated && (
          <Link href="/dashboard" className={navLinkClass('/dashboard')} onClick={() => setMenuOpen(false)}>
            <DashboardIcon /> Dashboard
          </Link>
        )}

        {mounted && isAuthenticated && (
          <Link href="/favorites" className={navLinkClass('/favorites')} onClick={() => setMenuOpen(false)}>
            ❤️ Favoritos
          </Link>
        )}

        <Link href="/public-partners" className={navLinkClass('/public-partners')} onClick={() => setMenuOpen(false)}>
          <BuildingIcon /> Estabelecimentos
        </Link>

        {mounted && isAuthenticated && (userInfo?.role === 'PARCEIRO' || userInfo?.role === 'ADMIN') && (
          <Link href="/partner" className={navLinkClass('/partner')} onClick={() => setMenuOpen(false)}>
            <BriefcaseIcon /> Parceiro
          </Link>
        )}

        {mounted && isAuthenticated && userInfo?.role === 'ADMIN' && (
          <Link href="/admin/partners" className={navLinkClass('/admin/partners')} onClick={() => setMenuOpen(false)}>
            <ShieldIcon /> Moderação
          </Link>
        )}

        {mounted && isAuthenticated && userInfo?.role === 'ADMIN' && (
          <Link href="/admin/reports" className={navLinkClass('/admin/reports')} onClick={() => setMenuOpen(false)}>
            🚨 Denúncias
          </Link>
        )}

        {mounted && isAuthenticated && userInfo?.role === 'ADMIN' && (
          <Link href="/admin/users" className={navLinkClass('/admin/users')} onClick={() => setMenuOpen(false)}>
            <UsersIcon /> Usuários
          </Link>
        )}

        <button
          type="button"
          onClick={toggleTheme}
          className="nav-icon-btn"
          aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        {mounted && isAuthenticated && (
          <Link href="/profile" className={`nav-profile-link${pathname === '/profile' ? ' is-active' : ''}`} id="topbar-profile-link" onClick={() => setMenuOpen(false)}>
            <UserAvatar avatarUrl={userInfo?.avatarUrl} fullName={userInfo?.fullName} email={userInfo?.email} size={28} />
            <span>Perfil</span>
          </Link>
        )}

        {mounted && isAuthenticated && (
          <button
            type="button"
            onClick={() => { setMenuOpen(false); logout().then(() => router.push('/auth/login')); }}
            className="nav-logout-btn"
            id="btn-logout"
          >
            <LogoutIcon /> Sair
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
