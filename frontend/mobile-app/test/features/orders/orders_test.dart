import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile_app/api/api_client.dart';
import 'package:mobile_app/api/api_exception.dart';
import 'package:mobile_app/api/models/product_models.dart';
import 'package:mobile_app/features/orders/create_order_screen.dart';
import 'package:mobile_app/features/orders/order_details_screen.dart';
import 'package:mobile_app/features/orders/order_error_messages.dart';
import 'package:mobile_app/features/orders/orders_screen.dart';
import 'package:provider/provider.dart';

import '../../api/order_api_test.dart' show orderJson;

class _Calls {
  final List<http.Request> requests = [];
  int count(String method, String path) =>
      requests.where((r) => r.method == method && r.url.path == path).length;
}

Future<void> _pump(
  WidgetTester tester,
  Widget home,
  http.Response Function(http.Request) handler,
  _Calls calls,
) async {
  tester.view.physicalSize = const Size(800, 3000);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
  final api = ApiClient(
    baseUrl: 'http://api.test',
    httpClient: MockClient((r) async {
      calls.requests.add(r);
      return handler(r);
    }),
  );
  await tester.pumpWidget(
    Provider<ApiClient>.value(value: api, child: MaterialApp(home: home)),
  );
}

http.Response _json(Object body, [int status = 200]) => http.Response(jsonEncode(body), status);

Map<String, dynamic> _order(String id, String status, {String verdict = 'SAFE'}) =>
    {...orderJson, 'id': id, 'status': status, 'allergenCheckVerdict': verdict};

const _product = Product(
  id: 'p1',
  name: 'Biscoito',
  brand: 'CeliFood',
  ingredients: 'Arroz',
  hasGluten: false,
  crossContamination: '',
  analysisStatus: AnalysisStatus.analisado,
  partnerId: 'pt1',
  price: 10,
);

