import 'dart:io';

import 'package:flutter/foundation.dart';

/// Resolução da base URL da API.
/// Override em build/run: `--dart-define=API_BASE_URL=https://...`.
class ApiConfig {
  ApiConfig._();

  static const String productionBaseUrl = 'https://api.celilac.com.br';
  static const int _devPort = 3002;
  static const String _envBaseUrl = String.fromEnvironment('API_BASE_URL');

  static String get baseUrl => resolveBaseUrl(
        override: _envBaseUrl,
        isRelease: kReleaseMode,
        isAndroid: Platform.isAndroid,
      );

  static String resolveBaseUrl({
    String? override,
    required bool isRelease,
    required bool isAndroid,
  }) {
    final custom = override?.trim().replaceAll(RegExp(r'/+$'), '') ?? '';
    if (custom.isNotEmpty) return custom;
    if (isRelease) return productionBaseUrl;
    return isAndroid ? 'http://10.0.2.2:$_devPort' : 'http://localhost:$_devPort';
  }
}
