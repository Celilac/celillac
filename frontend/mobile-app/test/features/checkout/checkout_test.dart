import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile_app/api/api_client.dart';
import 'package:mobile_app/api/api_exception.dart';
import 'package:mobile_app/api/models/order_models.dart';
import 'package:mobile_app/api/models/payment_models.dart';
import 'package:mobile_app/features/checkout/checkout_screen.dart';
import 'package:mobile_app/features/checkout/payment_error_messages.dart';
import 'package:mobile_app/features/checkout/pix_payment_screen.dart';
import 'package:mobile_app/features/orders/order_details_screen.dart';
import 'package:provider/provider.dart';

import '../../api/order_api_test.dart' show orderJson;
import '../../api/payment_api_test.dart' show pixCheckoutJson;

// PNG 1x1 válido.
const _pngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

class _Calls {
  final List<http.Request> requests = [];
  List<http.Request> where(String method, String path) =>
      requests.where((r) => r.method == method && r.url.path == path).toList();
  int count(String method, String path) => where(method, path).length;
}

http.Response _json(Object body, [int status = 200]) => http.Response(jsonEncode(body), status);

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

Order _order({String status = 'AWAITING_PAYMENT'}) => Order.fromJson({...orderJson, 'status': status});

Map<String, dynamic> _pix({String status = 'PENDING', String? qr, String? expires}) => {
      ...pixCheckoutJson,
      'status': status,
      'pixQrCode': qr ?? 'data:image/png;base64,$_pngBase64',
      'pixExpiresAt': expires ?? '2099-01-01T00:00:00Z',
    };

const _cash = {
  'paymentId': 'pay2',
  'orderId': 'o1',
  'method': 'CASH_ON_DELIVERY',
  'status': 'PENDING',
  'grossAmount': 25.5,
};

