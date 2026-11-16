import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/api_client.dart';
import '../../api/models/order_models.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/loading_overlay.dart';
import 'order_error_messages.dart';
import 'order_labels.dart';
import 'widgets/order_verdict_chip.dart';

/// Detalhe do pedido: itens, totais, status e veredito como vieram da API.
/// Atualiza por polling leve enquanto o pedido está em andamento.
class OrderDetailsScreen extends StatefulWidget {
  const OrderDetailsScreen({
    super.key,
    required this.orderId,
    this.pollInterval = const Duration(seconds: 20),
  });

  final String orderId;
  final Duration pollInterval;

  @override
  State<OrderDetailsScreen> createState() => _OrderDetailsScreenState();
}

class _OrderDetailsScreenState extends State<OrderDetailsScreen> {
  Order? _order;
  String? _error;
  bool _loading = true;
  bool _cancelling = false;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _load({bool silent = false}) async {
    final api = context.read<ApiClient>();
    if (!silent) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }
    try {
      final order = await api.getOrderById(widget.orderId);
      if (mounted) setState(() => _order = order);
    } catch (err) {
      // Falha silenciosa de polling não derruba o que já está na tela.
      if (mounted && !silent) setState(() => _error = OrderErrorMessages.details(err));
    } finally {
      if (mounted) {
        setState(() => _loading = false);
        _syncPolling();
      }
    }
  }

  void _syncPolling() {
    final inProgress = _order?.isInProgress ?? false;
    if (inProgress && _timer == null) {
      _timer = Timer.periodic(widget.pollInterval, (_) => _load(silent: true));
    } else if (!inProgress) {
      _timer?.cancel();
      _timer = null;
    }
  }

  Future<void> _cancel() async {
    final reason = await showDialog<String>(
      context: context,
      builder: (_) => const _CancelReasonDialog(),
    );
    if (reason == null || !mounted) return;
    final api = context.read<ApiClient>();
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _cancelling = true);
    try {
      final result = await api.cancelOrder(widget.orderId, reason: reason);
      messenger.showSnackBar(
        SnackBar(
          content: Text(
            result.requiresRefund
                ? 'Pedido cancelado. O estorno do pagamento será processado.'
                : 'Pedido cancelado.',
          ),
        ),
      );
      if (mounted) await _load(silent: true);
    } catch (err) {
      messenger.showSnackBar(SnackBar(content: Text(OrderErrorMessages.cancel(err))));
    } finally {
      if (mounted) setState(() => _cancelling = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Pedido')),
      body: _body(),
    );
  }

  Widget _body() {
    final order = _order;
    if (_loading && order == null) return const LoadingOverlay(message: 'Carregando pedido...');
    if (order == null) {
      return Center(
        key: const Key('order-error'),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(_error ?? OrderErrorMessages.details(Object()), textAlign: TextAlign.center),
              const SizedBox(height: 16),
              ElevatedButton(onPressed: _load, child: const Text('Tentar novamente')),
            ],
          ),
        ),
      );
    }
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text(
          orderStatusLabel(order.status),
          key: const Key('order-status'),
          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
        ),
        if (order.createdAt != null)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(
              'Feito em ${formatOrderDate(order.createdAt)}',
              style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
            ),
          ),
        const SizedBox(height: 12),
        OrderVerdictChip(verdict: order.allergenCheckVerdict),
        const SizedBox(height: 16),
        for (final item in order.items)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Row(
              children: [
                Expanded(child: Text('${item.quantity}x ${item.productName}')),
                Text(formatBrl(item.totalPrice)),
              ],
            ),
          ),
        const Divider(height: 28),
        _totalRow('Subtotal', order.subtotalAmount),
        _totalRow('Entrega', order.deliveryFee),
        _totalRow('Total', order.totalAmount, bold: true, key: const Key('order-total')),
        if (order.notes != null && order.notes!.isNotEmpty) ...[
          const SizedBox(height: 16),
          const Text('Observações', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
          const SizedBox(height: 4),
          Text(order.notes!),
        ],
        if (order.isCancelled && order.cancelReason != null && order.cancelReason!.isNotEmpty) ...[
          const SizedBox(height: 16),
          const Text('Motivo do cancelamento', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
          const SizedBox(height: 4),
          Text(order.cancelReason!, key: const Key('order-cancel-reason')),
        ],
        if (order.canCancel) ...[
          const SizedBox(height: 24),
          OutlinedButton(
            key: const Key('order-cancel'),
            onPressed: _cancelling ? null : _cancel,
            style: OutlinedButton.styleFrom(foregroundColor: AppColors.error),
            child: _cancelling
                ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Cancelar pedido'),
          ),
        ],
      ],
    );
  }

  Widget _totalRow(String label, double value, {bool bold = false, Key? key}) {
    final style = TextStyle(fontWeight: bold ? FontWeight.bold : FontWeight.normal, fontSize: bold ? 17 : 14);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          Text(label, style: style),
          const Spacer(),
          Text(formatBrl(value), key: key, style: style),
        ],
      ),
    );
  }
}

class _CancelReasonDialog extends StatefulWidget {
  const _CancelReasonDialog();

  @override
  State<_CancelReasonDialog> createState() => _CancelReasonDialogState();
}

class _CancelReasonDialogState extends State<_CancelReasonDialog> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final reason = _controller.text.trim();
    return AlertDialog(
      title: const Text('Cancelar pedido'),
      content: TextField(
        key: const Key('cancel-reason-field'),
        controller: _controller,
        maxLines: 3,
        maxLength: 200,
        onChanged: (_) => setState(() {}),
        decoration: const InputDecoration(labelText: 'Motivo do cancelamento'),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Voltar')),
        TextButton(
          key: const Key('cancel-confirm'),
          onPressed: reason.isEmpty ? null : () => Navigator.pop(context, reason),
          child: const Text('Cancelar pedido'),
        ),
      ],
    );
  }
}
