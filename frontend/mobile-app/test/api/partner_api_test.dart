import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile_app/api/api_client.dart';
import 'package:mobile_app/api/api_exception.dart';

ApiClient _client(
  http.Response Function(http.Request) handler, {
  void Function(http.Request)? capture,
  String? token = 'tok',
}) {
  final api = ApiClient(
    baseUrl: 'http://api.test',
    httpClient: MockClient((request) async {
      capture?.call(request);
      return handler(request);
    }),
  );
  if (token != null) api.setAuthToken(token);
  return api;
}

http.Response _json(Object body, int status) => http.Response(jsonEncode(body), status);

/// Resposta real de GET /partners: o backend inclui campos sensíveis que o app NÃO deve modelar nem exibir.
const _partnerJson = {
  'id': 'pt1',
  'userId': 'owner-1',
  'name': 'Cantina Sem Glúten',
  'cnpj': '12.345.678/0001-95',
  'legalNature': 'PJ',
  'documentNumber': '12.345.678/0001-95',
  'documentType': 'CNPJ',
  'companyName': 'Cantina LTDA',
  'responsibleName': 'Maria Silva',
  'description': 'Pratos sem contaminação cruzada.',
  'address': 'Av. Paulista, 1000',
  'phone': '11999998888',
  'type': 'RESTAURANT',
  'approvalStatus': 'APPROVED',
  'operationalStatus': 'TEMPORARILY_CLOSED',
  'city': 'São Paulo',
  'state': 'SP',
  'deliveryRegion': 'Grande SP',
  'logoUrl': 'https://img.test/logo.png',
};

