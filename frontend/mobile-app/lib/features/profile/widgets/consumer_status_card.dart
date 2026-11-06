import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../api/api_client.dart';
import '../../../api/models/consumer_models.dart';
import '../../../core/theme/app_colors.dart';
import '../consumer_error_messages.dart';

/// Status do perfil de consumidor (`GET /consumer/me`) e ativar/desativar
/// (`PATCH /consumer/status`). Exibe o que a API devolve, sem reinterpretar:
/// o aviso de perfil incompleto é o `hasIncompleteProfileWarning` da API.
class ConsumerStatusCard extends StatefulWidget {
  const ConsumerStatusCard({super.key});

  @override
  State<ConsumerStatusCard> createState() => _ConsumerStatusCardState();
}

class _ConsumerStatusCardState extends State<ConsumerStatusCard> {
  ConsumerMe? _me;
  bool _inactive = false;
  bool _isLoading = true;
  bool _isUpdating = false;
  String? _error;
  String? _actionError;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final me = await context.read<ApiClient>().getConsumerMe();
      if (!mounted) return;
      setState(() {
        _me = me;
        _inactive = me.consumer.isInactive;
      });
    } catch (e) {
      if (mounted) setState(() => _error = ConsumerErrorMessages.generic(e));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<bool> _confirmDeactivate() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Desativar perfil?'),
        content: const Text(
          'Ao desativar seu perfil, suas restrições não serão consideradas em alertas até que você o reative.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text(
              'Desativar',
              style: TextStyle(color: AppColors.error),
            ),
          ),
        ],
      ),
    );
    return confirmed == true;
  }

  Future<void> _toggle() async {
    final action = _inactive
        ? ConsumerStatusAction.activate
        : ConsumerStatusAction.deactivate;
    if (action == ConsumerStatusAction.deactivate &&
        !await _confirmDeactivate()) {
      return;
    }
    if (!mounted) return;

    final api = context.read<ApiClient>();
    setState(() {
      _isUpdating = true;
      _actionError = null;
    });
    try {
      final result = await api.setConsumerStatus(action);
      if (mounted) setState(() => _inactive = result.isInactive);
    } catch (e) {
      if (mounted) {
        setState(() => _actionError = ConsumerErrorMessages.generic(e));
      }
    } finally {
      if (mounted) setState(() => _isUpdating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'PERFIL DE CONSUMIDOR',
            style: TextStyle(
              color: AppColors.textMutedLight,
              fontSize: 13,
              fontWeight: FontWeight.w600,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 12),
          if (_isLoading)
            const Center(
              child: SizedBox(
                key: Key('consumer-status-loading'),
                width: 24,
                height: 24,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            )
          else if (_error != null) ...[
            Text(_error!, style: const TextStyle(color: AppColors.error)),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: _load,
              child: const Text('Tentar novamente'),
            ),
          ] else ...[
            Row(
              children: [
                Icon(
                  _inactive ? Icons.pause_circle_outline : Icons.check_circle,
                  color: _inactive ? AppColors.error : AppColors.success,
                  size: 20,
                ),
                const SizedBox(width: 8),
                const Text(
                  'Status: ',
                  style: TextStyle(color: AppColors.textPrimary),
                ),
                Text(
                  _inactive ? 'INATIVO' : 'ATIVO',
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            if (_me!.hasIncompleteProfileWarning) ...[
              const SizedBox(height: 12),
              Container(
                key: const Key('incomplete-profile-warning'),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFF7C2D12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Text(
                  '⚠️ Seu perfil alimentar está incompleto. Complete suas restrições para receber alertas confiáveis.',
                  style: TextStyle(
                    color: Color(0xFFFEF3C7),
                    fontSize: 14,
                    height: 1.4,
                  ),
                ),
              ),
            ],
            if (_actionError != null) ...[
              const SizedBox(height: 8),
              Text(
                _actionError!,
                style: const TextStyle(color: AppColors.error),
              ),
            ],
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: _isUpdating ? null : _toggle,
              child: _isUpdating
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Text(_inactive ? 'Reativar perfil' : 'Desativar perfil'),
            ),
          ],
        ],
      ),
    );
  }
}
