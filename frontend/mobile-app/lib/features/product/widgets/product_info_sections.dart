import 'package:flutter/material.dart';

import '../../../api/models/product_models.dart';
import '../../../core/theme/app_colors.dart';

const _sectionTitleStyle = TextStyle(
  fontSize: 13,
  fontWeight: FontWeight.bold,
  color: AppColors.textMuted,
  letterSpacing: 1,
);

class ProductSection extends StatelessWidget {
  const ProductSection({super.key, required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 20),
        Text(title, style: _sectionTitleStyle),
        const SizedBox(height: 8),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12)),
          child: child,
        ),
      ],
    );
  }
}

/// Valor numérico em pt-BR: `120` -> "120", `2.5` -> "2,5".
String formatNumber(double value) {
  final text = value == value.roundToDouble() ? value.toInt().toString() : value.toString();
  return text.replaceAll('.', ',');
}

/// Tabela nutricional como cadastrada (somente exibição).
class NutritionCard extends StatelessWidget {
  const NutritionCard({super.key, required this.info});

  final NutritionalInfo info;

  @override
  Widget build(BuildContext context) {
    final rows = <(String, double?, String)>[
      ('Calorias', info.calories, 'kcal'),
      ('Carboidratos', info.carbohydrates, 'g'),
      ('Açúcares totais', info.totalSugars, 'g'),
      ('Açúcares adicionados', info.addedSugars, 'g'),
      ('Proteínas', info.proteins, 'g'),
      ('Gorduras totais', info.totalFat, 'g'),
      ('Gorduras saturadas', info.saturatedFat, 'g'),
      ('Fibra alimentar', info.dietaryFiber, 'g'),
      ('Sódio', info.sodium, 'mg'),
    ].where((r) => r.$2 != null).toList();
    final serving = info.servingSize;

    return ProductSection(
      title: '🍽️ INFORMAÇÃO NUTRICIONAL',
      child: Column(
        key: const Key('nutrition-card'),
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (serving != null && serving.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Text('Porção: $serving', style: const TextStyle(color: AppColors.textMutedLight)),
            ),
          for (final row in rows)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 3),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(row.$1, style: const TextStyle(color: AppColors.textMuted)),
                  Text(
                    '${formatNumber(row.$2!)} ${row.$3}',
                    style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  /// Há algo para mostrar? (evita um cartão vazio)
  static bool hasContent(NutritionalInfo? info) =>
      info != null &&
      ((info.servingSize?.isNotEmpty ?? false) ||
          [
            info.calories,
            info.carbohydrates,
            info.totalSugars,
            info.addedSugars,
            info.proteins,
            info.totalFat,
            info.saturatedFat,
            info.dietaryFiber,
            info.sodium,
          ].any((v) => v != null));
}

/// Certificações cadastradas. As **rejeitadas** pela moderação não são exibidas.
class CertificationsCard extends StatelessWidget {
  const CertificationsCard({super.key, required this.certifications});

  final List<ProductCertification> certifications;

  static List<ProductCertification> visible(List<ProductCertification> all) =>
      all.where((c) => c.verificationStatus != 'REJECTED').toList();

  static String? _statusLabel(String? status) => switch (status) {
        'VERIFIED_BY_CELILAC' => 'Verificado pelo CeLiLac',
        'DECLARED_BY_PARTNER' => 'Declarado pelo parceiro',
        _ => null,
      };

  static String _date(String raw) {
    final d = DateTime.tryParse(raw);
    if (d == null) return raw;
    return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
  }

  @override
  Widget build(BuildContext context) {
    return ProductSection(
      title: '🏅 CERTIFICAÇÕES',
      child: Column(
        key: const Key('certifications-card'),
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          for (final c in certifications)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    c.certificationType,
                    style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
                  ),
                  Text(
                    [
                      c.certifyingEntity,
                      if (c.certificateCode != null && c.certificateCode!.isNotEmpty) 'Cód. ${c.certificateCode}',
                      if (c.validUntil != null && c.validUntil!.isNotEmpty) 'Válido até ${_date(c.validUntil!)}',
                    ].where((e) => e.isNotEmpty).join(' · '),
                    style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                  ),
                  if (_statusLabel(c.verificationStatus) != null)
                    Text(
                      _statusLabel(c.verificationStatus)!,
                      style: const TextStyle(color: AppColors.textMutedLight, fontSize: 12),
                    ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

const _featureLabels = <String, String>{
  'VEGAN': 'Vegano',
  'VEGETARIAN': 'Vegetariano',
  'NO_ADDED_SUGAR': 'Sem açúcar adicionado',
  'SUGAR_FREE': 'Zero açúcar',
  'ORGANIC': 'Orgânico',
  'KOSHER': 'Kosher',
  'HALAL': 'Halal',
};

/// Características dietéticas declaradas (estilo de vida, não segurança).
class DietaryFeaturesCard extends StatelessWidget {
  const DietaryFeaturesCard({super.key, required this.features});

  final List<String> features;

  @override
  Widget build(BuildContext context) {
    return ProductSection(
      title: '🌱 CARACTERÍSTICAS',
      child: Wrap(
        key: const Key('dietary-features-card'),
        spacing: 8,
        runSpacing: 8,
        children: [
          for (final f in features)
            Chip(
              label: Text(_featureLabels[f] ?? f),
              backgroundColor: AppColors.background,
              side: const BorderSide(color: AppColors.border),
              labelStyle: const TextStyle(color: AppColors.textPrimary, fontSize: 12),
            ),
        ],
      ),
    );
  }
}
