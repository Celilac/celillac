import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile_app/api/api_client.dart';
import 'package:mobile_app/api/api_exception.dart';
import 'package:mobile_app/api/models/consumer_models.dart';
import 'package:mobile_app/api/models/enums.dart';

ApiClient _client(
  http.Response Function(http.Request) handler, {
  void Function(http.Request)? capture,
}) {
  final api = ApiClient(
    baseUrl: 'http://api.test',
    httpClient: MockClient((request) async {
      capture?.call(request);
      return handler(request);
    }),
  );
  api.setAuthToken('tok');
  return api;
}

http.Response _json(Object body, int status) =>
    http.Response(jsonEncode(body), status);

const _meBody = {
  'consumer': {
    'id': 'c1',
    'userId': 'u1',
    'generalPreferences': {},
    'isFoodProfileComplete': false,
    'isFoodProfileCritical': false,
    'status': 'CONTA_CRIADA',
    'createdAt': '2026-08-01T10:00:00.000Z',
    'updatedAt': '2026-08-01T10:00:00.000Z',
  },
  'foodProfile': {
    'id': 'p1',
    'userId': 'u1',
    'acceptsCrossContamination': true,
    'restrictions': [
      {
        'id': 'r1',
        'allergen': 'GLUTEN',
        'severity': 'FATAL',
        'type': 'ALLERGY',
        'notes': 'Celíaco',
      },
    ],
  },
  'hasIncompleteProfileWarning': true,
};

const _profileBody = {
  'userId': 'u1',
  'acceptsCrossContamination': false,
  'restrictions': [
    {
      'id': 'r1',
      'allergen': 'LACTOSE',
      'severity': 'MEDIUM',
      'type': 'INTOLERANCE',
      'notes': null,
    },
  ],
};

