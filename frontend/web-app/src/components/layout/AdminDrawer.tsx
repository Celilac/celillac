'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CloseIcon, ShieldIcon, UsersIcon, BriefcaseIcon } from './icons';
import styles from './AdminDrawer.module.css';

interface AdminDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AdminNavItem {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

export const AdminDrawer: React.FC<AdminDrawerProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();

  // Fecha o drawer com a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const moderationItems: AdminNavItem[] = [
    {
      href: '/admin/partners',
      label: 'Moderação de Estabelecimentos',
      description: 'Aprovação, rejeição e auditoria de parceiros comerciais',
      icon: <ShieldIcon />,
    },
    {
      href: '/admin/categories',
      label: 'Categorias de Produtos',
      description: 'Taxonomia e organização de itens do catálogo',
      icon: <span>🏷️</span>,
    },
    {
      href: '/admin/certifications',
      label: 'Selos & Laudos Laboratoriais',
      description: 'Validação oficial de conformidade e segurança alimentar',
      icon: <span>🏅</span>,
    },
  ];

  const safetyItems: AdminNavItem[] = [
    {
      href: '/admin/reports',
      label: 'Denúncias & Contaminação',
      description: 'Gestão de alertas de risco alimentar reportados',
      icon: <span>🚨</span>,
    },
    {
      href: '/admin/users',
      label: 'Gestão de Usuários',
      description: 'Controle de contas, papéis e permissões da plataforma',
      icon: <UsersIcon />,
    },
  ];

  const operationItems: AdminNavItem[] = [
    {
      href: '/partner',
      label: 'Meus Estabelecimentos',
      description: 'Cadastrar e gerenciar seus próprios locais e vitrines de teste',
      icon: <BriefcaseIcon />,
    },
  ];

  return (
    <div
      className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ''}`}
      onClick={onClose}
      aria-hidden={!isOpen}
    >
      <div
        className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-drawer-title"
      >
        {/* Header do Drawer */}
        <div className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerIcon}>
              <ShieldIcon />
            </div>
            <div>
              <h3 id="admin-drawer-title" className={styles.title}>
                Painel Administrativo
              </h3>
              <span className={styles.badge}>ADMIN</span>
            </div>
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Fechar painel de administração"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Conteúdo com Seções */}
        <div className={styles.content}>
          <div className={styles.section}>
            <h4 className={styles.sectionHeading}>Curadoria & Catálogo</h4>
            {moderationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                  onClick={onClose}
                >
                  <div className={styles.itemIcon}>{item.icon}</div>
                  <div className={styles.itemText}>
                    <span className={styles.itemLabel}>{item.label}</span>
                    <span className={styles.itemDescription}>{item.description}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className={styles.section}>
            <h4 className={styles.sectionHeading}>Segurança & Auditoria</h4>
            {safetyItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                  onClick={onClose}
                >
                  <div className={styles.itemIcon}>{item.icon}</div>
                  <div className={styles.itemText}>
                    <span className={styles.itemLabel}>{item.label}</span>
                    <span className={styles.itemDescription}>{item.description}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className={styles.section}>
            <h4 className={styles.sectionHeading}>Operação & Testes</h4>
            {operationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                  onClick={onClose}
                >
                  <div className={styles.itemIcon}>{item.icon}</div>
                  <div className={styles.itemText}>
                    <span className={styles.itemLabel}>{item.label}</span>
                    <span className={styles.itemDescription}>{item.description}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Rodapé do Drawer */}
        <div className={styles.footer}>
          <span className={styles.footerNote}>Plataforma CeLiLac • Painel Geral</span>
        </div>
      </div>
    </div>
  );
};
