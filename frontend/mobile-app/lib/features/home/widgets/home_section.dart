import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

/// Título de um bloco do Início seguido do conteúdo.
class HomeSection extends StatelessWidget {
  const HomeSection({super.key, required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Semantics(
            header: true,
            child: Text(
              title,
              style: const TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class HomeBlockLoading extends StatelessWidget {
  const HomeBlockLoading({super.key});

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 12),
      child: Center(
        child: SizedBox(
          width: 24,
          height: 24,
          child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
        ),
      ),
    );
  }
}

/// Falha de um bloco, com nova tentativa. [id] compõe as chaves
/// `home-<id>-error` e `home-<id>-retry`.
class HomeBlockError extends StatelessWidget {
  const HomeBlockError({super.key, required this.id, required this.message, required this.onRetry});

  final String id;
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Container(
      key: Key('home-$id-error'),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(message, style: const TextStyle(color: AppColors.textMutedLight)),
          const SizedBox(height: 8),
          OutlinedButton(
            key: Key('home-$id-retry'),
            onPressed: onRetry,
            child: const Text('Tentar novamente'),
          ),
        ],
      ),
    );
  }
}

class HomeEmptyText extends StatelessWidget {
  const HomeEmptyText(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(text, style: const TextStyle(color: AppColors.textMutedLight, fontSize: 14));
  }
}
