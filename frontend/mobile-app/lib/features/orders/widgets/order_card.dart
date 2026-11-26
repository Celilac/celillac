import 'package:flutter/material.dart';

import '../../../api/models/order_models.dart';
import '../../../core/theme/app_colors.dart';
import '../order_labels.dart';
import 'order_verdict_chip.dart';

/// Resumo de um pedido (lista de pedidos e Início). [onPay], quando informado,
/// mostra o botão **Pagar**.
class OrderCard extends StatelessWidget {
  const OrderCard({
    super.key,
    required this.order,
    required this.onTap,
    this.onPay,
    this.showVerdict = true,
  });

  final Order order;
  final VoidCallback onTap;
  final VoidCallback? onPay;
  final bool showVerdict;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        key: Key('order-card-${order.id}'),
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      orderStatusLabel(order.status),
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ),
                  Text(formatBrl(order.totalAmount), style: const TextStyle(fontWeight: FontWeight.bold)),
                ],
              ),
              const SizedBox(height: 4),
              Text(orderSummary(order), style: const TextStyle(color: AppColors.textMutedLight)),
              if (order.createdAt != null)
                Text(
                  formatOrderDate(order.createdAt),
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                ),
              if (showVerdict) ...[
                const SizedBox(height: 8),
                Align(
                  alignment: Alignment.centerLeft,
                  child: OrderVerdictChip(verdict: order.allergenCheckVerdict),
                ),
              ],
              if (onPay != null) ...[
                const SizedBox(height: 10),
                ElevatedButton(
                  key: Key('order-pay-${order.id}'),
                  onPressed: onPay,
                  child: const Text('Pagar'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
