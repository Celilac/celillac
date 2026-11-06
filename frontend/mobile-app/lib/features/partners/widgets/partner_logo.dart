import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

/// Logo do parceiro. A API pode devolver URL http(s) ou data URI base64;
/// qualquer falha cai no ícone genérico.
class PartnerLogo extends StatelessWidget {
  const PartnerLogo({super.key, required this.logoUrl, this.size = 48});

  final String? logoUrl;
  final double size;

  Widget get _fallback => Container(
        width: size,
        height: size,
        color: AppColors.border,
        child: Icon(Icons.storefront_outlined, color: AppColors.textMutedLight, size: size * 0.5),
      );

  @override
  Widget build(BuildContext context) {
    final url = logoUrl?.trim() ?? '';
    Widget image = _fallback;
    if (url.startsWith('data:image')) {
      try {
        final bytes = UriData.parse(url).contentAsBytes();
        image = Image.memory(bytes, width: size, height: size, fit: BoxFit.cover, errorBuilder: (_, _, _) => _fallback);
      } catch (_) {
        image = _fallback;
      }
    } else if (url.startsWith('http://') || url.startsWith('https://')) {
      image = Image.network(url, width: size, height: size, fit: BoxFit.cover, errorBuilder: (_, _, _) => _fallback);
    }
    return ClipRRect(borderRadius: BorderRadius.circular(10), child: image);
  }
}