void main() {
  group('OrderErrorMessages', () {
    test('bloqueio de segurança alimentar é reconhecido e preserva o texto do backend', () {
      const err = ApiException('BLOQUEIO DE SEGURANÇA ALIMENTAR: O produto "X" é inseguro.', statusCode: 400);
      final f = OrderErrorMessages.create(err);
      expect(f.safetyBlock, isTrue);
      expect(f.message, contains('inseguro'));
    });

    test('outros 400 nunca repassam o texto técnico', () {
      const err = ApiException('SQL error: relation orders', statusCode: 400);
      final f = OrderErrorMessages.create(err);
      expect(f.safetyBlock, isFalse);
      expect(f.message, isNot(contains('SQL')));
    });

    test('perfil ausente, sob consulta, 503 e cancelamento negado', () {
      expect(
        OrderErrorMessages.create(const ApiException('Você precisa ter um perfil alimentar configurado', statusCode: 400)).message,
        contains('perfil alimentar'),
      );
      expect(
        OrderErrorMessages.create(const ApiException('valor sob consulta', statusCode: 400)).message,
        contains('sob consulta'),
      );
      expect(OrderErrorMessages.create(ApiException.serviceUnavailable()).message, ApiException.serviceUnavailableMessage);
      expect(
        OrderErrorMessages.cancel(const ApiException('O cancelamento não é mais permitido pelo consumidor', statusCode: 400)),
        contains('já confirmou'),
      );
    });
  });

  group('OrdersScreen', () {
    testWidgets('lista pedidos mais recentes primeiro e abre o detalhe', (tester) async {
      final calls = _Calls();
      await _pump(tester, const OrdersScreen(), (r) {
        if (r.url.path == '/orders/me') {
          return _json([
            {..._order('old', 'DELIVERED'), 'createdAt': '2026-01-01T00:00:00Z'},
            {..._order('new', 'PAID', verdict: 'WARNING'), 'createdAt': '2026-11-01T00:00:00Z'},
          ]);
        }
        return _json(_order('new', 'PAID'));
      }, calls);
      await tester.pumpAndSettle();

      final newPos = tester.getTopLeft(find.byKey(const Key('order-card-new'))).dy;
      final oldPos = tester.getTopLeft(find.byKey(const Key('order-card-old'))).dy;
      expect(newPos, lessThan(oldPos));
      expect(find.text('Atenção: possíveis traços para o seu perfil'), findsOneWidget);

      await tester.tap(find.byKey(const Key('order-card-new')));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('order-status')), findsOneWidget);
    });

    testWidgets('estado vazio', (tester) async {
      await _pump(tester, const OrdersScreen(), (_) => _json([]), _Calls());
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('orders-empty')), findsOneWidget);
    });

    testWidgets('erro mostra mensagem amigável e tenta novamente', (tester) async {
      var fail = true;
      await _pump(tester, const OrdersScreen(), (_) {
        if (fail) return http.Response('', 503);
        return _json([_order('o1', 'DELIVERED')]);
      }, _Calls());
      await tester.pumpAndSettle();
      expect(find.text(ApiException.serviceUnavailableMessage), findsOneWidget);

      fail = false;
      await tester.tap(find.byKey(const Key('orders-retry')));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('order-card-o1')), findsOneWidget);
    });

    testWidgets('polling roda com pedido em andamento e aba ativa', (tester) async {
      final calls = _Calls();
      await _pump(
        tester,
        const OrdersScreen(pollInterval: Duration(seconds: 5)),
        (_) => _json([_order('o1', 'PREPARING')]),
        calls,
      );
      await tester.pump();
      await tester.pump();
      expect(calls.count('GET', '/orders/me'), 1);
      await tester.pump(const Duration(seconds: 5));
      await tester.pump();
      expect(calls.count('GET', '/orders/me'), 2);
      // desmonta para cancelar o timer
      await tester.pumpWidget(const SizedBox());
    });

    testWidgets('sem pedido em andamento não há polling', (tester) async {
      final calls = _Calls();
      await _pump(
        tester,
        const OrdersScreen(pollInterval: Duration(seconds: 5)),
        (_) => _json([_order('o1', 'DELIVERED')]),
        calls,
      );
      await tester.pumpAndSettle();
      await tester.pump(const Duration(seconds: 30));
      expect(calls.count('GET', '/orders/me'), 1);
    });

    testWidgets('aba inativa não faz polling', (tester) async {
      final calls2 = _Calls();
      await _pump(
        tester,
        const OrdersScreen(isActive: false, pollInterval: Duration(seconds: 5)),
        (_) => _json([_order('o1', 'PREPARING')]),
        calls2,
      );
      await tester.pump();
      await tester.pump();
      await tester.pump(const Duration(seconds: 30));
      expect(calls2.count('GET', '/orders/me'), 1);
    });
  });

  group('OrderDetailsScreen', () {
    testWidgets('mostra itens, totais e veredito como vieram', (tester) async {
      await _pump(tester, const OrderDetailsScreen(orderId: 'o1'), (_) => _json(_order('o1', 'AWAITING_PAYMENT', verdict: 'WARNING')), _Calls());
      await tester.pump();
      await tester.pump();
      expect(find.text('Aguardando pagamento'), findsOneWidget);
      expect(find.text('2x Biscoito'), findsOneWidget);
      expect(find.text('R\$ 25,50'), findsOneWidget);
      expect(find.text('Atenção: possíveis traços para o seu perfil'), findsOneWidget);
      expect(find.byKey(const Key('order-cancel')), findsOneWidget);
      await tester.pumpWidget(const SizedBox());
    });

    testWidgets('pedido confirmado não oferece cancelamento', (tester) async {
      await _pump(tester, const OrderDetailsScreen(orderId: 'o1'), (_) => _json(_order('o1', 'CONFIRMED')), _Calls());
      await tester.pump();
      await tester.pump();
      expect(find.byKey(const Key('order-cancel')), findsNothing);
      await tester.pumpWidget(const SizedBox());
    });

    testWidgets('cancelar exige motivo e envia ao backend', (tester) async {
      final calls = _Calls();
      var status = 'PAID';
      await _pump(tester, const OrderDetailsScreen(orderId: 'o1'), (r) {
        if (r.method == 'POST') {
          status = 'CANCELLED';
          return _json({'orderId': 'o1', 'status': 'CANCELLED', 'requiresRefund': true, 'cancelReason': 'Desisti'});
        }
        return _json({..._order('o1', status), 'cancelReason': status == 'CANCELLED' ? 'Desisti' : null});
      }, calls);
      await tester.pump();
      await tester.pump();

      await tester.tap(find.byKey(const Key('order-cancel')));
      await tester.pumpAndSettle();
      final confirm = find.byKey(const Key('cancel-confirm'));
      expect(tester.widget<TextButton>(confirm).onPressed, isNull);

      await tester.enterText(find.byKey(const Key('cancel-reason-field')), 'Desisti');
      await tester.pump();
      await tester.tap(confirm);
      await tester.pumpAndSettle();

      final post = calls.requests.firstWhere((r) => r.method == 'POST');
      expect(post.url.path, '/orders/o1/cancel');
      expect(jsonDecode(post.body), {'reason': 'Desisti'});
      expect(find.text('Cancelado'), findsOneWidget);
      expect(find.byKey(const Key('order-cancel-reason')), findsOneWidget);
      expect(find.byKey(const Key('order-cancel')), findsNothing);
    });

    testWidgets('erro de carga com tentar novamente', (tester) async {
      await _pump(tester, const OrderDetailsScreen(orderId: 'x'), (_) => _json({'error': 'Pedido não encontrado.'}, 404), _Calls());
      await tester.pumpAndSettle();
      expect(find.text('Pedido não encontrado.'), findsOneWidget);
      expect(find.text('Tentar novamente'), findsOneWidget);
    });
  });

  group('CreateOrderScreen', () {
    testWidgets('quantidade altera o subtotal estimado e cria o pedido', (tester) async {
      final calls = _Calls();
      await _pump(tester, const CreateOrderScreen(product: _product), (r) {
        if (r.method == 'POST') {
          return _json({'orderId': 'o9', 'status': 'CREATED', 'totalAmount': 20, 'allergenCheckVerdict': 'SAFE'}, 201);
        }
        return _json(_order('o9', 'CREATED'));
      }, calls);

      await tester.tap(find.byKey(const Key('qty-plus')));
      await tester.pump();
      expect(find.text('R\$ 20,00'), findsOneWidget);
      await tester.enterText(find.byKey(const Key('order-notes')), 'Sem cebola');
      await tester.tap(find.byKey(const Key('order-submit')));
      await tester.pumpAndSettle();

      final post = calls.requests.firstWhere((r) => r.method == 'POST');
      expect(jsonDecode(post.body), {
        'partnerId': 'pt1',
        'items': [
          {'productId': 'p1', 'quantity': 2},
        ],
        'notes': 'Sem cebola',
      });
      expect(find.byKey(const Key('order-status')), findsOneWidget);
      await tester.pumpWidget(const SizedBox());
    });

    testWidgets('bloqueio de segurança alimentar aparece como BLOQUEADO com o texto do backend', (tester) async {
      await _pump(tester, const CreateOrderScreen(product: _product), (_) {
        return _json({'error': 'BLOQUEIO DE SEGURANÇA ALIMENTAR: O produto "Biscoito" é inseguro para seu perfil (glúten).'}, 400);
      }, _Calls());
      await tester.tap(find.byKey(const Key('order-submit')));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('order-safety-block')), findsOneWidget);
      expect(find.text('BLOQUEADO'), findsOneWidget);
      expect(find.textContaining('inseguro para seu perfil'), findsOneWidget);
      // continua na tela de criação; nada foi contornado
      expect(find.byKey(const Key('order-submit')), findsOneWidget);
    });

    testWidgets('erro comum mostra mensagem amigável', (tester) async {
      await _pump(tester, const CreateOrderScreen(product: _product), (_) => http.Response('', 502), _Calls());
      await tester.tap(find.byKey(const Key('order-submit')));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('order-error')), findsOneWidget);
      expect(find.text(ApiException.serviceUnavailableMessage), findsOneWidget);
    });
  });

  group('Product.canBeOrdered', () {
    test('exige partnerId e preço positivo', () {
      expect(_product.canBeOrdered, isTrue);
      expect(
        Product.fromJson({
          'id': 'p',
          'name': 'n',
          'hasGluten': false,
          'analysisStatus': 'ANALISADO',
          'partnerId': 'pt',
        }).canBeOrdered,
        isFalse,
      );
    });
  });
}
