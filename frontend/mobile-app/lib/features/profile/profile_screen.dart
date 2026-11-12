import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/api_client.dart';
import '../../api/models/food_profile_models.dart';
import '../../core/auth/session_controller.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/loading_overlay.dart';
import '../../shared/widgets/restriction_chip.dart';
import '../account/verify_email_screen.dart';
import '../legal/privacy_screen.dart';
import '../legal/terms_screen.dart';
import 'edit_profile_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  FoodProfile? _profile;
  // null = desconhecido (ainda carregando ou falha ao consultar /iam/me).
  bool? _emailVerified;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final userId = context.read<SessionController>().user?.id;
    if (userId == null) return;
    final apiClient = context.read<ApiClient>();
    _loadEmailStatus(apiClient);
    try {
      final data = await apiClient.getFoodProfile(userId);
      if (mounted) setState(() => _profile = data);
    } catch (_) {
      if (mounted) setState(() => _profile = null);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _loadEmailStatus(ApiClient apiClient) async {
    try {
      final account = await apiClient.getAccount();
      if (mounted) setState(() => _emailVerified = account.isEmailVerified);
    } catch (_) {
      // Estado de verificação é informativo; sem ele o card some.
    }
  }

  Future<void> _openVerifyEmail() async {
    final verified = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (_) => const VerifyEmailScreen()),
    );
    if (verified == true && mounted) setState(() => _emailVerified = true);
  }

  void _openLegal(Widget screen) {
    Navigator.push(context, MaterialPageRoute<void>(builder: (_) => screen));
  }

  Future<void> _handleLogout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sair'),
        content: const Text('Deseja encerrar a sessão?'),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Cancelar')),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Sair', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
    if (confirmed == true && mounted) {
      await context.read<SessionController>().logout();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: LoadingOverlay(message: 'Carregando perfil...'));
    }

    final user = context.watch<SessionController>().user;

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadProfile,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 40),
            children: [
              Column(
                children: [
                  const Text('👤', style: TextStyle(fontSize: 64)),
                  const SizedBox(height: 8),
                  Text(
                    user?.role ?? 'CELIACO',
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      letterSpacing: 1.5,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'RESTRIÇÕES ALIMENTARES',
                      style: TextStyle(
                        color: AppColors.textMutedLight,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 1,
                      ),
                    ),
                    const SizedBox(height: 16),
                    if (_profile != null && _profile!.restrictions.isNotEmpty)
                      Wrap(
                        children: _profile!.restrictions
                            .map((r) => RestrictionChip(allergen: r.allergen, severity: r.severity))
                            .toList(),
                      )
                    else
                      const Text(
                        'Nenhuma restrição cadastrada.',
                        style: TextStyle(color: Color(0xFF475569), fontSize: 14),
                      ),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: () async {
                        final updated = await Navigator.push<bool>(
                          context,
                          MaterialPageRoute(
                            builder: (context) => EditProfileScreen(initialProfile: _profile),
                          ),
                        );
                        if (updated == true) {
                          _loadProfile();
                        }
                      },
                      icon: const Icon(Icons.edit, size: 18),
                      label: const Text('Editar Perfil Alimentar'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        minimumSize: const Size.fromHeight(44),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ],
                ),
              ),
              if (_profile?.requiresHistoryRevalidation == true) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF7C2D12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text(
                    '⚠️ Seu perfil contém restrições FATAIS. Revalide verificações anteriores de produtos.',
                    style: TextStyle(color: Color(0xFFFEF3C7), fontSize: 14, height: 1.4),
                  ),
                ),
              ],
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'CONTA',
                      style: TextStyle(
                        color: AppColors.textMutedLight,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 1,
                      ),
                    ),
                    if (_emailVerified != null) ...[
                      const SizedBox(height: 12),
                      if (_emailVerified!)
                        const Row(
                          key: Key('email-verified-status'),
                          children: [
                            Icon(Icons.check_circle, color: AppColors.success, size: 20),
                            SizedBox(width: 8),
                            Text('E-mail verificado', style: TextStyle(color: AppColors.textPrimary)),
                          ],
                        )
                      else ...[
                        const Row(
                          key: Key('email-unverified-status'),
                          children: [
                            Icon(Icons.mark_email_unread_outlined, color: AppColors.severityMedium, size: 20),
                            SizedBox(width: 8),
                            Text('E-mail não verificado', style: TextStyle(color: AppColors.textPrimary)),
                          ],
                        ),
                        const SizedBox(height: 8),
                        OutlinedButton(
                          onPressed: _openVerifyEmail,
                          child: const Text('Verificar e-mail'),
                        ),
                      ],
                    ],
                    const SizedBox(height: 8),
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.gavel, color: AppColors.textMutedLight),
                      title: const Text('Termos de Uso', style: TextStyle(color: AppColors.textPrimary)),
                      trailing: const Icon(Icons.chevron_right, color: AppColors.textMuted),
                      onTap: () => _openLegal(const TermsScreen()),
                    ),
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.shield_outlined, color: AppColors.textMutedLight),
                      title: const Text('Política de Privacidade', style: TextStyle(color: AppColors.textPrimary)),
                      trailing: const Icon(Icons.chevron_right, color: AppColors.textMuted),
                      onTap: () => _openLegal(const PrivacyScreen()),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              OutlinedButton(
                onPressed: _handleLogout,
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.error),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text(
                  'Sair da conta',
                  style: TextStyle(color: AppColors.error, fontWeight: FontWeight.bold, fontSize: 15),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
