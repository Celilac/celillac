import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../shared/widgets/brand_logo.dart';

/// Exibida quando o usuário autenticado não é consumidor (PARCEIRO/ADMIN).
/// A sessão já foi encerrada pelo SessionController.
class WebPanelRequiredScreen extends StatelessWidget {
  const WebPanelRequiredScreen({super.key, required this.onBack});

  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const BrandLogo(),
              const SizedBox(height: 24),
              const Icon(Icons.desktop_windows_outlined, size: 48, color: AppColors.primary),
              const SizedBox(height: 16),
              const Text(
                'Use o painel web',
                style: TextStyle(color: AppColors.textPrimary, fontSize: 22, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'Este aplicativo é voltado a consumidores. Contas de parceiro e administrador '
                'devem acessar o painel web do CeLiLac.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.textMuted, fontSize: 14),
              ),
              const SizedBox(height: 24),
              ElevatedButton(onPressed: onBack, child: const Text('Voltar ao login')),
            ],
          ),
        ),
      ),
    );
  }
}
