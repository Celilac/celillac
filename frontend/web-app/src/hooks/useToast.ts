'use client';
// frontend/web-app/src/hooks/useToast.ts
//
// ⚠️ REGRA: única porta de entrada para notificações no frontend.
// Componentes de feature nunca devem chamar `notistack` (enqueueSnackbar/useSnackbar)
// diretamente — sempre passar por este hook.
import { useCallback, useMemo, type ReactNode } from 'react';
import { useSnackbar, type VariantType, type SnackbarKey } from 'notistack';
import '@/components/toast/types';

// `enqueueSnackbar` é genérico por variante, para tipar as extra-props no call-site
// (`toast.success(...)`, etc). Internamente este hook decide a variante em tempo de
// execução, então lida com uma assinatura simplificada e não genérica.
type EnqueueToast = (message: string, options: Record<string, unknown>) => SnackbarKey;

export interface ToastOptions {
  title?: string;
  description: string | ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  persist?: boolean;
  autoHideDuration?: number;
}

type ToastInput = string | ToastOptions;

function normalize(input: ToastInput, fallbackTitle?: string): ToastOptions {
  if (typeof input === 'string') {
    return { description: input, title: fallbackTitle };
  }
  return input;
}

export function useToast() {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const enqueue = enqueueSnackbar as unknown as EnqueueToast;

  const showToast = useCallback(
    (variant: VariantType, options: ToastOptions) => {
      const { description, title, actionLabel, onAction, persist, autoHideDuration } = options;
      return enqueue(description as string, {
        variant,
        title,
        actionLabel,
        onAction,
        persist,
        autoHideDuration,
      });
    },
    [enqueue],
  );

  return useMemo(
    () => ({
      success: (msg: ToastInput, title?: string) => showToast('success', normalize(msg, title)),
      error: (msg: ToastInput, title?: string) => showToast('error', normalize(msg, title)),
      warning: (msg: ToastInput, title?: string) => showToast('warning', normalize(msg, title)),
      info: (msg: ToastInput, title?: string) => showToast('info', normalize(msg, title)),
      message: (msg: string, variant: VariantType = 'default') => showToast(variant, { description: msg }),
      dismiss: (key?: string | number) => closeSnackbar(key),
    }),
    [showToast, closeSnackbar],
  );
}
