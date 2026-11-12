import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:mobile_app/api/api_exception.dart';
import 'package:mobile_app/core/storage/recent_checks_storage.dart';
import 'package:mobile_app/features/product/product_details_screen.dart';

import '../account/account_test_harness.dart';
import '../catalog/discovery_test_harness.dart';

final _fullProduct = {
  ...productSummary,
  'ingredients': 'Arroz integral, sal marinho.',
  'crossContamination': 'Pode conter traços de soja.',
  'shortDescription': 'Crocante e leve',
  'ean': '7891234567895',
  'imageUrl': 'https://img.test/cover.png',
  'images': [
    {'id': 'i1', 'url': 'https://img.test/cover.png', 'imageType': 'PRODUCT', 'displayOrder': 0, 'isCover': true},
    {'id': 'i2', 'url': 'https://img.test/label.png', 'imageType': 'LABEL', 'displayOrder': 1, 'isCover': false},
    {'id': 'i3', 'url': 'https://img.test/laudo.png', 'imageType': 'CERTIFICATION', 'caption': 'Laudo ACELBRA', 'displayOrder': 2, 'isCover': false},
  ],
  'dietaryFeatures': ['VEGAN', 'ORGANIC'],
  'nutritionalInfo': {'servingSize': '30g', 'calories': 120, 'proteins': 2.5, 'sodium': 80},
  'certifications': [
    {
      'id': 'c1',
      'certificationType': 'Sem Glúten',
      'certifyingEntity': 'ACELBRA',
      'certificateCode': 'X-1',
      'verificationStatus': 'VERIFIED_BY_CELILAC',
    },
    {
      'id': 'c2',
      'certificationType': 'Selo Falso',
      'certifyingEntity': 'Ninguém',
      'verificationStatus': 'REJECTED',
    },
  ],
};

const _blocked = {
  'isCompatible': false,
  'riskLevel': 'BLOCKED',
  'reasoning': 'Celíaco (FATAL) + traços de glúten detectados em cross_contamination.',
  'conflicts': [
    {'allergen': 'GLUTEN', 'severity': 'FATAL', 'reason': 'Detectado em cross_contamination.'},
  ],
};

const _noReviews = {'productId': 'p1', 'totalReviews': 0, 'averageRating': 0, 'reviews': []};

http.Response _route(
  http.Request r, {
  http.Response? product,
  http.Response? verdict,
  http.Response? reviews,
}) {
  switch (r.url.path) {
    case '/catalog/products/p1':
      return product ?? jsonResponse(_fullProduct, 200);
    case '/compatibility/check':
      return verdict ?? jsonResponse(_blocked, 200);
    case '/reviews/product/p1':
      return reviews ?? jsonResponse(_noReviews, 200);
    case '/favorites':
      return jsonResponse([], 200);
  }
  return jsonResponse({'error': 'not found'}, 404);
}

Future<RecentChecksStorage> _open(
  WidgetTester tester,
  RecordingHttp http, {
  LocalKeyValueStore? store,
}) async {
  final recents = RecentChecksStorage(store: store ?? MemoryKeyValueStore());
  await pumpDiscovery(
    tester,
    api: http.client(token: 'tok'),
    recents: recents,
    home: const ProductDetailsScreen(productId: 'p1'),
  );
  await tester.pumpAndSettle();
  return recents;
}

