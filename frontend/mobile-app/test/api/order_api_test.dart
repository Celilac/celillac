import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile_app/api/api_client.dart';
import 'package:mobile_app/api/api_exception.dart';
import 'package:mobile_app/api/models/order_models.dart';

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

const orderJson = {
  'id': 'o1',
  'consumerId': 'u1',
  'partnerId': 'pt1',
  'status': 'AWAITING_PAYMENT',
  'subtotalAmount': 20.0,
  'deliveryFee': 5.5,
  'totalAmount': 25.5,
  'allergenCheckVerdict': 'WARNING',
  'notes': 'Sem cebola',
  'cancelReason': null,
  'createdAt': '2026-11-13T12:00:00.000Z',
  'updatedAt': '2026-11-13T12:00:00.000Z',
  'items': [
    {
      'id': 'i1',
      'orderId': 'o1',
      'productId': 'p1',
      'productName': 'Biscoito',
      'unitPrice': 10.0,
      'quantity': 2,
      'totalPrice': 20.0,
    },
  ],
};

void main() {
  group('Order.fromJson', () {
    test('lê o formato real do backend', () {
      final o = Order.fromJson(orderJson);
      expect(o.id, 'o1');
      expect(o.subtotalAmount, 20.0);
      expect(o.deliveryFee, 5.5);
      expect(o.totalAmount, 25.5);
      expect(o.allergenCheckVerdict, 'WARNING');
      expect(o.items.single.productName, 'Biscoito');
      expect(o.items.single.quantity, 2);
      expect(o.createdAt, isNotNull);
      expect(o.canCancel, isTrue);
      expect(o.awaitsPayment, isTrue);
      expect(o.isInProgress, isTrue);
    });

    test('tolera total/subtotal e envelope data', () {
      final o = Order.fromJson({
        'data': {'id': 'o2', 'status': 'DELIVERED', 'total': 12, 'items': []},
      });
      expect(o.id, 'o2');
      expect(o.totalAmount, 12.0);
      expect(o.subtotalAmount, 12.0);
      expect(o.isInProgress, isFalse);
      expect(o.canCancel, isFalse);
    });

    test('cancelado não está em andamento nem cancelável', () {
      final o = Order.fromJson({...orderJson, 'status': 'CANCELLED'});
      expect(o.isInProgress, isFalse);
      expect(o.canCancel, isFalse);
    });

    test('só CREATED/AWAITING_PAYMENT/PAID podem ser cancelados', () {
      for (final s in ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY']) {
        expect(Order.fromJson({...orderJson, 'status': s}).canCancel, isFalse, reason: s);
      }
      expect(Order.fromJson({...orderJson, 'status': 'PAID'}).canCancel, isTrue);
    });
  });

  group('POST /orders', () {
    test('envia partnerId, 1 item e notes; sem deliveryFee', () async {
      late http.Request captured;
      final api = _client(
        (_) => _json({
          'orderId': 'o1',
          'status': 'CREATED',
          'subtotalAmount': 20,
          'deliveryFee': 0,
          'totalAmount': 20,
          'allergenCheckVerdict': 'SAFE',
          'itemsCount': 1,
        }, 201),
        capture: (r) => captured = r,
      );

      final created = await api.createOrder(partnerId: 'pt1', productId: 'p1', quantity: 2, notes: ' Sem cebola ');

      expect(captured.method, 'POST');
      expect(captured.url.toString(), 'http://api.test/orders');
      expect(captured.headers['Authorization'], 'Bearer tok');
      expect(jsonDecode(captured.body), {
        'partnerId': 'pt1',
        'items': [
          {'productId': 'p1', 'quantity': 2},
        ],
        'notes': 'Sem cebola',
      });
      expect(created.orderId, 'o1');
      expect(created.allergenCheckVerdict, 'SAFE');
    });

    test('omite notes vazias', () async {
      late http.Request captured;
      final api = _client((_) => _json({'orderId': 'o1', 'status': 'CREATED'}, 201), capture: (r) => captured = r);
      await api.createOrder(partnerId: 'pt1', productId: 'p1', quantity: 1, notes: '  ');
      expect(jsonDecode(captured.body).containsKey('notes'), isFalse);
    });

    test('400 vira ApiException com a mensagem do backend', () async {
      final api = _client((_) => _json({'error': 'BLOQUEIO DE SEGURANÇA ALIMENTAR: x'}, 400));
      expect(
        () => api.createOrder(partnerId: 'pt1', productId: 'p1', quantity: 1),
        throwsA(isA<ApiException>().having((e) => e.statusCode, 'status', 400)),
      );
    });

    test('503 vira serviço indisponível', () async {
      final api = _client((_) => http.Response('', 503));
      expect(
        () => api.createOrder(partnerId: 'pt1', productId: 'p1', quantity: 1),
        throwsA(isA<ApiException>().having((e) => e.isServiceUnavailable, 'unavailable', isTrue)),
      );
    });
  });

  group('GET /orders/me e /orders/:id', () {
    test('lista pedidos', () async {
      late http.Request captured;
      final api = _client((_) => _json([orderJson], 200), capture: (r) => captured = r);
      final orders = await api.getMyOrders();
      expect(captured.url.toString(), 'http://api.test/orders/me');
      expect(orders.single.id, 'o1');
    });

    test('detalhe', () async {
      late http.Request captured;
      final api = _client((_) => _json(orderJson, 200), capture: (r) => captured = r);
      final order = await api.getOrderById('o1');
      expect(captured.url.toString(), 'http://api.test/orders/o1');
      expect(order.items, hasLength(1));
    });
  });

  group('POST /orders/:id/cancel', () {
    test('envia reason e lê requiresRefund', () async {
      late http.Request captured;
      final api = _client(
        (_) => _json({'orderId': 'o1', 'status': 'CANCELLED', 'requiresRefund': true, 'cancelReason': 'Desisti'}, 200),
        capture: (r) => captured = r,
      );
      final res = await api.cancelOrder('o1', reason: 'Desisti');
      expect(captured.method, 'POST');
      expect(captured.url.toString(), 'http://api.test/orders/o1/cancel');
      expect(jsonDecode(captured.body), {'reason': 'Desisti'});
      expect(res.requiresRefund, isTrue);
      expect(res.status, 'CANCELLED');
    });
  });
}
