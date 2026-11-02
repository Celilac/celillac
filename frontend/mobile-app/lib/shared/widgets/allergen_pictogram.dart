import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../api/models/enums.dart';
import '../../core/assets/allergen_icons.dart';
import '../../core/theme/app_colors.dart';

/// Pictograma de alérgeno. Puramente visual: o asset vem de [allergenIconAssets].
class AllergenPictogram extends StatelessWidget {
  const AllergenPictogram({super.key, required this.allergen, this.size = 24});

  final AllergenType allergen;
  final double size;

  @override
  Widget build(BuildContext context) {
    final asset = allergenIconAssets[allergen];
    return Semantics(
      label: allergen.label,
      excludeSemantics: true,
      child: SizedBox(
        width: size,
        height: size,
        child: asset != null
            ? SvgPicture.asset(asset, width: size, height: size)
            : Icon(
                Icons.help_outline,
                key: const Key('allergen-pictogram-fallback'),
                size: size,
                color: AppColors.textMutedLight,
              ),
      ),
    );
  }
}
