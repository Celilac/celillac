'use client';
// frontend/web-app/src/components/toast/CustomSnackbarProvider.tsx
// Provider global de toasts — monta uma única vez no bootstrap da aplicação (ver layout.tsx).
import { useRef, useCallback } from 'react';
import { SnackbarProvider } from 'notistack';
import { AppSnackbarContent } from './AppSnackbarContent';
import { CloseIcon } from './icons';
import './types';

export function CustomSnackbarProvider({ children }: { children: React.ReactNode }) {
  const providerRef = useRef<SnackbarProvider>(null);

  const handleDismiss = useCallback(
    (key: string | number) => () => providerRef.current?.closeSnackbar(key),
    [],
  );

  return (
    <SnackbarProvider
      ref={providerRef}
      maxSnack={3}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      autoHideDuration={5000}
      preventDuplicate
      action={(key) => (
        <button
          type="button"
          onClick={handleDismiss(key)}
          aria-label="Fechar notificação"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 0,
            borderRadius: '9999px',
            background: 'transparent',
            color: 'inherit',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <CloseIcon />
        </button>
      )}
      Components={{
        default: AppSnackbarContent,
        success: AppSnackbarContent,
        error: AppSnackbarContent,
        warning: AppSnackbarContent,
        info: AppSnackbarContent,
      }}
    >
      {children}
    </SnackbarProvider>
  );
}
