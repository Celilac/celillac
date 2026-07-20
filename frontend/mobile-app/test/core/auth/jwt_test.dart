import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/auth/jwt.dart';

String _makeJwt(Map<String, dynamic> payload) {
  String base64UrlNoPad(List<int> bytes) =>
      base64Url.encode(bytes).replaceAll('=', '');

  final header = base64UrlNoPad(utf8.encode(jsonEncode({'alg': 'HS256', 'typ': 'JWT'})));
  final body = base64UrlNoPad(utf8.encode(jsonEncode(payload)));
  return '$header.$body.signature';
}

void main() {
  group('decodeJwt', () {
    test('decodes a well-formed token payload', () {
      final token = _makeJwt({
        'sub': 'user-123',
        'role': 'CELIACO',
        'iat': 1000,
        'exp': 2000,
      });

      final payload = decodeJwt(token);

      expect(payload, isNotNull);
      expect(payload!.sub, 'user-123');
      expect(payload.role, 'CELIACO');
      expect(payload.exp, 2000);
    });

    test('returns null for a malformed token', () {
      expect(decodeJwt('not-a-jwt'), isNull);
      expect(decodeJwt('a.b'), isNull);
    });
  });

  group('isTokenExpired', () {
    test('returns false when exp is in the future', () {
      final futureExp = (DateTime.now().millisecondsSinceEpoch ~/ 1000) + 3600;
      final token = _makeJwt({'sub': 'u', 'role': 'CELIACO', 'iat': 0, 'exp': futureExp});
      expect(isTokenExpired(token), isFalse);
    });

    test('returns true when exp is in the past', () {
      final pastExp = (DateTime.now().millisecondsSinceEpoch ~/ 1000) - 3600;
      final token = _makeJwt({'sub': 'u', 'role': 'CELIACO', 'iat': 0, 'exp': pastExp});
      expect(isTokenExpired(token), isTrue);
    });

    test('treats an undecodable token as expired', () {
      expect(isTokenExpired('garbage'), isTrue);
    });
  });
}
