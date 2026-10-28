import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile_app/api/api_client.dart';
import 'package:mobile_app/api/api_exception.dart';
import 'package:mobile_app/api/models/auth_models.dart';
import 'package:mobile_app/api/models/enums.dart';
import 'package:mobile_app/api/models/food_profile_models.dart';

void main() {
  group('ApiClient', () {
    test('injects Authorization header when a token is set', () async {
      http.Request? captured;
      final client = ApiClient(
        httpClient: MockClient((request) async {
          captured = request;
          return http.Response(jsonEncode({'token': 't', 'expiresIn': '7d'}), 200);
        }),
      );

      client.setAuthToken('abc123');
      await client.login(const LoginPayload(email: 'a@b.com', password: 'pw'));

      expect(captured!.headers['Authorization'], 'Bearer abc123');
    });

    test('omits Authorization header when no token is set', () async {
      http.Request? captured;
      final client = ApiClient(
        httpClient: MockClient((request) async {
          captured = request;
          return http.Response(jsonEncode({'token': 't', 'expiresIn': '7d'}), 200);
        }),
      );

      await client.login(const LoginPayload(email: 'a@b.com', password: 'pw'));

      expect(captured!.headers.containsKey('Authorization'), isFalse);
    });

    test('throws ApiException with the backend error message on non-2xx', () async {
      final client = ApiClient(
        httpClient: MockClient((request) async {
          return http.Response(jsonEncode({'error': 'Credenciais inválidas.'}), 401);
        }),
      );

      await expectLater(
        client.login(const LoginPayload(email: 'a@b.com', password: 'wrong')),
        throwsA(
          isA<ApiException>()
              .having((e) => e.statusCode, 'statusCode', 401)
              .having((e) => e.message, 'message', 'Credenciais inválidas.')
              .having((e) => e.isUnauthorized, 'isUnauthorized', isTrue),
        ),
      );
    });

    test('a 400 on getFoodProfile is surfaced as isBadRequest (no-profile-yet signal)', () async {
      final client = ApiClient(
        httpClient: MockClient((request) async {
          return http.Response(
            jsonEncode({'error': 'Perfil alimentar não encontrado para o usuário.'}),
            400,
          );
        }),
      );

      await expectLater(
        client.getFoodProfile('user-1'),
        throwsA(isA<ApiException>().having((e) => e.isBadRequest, 'isBadRequest', isTrue)),
      );
    });

    test('a 409 on createFoodProfile is surfaced as isConflict', () async {
      final client = ApiClient(
        httpClient: MockClient((request) async {
          return http.Response(
            jsonEncode({'error': 'Este usuário já possui um perfil alimentar. Use a atualização.'}),
            409,
          );
        }),
      );

      final payload = FoodProfilePayload(
        userId: 'user-1',
        restrictions: const [Restriction(allergen: AllergenType.gluten, severity: SeverityLevel.fatal)],
        acceptsCrossContamination: false,
      );

      await expectLater(
        client.createFoodProfile(payload),
        throwsA(isA<ApiException>().having((e) => e.isConflict, 'isConflict', isTrue)),
      );
    });
    group('base URL', () {
      test('prefixes every request with the configured baseUrl', () async {
        http.Request? captured;
        final client = ApiClient(
          baseUrl: 'https://api.celilac.com.br',
          httpClient: MockClient((request) async {
            captured = request;
            return http.Response(jsonEncode({'token': 't', 'expiresIn': '7d'}), 200);
          }),
        );

        await client.login(const LoginPayload(email: 'a@b.com', password: 'pw'));

        expect(captured!.url.toString(), 'https://api.celilac.com.br/iam/login');
      });
    });

    group('service unavailable handling', () {
      const unavailableMessage =
          'Serviço temporariamente indisponível. O backend está em manutenção ou inicializando.';

      for (final status in [502, 503]) {
        test('a $status with an HTML body (proxy page) maps to the unavailable message', () async {
          final client = ApiClient(
            httpClient: MockClient((_) async => http.Response('<html>Bad Gateway</html>', status)),
          );

          await expectLater(
            client.getFoodProfile('user-1'),
            throwsA(
              isA<ApiException>()
                  .having((e) => e.message, 'message', unavailableMessage)
                  .having((e) => e.statusCode, 'statusCode', status)
                  .having((e) => e.isServiceUnavailable, 'isServiceUnavailable', isTrue),
            ),
          );
        });

        test('a $status with a JSON error body still maps to the unavailable message', () async {
          final client = ApiClient(
            httpClient: MockClient(
              (_) async => http.Response(jsonEncode({'error': 'DB down'}), status),
            ),
          );

          await expectLater(
            client.getFoodProfile('user-1'),
            throwsA(isA<ApiException>().having((e) => e.message, 'message', unavailableMessage)),
          );
        });
      }

      test('a SocketException maps to the unavailable message', () async {
        final client = ApiClient(
          httpClient: MockClient((_) async => throw const SocketException('Connection refused')),
        );

        await expectLater(
          client.getFoodProfile('user-1'),
          throwsA(
            isA<ApiException>()
                .having((e) => e.message, 'message', unavailableMessage)
                .having((e) => e.isServiceUnavailable, 'isServiceUnavailable', isTrue),
          ),
        );
      });

      test('an http.ClientException maps to the unavailable message', () async {
        final client = ApiClient(
          httpClient: MockClient((_) async => throw http.ClientException('Failed to fetch')),
        );

        await expectLater(
          client.getFoodProfile('user-1'),
          throwsA(isA<ApiException>().having((e) => e.message, 'message', unavailableMessage)),
        );
      });

      test('a TimeoutException maps to the unavailable message', () async {
        final client = ApiClient(
          httpClient: MockClient((_) async => throw TimeoutException('slow')),
        );

        await expectLater(
          client.getFoodProfile('user-1'),
          throwsA(isA<ApiException>().having((e) => e.message, 'message', unavailableMessage)),
        );
      });

      test('other 5xx errors are not reported as service unavailable', () async {
        final client = ApiClient(
          httpClient: MockClient((_) async => http.Response(jsonEncode({'error': 'Boom'}), 500)),
        );

        await expectLater(
          client.getFoodProfile('user-1'),
          throwsA(
            isA<ApiException>()
                .having((e) => e.message, 'message', 'Boom')
                .having((e) => e.isServiceUnavailable, 'isServiceUnavailable', isFalse),
          ),
        );
      });

      test('a non-JSON error body on a 4xx falls back to a generic message', () async {
        final client = ApiClient(
          httpClient: MockClient((_) async => http.Response('nope', 404)),
        );

        await expectLater(
          client.getFoodProfile('user-1'),
          throwsA(
            isA<ApiException>()
                .having((e) => e.statusCode, 'statusCode', 404)
                .having((e) => e.message, 'message', 'Erro 404'),
          ),
        );
      });
    });

    test('updateFoodProfile sends a PUT request', () async {
      http.Request? captured;
      final client = ApiClient(
        httpClient: MockClient((request) async {
          captured = request;
          return http.Response(
            jsonEncode({
              'id': 'fp-1',
              'userId': 'user-1',
              'isActive': true,
              'requiresHistoryRevalidation': false,
              'restrictions': [],
              'acceptsCrossContamination': false,
            }),
            200,
          );
        }),
      );

      await client.updateFoodProfile(
        'user-1',
        FoodProfilePayload(userId: 'user-1', restrictions: const [], acceptsCrossContamination: false),
      );

      expect(captured!.method, 'PUT');
    });
  });
}
