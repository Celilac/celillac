import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/api/api_exception.dart';
import 'package:mobile_app/features/partners/partner_details_screen.dart';
import 'package:mobile_app/features/product/product_details_screen.dart';

import '../account/account_test_harness.dart';
import '../catalog/discovery_test_harness.dart';
import 'partner_test_harness.dart';

class _Routes {
  _Routes({
    this.partner,
    this.products,
    this.reviews,
    this.favorites,
    this.favoriteAdd,
    this.report,
  });

  Future<dynamic> Function()? partner;
  Future<dynamic> Function()? products;
  Future<dynamic> Function()? reviews;
  Future<dynamic> Function()? favorites;
  Future<dynamic> Function()? favoriteAdd;
  Future<dynamic> Function()? report;
}

Future<dynamic> _ok(Object body, [int status = 200]) async => jsonResponse(body, status);

Future<RecordingHttp> _open(
  WidgetTester tester,
  _Routes routes, {
  FakeLauncher? launcher,
}) async {
  final http = RecordingHttp((r) async {
    final path = r.url.path;
    if (path == '/partners/pt1') return await (routes.partner ?? () => _ok(partnerJson()))();
    if (path == '/catalog/products' && r.url.queryParameters.containsKey('partnerId')) {
      return await (routes.products ?? () => _ok(catalogPage([productSummary])))();
    }
    if (path == '/reviews/partner/pt1') return await (routes.reviews ?? () => _ok([reviewJson()]))();
    if (path == '/favorites' && r.method == 'GET') return await (routes.favorites ?? () => _ok([]))();
    if (path == '/favorites' && r.method == 'POST') {
      return await (routes.favoriteAdd ??
          () => _ok({'id': 'f1', 'userId': 'u1', 'partnerId': 'pt1', 'createdAt': '2026-01-01T00:00:00Z'}, 201))();
    }
    if (path == '/admin/reports') {
      return await (routes.report ??
          () => _ok({
                'id': 'rp1',
                'reporterId': 'u1',
                'partnerId': 'pt1',
                'reason': 'OTHER',
                'isFoodSafetyRisk': false,
                'status': 'PENDING',
                'createdAt': '2026-01-01T00:00:00Z',
              }, 201))();
    }
    return jsonResponse({'error': 'x'}, 404);
  });
  await pumpPartners(
    tester,
    api: http.client(token: 'tok'),
    launcher: launcher,
    home: const PartnerDetailsScreen(partnerId: 'pt1', partnerName: 'Cantina'),
  );
  await tester.pumpAndSettle();
  return http;
}

