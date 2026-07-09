// frontend/web-app/src/components/toast/types.ts
// Augmenta os tipos do notistack para aceitar as props extras do AppSnackbarContent
// (title, actionLabel, onAction) em todas as variantes, com segurança de tipos no enqueueSnackbar.
import 'notistack';

// Precisa ser `type` (não `interface`): o notistack testa
// `VariantOverrides[variant] extends Record<string, unknown>` para validar a variante, e apenas
// aliases de tipo literal recebem a index signature implícita necessária para passar nesse teste.
export type AppSnackbarExtraProps = {
  title?: string;
  actionLabel?: string;
  onAction?: () => void;
};

declare module 'notistack' {
  interface VariantOverrides {
    default: AppSnackbarExtraProps;
    success: AppSnackbarExtraProps;
    error: AppSnackbarExtraProps;
    warning: AppSnackbarExtraProps;
    info: AppSnackbarExtraProps;
  }
}
