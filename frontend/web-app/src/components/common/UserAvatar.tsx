'use client';
// frontend/web-app/src/components/common/UserAvatar.tsx
import { useState, useEffect } from 'react';
import { UserIcon } from '@/components/layout/icons';

interface UserAvatarProps {
  avatarUrl?: string;
  fullName?: string;
  email?: string;
  size?: number;
}

export function UserAvatar({ avatarUrl, fullName, email, size = 36 }: UserAvatarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Gera as iniciais do nome como fallback simbólico
  const getInitials = (): string | null => {
    if (fullName && fullName.trim()) {
      const parts = fullName.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0][0].toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return null;
  };

  const initials = getInitials();

  if (!mounted) {
    return (
      <span
        suppressHydrationWarning
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-emerald, #10b981) 0%, #059669 100%)',
          color: '#ffffff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: size * 0.4,
          border: '2px solid var(--color-emerald-light, #34d399)',
          flexShrink: 0,
          userSelect: 'none',
          verticalAlign: 'middle',
        }}
      >
        <UserIcon size={Math.round(size * 0.55)} style={{ color: '#ffffff' }} />
      </span>
    );
  }

  if (avatarUrl && avatarUrl.trim()) {
    return (
      <span
        suppressHydrationWarning
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid var(--color-emerald-light, #34d399)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          flexShrink: 0,
          verticalAlign: 'middle',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt={fullName || 'Avatar do usuário'}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </span>
    );
  }

  return (
    <span
      suppressHydrationWarning
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--color-emerald, #10b981) 0%, #059669 100%)',
        color: '#ffffff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: size * 0.4,
        border: '2px solid var(--color-emerald-light, #34d399)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        flexShrink: 0,
        userSelect: 'none',
        verticalAlign: 'middle',
      }}
      title={fullName || email || 'Usuário'}
    >
      {initials ? initials : <UserIcon size={Math.round(size * 0.55)} style={{ color: '#ffffff' }} />}
    </span>
  );
}
