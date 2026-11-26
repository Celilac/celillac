import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile_app/api/api_client.dart';
import 'package:mobile_app/api/api_exception.dart';
import 'package:mobile_app/api/models/payment_models.dart';

ApiClient _client(http.Response Function(http.Request) handler, {void Function(http.Request)? capture}) {
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

http.Response _json(Object body, int status) => http.Response(jsonEncode(body), status);

const pixCheckoutJson = {
  'paymentId': 'pay1',
  'orderId': 'o1',
  'method': 'PIX',
  'status': 'PENDING',
  'grossAmount': 25.5,
  'netPartnerAmount': 22.44,
  'platformFeeAmount': 3.06,
  'pixQrCode': 'https://qr.test/img.png',
  'pixCopyPaste': '000201pixcopiaecola',
  'pixExpiresAt': '2026-11-20T15:00:00.000Z',
};

void main() {
  group('Payment.fromJson', () {
    test('lê o formato do checkout (paymentId, pixQrCode, pixExpiresAt)', () {
      final p = Payment.fromJson(pixCheckoutJson);
      expect(p.id, 'pay1');
      expect(p.orderId, 'o1');
      expect(p.method, 'PIX');
      expect(p.status, 'PENDING');
      expect(p.grossAmount, 25.5);
      expect(p.pixQrCode, 'https://qr.test/img.png');
      expect(p.pixCopyPaste, '000201pixcopiaecola');
      expect(p.pixExpiresAt, DateTime.utc(2026, 11, 20, 15));
      expect(p.isPending, isTrue);
      expect(p.isPaid, isFalse);
    });

    test('lê o formato do GET /payments/order/:id (id, paidAt) e envelope data', () {
      final p = Payment.fromJson({
        'data': {
          'id': 'pay1',
          'orderId': 'o1',
          'method': 'PIX',
          'status': 'PAID',
          'grossAmount': 25.5,
          'paidAt': '2026-11-20T14:30:00.000Z',
        },
      });
      expect(p.id, 'pay1');
      expect(p.isPaid, isTrue);
      expect(p.paidAt, isNotNull);
      expect(p.pixCopyPaste, isNull);
    });

    test('FAILED e REFUNDED são terminais sem pagamento', () {
      for (final s in ['FAILED', 'REFUNDED']) {
        final p = Payment.fromJson({...pixCheckoutJson, 'status': s});
        expect(p.isPaid, isFalse, reason: s);
        expect(p.isPending, isFalse, reason: s);
        expect(p.isTerminalUnpaid, isTrue, reason: s);
      }
    });

    test('isPixExpired compara com o relógio informado', () {
      final p = Payment.fromJson(pixCheckoutJson);
      expect(p.isPixExpired(DateTime.utc(2026, 11, 20, 14, 59)), isFalse);
      expect(p.isPixExpired(DateTime.utc(2026, 11, 20, 15, 1)), isTrue);
      expect(Payment.fromJson({...pixCheckoutJson, 'pixExpiresAt': null}).isPixExpired(DateTime.utc(2030)), isFalse);
    });
  });

  group('POST /payments/checkout', () {
    test('PIX envia só orderId e method', () async {
      late http.Request captured;
      final api = _client((_) => _json(pixCheckoutJson, 201), capture: (r) => captured = r);

      final p = await api.checkoutPayment(orderId: 'o1', method: PaymentMethod.pix);

      expect(captured.method, 'POST');
      expect(captured.url.toString(), 'http://api.test/payments/checkout');
      expect(captured.headers['Authorization'], 'Bearer tok');
      expect(jsonDecode(captured.body), {'orderId': 'o1', 'method': 'PIX'});
      expect(p.pixCopyPaste, isNotNull);
    });

    test('dinheiro envia changeFor quando informado', () async {
      late http.Request captured;
      final api = _client(
        (_) => _json({...pixCheckoutJson, 'method': 'CASH_ON_DELIVERY', 'pixQrCode': null}, 201),
        capture: (r) => captured = r,
      );
      await api.checkoutPayment(orderId: 'o1', method: PaymentMethod.cashOnDelivery, changeFor: 50);
      expect(jsonDecode(captured.body), {'orderId': 'o1', 'method': 'CASH_ON_DELIVERY', 'changeFor': 50});
    });

    test('cartão na entrega não envia changeFor; forceNew só quando pedido', () async {
      late http.Request captured;
      final api = _client((_) => _json(pixCheckoutJson, 201), capture: (r) => captured = r);
      await api.checkoutPayment(orderId: 'o1', method: PaymentMethod.cardOnDelivery, changeFor: 50);
      expect(jsonDecode(captured.body), {'orderId': 'o1', 'method': 'CARD_ON_DELIVERY'});

      await api.checkoutPayment(orderId: 'o1', method: PaymentMethod.pix, forceNew: true);
      expect(jsonDecode(captured.body), {'orderId': 'o1', 'method': 'PIX', 'forceNew': true});
    });

    test('400 vira ApiException; 503 vira serviço indisponível', () async {
      final bad = _client((_) => _json({'error': 'Opção de pagamento na entrega indisponível'}, 400));
      expect(
        () => bad.checkoutPayment(orderId: 'o1', method: PaymentMethod.cashOnDelivery),
        throwsA(isA<ApiException>().having((e) => e.statusCode, 'status', 400)),
      );
      final down = _client((_) => http.Response('', 503));
      expect(
        () => down.checkoutPayment(orderId: 'o1', method: PaymentMethod.pix),
        throwsA(isA<ApiException>().having((e) => e.isServiceUnavailable, 'unavailable', true)),
      );
    });
  });

  group('GET /payments/order/:orderId', () {
    test('consulta pelo pedido', () async {
      late http.Request captured;
      final api = _client(
        (_) => _json({'id': 'pay1', 'orderId': 'o1', 'method': 'PIX', 'status': 'PAID', 'grossAmount': 25.5}, 200),
        capture: (r) => captured = r,
      );
      final p = await api.getPaymentByOrder('o1');
      expect(captured.method, 'GET');
      expect(captured.url.path, '/payments/order/o1');
      expect(p.isPaid, isTrue);
    });

    test('404 (sem pagamento ainda) vira ApiException 404', () async {
      final api = _client((_) => _json({'error': 'Nenhum pagamento gerado'}, 404));
      expect(
        () => api.getPaymentByOrder('o1'),
        throwsA(isA<ApiException>().having((e) => e.statusCode, 'status', 404)),
      );
    });
  });
}
