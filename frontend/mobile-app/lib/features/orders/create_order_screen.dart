import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/api_client.dart';
import '../../api/models/enums.dart';
import '../../api/models/product_models.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/alert_banner.dart';
import 'order_details_screen.dart';
import 'order_error_messages.dart';
import 'order_labels.dart';

/// Pedido de um único produto. O veredito de segurança é do backend: se o
/// AllergenEngine bloquear, exibimos o bloqueio como veio e nada é contornado.
class CreateOrderScreen extends StatefulWidget {
  const CreateOrderScreen({super.key, required this.product});

  final Product product;

  @override
  State<CreateOrderScreen> createState() => _CreateOrderScreenState();
}

class _CreateOrderScreenState extends State<CreateOrderScreen> {
  static const _maxQuantity = 20;

  final _notes = TextEditingController();
  int _quantity = 1;
  bool _submitting = false;
  OrderCreateFailure? _failure;

  @override
  void dispose() {
    _notes.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final product = widget.product;
    final partnerId = product.partnerId;
    if (partnerId == null || _submitting) return;
    final api = context.read<ApiClient>();
    setState(() {
      _submitting = true;
      _failure = null;
    });
    try {
      final created = await api.createOrder(
        partnerId: partnerId,
        productId: product.id,
        quantity: _quantity,
        notes: _notes.text,
      );
      if (!mounted) return;
      await Navigator.pushReplacement(
        context,
        MaterialPageRoute<void>(builder: (_) => OrderDetailsScreen(orderId: created.orderId)),
      );
    } catch (err) {
      if (mounted) setState(() => _failure = OrderErrorMessages.create(err));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final product = widget.product;
    final price = product.price ?? 0;
    final failure = _failure;
    return Scaffold(
      appBar: AppBar(title: const Text('Fazer pedido')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(
            product.name,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 4),
          Text(
            '${formatBrl(price)} por unidade',
            style: const TextStyle(color: AppColors.textMutedLight, fontSize: 14),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              const Text('Quantidade', style: TextStyle(color: AppColors.textPrimary, fontSize: 15)),
              const Spacer(),
              IconButton(
                key: const Key('qty-minus'),
                onPressed: _quantity > 1 && !_submitting ? () => setState(() => _quantity--) : null,
                icon: const Icon(Icons.remove_circle_outline),
              ),
              Text(
                '$_quantity',
                key: const Key('qty-value'),
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              IconButton(
                key: const Key('qty-plus'),
                onPressed: _quantity < _maxQuantity && !_submitting ? () => setState(() => _quantity++) : null,
                icon: const Icon(Icons.add_circle_outline),
              ),
            ],
          ),
          const SizedBox(height: 12),
          TextField(
            key: const Key('order-notes'),
            controller: _notes,
            enabled: !_submitting,
            maxLines: 3,
            maxLength: 300,
            decoration: const InputDecoration(labelText: 'Observações (opcional)'),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(10)),
            child: Row(
              children: [
                const Text('Subtotal', style: TextStyle(color: AppColors.textMutedLight)),
                const Spacer(),
                Text(
                  formatBrl(price * _quantity),
                  key: const Key('order-subtotal'),
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
              ],
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Valor estimado. Taxas e total final são confirmados pelo estabelecimento ao criar o pedido.',
            style: TextStyle(color: AppColors.textMuted, fontSize: 12),
          ),
          if (failure != null)
            failure.safetyBlock
                ? AlertBanner(
                    key: const Key('order-safety-block'),
                    status: RiskLevel.blocked,
                    message: 'Pedido bloqueado por segurança alimentar',
                    reasoning: failure.message,
                  )
                : Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Text(
                      failure.message,
                      key: const Key('order-error'),
                      style: const TextStyle(color: AppColors.error, fontSize: 14),
                    ),
                  ),
          const SizedBox(height: 20),
          ElevatedButton(
            key: const Key('order-submit'),
            onPressed: _submitting ? null : _submit,
            child: _submitting
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Confirmar pedido'),
          ),
        ],
      ),
    );
  }
}
