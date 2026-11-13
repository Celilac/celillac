// Modelos de pedidos do consumidor (docs/API_CONTRACTS.md §14).
//
// O backend responde objetos diretos (sem envelope `{success,data}`); o parse
// também aceita um envelope `data` por tolerância. `allergenCheckVerdict` é
// guardado exatamente como veio — o app nunca o calcula.

Map<String, dynamic> _unwrap(Map<String, dynamic> json) {
  final data = json['data'];
  return data is Map<String, dynamic> ? data : json;
}

double _num(dynamic v) => (v as num?)?.toDouble() ?? 0;

class OrderItem {
  const OrderItem({
    required this.productId,
    required this.productName,
    required this.unitPrice,
    required this.quantity,
    required this.totalPrice,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) => OrderItem(
        productId: (json['productId'] as String?) ?? '',
        productName: (json['productName'] as String?) ?? '',
        unitPrice: _num(json['unitPrice']),
        quantity: (json['quantity'] as num?)?.toInt() ?? 1,
        totalPrice: _num(json['totalPrice']),
      );

  final String productId;
  final String productName;
  final double unitPrice;
  final int quantity;
  final double totalPrice;
}

class Order {
  const Order({
    required this.id,
    required this.partnerId,
    required this.status,
    required this.subtotalAmount,
    required this.deliveryFee,
    required this.totalAmount,
    required this.allergenCheckVerdict,
    required this.items,
    this.notes,
    this.paymentMethod,
    this.changeFor,
    this.cancelledAt,
    this.cancelReason,
    this.createdAt,
  });

  factory Order.fromJson(Map<String, dynamic> raw) {
    final json = _unwrap(raw);
    final total = _num(json['totalAmount'] ?? json['total']);
    return Order(
      id: (json['id'] ?? json['orderId']) as String,
      partnerId: (json['partnerId'] as String?) ?? '',
      status: (json['status'] as String?) ?? '',
      subtotalAmount: _num(json['subtotalAmount'] ?? json['subtotal'] ?? total),
      deliveryFee: _num(json['deliveryFee']),
      totalAmount: total,
      allergenCheckVerdict: (json['allergenCheckVerdict'] as String?) ?? '',
      items: (json['items'] as List<dynamic>? ?? [])
          .map((e) => OrderItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      notes: json['notes'] as String?,
      paymentMethod: json['paymentMethod'] as String?,
      changeFor: (json['changeFor'] as num?)?.toDouble(),
      cancelledAt: DateTime.tryParse((json['cancelledAt'] as String?) ?? ''),
      cancelReason: json['cancelReason'] as String?,
      createdAt: DateTime.tryParse((json['createdAt'] as String?) ?? ''),
    );
  }

  final String id;
  final String partnerId;

  /// CREATED | AWAITING_PAYMENT | PAID | CONFIRMED | PREPARING |
  /// READY_FOR_PICKUP | OUT_FOR_DELIVERY | DELIVERED | CANCELLED.
  final String status;
  final double subtotalAmount;
  final double deliveryFee;
  final double totalAmount;

  /// `SAFE` | `WARNING`, como veio do backend.
  final String allergenCheckVerdict;
  final List<OrderItem> items;
  final String? notes;
  final String? paymentMethod;
  final double? changeFor;
  final DateTime? cancelledAt;
  final String? cancelReason;
  final DateTime? createdAt;

  bool get isCancelled => status == 'CANCELLED';
  bool get isDelivered => status == 'DELIVERED';

  /// Pedido que ainda muda de estado (vale a pena atualizar por polling).
  bool get isInProgress => !isCancelled && !isDelivered && status.isNotEmpty;

  /// Espelha `OrderCancellationPolicy.canConsumerCancel` apenas para decidir se
  /// o botão aparece; o backend continua sendo quem autoriza.
  bool get canCancel => const {'CREATED', 'AWAITING_PAYMENT', 'PAID'}.contains(status);

  bool get awaitsPayment => status == 'CREATED' || status == 'AWAITING_PAYMENT';
}

/// Resposta de `POST /orders` (resumo, sem itens).
class CreatedOrder {
  const CreatedOrder({
    required this.orderId,
    required this.status,
    required this.totalAmount,
    required this.allergenCheckVerdict,
  });

  factory CreatedOrder.fromJson(Map<String, dynamic> raw) {
    final json = _unwrap(raw);
    return CreatedOrder(
      orderId: (json['orderId'] ?? json['id']) as String,
      status: (json['status'] as String?) ?? '',
      totalAmount: _num(json['totalAmount'] ?? json['total']),
      allergenCheckVerdict: (json['allergenCheckVerdict'] as String?) ?? '',
    );
  }

  final String orderId;
  final String status;
  final double totalAmount;
  final String allergenCheckVerdict;
}

/// Resposta de `POST /orders/:id/cancel`.
class CancelledOrder {
  const CancelledOrder({
    required this.orderId,
    required this.status,
    required this.requiresRefund,
    this.cancelReason,
  });

  factory CancelledOrder.fromJson(Map<String, dynamic> raw) {
    final json = _unwrap(raw);
    return CancelledOrder(
      orderId: (json['orderId'] ?? json['id']) as String,
      status: (json['status'] as String?) ?? '',
      requiresRefund: json['requiresRefund'] == true,
      cancelReason: json['cancelReason'] as String?,
    );
  }

  final String orderId;
  final String status;
  final bool requiresRefund;
  final String? cancelReason;
}
