import 'package:flutter/material.dart';

import '../../../api/models/account_models.dart';
import '../../../api/models/consumer_models.dart';
import '../../../core/theme/app_colors.dart';
import '../home_block.dart';
import 'home_section.dart';

/// Avisos do topo: perfil incompleto (`hasIncompleteProfileWarning`, como veio
/// da API) e e-mail não verificado (`GET /iam/me`). A falha do perfil é tratada
/// no resumo alimentar.
class AccountNotices extends StatelessWidget {
  const AccountNotices({
    super.key,
    required this.account,
    required this.consumer,
    required this.onCompleteProfile,
    required this.onVerifyEmail,
  });

  final HomeBlock<AccountInfo> account;
  final HomeBlock<ConsumerMe> consumer;
  final VoidCallback onCompleteProfile;
  final VoidCallback onVerifyEmail;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (account.isLoading)
          const Padding(
            key: Key('home-account-loading'),
            padding: EdgeInsets.only(top: 16),
            child: LinearProgressIndicator(color: AppColors.primary, backgroundColor: AppColors.surface),
          ),
        if (account.error != null)
          Padding(
            padding: const EdgeInsets.only(top: 16),
            child: HomeBlockError(id: 'account', message: account.error!, onRetry: account.load),
          ),
        if (consumer.data?.hasIncompleteProfileWarning ?? false)
          _Notice(
            key: const Key('home-profile-warning'),
            icon: Icons.warning_amber_rounded,
            message: 'Seu perfil alimentar está incompleto. Complete suas restrições para receber alertas confiáveis.',
            actionKey: const Key('home-complete-profile'),
            actionLabel: 'Completar perfil',
            onAction: onCompleteProfile,
          ),
        if (account.data?.isEmailVerified == false)
          _Notice(
            key: const Key('home-email-warning'),
            icon: Icons.mark_email_unread_outlined,
            message: 'Seu e-mail ainda não foi verificado.',
            actionKey: const Key('home-verify-email'),
            actionLabel: 'Verificar e-mail',
            onAction: onVerifyEmail,
          ),
      ],
    );
  }
}

class _Notice extends StatelessWidget {
  const _Notice({
    super.key,
    required this.icon,
    required this.message,
    required this.actionKey,
    required this.actionLabel,
    required this.onAction,
  });

  final IconData icon;
  final String message;
  final Key actionKey;
  final String actionLabel;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 16),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      decoration: BoxDecoration(color: AppColors.riskWarningBg, borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: Colors.white, size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Text(message, style: const TextStyle(color: Colors.white, fontSize: 14, height: 1.4)),
              ),
            ],
          ),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              key: actionKey,
              onPressed: onAction,
              style: TextButton.styleFrom(foregroundColor: Colors.white),
              child: Text(actionLabel, style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }
}
