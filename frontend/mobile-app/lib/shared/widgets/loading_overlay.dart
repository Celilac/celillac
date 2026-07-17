import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Overlay de tela cheia com spinner + mensagem, usado durante operações
/// assíncronas de auth/perfil (conforme FRONTEND_STRATEGY.md: nunca deixar
/// a interface "congelada" sem feedback visual).
class LoadingOverlay extends StatelessWidget {
  const LoadingOverlay({super.key, this.message});

  final String? message;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black.withValues(alpha: 0.6),
      alignment: Alignment.center,
      child: Container(
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(color: AppColors.primary),
            if (message != null) ...[
              const SizedBox(height: 12),
              Text(
                message!,
                style: const TextStyle(color: AppColors.textMutedLight, fontSize: 14),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
