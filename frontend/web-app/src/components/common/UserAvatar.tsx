'use client';
// frontend/web-app/src/components/common/UserAvatar.tsx
import Image from 'next/image';

interface UserAvatarProps {
  avatarUrl?: string;
  fullName?: string;
  email?: string;
  size?: number;
}

export function UserAvatar({ avatarUrl, fullName, email, size = 36 }: UserAvatarProps) {
  // Gera as iniciais do nome como fallback simbólico
  const getInitials = () => {
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
    return '👤';
  };

  const initials = getInitials();

  if (avatarUrl && avatarUrl.trim()) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          position: 'relative',
          border: '2px solid var(--color-emerald, #10b981)',
          flexShrink: 0,
        }}
      >
        <img
          src={avatarUrl}
          alt={fullName || 'Avatar do usuário'}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            // Oculta imagem quebrada e exibe fallback simbólico
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--color-emerald, #10b981) 0%, #059669 100%)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: size * 0.4,
        border: '2px solid var(--color-emerald-light, #34d399)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        flexShrink: 0,
        userSelect: 'none',
      }}
      title={fullName || email || 'Usuário'}
    >
      {initials}
    </div>
  );
}
