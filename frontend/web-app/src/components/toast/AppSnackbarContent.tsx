'use client';
// frontend/web-app/src/components/toast/AppSnackbarContent.tsx
// Conteúdo customizado para TODAS as variantes de toast (success/error/warning/info/default).
// Bloco lateral colorido (identidade da variante) + card com fundo neutro do tema.
import { forwardRef, useCallback } from 'react';
import { SnackbarContent, useSnackbar, type CustomContentProps } from 'notistack';
import { CheckCircleIcon, ErrorIcon, WarningAmberIcon, InfoIcon, CloseIcon } from './icons';
import type { AppSnackbarExtraProps } from './types';
import styles from './AppSnackbarContent.module.css';

type AppSnackbarContentProps = CustomContentProps & AppSnackbarExtraProps;

const VARIANT_CONFIG = {
  success: { icon: CheckCircleIcon, className: styles.success },
  error:   { icon: ErrorIcon,       className: styles.error },
  warning: { icon: WarningAmberIcon, className: styles.warning },
  info:    { icon: InfoIcon,       className: styles.info },
  default: { icon: InfoIcon,       className: styles.info },
} as const;

export const AppSnackbarContent = forwardRef<HTMLDivElement, AppSnackbarContentProps>(
  ({ id, message, variant, title, actionLabel, onAction }, ref) => {
    const { closeSnackbar } = useSnackbar();
    const config = VARIANT_CONFIG[variant as keyof typeof VARIANT_CONFIG] ?? VARIANT_CONFIG.default;
    const Icon = config.icon;

    const handleClose = useCallback(() => closeSnackbar(id), [closeSnackbar, id]);

    const handleAction = useCallback(() => {
      onAction?.();
      closeSnackbar(id);
    }, [onAction, closeSnackbar, id]);

    return (
      <SnackbarContent ref={ref} role="alert" className={styles.wrapper}>
        <div className={`${styles.card} ${config.className}`}>
          <div className={styles.iconBlock}>
            <Icon />
          </div>
          <div className={styles.body}>
            <button
              type="button"
              className={styles.closeButton}
              onClick={handleClose}
              aria-label="Fechar notificação"
            >
              <CloseIcon />
            </button>
            {title && <p className={styles.title}>{title}</p>}
            <p className={styles.message}>{message}</p>
            {actionLabel && (
              <button type="button" className={styles.actionButton} onClick={handleAction}>
                {actionLabel}
              </button>
            )}
          </div>
        </div>
      </SnackbarContent>
    );
  },
);

AppSnackbarContent.displayName = 'AppSnackbarContent';
