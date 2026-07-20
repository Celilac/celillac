import 'package:flutter/material.dart';

/// Marca oficial do CeLiLac. Fonte da verdade:
/// frontend/web-app/public/brand/logo_with_transparent_background.png
/// (copiada para assets/brand/logo.png neste app).
class BrandLogo extends StatelessWidget {
  const BrandLogo({super.key, this.size = 64});

  final double size;

  @override
  Widget build(BuildContext context) {
    final badgeSize = size + 24;

    return Container(
      width: badgeSize,
      height: badgeSize,
      margin: const EdgeInsets.only(bottom: 12),
      decoration: const BoxDecoration(
        color: Color(0xFFF8FAFC),
        shape: BoxShape.circle,
      ),
      alignment: Alignment.center,
      child: Image.asset(
        'assets/brand/logo.png',
        width: size,
        height: size,
        fit: BoxFit.contain,
      ),
    );
  }
}
