import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile_app/api/api_client.dart';
import 'package:mobile_app/core/auth/session_controller.dart';
import 'package:mobile_app/core/storage/secure_token_storage.dart';

String _makeJwt(String role, {int? exp}) {
  String b64(Map<String, dynamic> m) =>
      base64Url.encode(utf8.encode(jsonEncode(m))).replaceAll('=', '');
  return '${b64({'alg': 'HS256', 'typ': 'JWT'})}.'
      '${b64({
    'sub': 'user-1',
    'role': role,
    'iat': 1,
    'exp': exp ?? (DateTime.now().millisecondsSinceEpoch ~/ 1000) + 3600,
  })}.sig';
}

class _FakeStorage extends SecureTokenStorage {
  _FakeStorage([this.token]);

  String? token;
  int deleteCalls = 0;

  @override
  Future<String?> read() async => token;

  @override
  Future<void> write(String value) async => token = value;

  @override
  Future<void> delete() async {
    deleteCalls++;
    token = null;
  }
}

const _foodProfileJson = {
  'id': 'fp-1',
  'userId': 'user-1',
  'isActive': true,
  'requiresHistoryRevalidation': false,
  'acceptsCrossContamination': false,
  'restrictions': <Map<String, dynamic>>[],
};

ApiClient _apiReturningToken(String token, List<http.Request> calls) {
  return ApiClient(
    httpClient: MockClient((request) async {
      calls.add(request);
      if (request.url.path == '/iam/login') {
        return http.Response(jsonEncode({'token': token, 'expiresIn': '7d'}), 200);
      }
      return http.Response(jsonEncode(_foodProfileJson), 200);
    }),
  );
}

void main() {
  group('SessionController role guard', () {
    test('CELIACO login is accepted', () async {
      final storage = _FakeStorage();
      final session = SessionController(
        apiClient: _apiReturningToken(_makeJwt('CELIACO'), []),
        storage: storage,
      );

      await session.login('a@b.com', 'pw');

      expect(session.isAuthenticated, isTrue);
      expect(session.roleBlocked, isFalse);
      expect(storage.token, isNotNull);
    });

    for (final role in ['PARCEIRO', 'ADMIN']) {
      test('$role login is rejected: no session, no token persisted, no API calls with it', () async {
        final calls = <http.Request>[];
        final storage = _FakeStorage();
        final session = SessionController(
          apiClient: _apiReturningToken(_makeJwt(role), calls),
          storage: storage,
        );

        await session.login('a@b.com', 'pw');

        expect(session.isAuthenticated, isFalse);
        expect(session.user, isNull);
        expect(session.roleBlocked, isTrue);
        expect(storage.token, isNull);
        // Só a chamada de login; nenhuma rota autenticada (food-profile) foi acionada.
        expect(calls.map((c) => c.url.path), ['/iam/login']);
      });

      test('$role restored from a stored token ends the session and blocks', () async {
        final storage = _FakeStorage(_makeJwt(role));
        final session = SessionController(
          apiClient: _apiReturningToken(_makeJwt(role), []),
          storage: storage,
        );

        await session.restoreSession();

        expect(session.isAuthenticated, isFalse);
        expect(session.isLoading, isFalse);
        expect(session.roleBlocked, isTrue);
        expect(storage.token, isNull);
      });
    }

    test('CELIACO restored from a stored token keeps the session', () async {
      final storage = _FakeStorage(_makeJwt('CELIACO'));
      final session = SessionController(
        apiClient: _apiReturningToken(_makeJwt('CELIACO'), []),
        storage: storage,
      );

      await session.restoreSession();

      expect(session.isAuthenticated, isTrue);
      expect(session.roleBlocked, isFalse);
    });

    test('acknowledgeRoleBlock clears the flag so the login screen can return', () async {
      final session = SessionController(
        apiClient: _apiReturningToken(_makeJwt('ADMIN'), []),
        storage: _FakeStorage(),
      );
      await session.login('a@b.com', 'pw');
      expect(session.roleBlocked, isTrue);

      session.acknowledgeRoleBlock();

      expect(session.roleBlocked, isFalse);
      expect(session.isAuthenticated, isFalse);
    });

    test('a subsequent CELIACO login clears a previous block', () async {
      var role = 'ADMIN';
      final api = ApiClient(
        httpClient: MockClient((request) async {
          if (request.url.path == '/iam/login') {
            return http.Response(jsonEncode({'token': _makeJwt(role), 'expiresIn': '7d'}), 200);
          }
          return http.Response(jsonEncode(_foodProfileJson), 200);
        }),
      );
      final session = SessionController(apiClient: api, storage: _FakeStorage());

      await session.login('a@b.com', 'pw');
      expect(session.roleBlocked, isTrue);

      role = 'CELIACO';
      await session.login('c@d.com', 'pw');

      expect(session.roleBlocked, isFalse);
      expect(session.isAuthenticated, isTrue);
    });
  });
}
