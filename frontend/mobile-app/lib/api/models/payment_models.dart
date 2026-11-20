// Modelos de pagamento do consumidor (docs/API_CONTRACTS.md §15).
//
// O backend responde objetos diretos (sem envelope); o parse tolera um
// envelope `data`. `POST /payments/checkout` usa `paymentId`; `GET
// /payments/order/:id` usa `id`. QR e copia-e-cola nunca são logados nem
// persistidos pelo app.

enum PaymentMethod {
  pix('PIX'),
  cashOnDelivery('CASH_ON_DELIVERY'),
  cardOnDelivery('CARD_ON_DELIVERY');

  const PaymentMethod(this.wire);

  final String wire;

  bool get isOnDelivery => this != pix;
}

class Payment {
  const Payment({
    required this.id,
    required this.orderId,
    required this.method,
    required this.status,
    required this.grossAmount,
    this.changeFor,
    this.pixQrCode,
    this.pixCopyPaste,
    this.pixExpiresAt,
    this.paidAt,
  });

  factory Payment.fromJson(Map<String, dynamic> raw) {
    final data = raw['data'];
    final json = data is Map<String, dynamic> ? data : raw;
    return Payment(
      id: (json['paymentId'] ?? json['id'] ?? '') as String,
      orderId: (json['orderId'] as String?) ?? '',
      method: (json['method'] as String?) ?? '',
      status: (json['status'] as String?) ?? '',
      grossAmount: (json['grossAmount'] as num?)?.toDouble() ?? 0,
      changeFor: (json['changeFor'] as num?)?.toDouble(),
      pixQrCode: json['pixQrCode'] as String?,
      pixCopyPaste: json['pixCopyPaste'] as String?,
      pixExpiresAt: DateTime.tryParse((json['pixExpiresAt'] as String?) ?? ''),
      paidAt: DateTime.tryParse((json['paidAt'] as String?) ?? ''),
    );
  }

  final String id;
  final String orderId;

  /// `PIX` | `CASH_ON_DELIVERY` | `CARD_ON_DELIVERY` (| `CREDIT_CARD`, não suportado no app).
  final String method;

  /// `PENDING` | `AUTHORIZED` | `PAID` | `FAILED` | `REFUNDED`.
  final String status;
  final double grossAmount;
  final double? changeFor;

  /// URL http(s), data URI ou base64 puro, conforme o gateway.
  final String? pixQrCode;
  final String? pixCopyPaste;
  final DateTime? pixExpiresAt;
  final DateTime? paidAt;

  bool get isPaid => status == 'PAID';
  bool get isPending => status == 'PENDING';
  bool get isTerminalUnpaid => status == 'FAILED' || status == 'REFUNDED';
  bool get isPix => method == 'PIX';

  bool isPixExpired(DateTime now) {
    final expires = pixExpiresAt;
    return expires != null && now.isAfter(expires);
  }
}
