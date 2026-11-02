import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile_app/api/api_client.dart';
import 'package:mobile_app/api/api_exception.dart';
import 'package:mobile_app/api/models/enums.dart';

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

const _summary = {
  'id': 'p1',
  'name': 'Biscoito de Arroz',
  'brand': 'CeliFood',
  'ingredients': 'Arroz, sal.',
  'hasGluten': false,
  'crossContamination': '',
  'analysisStatus': 'ANALISADO',
};

const _detail = {
  ..._summary,
  'price': 12.5,
  'category': 'Snacks',
  'imageUrl': 'https://img.test/cover.png',
  'shortDescription': 'Crocante',
  'ean': '7891234567895',
  'mayContainTraces': 'Soja',
  'images': [
    {'id': 'i2', 'url': 'https://img.test/label.png', 'imageType': 'LABEL', 'displayOrder': 1, 'isCover': false},
    {'id': 'i1', 'url': 'https://img.test/cover.png', 'imageType': 'PRODUCT', 'caption': 'Frente', 'displayOrder': 0, 'isCover': true},
  ],
  'dietaryFeatures': ['VEGAN', 'ORGANIC'],
  'nutritionalInfo': {'servingSize': '30g', 'calories': 120, 'proteins': 2.5, 'sodium': 80},
  'certifications': [
    {
      'id': 'c1',
      'certificationType': 'Sem Glúten',
      'certifyingEntity': 'ACELBRA',
      'certificateCode': 'X-1',
      'validUntil': '2027-01-01',
      'imageId': 'i2',
      'verificationStatus': 'VERIFIED_BY_CELILAC',
    },
  ],
  // O app deve ignorar: o veredito só vem de POST /compatibility/check.
  'compatibilityReport': {'riskLevel': 'SAFE', 'isCompatible': true},
};

