import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/api_client.dart';
import '../../api/models/enums.dart';
import '../../api/models/food_profile_models.dart';
import '../../core/auth/session_controller.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/loading_overlay.dart';
import '../../shared/widgets/restriction_chip.dart';
import 'allergen_catalog.dart';
import 'widgets/allergen_toggle_tile.dart';

class OnboardingProfileScreen extends StatefulWidget {
  const OnboardingProfileScreen({super.key, required this.onComplete});

  final VoidCallback onComplete;

  @override
  State<OnboardingProfileScreen> createState() => _OnboardingProfileScreenState();
}

class _OnboardingProfileScreenState extends State<OnboardingProfileScreen> {
  final Map<AllergenType, SeverityLevel?> _selected = {};
  bool _isLoading = false;

  void _toggleAllergen(AllergenType allergen) {
    setState(() {
      if (_selected.containsKey(allergen)) {
        _selected.remove(allergen);
      } else {
        _selected[allergen] = SeverityLevel.medium;
      }
    });
  }

  void _setSeverity(AllergenType allergen, SeverityLevel severity) {
    setState(() => _selected[allergen] = severity);
  }

  List<Restriction> get _selectedList => _selected.entries
      .where((entry) => entry.value != null)
      .map((entry) => Restriction(allergen: entry.key, severity: entry.value!))
      .toList();

  Future<void> _handleSave() async {
    final selectedList = _selectedList;
    if (selectedList.isEmpty) {
      _showMessage('Atenção', 'Selecione pelo menos uma restrição alimentar.');
      return;
    }
    final session = context.read<SessionController>();
    final userId = session.user?.id;
    if (userId == null) return;

    setState(() => _isLoading = true);
    try {
      final apiClient = context.read<ApiClient>();
      final profile = await apiClient.createFoodProfile(
        FoodProfilePayload(
          userId: userId,
          restrictions: selectedList,
          acceptsCrossContamination: false,
        ),
      );
      if (!mounted) return;
      if (profile.requiresHistoryRevalidation) {
        await showDialog<void>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('⚠️ Atenção'),
            content: const Text(
              'Seu perfil contém restrições FATAIS. Verificações anteriores de produtos devem ser refeitas.',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Entendido'),
              ),
            ],
          ),
        );
      }
      widget.onComplete();
    } catch (err) {
      if (mounted) {
        _showMessage('Erro', 'Não foi possível salvar o perfil.');
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showMessage(String title, String message) {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('OK')),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final selectedList = _selectedList;
    return Scaffold(
      body: Stack(
        children: [
          SafeArea(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 40),
              children: [
                const Text(
                  'Seu Perfil Alimentar',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Selecione seus alérgenos e a gravidade de cada restrição',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 13, color: AppColors.textMuted, height: 1.4),
                ),
                const SizedBox(height: 24),
                ...onboardingAllergens.map(
                  (allergen) => AllergenToggleTile(
                    allergen: allergen,
                    selectedSeverity: _selected[allergen],
                    onToggle: () => _toggleAllergen(allergen),
                    onSeveritySelected: (severity) => _setSeverity(allergen, severity),
                  ),
                ),
                if (selectedList.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  const Text(
                    'Resumo das restrições:',
                    style: TextStyle(color: AppColors.textMutedLight, fontSize: 13),
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    children: selectedList
                        .map((r) => RestrictionChip(allergen: r.allergen, severity: r.severity))
                        .toList(),
                  ),
                ],
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _isLoading ? null : _handleSave,
                  style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 18)),
                  child: const Text('Salvar e Começar', style: TextStyle(fontSize: 17)),
                ),
              ],
            ),
          ),
          if (_isLoading) const LoadingOverlay(message: 'Salvando perfil...'),
        ],
      ),
    );
  }
}
