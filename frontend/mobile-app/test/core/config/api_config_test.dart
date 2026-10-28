import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/config/api_config.dart';

void main() {
  group('ApiConfig.resolveBaseUrl', () {
    test('uses localhost:3002 in dev on iOS/desktop when no define is given', () {
      expect(
        ApiConfig.resolveBaseUrl(override: '', isRelease: false, isAndroid: false),
        'http://localhost:3002',
      );
    });

    test('uses the emulator loopback 10.0.2.2:3002 in dev on Android', () {
      expect(
        ApiConfig.resolveBaseUrl(override: '', isRelease: false, isAndroid: true),
        'http://10.0.2.2:3002',
      );
    });

    test('defaults to the official production API in release builds', () {
      expect(
        ApiConfig.resolveBaseUrl(override: '', isRelease: true, isAndroid: true),
        'https://api.celilac.com.br',
      );
      expect(
        ApiConfig.resolveBaseUrl(override: null, isRelease: true, isAndroid: false),
        'https://api.celilac.com.br',
      );
    });

    test('API_BASE_URL override wins over the defaults, in dev and release', () {
      expect(
        ApiConfig.resolveBaseUrl(override: 'http://192.168.0.10:3002', isRelease: false, isAndroid: true),
        'http://192.168.0.10:3002',
      );
      expect(
        ApiConfig.resolveBaseUrl(override: 'https://staging.celilac.com.br', isRelease: true, isAndroid: false),
        'https://staging.celilac.com.br',
      );
    });

    test('trims whitespace and trailing slashes from the override', () {
      expect(
        ApiConfig.resolveBaseUrl(override: '  https://api.celilac.com.br//  ', isRelease: true, isAndroid: false),
        'https://api.celilac.com.br',
      );
    });

    test('a blank override falls back to the default', () {
      expect(
        ApiConfig.resolveBaseUrl(override: '   ', isRelease: false, isAndroid: false),
        'http://localhost:3002',
      );
    });
  });
}
