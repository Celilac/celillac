import 'package:flutter/material.dart';

/// Paleta única do app — ported from the Expo screens' inline hex literals.
class AppColors {
  AppColors._();

  static const background = Color(0xFF0F172A);
  static const surface = Color(0xFF1E293B);
  static const border = Color(0xFF334155);
  static const primary = Color(0xFF3B82F6);
  static const textPrimary = Color(0xFFF1F5F9);
  static const textMuted = Color(0xFF64748B);
  static const textMutedLight = Color(0xFF94A3B8);
  static const error = Color(0xFFEF4444);

  // Escala de severidade (onboarding + RestrictionChip)
  static const severityLifestyle = Color(0xFF6366F1);
  static const severityLow = Color(0xFF22C55E);
  static const severityMedium = Color(0xFFF59E0B);
  static const severityHigh = Color(0xFFF97316);
  static const severityFatal = Color(0xFFEF4444);

  // Fundos do AlertBanner (paleta distinta da escala de severidade)
  static const riskSafeBg = Color(0xFF166534);
  static const riskWarningBg = Color(0xFF92400E);
  static const riskDangerBg = Color(0xFF9A3412);
  static const riskBlockedBg = Color(0xFF7F1D1D);
}
