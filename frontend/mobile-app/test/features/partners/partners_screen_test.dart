import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/api/api_exception.dart';
import 'package:mobile_app/features/partners/partners_screen.dart';

import '../account/account_test_harness.dart';
import 'partner_test_harness.dart';

Future<RecordingHttp> _open(
  WidgetTester tester,
  Future<dynamic> Function(RecordingHttp http) respond,
) async {
  late RecordingHttp http;
  http = RecordingHttp((r) async {
    if (r.url.path == '/partners') return await respond(http);
    // Navegação para o detalhe: respostas neutras.
    return jsonResponse({'error': 'x'}, 404);
  });
  await pumpPartners(tester, api: http.client(token: 'tok'), home: const PartnersScreen());
  await tester.pumpAndSettle();
  return http;
}

void main() {
  testWidgets('mostra loading enquanto carrega', (tester) async {
    final pending = pendingResponse();
    final http = RecordingHttp((r) => pending.future);
    await pumpPartners(tester, api: http.client(), home: const PartnersScreen());
    await tester.pump();

    expect(find.byKey(const Key('partners-loading')), findsOneWidget);

    pending.complete(jsonResponse([], 200));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('partners-loading')), findsNothing);
  });

  testWidgets('lista parceiros com tipo, cidade e badge PJ/PF, sem dados fiscais', (tester) async {
    await _open(
      tester,
      (_) async => jsonResponse([
        partnerJson(),
        partnerJson(id: 'pt2', name: 'Doces da Ana', legalNature: 'PF', type: 'INDEPENDENT_PRODUCER', city: null),
      ], 200),
    );

    expect(find.text('Cantina Sem Glúten'), findsOneWidget);
    expect(find.text('Doces da Ana'), findsOneWidget);
    expect(find.textContaining('Restaurante'), findsOneWidget);
    expect(find.textContaining('São Paulo - SP'), findsOneWidget);
    expect(find.text('PJ • Empresa'), findsOneWidget);
    expect(find.text('PF • Produtor'), findsOneWidget);
    expect(find.textContaining('Sem cidade'), findsOneWidget);

    // Dados que a API devolve mas não podem aparecer.
    expect(find.textContaining('12.345'), findsNothing);
    expect(find.textContaining('Secret'), findsNothing);
    expect(find.textContaining('owner-secret'), findsNothing);
  });

  testWidgets('parceiro temporariamente fechado exibe aviso', (tester) async {
    await _open(tester, (_) async => jsonResponse([partnerJson(status: 'TEMPORARILY_CLOSED')], 200));

    expect(find.text('Temporariamente fechado'), findsOneWidget);
  });

  testWidgets('lista vazia mostra estado vazio', (tester) async {
    await _open(tester, (_) async => jsonResponse([], 200));

    expect(find.byKey(const Key('partners-empty')), findsOneWidget);
  });

  testWidgets('erro mostra mensagem amigável e "Tentar novamente" recarrega', (tester) async {
    var calls = 0;
    final http = await _open(tester, (_) async {
      calls++;
      if (calls == 1) return jsonResponse({'error': 'relation "partners" does not exist'}, 500);
      return jsonResponse([partnerJson()], 200);
    });

    expect(find.byKey(const Key('partners-error')), findsOneWidget);
    expect(find.textContaining('relation'), findsNothing);
    expect(find.textContaining('Não foi possível carregar os parceiros'), findsOneWidget);

    await tester.tap(find.byKey(const Key('partners-retry')));
    await tester.pumpAndSettle();

    expect(find.text('Cantina Sem Glúten'), findsOneWidget);
    expect(http.requests.where((r) => r.url.path == '/partners'), hasLength(2));
  });

  testWidgets('503 mostra a mensagem de indisponibilidade', (tester) async {
    await _open(tester, (_) async => throw ApiException.serviceUnavailable());
    expect(find.text(ApiException.serviceUnavailableMessage), findsOneWidget);
  });

  testWidgets('busca por texto filtra por nome, cidade e descrição (só exibição, sem chamar a API)', (tester) async {
    final http = await _open(
      tester,
      (_) async => jsonResponse([
        partnerJson(),
        partnerJson(id: 'pt2', name: 'Mercado Verde', type: 'MARKET', city: 'Campinas'),
      ], 200),
    );
    final before = http.requests.length;

    await tester.enterText(find.byKey(const Key('partners-search')), 'campinas');
    await tester.pumpAndSettle();

    expect(find.text('Mercado Verde'), findsOneWidget);
    expect(find.text('Cantina Sem Glúten'), findsNothing);
    expect(http.requests.length, before);

    await tester.enterText(find.byKey(const Key('partners-search')), 'zzz');
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('partners-no-match')), findsOneWidget);
  });

  testWidgets('tocar em um parceiro abre o detalhe', (tester) async {
    final http = await _open(tester, (_) async => jsonResponse([partnerJson()], 200));

    await tester.tap(find.text('Cantina Sem Glúten'));
    await tester.pumpAndSettle();

    expect(http.requests.any((r) => r.url.path == '/partners/pt1'), isTrue);
  });
}