void main() {
  group('dados públicos', () {
    testWidgets('mostra nome, badge, descrição, endereço, telefone e atendimento; nunca dados fiscais', (tester) async {
      await _open(tester, _Routes());

      expect(find.text('Cantina Sem Glúten'), findsWidgets);
      expect(find.text('PJ • Empresa'), findsOneWidget);
      expect(find.text('Pratos sem contaminação cruzada.'), findsOneWidget);
      expect(find.textContaining('Av. Paulista, 1000'), findsOneWidget);
      expect(find.textContaining('(11) 99999-8888'), findsOneWidget);
      expect(find.textContaining('Grande SP'), findsOneWidget);
      expect(find.textContaining('12.345'), findsNothing);
      expect(find.textContaining('Secret'), findsNothing);
      expect(find.byKey(const Key('partner-closed-banner')), findsNothing);
    });

    testWidgets('TEMPORARILY_CLOSED exibe aviso e mantém os produtos visíveis', (tester) async {
      await _open(tester, _Routes(partner: () => _ok(partnerJson(status: 'TEMPORARILY_CLOSED'))));

      expect(find.byKey(const Key('partner-closed-banner')), findsOneWidget);
      expect(find.textContaining('Temporariamente fechado'), findsWidgets);
      expect(find.text('Biscoito de Arroz'), findsOneWidget);
    });

    testWidgets('loading enquanto o parceiro carrega', (tester) async {
      final pending = pendingResponse();
      final http = RecordingHttp((r) => pending.future);
      await pumpPartners(
        tester,
        api: http.client(),
        home: const PartnerDetailsScreen(partnerId: 'pt1', partnerName: 'Cantina'),
      );
      await tester.pump();

      expect(find.byKey(const Key('partner-loading')), findsOneWidget);
      pending.complete(jsonResponse({'error': 'x'}, 404));
      await tester.pumpAndSettle();
    });

    testWidgets('404 mostra erro amigável com "Tentar novamente"', (tester) async {
      final http = await _open(
        tester,
        _Routes(partner: () => _ok({'error': 'Parceiro comercial não encontrado.'}, 404)),
      );

      expect(find.byKey(const Key('partner-error')), findsOneWidget);
      expect(find.textContaining('Parceiro não encontrado'), findsOneWidget);
      expect(find.textContaining('comercial'), findsNothing);

      await tester.tap(find.byKey(const Key('partner-retry')));
      await tester.pumpAndSettle();
      expect(http.requests.where((r) => r.url.path == '/partners/pt1'), hasLength(2));
    });

    testWidgets('503 mostra mensagem de indisponibilidade', (tester) async {
      await _open(tester, _Routes(partner: () async => throw ApiException.serviceUnavailable()));
      expect(find.text(ApiException.serviceUnavailableMessage), findsOneWidget);
    });
  });

  group('produtos do parceiro', () {
    testWidgets('lista produtos sem exibir veredito e abre o detalhe do produto', (tester) async {
      final http = await _open(tester, _Routes());

      expect(find.text('Biscoito de Arroz'), findsOneWidget);
      expect(find.textContaining('CeliFood'), findsOneWidget);
      expect(find.byKey(const Key('partner-products-empty')), findsNothing);
      expect(http.requests.where((r) => r.url.path == '/compatibility/check'), isEmpty);

      await tester.tap(find.text('Biscoito de Arroz'));
      await tester.pumpAndSettle();

      expect(find.byType(ProductDetailsScreen), findsOneWidget);
      // O veredito só é pedido ao abrir o produto, via POST /compatibility/check.
      expect(http.requests.any((r) => r.url.path == '/compatibility/check' && r.method == 'POST'), isTrue);
    });

    testWidgets('sem produtos mostra estado vazio', (tester) async {
      await _open(tester, _Routes(products: () => _ok(catalogPage([]))));
      expect(find.byKey(const Key('partner-products-empty')), findsOneWidget);
    });

    testWidgets('falha nos produtos não derruba o detalhe e permite tentar de novo', (tester) async {
      var calls = 0;
      final http = await _open(
        tester,
        _Routes(products: () {
          calls++;
          return calls == 1 ? _ok({'error': 'boom tecnico'}, 500) : _ok(catalogPage([productSummary]));
        }),
      );

      expect(find.text('Cantina Sem Glúten'), findsWidgets);
      expect(find.byKey(const Key('partner-products-error')), findsOneWidget);
      expect(find.textContaining('boom'), findsNothing);
      expect(find.text('Pratos sem contaminação cruzada.'), findsOneWidget);

      await tester.tap(find.byKey(const Key('partner-products-retry')));
      await tester.pumpAndSettle();
      expect(find.text('Biscoito de Arroz'), findsOneWidget);
      expect(http.requests.where((r) => r.url.path == '/catalog/products'), hasLength(2));
    });

    testWidgets('"Carregar mais" busca a próxima página e acrescenta', (tester) async {
      final http = await _open(
        tester,
        _Routes(products: () => _ok(catalogPage([productSummary], total: 2))),
      );

      expect(find.byKey(const Key('partner-products-more')), findsOneWidget);
      await tester.tap(find.byKey(const Key('partner-products-more')));
      await tester.pumpAndSettle();

      final calls = http.requests.where((r) => r.url.path == '/catalog/products').toList();
      expect(calls, hasLength(2));
      expect(calls.last.url.queryParameters['page'], '2');
    });
  });

  group('avaliações', () {
    testWidgets('mostra média, total e comentários', (tester) async {
      await _open(tester, _Routes(reviews: () => _ok([reviewJson(rating: 5), reviewJson(id: 'r2', rating: 4)])));

      expect(find.textContaining('2 avaliações'), findsOneWidget);
      expect(find.textContaining('4,5'), findsOneWidget);
      expect(find.text('Atendimento ótimo'), findsNWidgets(2));
    });

    testWidgets('sem avaliações mostra estado vazio', (tester) async {
      await _open(tester, _Routes(reviews: () => _ok([])));
      expect(find.byKey(const Key('partner-reviews-empty')), findsOneWidget);
    });

    testWidgets('falha nas avaliações não derruba o detalhe e permite tentar de novo', (tester) async {
      var calls = 0;
      await _open(
        tester,
        _Routes(reviews: () {
          calls++;
          return calls == 1 ? _ok({'error': 'x'}, 500) : _ok([reviewJson()]);
        }),
      );

      expect(find.text('Biscoito de Arroz'), findsOneWidget);
      expect(find.byKey(const Key('partner-reviews-error')), findsOneWidget);

      await tester.tap(find.byKey(const Key('partner-reviews-retry')));
      await tester.pumpAndSettle();
      expect(find.text('Atendimento ótimo'), findsOneWidget);
    });
  });

  group('favoritar', () {
    testWidgets('estado inicial vem de GET /favorites e favoritar envia partnerId', (tester) async {
      final http = await _open(tester, _Routes());

      expect(find.byIcon(Icons.favorite_border), findsOneWidget);
      await tester.tap(find.byIcon(Icons.favorite_border));
      await tester.pumpAndSettle();

      final post = http.requests.singleWhere((r) => r.method == 'POST' && r.url.path == '/favorites');
      expect(jsonDecode(post.body), {'partnerId': 'pt1'});
      expect(find.byIcon(Icons.favorite), findsOneWidget);
    });

    testWidgets('parceiro já favorito aparece marcado', (tester) async {
      await _open(
        tester,
        _Routes(favorites: () => _ok([
              {'id': 'f1', 'userId': 'u1', 'partnerId': 'pt1', 'createdAt': '2026-01-01T00:00:00Z'},
            ])),
      );
      expect(find.byIcon(Icons.favorite), findsOneWidget);
    });

    testWidgets('falha ao carregar favoritos não atrapalha a tela', (tester) async {
      await _open(tester, _Routes(favorites: () => _ok({'error': 'x'}, 500)));
      expect(find.text('Biscoito de Arroz'), findsOneWidget);
      expect(find.byIcon(Icons.favorite_border), findsOneWidget);
    });

    testWidgets('403 (e-mail não verificado) mostra mensagem amigável e mantém desmarcado', (tester) async {
      await _open(tester, _Routes(favoriteAdd: () => _ok({'error': 'É necessário validar seu e-mail', 'code': 'EMAIL_NOT_VERIFIED'}, 403)));

      await tester.tap(find.byIcon(Icons.favorite_border));
      await tester.pumpAndSettle();

      expect(find.textContaining('Verifique seu e-mail'), findsOneWidget);
      expect(find.textContaining('OTP'), findsNothing);
      expect(find.byIcon(Icons.favorite_border), findsOneWidget);
    });
  });

  group('denunciar', () {
    Future<void> openDialog(WidgetTester tester) async {
      await tester.tap(find.byKey(const Key('partner-report-button')));
      await tester.pumpAndSettle();
    }

    testWidgets('envia partnerId e motivo e confirma ao usuário', (tester) async {
      final http = await _open(tester, _Routes());

      await openDialog(tester);
      expect(find.text('Denunciar Cantina Sem Glúten'), findsOneWidget);
      await tester.tap(find.text('Denunciar').last);
      await tester.pumpAndSettle();

      final post = http.requests.singleWhere((r) => r.url.path == '/admin/reports');
      final body = jsonDecode(post.body) as Map<String, dynamic>;
      expect(body['partnerId'], 'pt1');
      expect(body.containsKey('productId'), isFalse);
      expect(body['reason'], 'MISSING_ALLERGEN');
      expect(find.text('Denúncia enviada para análise.'), findsOneWidget);
    });

    testWidgets('falha mostra mensagem amigável dentro do diálogo e mantém aberto', (tester) async {
      await _open(tester, _Routes(report: () => _ok({'error': 'SQL: violates constraint'}, 500)));

      await openDialog(tester);
      await tester.tap(find.text('Denunciar').last);
      await tester.pumpAndSettle();

      expect(find.textContaining('Não foi possível enviar a denúncia'), findsOneWidget);
      expect(find.textContaining('SQL'), findsNothing);
      expect(find.text('Denunciar Cantina Sem Glúten'), findsOneWidget);
    });
  });

  group('contato e mapa', () {
    testWidgets('ligar abre tel: com o telefone normalizado', (tester) async {
      final launcher = FakeLauncher();
      await _open(tester, _Routes(), launcher: launcher);

      await tester.tap(find.byKey(const Key('partner-call')));
      await tester.pumpAndSettle();

      expect(launcher.opened.single.toString(), 'tel:11999998888');
    });

    testWidgets('abrir no mapa usa busca com endereço, cidade e UF', (tester) async {
      final launcher = FakeLauncher();
      await _open(tester, _Routes(), launcher: launcher);

      await tester.tap(find.byKey(const Key('partner-open-map')));
      await tester.pumpAndSettle();

      final uri = launcher.opened.single;
      expect(uri.host, 'www.google.com');
      expect(uri.queryParameters['query'], 'Av. Paulista, 1000, São Paulo - SP');
    });

    testWidgets('falha ao abrir mostra mensagem amigável', (tester) async {
      final launcher = FakeLauncher(result: false);
      await _open(tester, _Routes(), launcher: launcher);

      await tester.tap(find.byKey(const Key('partner-open-map')));
      await tester.pumpAndSettle();

      expect(find.textContaining('Não foi possível abrir o mapa'), findsOneWidget);

      await tester.tap(find.byKey(const Key('partner-call')));
      await tester.pumpAndSettle();
      expect(find.textContaining('Não foi possível abrir o telefone'), findsOneWidget);
    });

    testWidgets('sem telefone ou endereço os botões não aparecem', (tester) async {
      await _open(tester, _Routes(partner: () => _ok(partnerJson(phone: null, address: null))));

      expect(find.byKey(const Key('partner-call')), findsNothing);
      expect(find.byKey(const Key('partner-open-map')), findsNothing);
    });

    testWidgets('copiar endereço coloca o texto na área de transferência', (tester) async {
      String? copied;
      tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(SystemChannels.platform, (call) async {
        if (call.method == 'Clipboard.setData') copied = (call.arguments as Map)['text'] as String?;
        return null;
      });
      addTearDown(() => tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(SystemChannels.platform, null));
      await _open(tester, _Routes());

      await tester.tap(find.byKey(const Key('partner-copy-address')));
      await tester.pumpAndSettle();

      expect(copied, 'Av. Paulista, 1000, São Paulo - SP');
      expect(find.text('Endereço copiado.'), findsOneWidget);
    });
  });
}
