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
      <span className="topbar-title brand-lockup" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
        <Image src="/brand/logo_with_transparent_background.png" alt="CeliLac" width={32} height={32} priority />
        <span className="brand-wordmark">Celi<span>Lac</span></span>
        <span className="brand-tagline">Vivendo bem a vida</span>
      </span>
      <nav className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button type="button" onClick={toggleTheme} className="btn btn-ghost theme-button" aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {mounted && isAuthenticated && (
          <Link href="/dashboard" className="btn btn-ghost" style={{ padding: '0.4rem 1rem' }}>
            📊 Dashboard
          </Link>
        )}

        <Link href="/public-partners" className="btn btn-ghost" style={{ padding: '0.4rem 1rem' }}>
          🏢 Estabelecimentos
        </Link>

        {mounted && isAuthenticated && (userInfo?.role === 'PARCEIRO' || userInfo?.role === 'ADMIN') && (
          <Link href="/partner" className="btn btn-ghost" style={{ padding: '0.4rem 1rem' }}>
            💼 Parceiro
          </Link>
        )}

        {mounted && isAuthenticated && userInfo?.role === 'ADMIN' && (
          <Link href="/admin/partners" className="btn btn-ghost" style={{ padding: '0.4rem 1rem' }}>
            🛡️ Moderação
          </Link>
        )}

        {mounted && isAuthenticated && userInfo?.role === 'ADMIN' && (
          <Link href="/admin/users" className="btn btn-ghost" style={{ padding: '0.4rem 1rem' }}>
            👥 Usuários
          </Link>
        )}

        {mounted && isAuthenticated && (
          <Link href="/profile" className="btn btn-ghost" style={{ padding: '0.3rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} id="topbar-profile-link">
            <UserAvatar avatarUrl={userInfo?.avatarUrl} fullName={userInfo?.fullName} email={userInfo?.email} size={30} />
            <span>Perfil</span>
          </Link>
        )}

        {mounted && isAuthenticated && (
          <button onClick={() => logout().then(() => router.push('/auth/login'))} className="btn btn-ghost" style={{ padding: '0.4rem 1rem', border: 'none', background: 'none', cursor: 'pointer' }} id="btn-logout">
            🚪 Sair
          </button>
        )}

        {mounted && !isAuthenticated && (
          <Link href="/auth/login" className="btn btn-em" style={{ padding: '0.4rem 1rem' }}>
            Entrar
          </Link>
        )}
      </nav>
    </header>
  );
}
