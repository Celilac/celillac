// frontend/web-app/src/components/layout/icons.tsx
// Ícones de navegação e componentes — traço único (stroke), mesmo peso e viewBox,
// substituindo os emojis heterogêneos de SO por vetores SVG nítidos e acessíveis.
import React from 'react';

export interface IconProps {
  className?: string;
  size?: number | string;
  color?: string;
  style?: React.CSSProperties;
}

const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function HomeIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v10H10v-6h4v6h4.5V10" />
    </svg>
  );
}

export function DashboardIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function BuildingIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M4 8.5 6 4h12l2 4.5" />
      <rect x="4" y="8.5" width="16" height="11.5" rx="1" />
      <line x1="9" y1="20" x2="9" y2="13.5" />
      <line x1="15" y1="20" x2="15" y2="13.5" />
    </svg>
  );
}

export function BriefcaseIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7" />
      <line x1="3" y1="12.5" x2="21" y2="12.5" />
    </svg>
  );
}

export function ShieldIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M12 3.5 19 6v5.5c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-2.5z" />
    </svg>
  );
}

export function ShieldCheckIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

export function UsersIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6" />
      <circle cx="17" cy="9" r="2.3" />
      <path d="M15.2 20c.3-2.4 1.9-4.4 3.8-5" />
    </svg>
  );
}

export function UserIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function LogoutIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M9.5 4H6.5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
      <path d="M15 16l4-4-4-4" />
      <line x1="19" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export function SunIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.2 12H2M22 12h-2.2M5.3 5.3l1.5 1.5M17.2 17.2l1.5 1.5M5.3 18.7l1.5-1.5M17.2 6.8l1.5-1.5" />
    </svg>
  );
}

export function MoonIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

export function MenuIcon({ className, size = 20, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}

export function CloseIcon({ className, size = 20, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  );
}

export function BellIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export function TrashIcon({ className, size = 16, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

export function PackageIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M16.5 9.4 7.55 4.24" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" y1="22" x2="12" y2="12" />
    </svg>
  );
}

export interface HeartIconProps extends IconProps {
  filled?: boolean;
}

export function HeartIcon({ className, size = 18, style, filled = false }: HeartIconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

export function ChefHatIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M6 13.8a4 4 0 0 1-2-3.8 4 4 0 0 1 4-4 4 4 0 0 1 4 2 4 4 0 0 1 4-2 4 4 0 0 1 4 4 4 4 0 0 1-2 3.8" />
      <path d="M6 17h12" />
      <path d="M6 21h12" />
      <path d="M6 14v7" />
      <path d="M18 14v7" />
    </svg>
  );
}

export function ClockIcon({ className, size = 18, color, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ ...(color ? { color } : {}), ...style }} {...strokeProps}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function CheckCircleIcon({ className, size = 18, color, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ ...(color ? { color } : {}), ...style }} {...strokeProps}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

export function XCircleIcon({ className, size = 18, color, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ ...(color ? { color } : {}), ...style }} {...strokeProps}>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

export function FireIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" />
    </svg>
  );
}

export function BikeIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <circle cx="18.5" cy="17.5" r="3.5" />
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="15" cy="5" r="1" />
      <path d="M12 17.5V14l-3-3 4-3 2 3h2" />
    </svg>
  );
}

export function FinishFlagIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

export function SparklesIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    </svg>
  );
}

export function SearchIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function EyeIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function EditIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

export function RefreshIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
    </svg>
  );
}

export function PlusIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function CameraIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

export function MapPinIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function PhoneIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export function StoreIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

export function UtensilsIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2" />
      <path d="M15 2v20" />
      <path d="M4 2v4a3 3 0 0 0 3 3h1a3 3 0 0 0 3-3V2" />
      <path d="M7 9v13" />
    </svg>
  );
}

export function ShoppingCartIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

export interface StarIconProps extends IconProps {
  filled?: boolean;
}

export function StarIcon({ className, size = 16, style, filled = false }: StarIconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function GlobeIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export function LockIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function CreditCardIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

export function PixIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="m13 2-8 12h6l-2 8 10-13h-6l2-7Z" />
    </svg>
  );
}

export function BanknoteIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  );
}

export function ScaleIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="M7 21h10M12 3v18M3 7h18" />
    </svg>
  );
}

export function FlagIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

export function AlertTriangleIcon({ className, size = 18, color, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ ...(color ? { color } : {}), ...style }} {...strokeProps}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function InfoIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

export function TagIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

export function MedalIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}

export function FileTextIcon({ className, size = 18, color, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ ...(color ? { color } : {}), ...style }} {...strokeProps}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