void main() {
  group('getConsumerMe', () {
    test(
      'GET /consumer/me com Authorization e interpreta status, aviso e restrições',
      () async {
        late http.Request req;
        final client = _client(
          (_) => _json(_meBody, 200),
          capture: (r) => req = r,
        );

        final me = await client.getConsumerMe();

        expect(req.method, 'GET');
        expect(req.url.path, '/consumer/me');
        expect(req.headers['Authorization'], 'Bearer tok');
        expect(me.consumer.status, 'CONTA_CRIADA');
        expect(me.hasIncompleteProfileWarning, isTrue);
        expect(me.foodProfile!.acceptsCrossContamination, isTrue);
        expect(
          me.foodProfile!.restrictions.single.allergen,
          AllergenType.gluten,
        );
        expect(
          me.foodProfile!.restrictions.single.severity,
          SeverityLevel.fatal,
        );
      },
    );

    test('foodProfile null é aceito (consumidor sem perfil)', () async {
      final client = _client(
        (_) => _json({
          'consumer': _meBody['consumer'],
          'foodProfile': null,
          'hasIncompleteProfileWarning': true,
        }, 200),
      );

      final me = await client.getConsumerMe();

      expect(me.foodProfile, isNull);
      expect(me.hasIncompleteProfileWarning, isTrue);
    });
  });

  group('setConsumerStatus', () {
    test(
      'PATCH /consumer/status com action DEACTIVATE (sem targetUserId)',
      () async {
        late http.Request req;
        final client = _client(
          (_) => _json({
            'id': 'c1',
            'userId': 'u1',
            'status': 'INATIVO',
            'statusChangedAt': '2026-08-01T17:50:00.000Z',
            'statusChangedBy': 'u1',
            'statusChangeReason': null,
          }, 200),
          capture: (r) => req = r,
        );

        final res = await client.setConsumerStatus(
          ConsumerStatusAction.deactivate,
        );

        expect(req.method, 'PATCH');
        expect(req.url.path, '/consumer/status');
        expect(req.headers['Authorization'], 'Bearer tok');
        expect(jsonDecode(req.body), {'action': 'DEACTIVATE'});
        expect(res.status, 'INATIVO');
      },
    );

    test('ACTIVATE envia action ACTIVATE', () async {
      late http.Request req;
      final client = _client(
        (_) => _json({'id': 'c1', 'userId': 'u1', 'status': 'ATIVO'}, 200),
        capture: (r) => req = r,
      );

      final res = await client.setConsumerStatus(ConsumerStatusAction.activate);

      expect(jsonDecode(req.body), {'action': 'ACTIVATE'});
      expect(res.status, 'ATIVO');
    });
  });

  group('restrições do consumidor', () {
    test(
      'POST /consumer/restrictions com allergen, severity, type e notes',
      () async {
        late http.Request req;
        final client = _client(
          (_) => _json(_profileBody, 200),
          capture: (r) => req = r,
        );

        final profile = await client.addConsumerRestriction(
          allergen: AllergenType.lactose,
          severity: SeverityLevel.medium,
          type: 'INTOLERANCE',
          notes: 'leve',
        );

        expect(req.method, 'POST');
        expect(req.url.path, '/consumer/restrictions');
        expect(req.headers['Authorization'], 'Bearer tok');
        expect(jsonDecode(req.body), {
          'allergen': 'LACTOSE',
          'severity': 'MEDIUM',
          'type': 'INTOLERANCE',
          'notes': 'leve',
        });
        expect(profile.restrictions.single.allergen, AllergenType.lactose);
      },
    );

    test('type e notes são omitidos quando não informados', () async {
      late http.Request req;
      final client = _client(
        (_) => _json(_profileBody, 200),
        capture: (r) => req = r,
      );

      await client.addConsumerRestriction(
        allergen: AllergenType.gluten,
        severity: SeverityLevel.fatal,
      );

      expect(jsonDecode(req.body), {'allergen': 'GLUTEN', 'severity': 'FATAL'});
    });

    test('DELETE /consumer/restrictions/:allergen', () async {
      late http.Request req;
      final client = _client(
        (_) => _json({
          'userId': 'u1',
          'acceptsCrossContamination': false,
          'restrictions': [],
        }, 200),
        capture: (r) => req = r,
      );

      final profile = await client.removeConsumerRestriction(
        AllergenType.gluten,
      );

      expect(req.method, 'DELETE');
      expect(req.url.path, '/consumer/restrictions/GLUTEN');
      expect(req.headers['Authorization'], 'Bearer tok');
      expect(profile.restrictions, isEmpty);
    });
  });

  group('erros', () {
    final calls = <String, Future<Object?> Function(ApiClient)>{
      'getConsumerMe': (c) => c.getConsumerMe(),
      'setConsumerStatus': (c) =>
          c.setConsumerStatus(ConsumerStatusAction.deactivate),
      'addConsumerRestriction': (c) => c.addConsumerRestriction(
        allergen: AllergenType.soy,
        severity: SeverityLevel.low,
      ),
      'removeConsumerRestriction': (c) =>
          c.removeConsumerRestriction(AllergenType.soy),
    };

    for (final entry in calls.entries) {
      for (final status in [400, 401, 404, 429]) {
        test(
          '${entry.key}: $status vira ApiException com o statusCode',
          () async {
            final client = _client((_) => _json({'error': 'x'}, status));
            await expectLater(
              entry.value(client),
              throwsA(
                isA<ApiException>().having(
                  (e) => e.statusCode,
                  'statusCode',
                  status,
                ),
              ),
            );
          },
        );
      }

      for (final status in [502, 503]) {
        test('${entry.key}: $status vira serviceUnavailable', () async {
          final client = _client(
            (_) => http.Response('<html>Bad Gateway</html>', status),
          );
          await expectLater(
            entry.value(client),
            throwsA(
              isA<ApiException>().having(
                (e) => e.isServiceUnavailable,
                'isServiceUnavailable',
                isTrue,
              ),
            ),
          );
        });
      }
    }
  });
}