void main() {
  group('PaymentErrorMessages', () {
    test('503/rede, limite e sessão', () {
      expect(PaymentErrorMessages.checkout(ApiException.serviceUnavailable()), ApiException.serviceUnavailableMessage);
      expect(PaymentErrorMessages.checkout(const ApiException('x', statusCode: 429)), contains('Muitas'));
    });

    test('entrega indisponível orienta PIX e nunca repassa texto técnico', () {
      final f = PaymentErrorMessages.checkout(
        const ApiException('Opção de pagamento na entrega indisponível para esta conta', statusCode: 400),
      );
      expect(f, contains('PIX'));
      final g = PaymentErrorMessages.checkout(const ApiException('Asaas gateway timeout stack', statusCode: 400));
      expect(g, isNot(contains('Asaas')));
    });

    test('troco e status do pedido', () {
      expect(
        PaymentErrorMessages.checkout(const ApiException('O valor informado para troco deve ser maior', statusCode: 400)),
        contains('troco'),
      );
      expect(
        PaymentErrorMessages.checkout(
          const ApiException('Não é possível realizar checkout de um pedido com status "PAID"', statusCode: 400),
        ),
        contains('não aceita'),
      );
    });

    test('consulta de status', () {
      expect(PaymentErrorMessages.status(ApiException.serviceUnavailable()), ApiException.serviceUnavailableMessage);
      expect(PaymentErrorMessages.status(const ApiException('x', statusCode: 500)), contains('status'));
    });
  });

  group('CheckoutScreen', () {
    testWidgets('mostra total e os 3 métodos, sem cartão online', (tester) async {
      await _pump(tester, CheckoutScreen(order: _order()), (_) => _json({}), _Calls());

      expect(find.byKey(const Key('checkout-total')), findsOneWidget);
      expect(find.text('R\$ 25,50'), findsWidgets);
      expect(find.byKey(const Key('method-pix')), findsOneWidget);
      expect(find.byKey(const Key('method-cash')), findsOneWidget);
      expect(find.byKey(const Key('method-card')), findsOneWidget);
      expect(find.textContaining('crédito online'), findsNothing);
    });

    testWidgets('PIX: envia checkout e abre a tela do QR', (tester) async {
      final calls = _Calls();
      await _pump(tester, CheckoutScreen(order: _order()), (r) {
        if (r.url.path == '/payments/checkout') return _json(_pix(), 201);
        return _json(_pix());
      }, calls);

      await tester.tap(find.byKey(const Key('checkout-confirm')));
      await tester.pump();
      await tester.pump(const Duration(seconds: 1));

      final req = calls.where('POST', '/payments/checkout').single;
      expect(jsonDecode(req.body), {'orderId': 'o1', 'method': 'PIX'});
      expect(find.byType(PixPaymentScreen), findsOneWidget);
      expect(find.byKey(const Key('pix-code')), findsOneWidget);
      await tester.pumpWidget(const SizedBox());
    });

    testWidgets('dinheiro: troco menor que o total é barrado sem chamar a API', (tester) async {
      final calls = _Calls();
      await _pump(tester, CheckoutScreen(order: _order()), (_) => _json(_cash, 201), calls);

      await tester.tap(find.byKey(const Key('method-cash')));
      await tester.pumpAndSettle();
      await tester.enterText(find.byKey(const Key('change-field')), '20');
      await tester.tap(find.byKey(const Key('checkout-confirm')));
      await tester.pumpAndSettle();

      expect(calls.count('POST', '/payments/checkout'), 0);
      expect(find.byKey(const Key('change-error')), findsOneWidget);
    });

    testWidgets('dinheiro: troco válido (vírgula) é enviado e confirma o registro', (tester) async {
      final calls = _Calls();
      await _pump(tester, CheckoutScreen(order: _order()), (_) => _json(_cash, 201), calls);

      await tester.tap(find.byKey(const Key('method-cash')));
      await tester.pumpAndSettle();
      await tester.enterText(find.byKey(const Key('change-field')), '50,00');
      await tester.tap(find.byKey(const Key('checkout-confirm')));
      await tester.pumpAndSettle();

      final body = jsonDecode(calls.where('POST', '/payments/checkout').single.body);
      expect(body, {'orderId': 'o1', 'method': 'CASH_ON_DELIVERY', 'changeFor': 50.0});
      expect(find.byKey(const Key('delivery-registered')), findsOneWidget);
    });

    testWidgets('troco em branco não envia changeFor', (tester) async {
      final calls = _Calls();
      await _pump(tester, CheckoutScreen(order: _order()), (_) => _json(_cash, 201), calls);

      await tester.tap(find.byKey(const Key('method-cash')));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('checkout-confirm')));
      await tester.pumpAndSettle();

      final body = jsonDecode(calls.where('POST', '/payments/checkout').single.body) as Map;
      expect(body.containsKey('changeFor'), isFalse);
    });

    testWidgets('cartão na entrega', (tester) async {
      final calls = _Calls();
      await _pump(tester, CheckoutScreen(order: _order()), (_) => _json({..._cash, 'method': 'CARD_ON_DELIVERY'}, 201), calls);

      await tester.tap(find.byKey(const Key('method-card')));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('checkout-confirm')));
      await tester.pumpAndSettle();

      expect(jsonDecode(calls.where('POST', '/payments/checkout').single.body), {
        'orderId': 'o1',
        'method': 'CARD_ON_DELIVERY',
      });
      expect(find.byKey(const Key('delivery-registered')), findsOneWidget);
    });

    testWidgets('entrega indisponível (400): mensagem amigável e PIX continua disponível', (tester) async {
      await _pump(
        tester,
        CheckoutScreen(order: _order()),
        (_) => _json({'error': 'Opção de pagamento na entrega indisponível para esta conta'}, 400),
        _Calls(),
      );

      await tester.tap(find.byKey(const Key('method-card')));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('checkout-confirm')));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('checkout-error')), findsOneWidget);
      expect(find.textContaining('PIX'), findsWidgets);
      expect(find.byKey(const Key('method-pix')), findsOneWidget);
    });

    testWidgets('503 mostra serviço indisponível', (tester) async {
      await _pump(tester, CheckoutScreen(order: _order()), (_) => http.Response('', 503), _Calls());
      await tester.tap(find.byKey(const Key('checkout-confirm')));
      await tester.pumpAndSettle();
      expect(find.text(ApiException.serviceUnavailableMessage), findsOneWidget);
    });
  });

  group('PixPaymentScreen', () {
    Payment payment({String status = 'PENDING', String? qr, String? expires}) =>
        Payment.fromJson(_pix(status: status, qr: qr, expires: expires));

    testWidgets('exibe QR, copia-e-cola, valor e copia para a área de transferência', (tester) async {
      String? copied;
      tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(SystemChannels.platform, (call) async {
        if (call.method == 'Clipboard.setData') copied = (call.arguments as Map)['text'] as String?;
        return null;
      });
      addTearDown(() => tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(SystemChannels.platform, null));

      await _pump(
        tester,
        PixPaymentScreen(order: _order(), payment: payment(expires: '2099-01-01T00:00:00Z')),
        (_) => _json(_pix()),
        _Calls(),
      );

      expect(find.byKey(const Key('pix-qr')), findsOneWidget);
      expect(find.text('000201pixcopiaecola'), findsOneWidget);
      expect(find.text('R\$ 25,50'), findsWidgets);

      await tester.tap(find.byKey(const Key('pix-copy')));
      await tester.pump();
      expect(copied, '000201pixcopiaecola');
      expect(find.text('Código PIX copiado'), findsOneWidget);
      // Remove o timer de polling antes do fim do teste.
      await tester.pumpWidget(const SizedBox());
    });

    testWidgets('QR inválido não quebra: copia-e-cola segue disponível', (tester) async {
      await _pump(
        tester,
        PixPaymentScreen(order: _order(), payment: payment(qr: '%%%não-é-imagem%%%', expires: '2099-01-01T00:00:00Z')),
        (_) => _json(_pix()),
        _Calls(),
      );
      expect(find.byKey(const Key('pix-qr')), findsNothing);
      expect(find.byKey(const Key('pix-code')), findsOneWidget);
      await tester.pumpWidget(const SizedBox());
    });

    testWidgets('faz polling a cada intervalo até PAID e então para', (tester) async {
      final calls = _Calls();
      var polls = 0;
      await _pump(
        tester,
        PixPaymentScreen(
          order: _order(),
          payment: payment(expires: '2099-01-01T00:00:00Z'),
          pollInterval: const Duration(seconds: 5),
        ),
        (r) {
          if (r.url.path == '/payments/order/o1') {
            polls++;
            return _json({'id': 'pay1', 'orderId': 'o1', 'method': 'PIX', 'status': polls >= 2 ? 'PAID' : 'PENDING', 'grossAmount': 25.5});
          }
          return _json(orderJson);
        },
        calls,
      );

      expect(calls.count('GET', '/payments/order/o1'), 0);
      await tester.pump(const Duration(seconds: 5));
      await tester.pump();
      expect(calls.count('GET', '/payments/order/o1'), 1);
      expect(find.byKey(const Key('pix-paid')), findsNothing);

      await tester.pump(const Duration(seconds: 5));
      await tester.pump();
      expect(calls.count('GET', '/payments/order/o1'), 2);
      expect(find.byKey(const Key('pix-paid')), findsOneWidget);

      await tester.pump(const Duration(seconds: 30));
      expect(calls.count('GET', '/payments/order/o1'), 2, reason: 'polling deve parar após PAID');
    });

    testWidgets('falha transitória de polling não derruba a tela', (tester) async {
      final calls = _Calls();
      await _pump(
        tester,
        PixPaymentScreen(order: _order(), payment: payment(expires: '2099-01-01T00:00:00Z')),
        (_) => http.Response('', 503),
        calls,
      );
      await tester.pump(const Duration(seconds: 5));
      await tester.pump();
      expect(find.byKey(const Key('pix-code')), findsOneWidget);
      expect(find.byKey(const Key('pix-paid')), findsNothing);
      await tester.pumpWidget(const SizedBox());
    });

    testWidgets('sair da tela cancela o polling', (tester) async {
      final calls = _Calls();
      await _pump(
        tester,
        PixPaymentScreen(order: _order(), payment: payment(expires: '2099-01-01T00:00:00Z')),
        (_) => _json(_pix()),
        calls,
      );
      await tester.pumpWidget(const SizedBox());
      await tester.pump(const Duration(seconds: 30));
      expect(calls.count('GET', '/payments/order/o1'), 0);
    });

    testWidgets('em segundo plano não faz polling; ao voltar consulta de novo', (tester) async {
      final calls = _Calls();
      await _pump(
        tester,
        PixPaymentScreen(order: _order(), payment: payment(expires: '2099-01-01T00:00:00Z')),
        (_) => _json(_pix()),
        calls,
      );
      tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.paused);
      await tester.pump(const Duration(seconds: 30));
      expect(calls.count('GET', '/payments/order/o1'), 0);

      tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed);
      await tester.pump();
      await tester.pump();
      expect(calls.count('GET', '/payments/order/o1'), 1);
      await tester.pumpWidget(const SizedBox());
    });

    testWidgets('PIX expirado oferece gerar novo QR (forceNew) e volta a exibir o código novo', (tester) async {
      final calls = _Calls();
      await _pump(
        tester,
        PixPaymentScreen(
          order: _order(),
          payment: payment(expires: '2026-11-20T10:00:00Z'),
          now: () => DateTime.utc(2026, 11, 20, 11),
        ),
        (r) {
          if (r.method == 'POST') {
            return _json({..._pix(expires: '2099-01-01T00:00:00Z'), 'pixCopyPaste': 'NOVOCODIGO'}, 201);
          }
          return _json(_pix());
        },
        calls,
      );

      expect(find.byKey(const Key('pix-expired')), findsOneWidget);
      expect(find.byKey(const Key('pix-copy')), findsNothing);
      await tester.tap(find.byKey(const Key('pix-regenerate')));
      await tester.pump();
      await tester.pump();

      expect(jsonDecode(calls.where('POST', '/payments/checkout').single.body), {
        'orderId': 'o1',
        'method': 'PIX',
        'forceNew': true,
      });
      expect(find.text('NOVOCODIGO'), findsOneWidget);
      expect(find.byKey(const Key('pix-expired')), findsNothing);
      await tester.pumpWidget(const SizedBox());
    });

    testWidgets('pagamento FAILED também oferece novo QR', (tester) async {
      await _pump(
        tester,
        PixPaymentScreen(order: _order(), payment: payment(status: 'FAILED', expires: '2099-01-01T00:00:00Z')),
        (_) => _json(_pix()),
        _Calls(),
      );
      expect(find.byKey(const Key('pix-regenerate')), findsOneWidget);
    });

    testWidgets('já pago ao abrir mostra confirmação', (tester) async {
      await _pump(
        tester,
        PixPaymentScreen(order: _order(), payment: payment(status: 'PAID')),
        (_) => _json(_pix()),
        _Calls(),
      );
      expect(find.byKey(const Key('pix-paid')), findsOneWidget);
    });
  });

  group('OrderDetailsScreen + Pagar', () {
    testWidgets('pedido aguardando pagamento mostra Pagar e abre o checkout', (tester) async {
      final calls = _Calls();
      await _pump(tester, const OrderDetailsScreen(orderId: 'o1'), (_) => _json({...orderJson, 'status': 'AWAITING_PAYMENT'}), calls);
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('order-pay')), findsOneWidget);
      await tester.ensureVisible(find.byKey(const Key('order-pay')));
      await tester.tap(find.byKey(const Key('order-pay')));
      await tester.pumpAndSettle();
      expect(find.byType(CheckoutScreen), findsOneWidget);
    });

    testWidgets('CREATED também; PAID e CANCELLED não', (tester) async {
      for (final s in ['CREATED']) {
        await tester.pumpWidget(const SizedBox());
        await _pump(tester, const OrderDetailsScreen(orderId: 'o1'), (_) => _json({...orderJson, 'status': s}), _Calls());
        await tester.pumpAndSettle();
        expect(find.byKey(const Key('order-pay')), findsOneWidget, reason: s);
      }
      for (final s in ['PAID', 'CANCELLED', 'DELIVERED']) {
        await tester.pumpWidget(const SizedBox());
        await _pump(tester, const OrderDetailsScreen(orderId: 'o1'), (_) => _json({...orderJson, 'status': s}), _Calls());
        await tester.pumpAndSettle();
        expect(find.byKey(const Key('order-pay')), findsNothing, reason: s);
      }
    });
  });
}
