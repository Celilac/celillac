import 'dart:convert';

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
      );

      await expectLater(
        client.createFoodProfile(payload),
        throwsA(isA<ApiException>().having((e) => e.isConflict, 'isConflict', isTrue)),
      );
    });
  });
}