void main() {
  group('carregamento do produto', () {
    testWidgets('mostra loading enquanto carrega', (tester) async {
      final pending = pendingResponse();
      final http = RecordingHttp((r) => pending.future);
      await pumpDiscovery(
        tester,
        api: http.client(token: 'tok'),
        recents: RecentChecksStorage(store: MemoryKeyValueStore()),
        home: const ProductDetailsScreen(productId: 'p1'),
      );
      await tester.pump();

      expect(find.text('Carregando detalhes...'), findsOneWidget);
      pending.complete(jsonResponse({'error': 'x'}, 404));
      await tester.pumpAndSettle();
    });

    testWidgets('404 mostra "não encontrado" com botão de tentar de novo', (tester) async {
      final http = RecordingHttp((r) async => _route(r, product: jsonResponse({'error': 'Produto não encontrado.'}, 404)));
      await _open(tester, http);

      expect(find.byKey(const Key('product-error')), findsOneWidget);
      expect(find.textContaining('não encontrado'), findsOneWidget);
      expect(find.text('Tentar novamente'), findsOneWidget);
    });

    testWidgets('503 mostra mensagem padrão de indisponibilidade e recarrega', (tester) async {
      var fail = true;
      final http = RecordingHttp((r) async {
        if (fail && r.url.path == '/catalog/products/p1') return jsonResponse({'error': 'x'}, 503);
        return _route(r);
      });
      await _open(tester, http);

      expect(find.text(ApiException.serviceUnavailableMessage), findsOneWidget);

      fail = false;
      await tester.tap(find.text('Tentar novamente'));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('product-error')), findsNothing);
      expect(find.text('Biscoito de Arroz'), findsWidgets);
    });
  });

  group('veredito (sempre POST /compatibility/check)', () {
    testWidgets('exibe exatamente riskLevel, reasoning e conflitos vindos da API', (tester) async {
      final http = RecordingHttp((r) async => _route(r));
      await _open(tester, http);

      final check = http.requests.singleWhere((r) => r.url.path == '/compatibility/check');
      expect(check.method, 'POST');
      expect(check.body, contains('"userId":"u1"'));
      expect(check.body, contains('"productId":"p1"'));

      expect(find.text('BLOQUEADO'), findsOneWidget);
      expect(find.text(_blocked['reasoning'] as String), findsOneWidget);
      expect(find.byKey(const Key('verdict-conflicts')), findsOneWidget);
      final conflicts = find.byKey(const Key('verdict-conflicts'));
      expect(find.descendant(of: conflicts, matching: find.textContaining('GLUTEN')), findsOneWidget);
      expect(find.descendant(of: conflicts, matching: find.textContaining('FATAL')), findsOneWidget);
      expect(find.text('Detectado em cross_contamination.'), findsOneWidget);
    });

    testWidgets('SAFE da API é exibido como SAFE mesmo que o produto declare glúten', (tester) async {
      final http = RecordingHttp((r) async => _route(
            r,
            product: jsonResponse({..._fullProduct, 'hasGluten': true}, 200),
            verdict: jsonResponse({'isCompatible': true, 'riskLevel': 'SAFE', 'reasoning': 'Nada encontrado.', 'conflicts': []}, 200),
          ));
      await _open(tester, http);

      expect(find.text('COMPATÍVEL'), findsOneWidget);
      expect(find.text('BLOQUEADO'), findsNothing);
      expect(find.byKey(const Key('verdict-conflicts')), findsNothing);
    });

    testWidgets('UNEVALUATED é exibido como perfil incompleto', (tester) async {
      final http = RecordingHttp((r) async => _route(
            r,
            verdict: jsonResponse({'isCompatible': false, 'riskLevel': 'UNEVALUATED', 'reasoning': 'Perfil incompleto.', 'conflicts': []}, 200),
          ));
      await _open(tester, http);

      expect(find.text('PERFIL INCOMPLETO'), findsOneWidget);
      expect(find.text('Perfil incompleto.'), findsOneWidget);
    });

    testWidgets('ignora compatibilityReport embutido no GET do produto', (tester) async {
      final http = RecordingHttp((r) async => _route(
            r,
            product: jsonResponse({..._fullProduct, 'compatibilityReport': {'riskLevel': 'SAFE', 'isCompatible': true}}, 200),
          ));
      await _open(tester, http);

      expect(find.text('BLOQUEADO'), findsOneWidget);
      expect(find.text('COMPATÍVEL'), findsNothing);
    });

    testWidgets('falha do veredito nunca vira "seguro": mostra erro e permite tentar de novo', (tester) async {
      var fail = true;
      final http = RecordingHttp((r) async {
        if (fail && r.url.path == '/compatibility/check') return jsonResponse({'error': 'boom'}, 503);
        return _route(r);
      });
      await _open(tester, http);

      expect(find.byKey(const Key('verdict-error')), findsOneWidget);
      expect(find.text(ApiException.serviceUnavailableMessage), findsOneWidget);
      expect(find.text('COMPATÍVEL'), findsNothing);
      expect(find.text('Biscoito de Arroz'), findsWidgets); // produto continua visível

      fail = false;
      await tester.tap(find.byKey(const Key('verdict-retry')));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('verdict-error')), findsNothing);
      expect(find.text('BLOQUEADO'), findsOneWidget);
    });

    testWidgets('400 do veredito orienta revisar o perfil sem texto do backend', (tester) async {
      final http = RecordingHttp((r) async => _route(r, verdict: jsonResponse({'error': 'Perfil não encontrado SQL'}, 400)));
      await _open(tester, http);

      expect(find.byKey(const Key('verdict-error')), findsOneWidget);
      expect(find.textContaining('perfil'), findsWidgets);
      expect(find.textContaining('SQL'), findsNothing);
    });

    testWidgets('429 do veredito mostra mensagem de limite', (tester) async {
      final http = RecordingHttp((r) async => _route(r, verdict: jsonResponse({'error': 'x'}, 429)));
      await _open(tester, http);

      expect(find.textContaining('Muitas tentativas'), findsOneWidget);
    });
  });

  group('verificados recentemente', () {
    testWidgets('grava id, nome e marca após o veredito, sem o veredito', (tester) async {
      final store = MemoryKeyValueStore();
      final http = RecordingHttp((r) async => _route(r));
      final recents = await _open(tester, http, store: store);

      final items = await recents.load('u1');
      expect(items.single.productId, 'p1');
      expect(items.single.productName, 'Biscoito de Arroz');
      expect(items.single.brand, 'CeliFood');
      expect(store.data.values.single.toLowerCase(), isNot(contains('blocked')));
    });

    testWidgets('não grava quando o veredito falha', (tester) async {
      final store = MemoryKeyValueStore();
      final http = RecordingHttp((r) async => _route(r, verdict: jsonResponse({'error': 'x'}, 503)));
      final recents = await _open(tester, http, store: store);

      expect(await recents.load('u1'), isEmpty);
    });

    testWidgets('storage indisponível não impede de ver o veredito', (tester) async {
      final http = RecordingHttp((r) async => _route(r));
      await _open(tester, http, store: BrokenKeyValueStore());

      expect(tester.takeException(), isNull);
      expect(find.text('BLOQUEADO'), findsOneWidget);
    });
  });

  group('imagens, rótulos e laudos', () {
    testWidgets('carrossel com uma página por imagem, rotuladas por tipo', (tester) async {
      final http = RecordingHttp((r) async => _route(r));
      await _open(tester, http);

      expect(find.byKey(const Key('product-carousel')), findsOneWidget);
      expect(find.byKey(const Key('carousel-page-indicator')), findsOneWidget);
      expect(find.text('1 / 3'), findsOneWidget);
      expect(find.text('Produto'), findsOneWidget);

      await tester.drag(find.byKey(const Key('product-carousel')), const Offset(-800, 0));
      await tester.pumpAndSettle();
      expect(find.text('2 / 3'), findsOneWidget);
      expect(find.text('Rótulo'), findsOneWidget);

      await tester.drag(find.byKey(const Key('product-carousel')), const Offset(-800, 0));
      await tester.pumpAndSettle();
      expect(find.text('Laudo / Certificação'), findsOneWidget);
      expect(find.text('Laudo ACELBRA'), findsOneWidget);
    });

    testWidgets('imagem que não carrega mostra placeholder, sem quebrar a tela', (tester) async {
      final http = RecordingHttp((r) async => _route(r));
      await _open(tester, http);

      // No ambiente de teste, Image.network falha => errorBuilder.
      expect(find.text('Imagem indisponível'), findsWidgets);
      expect(tester.takeException(), isNull);
    });

    testWidgets('sem galeria usa imageUrl legado como única imagem', (tester) async {
      final http = RecordingHttp((r) async => _route(
            r,
            product: jsonResponse({...productSummary, 'imageUrl': 'https://img.test/only.png'}, 200),
          ));
      await _open(tester, http);

      expect(find.byKey(const Key('product-carousel')), findsOneWidget);
      expect(find.byKey(const Key('carousel-page-indicator')), findsNothing);
    });

    testWidgets('sem imagens mostra aviso e nenhum carrossel', (tester) async {
      final http = RecordingHttp((r) async => _route(r, product: jsonResponse(productSummary, 200)));
      await _open(tester, http);

      expect(find.byKey(const Key('product-no-images')), findsOneWidget);
      expect(find.text('Sem imagens cadastradas'), findsOneWidget);
      expect(find.byKey(const Key('product-carousel')), findsNothing);
    });
  });

  group('informações do produto', () {
    testWidgets('nutricional, certificações (sem rejeitadas) e características dietéticas', (tester) async {
      final http = RecordingHttp((r) async => _route(r));
      await _open(tester, http);

      expect(find.byKey(const Key('nutrition-card')), findsOneWidget);
      expect(find.text('Porção: 30g'), findsOneWidget);
      expect(find.text('120 kcal'), findsOneWidget);
      expect(find.text('2,5 g'), findsOneWidget);
      expect(find.text('80 mg'), findsOneWidget);

      expect(find.byKey(const Key('certifications-card')), findsOneWidget);
      expect(find.text('Sem Glúten'), findsOneWidget);
      expect(find.textContaining('ACELBRA'), findsOneWidget);
      expect(find.text('Verificado pelo CeLiLac'), findsOneWidget);
      expect(find.text('Selo Falso'), findsNothing);

      expect(find.byKey(const Key('dietary-features-card')), findsOneWidget);
      expect(find.text('Vegano'), findsOneWidget);
      expect(find.text('Orgânico'), findsOneWidget);
    });

    testWidgets('seções ausentes não aparecem', (tester) async {
      final http = RecordingHttp((r) async => _route(r, product: jsonResponse(productSummary, 200)));
      await _open(tester, http);

      expect(find.byKey(const Key('nutrition-card')), findsNothing);
      expect(find.byKey(const Key('certifications-card')), findsNothing);
      expect(find.byKey(const Key('dietary-features-card')), findsNothing);
    });

    testWidgets('ingredientes e contaminação cruzada aparecem como informados, sem cor de segurança', (tester) async {
      final http = RecordingHttp((r) async => _route(r));
      await _open(tester, http);

      expect(find.text('Arroz integral, sal marinho.'), findsOneWidget);
      expect(find.text('Pode conter traços de soja.'), findsOneWidget);
    });
  });

  group('avaliações', () {
    testWidgets('média, total e lista', (tester) async {
      final http = RecordingHttp((r) async => _route(
            r,
            reviews: jsonResponse({
              'productId': 'p1',
              'totalReviews': 2,
              'averageRating': 4.5,
              'reviews': [
                {'id': 'r1', 'userId': 'u2', 'rating': 5, 'comment': 'Seguro', 'createdAt': '2026-07-04T22:00:00.000Z'},
                {'id': 'r2', 'userId': 'u3', 'rating': 4, 'createdAt': '2026-07-05T10:00:00.000Z'},
              ],
            }, 200),
          ));
      await _open(tester, http);

      expect(find.byKey(const Key('reviews-section')), findsOneWidget);
      expect(find.textContaining('4,5'), findsOneWidget);
      expect(find.textContaining('2 avaliações'), findsOneWidget);
      expect(find.text('Seguro'), findsOneWidget);
    });

    testWidgets('sem avaliações', (tester) async {
      final http = RecordingHttp((r) async => _route(r));
      await _open(tester, http);

      expect(find.text('Nenhuma avaliação cadastrada ainda.'), findsOneWidget);
    });

    testWidgets('falha nas avaliações é local: avisa, permite tentar de novo e não afeta o veredito', (tester) async {
      var fail = true;
      final http = RecordingHttp((r) async {
        if (fail && r.url.path == '/reviews/product/p1') return jsonResponse({'error': 'x'}, 503);
        return _route(r);
      });
      await _open(tester, http);

      expect(find.byKey(const Key('reviews-error')), findsOneWidget);
      expect(find.text('BLOQUEADO'), findsOneWidget);

      fail = false;
      await tester.tap(find.byKey(const Key('reviews-retry')));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('reviews-error')), findsNothing);
      expect(find.text('Nenhuma avaliação cadastrada ainda.'), findsOneWidget);
    });
  });
}
