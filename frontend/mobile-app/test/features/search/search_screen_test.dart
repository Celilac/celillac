import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/api/api_exception.dart';
import 'package:mobile_app/core/storage/recent_checks_storage.dart';
import 'package:mobile_app/features/search/search_screen.dart';

import '../account/account_test_harness.dart';
import '../catalog/discovery_test_harness.dart';

Future<void> _open(
  WidgetTester tester,
  RecordingHttp http, {
  MemoryKeyValueStore? store,
  LocalKeyValueStore? rawStore,
}) async {
  await pumpDiscovery(
    tester,
    api: http.client(token: 'tok'),
    recents: RecentChecksStorage(store: rawStore ?? store ?? MemoryKeyValueStore()),
    home: const SearchScreen(),
  );
  await tester.pumpAndSettle();
}

Future<void> _search(WidgetTester tester, String text) async {
  await tester.enterText(find.byKey(const Key('search-field')), text);
  await tester.testTextInput.receiveAction(TextInputAction.search);
  await tester.pumpAndSettle();
}

List<String> _catalogCalls(RecordingHttp http) =>
    http.requests.where((r) => r.url.path == '/catalog/products').map((r) => r.url.query).toList();

void main() {
  group('estado inicial', () {
    testWidgets('não chama a API sozinho e orienta a busca', (tester) async {
      final http = RecordingHttp((r) async => jsonResponse(catalogPage([]), 200));
      await _open(tester, http);

      expect(http.requests, isEmpty);
      expect(find.byKey(const Key('search-hint')), findsOneWidget);
      expect(find.byKey(const Key('recent-checks')), findsNothing);
    });

    testWidgets('mostra "verificados recentemente" do usuário, sem veredito', (tester) async {
      final store = MemoryKeyValueStore();
      await RecentChecksStorage(store: store).save(
        'u1',
        const RecentCheck(productId: 'p9', productName: 'Pão sem glúten', brand: 'Padaria X'),
      );
      final http = RecordingHttp((r) async => jsonResponse(catalogPage([]), 200));
      await _open(tester, http, store: store);

      expect(find.byKey(const Key('recent-checks')), findsOneWidget);
      expect(find.text('Verificados recentemente'), findsOneWidget);
      expect(find.text('Pão sem glúten'), findsOneWidget);
      expect(find.text('Padaria X'), findsOneWidget);
      expect(find.text('COMPATÍVEL'), findsNothing);
      expect(http.requests, isEmpty);
    });

    testWidgets('storage local indisponível: tela abre normalmente sem histórico', (tester) async {
      final http = RecordingHttp((r) async => jsonResponse(catalogPage([]), 200));
      await _open(tester, http, rawStore: BrokenKeyValueStore());

      expect(tester.takeException(), isNull);
      expect(find.byKey(const Key('search-hint')), findsOneWidget);
      expect(find.byKey(const Key('recent-checks')), findsNothing);
    });

    testWidgets('tocar em um recente abre o detalhe (que refaz a verificação)', (tester) async {
      final store = MemoryKeyValueStore();
      await RecentChecksStorage(store: store).save(
        'u1',
        const RecentCheck(productId: 'p1', productName: 'Biscoito de Arroz', brand: 'CeliFood'),
      );
      final http = RecordingHttp((r) async {
        if (r.url.path == '/catalog/products/p1') return jsonResponse(productSummary, 200);
        return jsonResponse({'error': 'x'}, 404);
      });
      await _open(tester, http, store: store);

      await tester.tap(find.byKey(const Key('recent-p1')));
      await tester.pumpAndSettle();

      expect(http.requests.any((r) => r.url.path == '/catalog/products/p1'), isTrue);
      expect(http.requests.any((r) => r.url.path == '/compatibility/check'), isTrue);
    });
  });

  group('busca', () {
    testWidgets('mostra loading e depois os resultados sem nenhum veredito', (tester) async {
      final pending = pendingResponse();
      final http = RecordingHttp((r) => pending.future);
      await _open(tester, http);

      await tester.enterText(find.byKey(const Key('search-field')), 'arroz');
      await tester.testTextInput.receiveAction(TextInputAction.search);
      await tester.pump();
      expect(find.byKey(const Key('search-loading')), findsOneWidget);

      pending.complete(jsonResponse(
        catalogPage([
          {
            ...productSummary,
            // Mesmo que o backend embuta um veredito na lista, o app não o exibe.
            'compatibilityReport': {'riskLevel': 'SAFE', 'isCompatible': true},
          },
        ]),
        200,
      ));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('search-loading')), findsNothing);
      expect(find.text('Biscoito de Arroz'), findsOneWidget);
      expect(find.text('CeliFood'), findsOneWidget);
      expect(find.text('COMPATÍVEL'), findsNothing);
      expect(Uri.splitQueryString(_catalogCalls(http).single)['q'], 'arroz');
    });

    testWidgets('lista vazia', (tester) async {
      final http = RecordingHttp((r) async => jsonResponse(catalogPage([]), 200));
      await _open(tester, http);
      await _search(tester, 'xyz');

      expect(find.byKey(const Key('search-empty')), findsOneWidget);
      expect(find.textContaining('Nenhum produto encontrado'), findsOneWidget);
    });

    testWidgets('erro 503 mostra mensagem amigável e permite tentar de novo', (tester) async {
      var fail = true;
      final http = RecordingHttp((r) async {
        if (fail) return jsonResponse({'error': 'upstream'}, 503);
        return jsonResponse(catalogPage([productSummary]), 200);
      });
      await _open(tester, http);
      await _search(tester, 'arroz');

      expect(find.byKey(const Key('search-error')), findsOneWidget);
      expect(find.text(ApiException.serviceUnavailableMessage), findsOneWidget);

      fail = false;
      await tester.tap(find.text('Tentar novamente'));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('search-error')), findsNothing);
      expect(find.text('Biscoito de Arroz'), findsOneWidget);
    });

    testWidgets('429 mostra mensagem de limite sem texto do backend', (tester) async {
      final http = RecordingHttp((r) async => jsonResponse({'error': 'rate-limit-interno'}, 429));
      await _open(tester, http);
      await _search(tester, 'arroz');

      expect(find.textContaining('Muitas tentativas'), findsOneWidget);
      expect(find.textContaining('rate-limit-interno'), findsNothing);
    });

    testWidgets('paginação: "Carregar mais" busca a próxima página e acrescenta', (tester) async {
      final http = RecordingHttp((r) async {
        final page = r.url.queryParameters['page'];
        if (page == '2') {
          return jsonResponse(
            catalogPage([
              {...productSummary, 'id': 'p2', 'name': 'Bolo de Milho'},
            ], total: 2, page: 2),
            200,
          );
        }
        return jsonResponse(catalogPage([productSummary], total: 2), 200);
      });
      await _open(tester, http);
      await _search(tester, 'a');

      await tester.tap(find.byKey(const Key('load-more')));
      await tester.pumpAndSettle();

      expect(find.text('Biscoito de Arroz'), findsOneWidget);
      expect(find.text('Bolo de Milho'), findsOneWidget);
      expect(find.byKey(const Key('load-more')), findsNothing);
      expect(_catalogCalls(http).last, contains('page=2'));
    });

    testWidgets('falha ao carregar mais mantém a lista e avisa', (tester) async {
      final http = RecordingHttp((r) async {
        if (r.url.queryParameters['page'] == '2') return jsonResponse({'error': 'x'}, 503);
        return jsonResponse(catalogPage([productSummary], total: 2), 200);
      });
      await _open(tester, http);
      await _search(tester, 'a');

      await tester.tap(find.byKey(const Key('load-more')));
      await tester.pumpAndSettle();

      expect(find.text('Biscoito de Arroz'), findsOneWidget);
      expect(find.text(ApiException.serviceUnavailableMessage), findsOneWidget);
      expect(find.byKey(const Key('load-more')), findsOneWidget);
    });

    testWidgets('tocar no resultado abre o detalhe', (tester) async {
      final http = RecordingHttp((r) async {
        if (r.url.path == '/catalog/products') return jsonResponse(catalogPage([productSummary]), 200);
        if (r.url.path == '/catalog/products/p1') return jsonResponse(productSummary, 200);
        return jsonResponse({'error': 'x'}, 404);
      });
      await _open(tester, http);
      await _search(tester, 'arroz');

      await tester.tap(find.byKey(const Key('product-result-p1')));
      await tester.pumpAndSettle();

      expect(http.requests.any((r) => r.url.path == '/catalog/products/p1'), isTrue);
    });
  });

  group('filtros (parâmetros da API, sem filtro local)', () {
    testWidgets('"Evitar glúten" envia avoidAllergens=GLUTEN mesmo sem texto', (tester) async {
      final http = RecordingHttp((r) async => jsonResponse(catalogPage([productSummary]), 200));
      await _open(tester, http);

      await tester.tap(find.byKey(const Key('filter-GLUTEN')));
      await tester.pumpAndSettle();

      final params = Uri.splitQueryString(_catalogCalls(http).single);
      expect(params['avoidAllergens'], 'GLUTEN');
      expect(params['q'], '');
      expect(find.text('Biscoito de Arroz'), findsOneWidget);
    });

    testWidgets('combina vários alérgenos e "somente compatíveis"', (tester) async {
      final http = RecordingHttp((r) async => jsonResponse(catalogPage([]), 200));
      await _open(tester, http);

      await tester.tap(find.byKey(const Key('filter-GLUTEN')));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('filter-LACTOSE')));
      await tester.pumpAndSettle();
      await tester.ensureVisible(find.byKey(const Key('filter-only-compatible')));
      await tester.tap(find.byKey(const Key('filter-only-compatible')));
      await tester.pumpAndSettle();

      final params = Uri.splitQueryString(_catalogCalls(http).last);
      expect(params['avoidAllergens'], 'GLUTEN,LACTOSE');
      expect(params['onlyCompatible'], 'true');
    });

    testWidgets('desmarcar o filtro sem texto volta ao estado inicial, sem nova chamada', (tester) async {
      final http = RecordingHttp((r) async => jsonResponse(catalogPage([productSummary]), 200));
      await _open(tester, http);

      await tester.tap(find.byKey(const Key('filter-GLUTEN')));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('filter-GLUTEN')));
      await tester.pumpAndSettle();

      expect(_catalogCalls(http).length, 1);
      expect(find.byKey(const Key('search-hint')), findsOneWidget);
      expect(find.text('Biscoito de Arroz'), findsNothing);
    });

    testWidgets('desmarcar o filtro com texto refaz a busca sem avoidAllergens', (tester) async {
      final http = RecordingHttp((r) async => jsonResponse(catalogPage([]), 200));
      await _open(tester, http);

      await tester.tap(find.byKey(const Key('filter-GLUTEN')));
      await tester.pumpAndSettle();
      await _search(tester, 'arroz');
      await tester.tap(find.byKey(const Key('filter-GLUTEN')));
      await tester.pumpAndSettle();

      final params = Uri.splitQueryString(_catalogCalls(http).last);
      expect(params['q'], 'arroz');
      expect(params.containsKey('avoidAllergens'), isFalse);
    });

    testWidgets('exibe aviso de que filtros não substituem a verificação', (tester) async {
      final http = RecordingHttp((r) async => jsonResponse(catalogPage([]), 200));
      await _open(tester, http);

      expect(find.byKey(const Key('filters-disclaimer')), findsOneWidget);
      expect(find.textContaining('não garantem'), findsOneWidget);
    });
  });
}
