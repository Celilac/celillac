import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/api_client.dart';
import '../../api/models/enums.dart';
import '../../api/models/food_profile_models.dart';
import '../../core/auth/session_controller.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/loading_overlay.dart';
import '../onboarding/allergen_catalog.dart';
import '../onboarding/widgets/allergen_toggle_tile.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key, this.initialProfile});

  final FoodProfile? initialProfile;

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final Map<AllergenType, SeverityLevel?> _selected = {};
  bool _acceptsCrossContamination = false;
  bool _isLoading = false;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialProfile != null) {
      _populateFromProfile(widget.initialProfile!);
    } else {
      _loadCurrentProfile();
    }
  }

  void _populateFromProfile(FoodProfile profile) {
    for (final r in profile.restrictions) {
      _selected[r.allergen] = r.severity;
    }
    _acceptsCrossContamination = profile.acceptsCrossContamination;
  }

  Future<void> _loadCurrentProfile() async {
    final userId = context.read<SessionController>().user?.id;
    if (userId == null) return;
    setState(() => _isLoading = true);
    try {
      final apiClient = context.read<ApiClient>();
      final profile = await apiClient.getFoodProfile(userId);
      if (mounted) {
        setState(() {
          _populateFromProfile(profile);
        });
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

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
    final userId = context.read<SessionController>().user?.id;
    if (userId == null) return;

    setState(() => _isSaving = true);
    try {
      final apiClient = context.read<ApiClient>();
      final payload = FoodProfilePayload(
        userId: userId,
        restrictions: _selectedList,
        acceptsCrossContamination: _acceptsCrossContamination,
      );

      final updated = await apiClient.updateFoodProfile(userId, payload);
      if (!mounted) return;

      if (updated.requiresHistoryRevalidation) {
        await showDialog<void>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('⚠️ Revalidação Necessária'),
            content: const Text(
              'Seu perfil agora inclui restrições FATAIS. Verificações passadas foram invalidadas por segurança.',
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

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Perfil alimentar atualizado com sucesso!')),
        );
        Navigator.pop(context, true);
      }
    } catch (err) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Falha ao atualizar perfil alimentar.')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Editar Perfil Alimentar'),
      ),
      body: _isLoading || _isSaving
          ? const LoadingOverlay(message: 'Salvando restrições...')
          : SafeArea(
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  const Text(
                    'Selecione suas restrições e severidades:',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 16),
                  ...kAllergenCatalog.map(
                    (item) => AllergenToggleTile(
                      item: item,
                      isSelected: _selected.containsKey(item.type),
                      selectedSeverity: _selected[item.type],
                      onToggle: () => _toggleAllergen(item.type),
                      onSeveritySelected: (s) => _setSeverity(item.type, s),
                    ),
                  ),
                  const SizedBox(height: 20),
                  SwitchListTile(
                    title: const Text('Aceita traços / contaminação cruzada', style: TextStyle(color: AppColors.textPrimary)),
                    subtitle: const Text(
                      'Marque apenas se seu médico liberar o consumo de alimentos com traços.',
                      style: TextStyle(fontSize: 12, color: AppColors.textMuted),
                    ),
                    value: _acceptsCrossContamination,
                    activeColor: AppColors.primary,
                    onChanged: (val) => setState(() => _acceptsCrossContamination = val),
                  ),
                  const SizedBox(height: 30),
                  ElevatedButton(
                    onPressed: _handleSave,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      backgroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text(
                      'Salvar Perfil',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
