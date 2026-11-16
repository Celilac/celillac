import '../../api/models/order_models.dart';

/// "R$ 25,50".
String formatBrl(double value) => 'R\$ ${value.toStringAsFixed(2).replaceAll('.', ',')}';

String orderStatusLabel(String status) => switch (status) {
      'CREATED' => 'Pedido criado',
      'AWAITING_PAYMENT' => 'Aguardando pagamento',
      'PAID' => 'Pago',
      'CONFIRMED' => 'Confirmado pelo estabelecimento',
      'PREPARING' => 'Em preparo',
      'READY_FOR_PICKUP' => 'Pronto para retirada',
      'OUT_FOR_DELIVERY' => 'Saiu para entrega',
      'DELIVERED' => 'Entregue',
      'CANCELLED' => 'Cancelado',
      _ => 'Status desconhecido',
    };

/// Texto do `allergenCheckVerdict` exatamente como o backend decidiu.
/// Valor desconhecido vira `null` (nada é exibido), nunca um palpite.
String? orderVerdictLabel(String verdict) => switch (verdict) {
      'SAFE' => 'Verificado seguro para o seu perfil',
      'WARNING' => 'Atenção: possíveis traços para o seu perfil',
      _ => null,
    };

String orderSummary(Order order) {
  if (order.items.isEmpty) return 'Pedido';
  final first = order.items.first;
  final extra = order.items.length - 1;
  final base = '${first.quantity}x ${first.productName}';
  return extra > 0 ? '$base +$extra' : base;
}

String formatOrderDate(DateTime? date) {
  if (date == null) return '';
  final d = date.toLocal();
  String two(int n) => n.toString().padLeft(2, '0');
  return '${two(d.day)}/${two(d.month)}/${d.year} ${two(d.hour)}:${two(d.minute)}';
}
