'use client';
// frontend/web-app/src/components/layout/Header.tsx
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { UserAvatar } from '@/components/common/UserAvatar';
import { apiClient, HttpError } from '@/api/client';
import { HomeIcon, DashboardIcon, BuildingIcon, BriefcaseIcon, ShieldIcon, UsersIcon, LogoutIcon, SunIcon, MoonIcon, MenuIcon, CloseIcon, BellIcon } from './icons';
import { AdminDrawer } from './AdminDrawer';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationDropdown } from './NotificationDropdown';

export function Header() {
  const { token, userId, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const router = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [adminDrawerOpen, setAdminDrawerOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<{ avatarUrl?: string; fullName?: string; email?: string; role?: string } | null>(null);

  const navRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const navLinkClass = (href: string) => `nav-link${pathname === href ? ' is-active' : ''}`;

  useEffect(() => {
    setMounted(true);
    router.prefetch('/auth/login');
  }, [router]);

  // Fecha o menu móvel e notificações automaticamente ao navegar
  useEffect(() => {
    setMenuOpen(false);
    setNotificationsOpen(false);
  }, [pathname]);

  // Fecha o menu móvel ao clicar fora, redimensionar para desktop ou pressionar ESC
  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        navRef.current &&
        !navRef.current.contains(target) &&
        toggleRef.current &&
        !toggleRef.current.contains(target)
      ) {
        setMenuOpen(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (isAuthenticated && token && userId) {
      apiClient.get<{ avatarUrl?: string; fullName?: string; email?: string; role?: string }>('/iam/me', token)
        .then((res) => setUserInfo(res))
        .catch((err) => {
          setUserInfo(null);
          if (err instanceof HttpError && err.status === 401) {
            logout();
            router.replace('/auth/login');
          }
        });
    }
  }, [isAuthenticated, token, userId, logout, router]);

  return (
    <>
      <header className="topbar">
        <Link href="/" className="topbar-title brand-lockup">
          <Image src="/brand/logo_with_transparent_background.png" alt="CeliLac" width={32} height={32} priority />
          <span className="brand-wordmark">Celi<span>Lac</span></span>
          <span className="brand-tagline">Vivendo bem a vida</span>
        </Link>
        <div className="topbar-mobile-controls">
          <button
            type="button"
            onClick={toggleTheme}
            className="nav-icon-btn topbar-theme-toggle-mobile"
            aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

          <button
            ref={toggleRef}
            type="button"
            className="topbar-nav-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
            aria-controls="topbar-nav"
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>

        <nav
          ref={navRef}
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
            <Link href="/orders" className={navLinkClass('/orders')} onClick={() => setMenuOpen(false)}>
              📦 Meus Pedidos
            </Link>
          )}

          {mounted && isAuthenticated && (
            <Link href="/favorites" className={navLinkClass('/favorites')} onClick={() => setMenuOpen(false)}>
              ❤️ Favoritos
            </Link>
          )}

          <Link href="/public-partners" className={navLinkClass('/public-partners')} onClick={() => setMenuOpen(false)}>
            <BuildingIcon /> Descobrir Locais
          </Link>

          {mounted && isAuthenticated && (userInfo?.role === 'PARCEIRO' || userInfo?.role === 'ADMIN') && (
            <>
              <Link href="/partner" className={navLinkClass('/partner')} onClick={() => setMenuOpen(false)}>
                <BriefcaseIcon /> Meus Estabelecimentos
              </Link>
              <Link
                href="/partner/orders"
                className={navLinkClass('/partner/orders')}
                onClick={() => setMenuOpen(false)}
                id="header-kitchen-orders-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>🍳</span> Pedidos da Cozinha
              </Link>
            </>
          )}

          {mounted && isAuthenticated && userInfo?.role === 'ADMIN' && (
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setAdminDrawerOpen(true);
              }}
              className="nav-link"
              style={{
                cursor: 'pointer',
                background: 'rgba(234, 179, 8, 0.12)',
                color: '#ca8a04',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
              id="header-admin-drawer-trigger"
              aria-label="Abrir painel administrativo"
            >
              <ShieldIcon />
              <span>Painel Admin</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            className="nav-icon-btn topbar-theme-toggle-desktop"
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
            <div className="notification-bell-container">
              <button
                type="button"
                className="nav-icon-btn notification-bell-btn"
                id="btn-notifications"
                onClick={() => setNotificationsOpen((prev) => !prev)}
                aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
                aria-expanded={notificationsOpen}
                title="Notificações"
              >
                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BellIcon />
                  {unreadCount > 0 && (
                    <span className="notification-badge" aria-hidden="true">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className="notification-btn-label">Notificações</span>
              </button>
              <NotificationDropdown
                isOpen={notificationsOpen}
                onClose={() => setNotificationsOpen(false)}
              />
            </div>
          )}

          {mounted && isAuthenticated && (
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                logout();
                router.replace('/auth/login');
              }}
              className="nav-logout-btn"
              id="btn-logout"
            >
              <LogoutIcon /> Sair
            </button>
          )}

          {/* Prefetch oculto garantindo que o payload de login esteja sempre em cache */}
          {mounted && isAuthenticated && (
            <Link href="/auth/login" prefetch={true} style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />
          )}

          {mounted && !isAuthenticated && (
            pathname === '/auth/login' ? (
              <Link href="/auth/register" className="btn btn-em" onClick={() => setMenuOpen(false)}>
                Criar Conta
              </Link>
            ) : (
              <Link href="/auth/login" className="btn btn-em" onClick={() => setMenuOpen(false)}>
                Entrar
              </Link>
            )
          )}
        </nav>
      </header>

      {mounted && menuOpen && (
        <div
          className="topbar-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {mounted && userInfo?.role === 'ADMIN' && (
        <AdminDrawer
          isOpen={adminDrawerOpen}
          onClose={() => setAdminDrawerOpen(false)}
        />
      )}
    </>
  );
}
