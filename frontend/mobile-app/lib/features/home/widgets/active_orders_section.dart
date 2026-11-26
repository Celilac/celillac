import 'package:flutter/material.dart';

import '../../../api/models/order_models.dart';
import '../../orders/widgets/order_card.dart';
import '../home_block.dart';
import 'home_section.dart';

/// Pedidos em andamento ([Order.isInProgress]). Sem o selo de veredito: o
/// Início não mostra risco por produto.
class ActiveOrdersSection extends StatelessWidget {
  const ActiveOrdersSection({
    super.key,
    required this.orders,
    required this.onOpen,
    required this.onPay,
    required this.onViewAll,
  });

  static const maxItems = 3;

  /// Já filtrados e ordenados (mais recentes primeiro).
  final HomeBlock<List<Order>> orders;
  final ValueChanged<Order> onOpen;
  final ValueChanged<Order> onPay;
  final VoidCallback onViewAll;

  @override
  Widget build(BuildContext context) {
    final data = orders.data;
    if (data == null) {
      return orders.error != null
          ? HomeBlockError(id: 'orders', message: orders.error!, onRetry: orders.load)
          : const HomeBlockLoading(key: Key('home-orders-loading'));
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (data.isEmpty)
          const HomeEmptyText('Nenhum pedido em andamento.', key: Key('home-orders-empty')),
        for (final order in data.take(maxItems))
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: OrderCard(
              order: order,
              showVerdict: false,
              onTap: () => onOpen(order),
              onPay: order.awaitsPayment ? () => onPay(order) : null,
            ),
          ),
        Align(
          alignment: Alignment.centerRight,
          child: TextButton(
            key: const Key('home-orders-all'),
            onPressed: onViewAll,
            child: const Text('Ver todos os pedidos'),
          ),
        ),
      ],
    );
  }
}