export function ExternalLinkIcon({ className, size = 14, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

export function CompassIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

export function ArrowLeftIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

export function ArrowRightIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export function MailIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

export function WheatIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M2 22 16 8" />
      <path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />
      <path d="M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />
      <path d="M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />
      <path d="M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z" />
    </svg>
  );
}

export function MilkIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M8 2h8v3H8z" />
      <path d="M8 5 6 9v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9l-2-4" />
      <line x1="6" y1="13" x2="18" y2="13" />
    </svg>
  );
}

export function LeafIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

export function NutIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M12 2C6.5 2 2 6.5 2 12c0 4.5 4 8 10 10 6 0 10-3.5 10-8 0-5.5-4.5-12-10-14z" />
      <path d="M12 2v20" />
    </svg>
  );
}

export function EggIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M12 22c4.97 0 9-4.03 9-9 0-5.5-4.03-11-9-11S3 7.5 3 13c0 4.97 4.03 9 9 9z" />
    </svg>
  );
}

export function FishIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.46-3.44 6-7 6s-7.56-2.54-8.5-6Z" />
      <path d="M18 12c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2Z" />
      <path d="M2 16l4.5-4L2 8" />
    </svg>
  );
}

export function ShellfishIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M12 3a9 9 0 0 0-9 9c0 4 3 7 9 9 6 0 9-5 9-9a9 9 0 0 0-9-9Z" />
      <path d="M12 3v18" />
      <path d="M3 12h18" />
    </svg>
  );
}

export function FlaskIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M10 2v7.5L4.5 18a2 2 0 0 0 1.5 3h12a2 2 0 0 0 1.5-3L14 9.5V2" />
      <path d="M8.5 2h7" />
      <path d="M7 16h10" />
    </svg>
  );
}

export function ChartBarIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

export function BowlIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M3 11a9 9 0 0 0 18 0H3z" />
      <path d="M8 20h8" />
    </svg>
  );
}

export function CookieIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5Z" />
      <path d="M8.5 8.5v.01" />
      <path d="M11.5 15.5v.01" />
      <path d="M8.5 15.5v.01" />
      <path d="M15.5 11.5v.01" />
    </svg>
  );
}

export function DownloadIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export function LinkIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export function SaveIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

export function MessageSquareIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export interface StatusDotProps {
  color?: 'green' | 'yellow' | 'orange' | 'red' | 'gray' | 'purple' | 'blue' | string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function StatusDot({ color = 'green', size = 8, className, style }: StatusDotProps) {
  const colorMap: Record<string, string> = {
    green: 'var(--color-emerald, #10b981)',
    yellow: 'var(--color-warning, #f59e0b)',
    orange: 'var(--color-danger, #f97316)',
    red: 'var(--color-blocked, #ef4444)',
    gray: 'var(--color-text-muted, #94a3b8)',
    purple: 'var(--color-status-suspended, #a855f7)',
    blue: '#3b82f6',
  };
  const fillColor = colorMap[color] || color;

  return (
    <span
      className={className}
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: fillColor,
        flexShrink: 0,
        boxShadow: `0 0 0 2px ${fillColor}22`,
        verticalAlign: 'middle',
        ...style,
      }}
    />
  );
}

export function RocketIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4.5c1.62-1.63 5-2.5 5-2.5" />
      <path d="M12 15v5s3.03-.55 4.5-2c1.63-1.62 2.5-5 2.5-5" />
    </svg>
  );
}

export function CrownIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
      <path d="M5 20h14" />
    </svg>
  );
}

export function KeyIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <circle cx="7.5" cy="15.5" r="4.5" />
      <path d="m11 12 9-9" />
      <path d="m17 3 3 3" />
      <path d="m14 6 3 3" />
    </svg>
  );
}

export function PinIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <line x1="12" y1="17" x2="12" y2="22" />
      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.89A4 4 0 0 1 14 9V4H10v5a4 4 0 0 1-2.11 3.56l-1.78.89A2 2 0 0 0 5 15.24Z" />
    </svg>
  );
}

export function UserXIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="18" y1="8" x2="23" y2="13" />
      <line x1="23" y1="8" x2="18" y2="13" />
    </svg>
  );
}

export function SendIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

export function TruckIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

export function HashIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  );
}

export function CalendarIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function BanIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  );
}

export function ScrollIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="M19 17V5a2 2 0 0 0-2-2H4" />
      <path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4" />
      <line x1="19" y1="17" x2="10" y2="17" />
    </svg>
  );
}

export function ChevronDownIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function AwardIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <circle cx="12" cy="8" r="6" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  );
}

export function CheckIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function ClipboardListIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  );
}

export function RefreshCwIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

export function FilterIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

export function SlidersIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

export function ArrowUpDownIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <path d="m7 15 5 5 5-5" />
      <path d="m7 9 5-5 5 5" />
    </svg>
  );
}

export function XIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style} {...strokeProps}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}


