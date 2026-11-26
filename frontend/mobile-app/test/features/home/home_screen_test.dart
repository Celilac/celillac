import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:mobile_app/api/api_exception.dart';
import 'package:mobile_app/core/storage/recent_checks_storage.dart';
import 'package:mobile_app/features/account/verify_email_screen.dart';
import 'package:mobile_app/features/checkout/checkout_screen.dart';
import 'package:mobile_app/features/home/home_tab.dart';
import 'package:mobile_app/features/orders/order_details_screen.dart';
import 'package:mobile_app/features/orders/widgets/order_verdict_chip.dart';
import 'package:mobile_app/features/product/product_details_screen.dart';
import 'package:mobile_app/shared/widgets/alert_banner.dart';
import 'package:mobile_app/shared/widgets/restriction_chip.dart';

import 'home_test_harness.dart';

Finder _key(String key) => find.byKey(Key(key));

/// Descarta a árvore para cancelar timers de polling de telas abertas.
Future<void> _dispose(WidgetTester tester) => tester.pumpWidget(const SizedBox());

Future<RecentChecksStorage> _recentsWith(List<String> names) async {
  final storage = RecentChecksStorage(store: MemoryKeyValueStore());
  for (var i = 0; i < names.length; i++) {
    await storage.save('u1', RecentCheck(productId: 'p$i', productName: names[i], brand: 'CeliFood'));
  }
  return storage;
}