void main() {
  group('GET /partners', () {
    test('usa método, path e envia Authorization quando há token', () async {
      late http.Request captured;
      final api = _client((_) => _json([_partnerJson], 200), capture: (r) => captured = r);

      final partners = await api.getPublicPartners();

      expect(captured.method, 'GET');
      expect(captured.url.toString(), 'http://api.test/partners');
      expect(captured.headers['Authorization'], 'Bearer tok');
      expect(partners, hasLength(1));
      final p = partners.single;
      expect(p.id, 'pt1');
      expect(p.name, 'Cantina Sem Glúten');
      expect(p.type, 'RESTAURANT');
      expect(p.legalNature, 'PJ');
      expect(p.city, 'São Paulo');
      expect(p.state, 'SP');
      expect(p.isTemporarilyClosed, isTrue);
    });

    test('funciona sem token (rota pública) e aceita lista vazia', () async {
      late http.Request captured;
      final api = _client((_) => _json([], 200), capture: (r) => captured = r, token: null);

      final partners = await api.getPublicPartners();

      expect(partners, isEmpty);
      expect(captured.headers.containsKey('Authorization'), isFalse);
    });

    test('campos opcionais ausentes não quebram o parse', () async {
      final api = _client(
        (_) => _json([
          {'id': 'pt2', 'name': 'Mercado', 'type': 'MARKET', 'operationalStatus': 'ACTIVE'},
        ], 200),
      );

      final p = (await api.getPublicPartners()).single;

      expect(p.description, isNull);
      expect(p.address, isNull);
      expect(p.phone, isNull);
      expect(p.isTemporarilyClosed, isFalse);
    });

    for (final status in [400, 401, 404, 429]) {
      test('status $status vira ApiException com o mesmo código', () async {
        final api = _client((_) => _json({'error': 'x'}, status));
        await expectLater(
          api.getPublicPartners(),
          throwsA(isA<ApiException>().having((e) => e.statusCode, 'statusCode', status)),
        );
      });
    }

    for (final status in [502, 503]) {
      test('status $status vira serviceUnavailable', () async {
        final api = _client((_) => http.Response('Bad Gateway', status));
        await expectLater(
          api.getPublicPartners(),
          throwsA(isA<ApiException>().having((e) => e.isServiceUnavailable, 'isServiceUnavailable', isTrue)),
        );
      });
    }
  });

  group('GET /partners/:id', () {
    test('usa path com id e devolve o parceiro', () async {
      late http.Request captured;
      final api = _client((_) => _json(_partnerJson, 200), capture: (r) => captured = r);

      final p = await api.getPartner('pt1');

      expect(captured.method, 'GET');
      expect(captured.url.toString(), 'http://api.test/partners/pt1');
      expect(captured.headers['Authorization'], 'Bearer tok');
      expect(p.name, 'Cantina Sem Glúten');
      expect(p.deliveryRegion, 'Grande SP');
    });

    test('404 (inexistente ou não público) vira ApiException 404', () async {
      final api = _client((_) => _json({'error': 'Parceiro comercial não encontrado.'}, 404));
      await expectLater(
        api.getPartner('x'),
        throwsA(isA<ApiException>().having((e) => e.statusCode, 'statusCode', 404)),
      );
    });

    test('503 vira serviceUnavailable', () async {
      final api = _client((_) => http.Response('', 503));
      await expectLater(
        api.getPartner('x'),
        throwsA(isA<ApiException>().having((e) => e.isServiceUnavailable, 'isServiceUnavailable', isTrue)),
      );
    });
  });

  group('GET /catalog/products?partnerId', () {
    test('envia partnerId, page e limit e parseia a página', () async {
      late http.Request captured;
      final api = _client(
        (_) => _json({
          'data': [
            {
              'id': 'p1',
              'name': 'Pão',
              'brand': 'Cantina',
              'ingredients': 'Arroz',
              'hasGluten': false,
              'crossContamination': '',
              'analysisStatus': 'ANALISADO',
            },
          ],
          'total': 21,
          'page': 2,
          'limit': 20,
        }, 200),
        capture: (r) => captured = r,
      );

      final page = await api.getPartnerProducts('pt 1', page: 2);

      expect(captured.method, 'GET');
      expect(captured.url.path, '/catalog/products');
      expect(captured.url.queryParameters, {'partnerId': 'pt 1', 'page': '2', 'limit': '20'});
      expect(captured.headers['Authorization'], 'Bearer tok');
      expect(page.data.single.name, 'Pão');
      expect(page.total, 21);
    });

    test('429 e 503 mapeados', () async {
      final limited = _client((_) => _json({'error': 'x'}, 429));
      await expectLater(
        limited.getPartnerProducts('pt1'),
        throwsA(isA<ApiException>().having((e) => e.isTooManyRequests, 'isTooManyRequests', isTrue)),
      );
      final down = _client((_) => http.Response('', 503));
      await expectLater(
        down.getPartnerProducts('pt1'),
        throwsA(isA<ApiException>().having((e) => e.isServiceUnavailable, 'isServiceUnavailable', isTrue)),
      );
    });
  });

  group('GET /reviews/partner/:id', () {
    test('usa path e parseia a lista', () async {
      late http.Request captured;
      final api = _client(
        (_) => _json([
          {'id': 'r1', 'userId': 'u1', 'partnerId': 'pt1', 'rating': 4, 'comment': 'Ótimo', 'createdAt': '2026-01-02T10:00:00Z'},
        ], 200),
        capture: (r) => captured = r,
      );

      final reviews = await api.getPartnerReviews('pt1');

      expect(captured.method, 'GET');
      expect(captured.url.toString(), 'http://api.test/reviews/partner/pt1');
      expect(reviews.single.rating, 4);
    });

    test('400 e 503 mapeados', () async {
      final bad = _client((_) => _json({'error': 'x'}, 400));
      await expectLater(
        bad.getPartnerReviews('pt1'),
        throwsA(isA<ApiException>().having((e) => e.isBadRequest, 'isBadRequest', isTrue)),
      );
      final down = _client((_) => http.Response('', 502));
      await expectLater(
        down.getPartnerReviews('pt1'),
        throwsA(isA<ApiException>().having((e) => e.isServiceUnavailable, 'isServiceUnavailable', isTrue)),
      );
    });
  });

  group('favoritos de parceiro', () {
    test('POST /favorites envia só partnerId com Authorization', () async {
      late http.Request captured;
      final api = _client(
        (_) => _json({'id': 'f1', 'userId': 'u1', 'partnerId': 'pt1', 'createdAt': '2026-01-01T00:00:00Z'}, 201),
        capture: (r) => captured = r,
      );

      final fav = await api.addFavorite(partnerId: 'pt1');

      expect(captured.method, 'POST');
      expect(captured.url.toString(), 'http://api.test/favorites');
      expect(captured.headers['Authorization'], 'Bearer tok');
      expect(jsonDecode(captured.body), {'partnerId': 'pt1'});
      expect(fav.partnerId, 'pt1');
    });

    test('DELETE /favorites/:partnerId', () async {
      late http.Request captured;
      final api = _client((_) => _json({'success': true}, 200), capture: (r) => captured = r);

      await api.removeFavorite('pt1');

      expect(captured.method, 'DELETE');
      expect(captured.url.toString(), 'http://api.test/favorites/pt1');
    });

    test('401, 403 (e-mail não verificado) e 429 viram ApiException', () async {
      for (final status in [401, 403, 429]) {
        final api = _client((_) => _json({'error': 'x'}, status));
        await expectLater(
          api.addFavorite(partnerId: 'pt1'),
          throwsA(isA<ApiException>().having((e) => e.statusCode, 'statusCode', status)),
        );
      }
    });
  });

  group('denúncia de parceiro', () {
    test('POST /admin/reports envia partnerId, reason e isFoodSafetyRisk', () async {
      late http.Request captured;
      final api = _client(
        (_) => _json({
          'id': 'rp1',
          'reporterId': 'u1',
          'partnerId': 'pt1',
          'reason': 'OTHER',
          'isFoodSafetyRisk': false,
          'status': 'PENDING',
          'createdAt': '2026-01-01T00:00:00Z',
        }, 201),
        capture: (r) => captured = r,
      );

      final report = await api.createReport(partnerId: 'pt1', reason: 'OTHER', details: 'Detalhe');

      expect(captured.method, 'POST');
      expect(captured.url.toString(), 'http://api.test/admin/reports');
      expect(captured.headers['Authorization'], 'Bearer tok');
      expect(jsonDecode(captured.body), {
        'partnerId': 'pt1',
        'reason': 'OTHER',
        'details': 'Detalhe',
        'isFoodSafetyRisk': false,
      });
      expect(report.partnerId, 'pt1');
    });

    test('400, 401, 403, 429 e 503', () async {
      for (final status in [400, 401, 403, 429]) {
        final api = _client((_) => _json({'error': 'x'}, status));
        await expectLater(
          api.createReport(partnerId: 'pt1', reason: 'OTHER'),
          throwsA(isA<ApiException>().having((e) => e.statusCode, 'statusCode', status)),
        );
      }
      final down = _client((_) => http.Response('', 503));
      await expectLater(
        down.createReport(partnerId: 'pt1', reason: 'OTHER'),
        throwsA(isA<ApiException>().having((e) => e.isServiceUnavailable, 'isServiceUnavailable', isTrue)),
      );
    });
  });
}
