import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile_app/api/api_client.dart';
import 'package:mobile_app/api/api_exception.dart';
import 'package:mobile_app/api/models/account_models.dart';

ApiClient _client(http.Response Function(http.Request) handler, {void Function(http.Request)? capture}) {
  return ApiClient(
    baseUrl: 'http://api.test',
    httpClient: MockClient((request) async {
      capture?.call(request);
      return handler(request);
    }),
  );
}

http.Response _json(Object body, int status) => http.Response(jsonEncode(body), status);

void main() {
  group('requestPasswordReset', () {
    test('POST /iam/password-reset/request com o e-mail e retorna a mensagem do backend', () async {
      late http.Request req;
      final client = _client(
        (_) => _json({'message': 'Se o endereço estiver cadastrado...'}, 200),
        capture: (r) => req = r,
      );

      final res = await client.requestPasswordReset('a@b.com');

      expect(req.method, 'POST');
      expect(req.url.path, '/iam/password-reset/request');
      expect(jsonDecode(req.body), {'email': 'a@b.com'});
      expect(req.headers.containsKey('Authorization'), isFalse);
      expect(res.message, 'Se o endereço estiver cadastrado...');
    });

    test('429 vira ApiException com statusCode 429', () async {
      final client = _client((_) => _json({'error': 'Muitas tentativas'}, 429));
      await expectLater(
        client.requestPasswordReset('a@b.com'),
        throwsA(isA<ApiException>().having((e) => e.isTooManyRequests, 'isTooManyRequests', isTrue)),
      );
    });

    test('400 vira ApiException isBadRequest', () async {
      final client = _client((_) => _json({'error': 'Formato de e-mail inválido.'}, 400));
      await expectLater(
        client.requestPasswordReset('x'),
        throwsA(isA<ApiException>().having((e) => e.isBadRequest, 'isBadRequest', isTrue)),
      );
    });
  });

  group('confirmPasswordReset', () {
    test('POST /iam/password-reset/confirm com email, code e newPassword', () async {
      late http.Request req;
      final client = _client(
        (_) => _json({'message': 'Senha redefinida com sucesso!'}, 200),
        capture: (r) => req = r,
      );

      final res = await client.confirmPasswordReset(
        const ConfirmPasswordResetPayload(email: 'a@b.com', code: '123456', newPassword: 'Abcdef1!'),
      );

      expect(req.method, 'POST');
      expect(req.url.path, '/iam/password-reset/confirm');
      expect(jsonDecode(req.body), {'email': 'a@b.com', 'code': '123456', 'newPassword': 'Abcdef1!'});
      expect(req.headers.containsKey('Authorization'), isFalse);
      expect(res.message, 'Senha redefinida com sucesso!');
    });

    test('400 (código inválido) vira ApiException isBadRequest', () async {
      final client = _client((_) => _json({'error': 'Código de recuperação inválido ou já utilizado.'}, 400));
      await expectLater(
        client.confirmPasswordReset(
          const ConfirmPasswordResetPayload(email: 'a@b.com', code: '000000', newPassword: 'Abcdef1!'),
        ),
        throwsA(isA<ApiException>().having((e) => e.isBadRequest, 'isBadRequest', isTrue)),
      );
    });
  });

  group('verifyEmail', () {
    test('POST /iam/email-verification/verify com code e Authorization', () async {
      late http.Request req;
      final client = _client(
        (_) => _json({'message': 'Endereço de e-mail verificado com sucesso!'}, 200),
        capture: (r) => req = r,
      )..setAuthToken('tok');

      final res = await client.verifyEmail('123456');

      expect(req.method, 'POST');
      expect(req.url.path, '/iam/email-verification/verify');
      expect(jsonDecode(req.body), {'code': '123456'});
      expect(req.headers['Authorization'], 'Bearer tok');
      expect(res.message, 'Endereço de e-mail verificado com sucesso!');
    });

    test('400 vira ApiException isBadRequest', () async {
      final client = _client((_) => _json({'error': 'Código de verificação expirado.'}, 400))..setAuthToken('tok');
      await expectLater(
        client.verifyEmail('123456'),
        throwsA(isA<ApiException>().having((e) => e.isBadRequest, 'isBadRequest', isTrue)),
      );
    });
  });

  group('resendEmailVerification', () {
    test('POST /iam/email-verification/resend com Authorization', () async {
      late http.Request req;
      final client = _client(
        (_) => _json({'message': 'Novo código de verificação enviado por e-mail.'}, 200),
        capture: (r) => req = r,
      )..setAuthToken('tok');

      final res = await client.resendEmailVerification();

      expect(req.method, 'POST');
      expect(req.url.path, '/iam/email-verification/resend');
      expect(req.headers['Authorization'], 'Bearer tok');
      expect(res.message, 'Novo código de verificação enviado por e-mail.');
    });

    test('400 "E-mail já verificado." e 429 são distinguíveis', () async {
      final already = _client((_) => _json({'error': 'E-mail já verificado.'}, 400))..setAuthToken('tok');
      await expectLater(
        already.resendEmailVerification(),
        throwsA(isA<ApiException>().having((e) => e.isBadRequest, 'isBadRequest', isTrue)),
      );

      final limited = _client((_) => _json({'error': 'Muitas tentativas'}, 429))..setAuthToken('tok');
      await expectLater(
        limited.resendEmailVerification(),
        throwsA(isA<ApiException>().having((e) => e.isTooManyRequests, 'isTooManyRequests', isTrue)),
      );
    });
  });

  group('getAccount (GET /iam/me)', () {
    test('lê isEmailVerified com Authorization', () async {
      late http.Request req;
      final client = _client(
        (_) => _json({'id': 'u1', 'email': 'a@b.com', 'role': 'CELIACO', 'isEmailVerified': false}, 200),
        capture: (r) => req = r,
      )..setAuthToken('tok');

      final me = await client.getAccount();

      expect(req.method, 'GET');
      expect(req.url.path, '/iam/me');
      expect(req.headers['Authorization'], 'Bearer tok');
      expect(me.email, 'a@b.com');
      expect(me.isEmailVerified, isFalse);
    });

    test('campo ausente é tratado como verificado (mesma regra do web)', () async {
      final client = _client((_) => _json({'id': 'u1', 'email': 'a@b.com'}, 200))..setAuthToken('tok');
      expect((await client.getAccount()).isEmailVerified, isTrue);
    });
  });

  test('502/503 continuam virando serviceUnavailable nos novos endpoints', () async {
    final client = _client((_) => http.Response('bad gateway', 502));
    await expectLater(
      client.requestPasswordReset('a@b.com'),
      throwsA(isA<ApiException>().having((e) => e.isServiceUnavailable, 'isServiceUnavailable', isTrue)),
    );
  });
}