void main() {
  group('saudação', () {
    testWidgets('usa o primeiro nome de GET /iam/me', (tester) async {
      await pumpHome(tester, HomeBackend());
      expect(find.text('Olá, Maria!'), findsOneWidget);
    });

    testWidgets('sem nome cadastrado cumprimenta sem nome', (tester) async {
      final backend = HomeBackend()..account = () => jsonResponse(accountJson(fullName: null), 200);
      await pumpHome(tester, backend);
      expect(find.text('Olá!'), findsOneWidget);
    });

    testWidgets('aparece antes de qualquer resposta', (tester) async {
      final pending = Completer<http.Response>();
      final backend = HomeBackend()..account = () => pending.future;
      await pumpHome(tester, backend, settle: false);
      await tester.pump();
      expect(find.text('Olá!'), findsOneWidget);
      expect(_key('home-account-loading'), findsOneWidget);

      pending.complete(jsonResponse(accountJson(), 200));
      await tester.pumpAndSettle();
      expect(find.text('Olá, Maria!'), findsOneWidget);
      expect(_key('home-account-loading'), findsNothing);
    });
  });

  group('aviso de e-mail', () {
    testWidgets('não aparece quando verificado', (tester) async {
      await pumpHome(tester, HomeBackend());
      expect(_key('home-email-warning'), findsNothing);
      expect(_key('home-account-error'), findsNothing);
    });

    testWidgets('abre a verificação e some após concluir', (tester) async {
      var verified = false;
      final backend = HomeBackend()
        ..account = () => jsonResponse(accountJson(verified: verified), 200);
      await pumpHome(tester, backend);
      expect(_key('home-email-warning'), findsOneWidget);

      await tester.tap(_key('home-verify-email'));
      await tester.pumpAndSettle();
      expect(find.byType(VerifyEmailScreen), findsOneWidget);

      verified = true;
      await tester.enterText(find.byType(TextField), '123456');
      await tester.pump();
      await tester.tap(find.widgetWithText(ElevatedButton, 'Verificar e-mail'));
      await tester.pumpAndSettle();

      expect(find.byType(VerifyEmailScreen), findsNothing);
      expect(_key('home-email-warning'), findsNothing);
    });

    testWidgets('some após verificar mesmo se a recarga falhar', (tester) async {
      var fail = false;
      final backend = HomeBackend()
        ..account = () => fail ? http.Response('', 503) : jsonResponse(accountJson(verified: false), 200);
      await pumpHome(tester, backend);

      await tester.tap(_key('home-verify-email'));
      await tester.pumpAndSettle();
      fail = true;
      await tester.enterText(find.byType(TextField), '123456');
      await tester.pump();
      await tester.tap(find.widgetWithText(ElevatedButton, 'Verificar e-mail'));
      await tester.pumpAndSettle();

      expect(_key('home-email-warning'), findsNothing);
      expect(find.text('Olá, Maria!'), findsOneWidget);
    });

    testWidgets('falha mostra erro amigável e permite tentar de novo', (tester) async {
      var fail = true;
      final backend = HomeBackend()
        ..account = () => fail
            ? jsonResponse({'error': 'SQL error: relation users'}, 500)
            : jsonResponse(accountJson(verified: false), 200);
      await pumpHome(tester, backend);
      expect(_key('home-account-error'), findsOneWidget);
      expect(find.textContaining('SQL'), findsNothing);
      expect(_key('home-email-warning'), findsNothing);

      fail = false;
      await tester.tap(_key('home-account-retry'));
      await tester.pumpAndSettle();
      expect(_key('home-account-error'), findsNothing);
      expect(_key('home-email-warning'), findsOneWidget);
    });
  });

  group('perfil alimentar', () {
    testWidgets('carregando', (tester) async {
      final pending = Completer<http.Response>();
      final backend = HomeBackend()..consumer = () => pending.future;
      await pumpHome(tester, backend, settle: false);
      await tester.pump();
      expect(_key('home-profile-loading'), findsOneWidget);
      expect(find.text('Nenhuma restrição cadastrada.'), findsNothing);

      pending.complete(jsonResponse(consumerJson(), 200));
      await tester.pumpAndSettle();
      expect(_key('home-profile-loading'), findsNothing);
    });

    testWidgets('preenchido mostra restrições e contaminação cruzada como vieram', (tester) async {
      await pumpHome(tester, HomeBackend());
      expect(find.byType(RestrictionChip), findsOneWidget);
      expect(find.text('Glúten'), findsOneWidget);
      expect(find.text('FATAL'), findsOneWidget);
      expect(find.text('Contaminação cruzada: não aceita traços.'), findsOneWidget);
      expect(_key('home-profile-inactive'), findsNothing);
      expect(_key('home-profile-warning'), findsNothing);
    });

    testWidgets('quando o perfil aceita traços', (tester) async {
      final backend = HomeBackend()
        ..consumer = () => jsonResponse(consumerJson(acceptsCrossContamination: true), 200);
      await pumpHome(tester, backend);
      expect(find.text('Contaminação cruzada: aceita risco de traços.'), findsOneWidget);
    });

    testWidgets('sem perfil: vazio e aviso de perfil incompleto leva ao Perfil', (tester) async {
      final backend = HomeBackend()
        ..consumer = () => jsonResponse(consumerJson(hasProfile: false, warning: true), 200);
      final home = await pumpHome(tester, backend);
      expect(find.text('Nenhuma restrição cadastrada.'), findsOneWidget);
      expect(find.textContaining('Contaminação cruzada'), findsNothing);
      expect(_key('home-profile-warning'), findsOneWidget);

      await tester.tap(_key('home-complete-profile'));
      expect(home.selected, [HomeTab.profile]);
    });

    testWidgets('o aviso segue apenas a flag da API', (tester) async {
      final backend = HomeBackend()
        ..consumer = () => jsonResponse(consumerJson(restrictions: const [], warning: false), 200);
      await pumpHome(tester, backend);
      expect(find.text('Nenhuma restrição cadastrada.'), findsOneWidget);
      expect(_key('home-profile-warning'), findsNothing);
    });

    testWidgets('INATIVO é sinalizado junto das restrições', (tester) async {
      final backend = HomeBackend()..consumer = () => jsonResponse(consumerJson(status: 'INATIVO'), 200);
      await pumpHome(tester, backend);
      expect(_key('home-profile-inactive'), findsOneWidget);
      expect(find.byType(RestrictionChip), findsOneWidget);
    });

    testWidgets('"Ver perfil" leva à aba Perfil', (tester) async {
      final home = await pumpHome(tester, HomeBackend());
      await tester.tap(_key('home-view-profile'));
      expect(home.selected, [HomeTab.profile]);
    });

    testWidgets('falha NÃO aparece como "sem restrições" e permite tentar de novo', (tester) async {
      var fail = true;
      final backend = HomeBackend()
        ..consumer = () => fail ? http.Response('', 502) : jsonResponse(consumerJson(), 200);
      await pumpHome(tester, backend);
      expect(_key('home-profile-error'), findsOneWidget);
      expect(find.text(ApiException.serviceUnavailableMessage), findsOneWidget);
      expect(find.text('Nenhuma restrição cadastrada.'), findsNothing);

      fail = false;
      await tester.tap(_key('home-profile-retry'));
      await tester.pumpAndSettle();
      expect(find.byType(RestrictionChip), findsOneWidget);
    });
  });

  group('atalhos', () {
    testWidgets('Scanner, Buscar e Parceiros pedem a troca de aba', (tester) async {
      final home = await pumpHome(tester, HomeBackend());
      await tester.tap(_key('home-shortcut-scanner'));
      await tester.tap(_key('home-shortcut-search'));
      await tester.tap(_key('home-shortcut-partners'));
      expect(home.selected, [HomeTab.scanner, HomeTab.search, HomeTab.partners]);
    });
  });

  group('pedidos em andamento', () {
    testWidgets('carregando', (tester) async {
      final pending = Completer<http.Response>();
      final backend = HomeBackend()..orders = () => pending.future;
      await pumpHome(tester, backend, settle: false);
      await tester.pump();
      expect(_key('home-orders-loading'), findsOneWidget);

      pending.complete(jsonResponse([], 200));
      await tester.pumpAndSettle();
      expect(_key('home-orders-empty'), findsOneWidget);
    });

    testWidgets('entregues e cancelados não contam', (tester) async {
      final backend = HomeBackend()
        ..orders = () => jsonResponse([
              homeOrder('d', status: 'DELIVERED'),
              homeOrder('c', status: 'CANCELLED'),
            ], 200);
      await pumpHome(tester, backend);
      expect(_key('home-orders-empty'), findsOneWidget);
      expect(_key('order-card-d'), findsNothing);
      expect(_key('order-card-c'), findsNothing);
    });

    testWidgets('mostra no máximo 3, mais recentes primeiro', (tester) async {
      final backend = HomeBackend()
        ..orders = () => jsonResponse([
              for (var day = 1; day <= 5; day++) homeOrder('o$day', createdAt: '2026-11-0${day}T12:00:00.000Z'),
            ], 200);
      await pumpHome(tester, backend);
      expect(_key('order-card-o5'), findsOneWidget);
      expect(_key('order-card-o4'), findsOneWidget);
      expect(_key('order-card-o3'), findsOneWidget);
      expect(_key('order-card-o2'), findsNothing);
      expect(tester.getTopLeft(_key('order-card-o5')).dy, lessThan(tester.getTopLeft(_key('order-card-o3')).dy));
    });

    testWidgets('"Ver todos" leva à aba Pedidos', (tester) async {
      final home = await pumpHome(tester, HomeBackend());
      await tester.tap(_key('home-orders-all'));
      expect(home.selected, [HomeTab.orders]);
    });

    testWidgets('não exibe o selo de veredito do pedido', (tester) async {
      final backend = HomeBackend()..orders = () => jsonResponse([homeOrder('o1')], 200);
      await pumpHome(tester, backend);
      expect(_key('order-card-o1'), findsOneWidget);
      expect(find.byType(OrderVerdictChip), findsNothing);
      expect(find.textContaining('traços para o seu perfil'), findsNothing);
    });

    testWidgets('"Pagar" só em pedidos que aguardam pagamento', (tester) async {
      final backend = HomeBackend()
        ..orders = () => jsonResponse([
              homeOrder('new', status: 'CREATED'),
              homeOrder('wait', status: 'AWAITING_PAYMENT'),
              homeOrder('paid', status: 'PAID'),
            ], 200);
      await pumpHome(tester, backend);
      expect(_key('order-pay-new'), findsOneWidget);
      expect(_key('order-pay-wait'), findsOneWidget);
      expect(_key('order-pay-paid'), findsNothing);
    });

    testWidgets('toque abre o detalhe e recarrega ao voltar', (tester) async {
      final backend = HomeBackend()..orders = () => jsonResponse([homeOrder('o1')], 200);
      await pumpHome(tester, backend);

      await tester.tap(_key('order-card-o1'));
      await tester.pumpAndSettle();
      expect(find.byType(OrderDetailsScreen), findsOneWidget);
      expect(backend.count('GET /orders/o1'), 1);

      await tester.pageBack();
      await tester.pumpAndSettle();
      expect(backend.count('GET /orders/me'), 2);
      await _dispose(tester);
    });

    testWidgets('"Pagar" abre o checkout', (tester) async {
      final backend = HomeBackend()
        ..orders = () => jsonResponse([homeOrder('o1', status: 'AWAITING_PAYMENT')], 200);
      await pumpHome(tester, backend);

      await tester.tap(_key('order-pay-o1'));
      await tester.pumpAndSettle();
      expect(find.byType(CheckoutScreen), findsOneWidget);
      expect(find.byType(OrderDetailsScreen), findsNothing);

      await tester.pageBack();
      await tester.pumpAndSettle();
      expect(backend.count('GET /orders/me'), 2);
    });

    testWidgets('falha de rede mostra indisponibilidade e permite tentar de novo', (tester) async {
      var fail = true;
      final backend = HomeBackend()
        ..orders = () => fail
            ? throw http.ClientException('Connection refused')
            : jsonResponse([homeOrder('o1')], 200);
      await pumpHome(tester, backend);
      expect(_key('home-orders-error'), findsOneWidget);
      expect(find.text(ApiException.serviceUnavailableMessage), findsOneWidget);
      expect(find.textContaining('Connection refused'), findsNothing);
      expect(_key('home-orders-empty'), findsNothing);

      fail = false;
      await tester.tap(_key('home-orders-retry'));
      await tester.pumpAndSettle();
      expect(_key('order-card-o1'), findsOneWidget);
    });

    testWidgets('sem polling', (tester) async {
      final backend = HomeBackend()..orders = () => jsonResponse([homeOrder('o1')], 200);
      await pumpHome(tester, backend);
      await tester.pump(const Duration(minutes: 5));
      expect(backend.count('GET /orders/me'), 1);
    });
  });

  group('verificados recentemente', () {
    testWidgets('vazio', (tester) async {
      await pumpHome(tester, HomeBackend());
      expect(_key('home-recents-empty'), findsOneWidget);
    });

    testWidgets('armazenamento indisponível fica vazio, sem erro', (tester) async {
      await pumpHome(tester, HomeBackend(), recents: RecentChecksStorage(store: BrokenKeyValueStore()));
      expect(_key('home-recents-empty'), findsOneWidget);
    });

    testWidgets('lista nome e marca e abre o produto', (tester) async {
      await pumpHome(tester, HomeBackend(), recents: await _recentsWith(['Pão', 'Bolo']));
      expect(find.text('Pão'), findsOneWidget);
      expect(find.text('Bolo'), findsOneWidget);
      expect(find.byType(AlertBanner), findsNothing);

      await tester.tap(_key('home-recent-p0'));
      await tester.pumpAndSettle();
      expect(find.byType(ProductDetailsScreen), findsOneWidget);
    });
  });

  group('blocos independentes', () {
    testWidgets('falha de um não derruba os demais', (tester) async {
      final backend = HomeBackend()
        ..account = (() => http.Response('', 503))
        ..orders = () => jsonResponse([homeOrder('o1')], 200);
      await pumpHome(tester, backend, recents: await _recentsWith(['Pão']));
      expect(_key('home-account-error'), findsOneWidget);
      expect(find.byType(RestrictionChip), findsOneWidget);
      expect(_key('order-card-o1'), findsOneWidget);
      expect(find.text('Pão'), findsOneWidget);
      expect(_key('home-shortcut-scanner'), findsOneWidget);
    });

    testWidgets('todos falhando ainda oferece atalhos e recentes', (tester) async {
      final backend = HomeBackend()
        ..account = (() => http.Response('', 503))
        ..consumer = (() => http.Response('', 503))
        ..orders = (() => http.Response('', 503));
      await pumpHome(tester, backend);
      expect(_key('home-account-error'), findsOneWidget);
      expect(_key('home-profile-error'), findsOneWidget);
      expect(_key('home-orders-error'), findsOneWidget);
      expect(_key('home-shortcut-search'), findsOneWidget);
      expect(_key('home-recents-empty'), findsOneWidget);
    });

    testWidgets('nunca consulta compatibilidade', (tester) async {
      final backend = HomeBackend()..orders = () => jsonResponse([homeOrder('o1')], 200);
      await pumpHome(tester, backend, recents: await _recentsWith(['Pão']));
      expect(backend.calls, unorderedEquals(['GET /iam/me', 'GET /consumer/me', 'GET /orders/me']));
    });
  });

  group('atualização', () {
    testWidgets('recarrega tudo ao voltar para a aba', (tester) async {
      final recents = RecentChecksStorage(store: MemoryKeyValueStore());
      var orders = <Map<String, dynamic>>[];
      final backend = HomeBackend()..orders = () => jsonResponse(orders, 200);
      final home = await pumpHome(tester, backend, recents: recents);
      expect(_key('home-orders-empty'), findsOneWidget);

      home.active.value = false;
      await tester.pumpAndSettle();
      expect(backend.count('GET /orders/me'), 1);

      orders = [homeOrder('o1')];
      await recents.save('u1', const RecentCheck(productId: 'p9', productName: 'Granola', brand: 'X'));
      home.active.value = true;
      await tester.pumpAndSettle();

      expect(backend.count('GET /iam/me'), 2);
      expect(backend.count('GET /consumer/me'), 2);
      expect(_key('order-card-o1'), findsOneWidget);
      expect(find.text('Granola'), findsOneWidget);
    });

    testWidgets('falha na atualização mantém o que já está na tela', (tester) async {
      var fail = false;
      http.Response guard(http.Response ok) => fail ? http.Response('', 503) : ok;
      final backend = HomeBackend()
        ..account = (() => guard(jsonResponse(accountJson(), 200)))
        ..consumer = (() => guard(jsonResponse(consumerJson(), 200)))
        ..orders = () => guard(jsonResponse([homeOrder('o1')], 200));
      final home = await pumpHome(tester, backend);

      fail = true;
      home.active.value = false;
      await tester.pumpAndSettle();
      home.active.value = true;
      await tester.pumpAndSettle();

      expect(backend.count('GET /orders/me'), 2);
      expect(find.text('Olá, Maria!'), findsOneWidget);
      expect(find.byType(RestrictionChip), findsOneWidget);
      expect(_key('order-card-o1'), findsOneWidget);
      expect(find.text(ApiException.serviceUnavailableMessage), findsNothing);
    });

    testWidgets('resposta antiga não sobrescreve a mais nova', (tester) async {
      final slow = Completer<http.Response>();
      var first = true;
      final backend = HomeBackend()
        ..orders = () {
          if (!first) return jsonResponse([homeOrder('new')], 200);
          first = false;
          return slow.future;
        };
      final home = await pumpHome(tester, backend, settle: false);
      await tester.pump();
      home.active.value = false;
      await tester.pump();
      home.active.value = true;
      await tester.pump();
      await tester.pump();

      slow.complete(jsonResponse([homeOrder('old')], 200));
      await tester.pumpAndSettle();
      expect(_key('order-card-new'), findsOneWidget);
      expect(_key('order-card-old'), findsNothing);
    });

    testWidgets('pull to refresh recarrega os blocos', (tester) async {
      final backend = HomeBackend();
      await pumpHome(tester, backend);
      // O indicador só arma após arrastar 25% da altura da viewport (3000).
      await tester.fling(find.byKey(const Key('home-list')), const Offset(0, 1200), 2000);
      await tester.pumpAndSettle();
      expect(backend.count('GET /iam/me'), 2);
      expect(backend.count('GET /consumer/me'), 2);
      expect(backend.count('GET /orders/me'), 2);
    });
  });
}