void main() {
  group('searchProducts', () {
    test('GET /catalog/products com q, page e limit (compatível com o scanner)', () async {
      late http.Request sent;
      final api = _client(
        (_) => _json({'data': [_summary], 'total': 1, 'page': 1, 'limit': 20}, 200),
        capture: (r) => sent = r,
      );

      final result = await api.searchProducts('arroz doce');

      expect(sent.method, 'GET');
      expect(sent.url.path, '/catalog/products');
      expect(sent.url.queryParameters, {'q': 'arroz doce', 'page': '1', 'limit': '20'});
      expect(sent.headers['Authorization'], 'Bearer tok');
      expect(result.data.single.name, 'Biscoito de Arroz');
      expect(result.total, 1);
    });

    test('filtros viram avoidAllergens (separados por vírgula) e onlyCompatible', () async {
      late http.Request sent;
      final api = _client(
        (_) => _json({'data': [], 'total': 0, 'page': 2, 'limit': 10}, 200),
        capture: (r) => sent = r,
      );

      await api.searchProducts(
        '',
        page: 2,
        limit: 10,
        avoidAllergens: [AllergenType.gluten, AllergenType.lactose],
        onlyCompatible: true,
      );

      expect(sent.url.queryParameters['q'], '');
      expect(sent.url.queryParameters['page'], '2');
      expect(sent.url.queryParameters['limit'], '10');
      expect(sent.url.queryParameters['avoidAllergens'], 'GLUTEN,LACTOSE');
      expect(sent.url.queryParameters['onlyCompatible'], 'true');
    });

    test('sem filtros não envia avoidAllergens nem onlyCompatible', () async {
      late http.Request sent;
      final api = _client(
        (_) => _json({'data': [], 'total': 0, 'page': 1, 'limit': 20}, 200),
        capture: (r) => sent = r,
      );

      await api.searchProducts('x');

      expect(sent.url.queryParameters.containsKey('avoidAllergens'), isFalse);
      expect(sent.url.queryParameters.containsKey('onlyCompatible'), isFalse);
    });

    test('ignora compatibilityReport embutido no item', () async {
      final api = _client(
        (_) => _json({
          'data': [
            {..._summary, 'compatibilityReport': {'riskLevel': 'SAFE'}},
          ],
          'total': 1,
          'page': 1,
          'limit': 20,
        }, 200),
      );

      final result = await api.searchProducts('x');

      expect(result.data.single.id, 'p1');
    });

    for (final status in [400, 401, 429]) {
      test('$status vira ApiException com o status', () async {
        final api = _client((_) => _json({'error': 'x'}, status));
        await expectLater(
          api.searchProducts('x'),
          throwsA(isA<ApiException>().having((e) => e.statusCode, 'status', status)),
        );
      });
    }

    for (final status in [502, 503]) {
      test('$status vira serviceUnavailable', () async {
        final api = _client((_) => http.Response('bad gateway', status));
        await expectLater(
          api.searchProducts('x'),
          throwsA(isA<ApiException>().having((e) => e.isServiceUnavailable, 'unavailable', true)),
        );
      });
    }

    test('erro de rede vira serviceUnavailable', () async {
      final api = ApiClient(
        baseUrl: 'http://api.test',
        httpClient: MockClient((_) async => throw http.ClientException('offline')),
      );
      await expectLater(
        api.searchProducts('x'),
        throwsA(isA<ApiException>().having((e) => e.isServiceUnavailable, 'unavailable', true)),
      );
    });
  });

  group('getProductById', () {
    test('GET /catalog/products/:id e parse do detalhe completo', () async {
      late http.Request sent;
      final api = _client((_) => _json(_detail, 200), capture: (r) => sent = r);

      final product = await api.getProductById('p1');

      expect(sent.method, 'GET');
      expect(sent.url.path, '/catalog/products/p1');
      expect(sent.headers['Authorization'], 'Bearer tok');
      expect(product.shortDescription, 'Crocante');
      expect(product.ean, '7891234567895');
      expect(product.mayContainTraces, 'Soja');
      expect(product.images.map((i) => i.id), ['i2', 'i1']);
      expect(product.images.last.isCover, isTrue);
      expect(product.images.last.caption, 'Frente');
      expect(product.dietaryFeatures, ['VEGAN', 'ORGANIC']);
      expect(product.nutritionalInfo!.servingSize, '30g');
      expect(product.nutritionalInfo!.calories, 120);
      expect(product.nutritionalInfo!.proteins, 2.5);
      expect(product.certifications.single.certifyingEntity, 'ACELBRA');
      expect(product.certifications.single.verificationStatus, 'VERIFIED_BY_CELILAC');
    });

    test('campos opcionais ausentes viram vazios', () async {
      final api = _client((_) => _json(_summary, 200));

      final product = await api.getProductById('p1');

      expect(product.images, isEmpty);
      expect(product.dietaryFeatures, isEmpty);
      expect(product.certifications, isEmpty);
      expect(product.nutritionalInfo, isNull);
      expect(product.imageUrl, isNull);
    });

    test('404 vira ApiException 404', () async {
      final api = _client((_) => _json({'error': 'Produto não encontrado.'}, 404));
      await expectLater(
        api.getProductById('nope'),
        throwsA(isA<ApiException>().having((e) => e.statusCode, 'status', 404)),
      );
    });

    for (final status in [400, 401, 429]) {
      test('$status vira ApiException com o status', () async {
        final api = _client((_) => _json({'error': 'x'}, status));
        await expectLater(
          api.getProductById('p1'),
          throwsA(isA<ApiException>().having((e) => e.statusCode, 'status', status)),
        );
      });
    }

    test('503 vira serviceUnavailable', () async {
      final api = _client((_) => http.Response('', 503));
      await expectLater(
        api.getProductById('p1'),
        throwsA(isA<ApiException>().having((e) => e.isServiceUnavailable, 'unavailable', true)),
      );
    });
  });

  group('checkCompatibility', () {
    test('POST /compatibility/check com userId e productId e Authorization', () async {
      late http.Request sent;
      final api = _client(
        (_) => _json({
          'isCompatible': false,
          'riskLevel': 'BLOCKED',
          'reasoning': 'Glúten detectado.',
          'conflicts': [
            {'allergen': 'GLUTEN', 'severity': 'FATAL', 'reason': 'Contém trigo.'},
          ],
        }, 200),
        capture: (r) => sent = r,
      );

      final report = await api.checkCompatibility('u1', 'p1');

      expect(sent.method, 'POST');
      expect(sent.url.path, '/compatibility/check');
      expect(sent.headers['Authorization'], 'Bearer tok');
      expect(jsonDecode(sent.body), {'userId': 'u1', 'productId': 'p1'});
      expect(report.riskLevel, RiskLevel.blocked);
      expect(report.reasoning, 'Glúten detectado.');
      expect(report.conflicts.single.allergen, 'GLUTEN');
    });

    for (final status in [400, 401, 403, 404, 429]) {
      test('$status vira ApiException com o status', () async {
        final api = _client((_) => _json({'error': 'x'}, status));
        await expectLater(
          api.checkCompatibility('u1', 'p1'),
          throwsA(isA<ApiException>().having((e) => e.statusCode, 'status', status)),
        );
      });
    }

    for (final status in [502, 503]) {
      test('$status vira serviceUnavailable', () async {
        final api = _client((_) => http.Response('', status));
        await expectLater(
          api.checkCompatibility('u1', 'p1'),
          throwsA(isA<ApiException>().having((e) => e.isServiceUnavailable, 'unavailable', true)),
        );
      });
    }
  });

  group('getProductReviews', () {
    test('GET /reviews/product/:id e parse do objeto {averageRating,totalReviews,reviews}', () async {
      late http.Request sent;
      final api = _client(
        (_) => _json({
          'productId': 'p1',
          'totalReviews': 2,
          'averageRating': 4.5,
          'reviews': [
            {'id': 'r1', 'userId': 'u1', 'rating': 5, 'comment': 'Seguro', 'createdAt': '2026-07-04T22:00:00.000Z'},
            {'id': 'r2', 'userId': 'u2', 'rating': 4, 'createdAt': '2026-07-05T10:00:00.000Z'},
          ],
        }, 200),
        capture: (r) => sent = r,
        token: null,
      );

      final reviews = await api.getProductReviews('p1');

      expect(sent.method, 'GET');
      expect(sent.url.path, '/reviews/product/p1');
      expect(sent.headers.containsKey('Authorization'), isFalse);
      expect(reviews.totalReviews, 2);
      expect(reviews.averageRating, 4.5);
      expect(reviews.reviews.first.productId, 'p1');
      expect(reviews.reviews.first.comment, 'Seguro');
      expect(reviews.reviews.last.comment, isNull);
    });

    test('sem avaliações', () async {
      final api = _client(
        (_) => _json({'productId': 'p1', 'totalReviews': 0, 'averageRating': 0, 'reviews': []}, 200),
      );
      final reviews = await api.getProductReviews('p1');
      expect(reviews.reviews, isEmpty);
      expect(reviews.averageRating, 0);
    });

    for (final status in [400, 429]) {
      test('$status vira ApiException com o status', () async {
        final api = _client((_) => _json({'error': 'x'}, status));
        await expectLater(
          api.getProductReviews('p1'),
          throwsA(isA<ApiException>().having((e) => e.statusCode, 'status', status)),
        );
      });
    }

    test('503 vira serviceUnavailable', () async {
      final api = _client((_) => http.Response('', 503));
      await expectLater(
        api.getProductReviews('p1'),
        throwsA(isA<ApiException>().having((e) => e.isServiceUnavailable, 'unavailable', true)),
      );
    });
  });
}
