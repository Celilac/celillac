import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/api_client.dart';
import '../../api/models/order_models.dart';
import '../../api/models/payment_models.dart';
import '../../core/theme/app_colors.dart';
import '../orders/order_labels.dart';
import 'payment_error_messages.dart';
import 'pix_payment_screen.dart';

/// Escolha do método de pagamento: PIX online ou dinheiro/cartão na entrega.
/// Cartão de crédito online fica fora (sem dados de cartão no app). Faz `pop(true)`
/// quando algo mudou (pagamento registrado/confirmado) para o chamador recarregar.
class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key, required this.order});

  final Order order;

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _change = TextEditingController();
  PaymentMethod _method = PaymentMethod.pix;
  bool _submitting = false;
  bool _registered = false;
  String? _error;
  String? _changeError;

  @override
  void dispose() {
    _change.dispose();
    super.dispose();
  }

  /// Vazio = sem troco. Aceita vírgula. `null` com `ok=false` = formato inválido.
  ({bool ok, double? value}) _parseChange() {
    final text = _change.text.trim().replaceAll(',', '.');
    if (text.isEmpty) return (ok: true, value: null);
    final value = double.tryParse(text);
    if (value == null || value <= 0) return (ok: false, value: null);
    return (ok: true, value: value);
  }

  Future<void> _confirm() async {
    double? changeFor;
    if (_method == PaymentMethod.cashOnDelivery) {
      final parsed = _parseChange();
      // Só UX: o backend continua sendo a fonte da verdade da regra do troco.
      if (!parsed.ok || (parsed.value != null && parsed.value! < widget.order.totalAmount)) {
        setState(() => _changeError = 'Informe um valor igual ou maior que ${formatBrl(widget.order.totalAmount)}.');
        return;
      }
      changeFor = parsed.value;
    }
    final api = context.read<ApiClient>();
    setState(() {
      _submitting = true;
      _error = null;
      _changeError = null;
    });
    try {
      final payment = await api.checkoutPayment(
        orderId: widget.order.id,
        method: _method,
        changeFor: changeFor,
      );
      if (!mounted) return;
      if (_method == PaymentMethod.pix) {
        final paid = await Navigator.push<bool>(
          context,
          MaterialPageRoute<bool>(builder: (_) => PixPaymentScreen(order: widget.order, payment: payment)),
        );
        if (mounted && paid == true) Navigator.pop(context, true);
      } else {
        setState(() => _registered = true);
      }
    } catch (err) {
      if (mounted) setState(() => _error = PaymentErrorMessages.checkout(err));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Pagamento')),
      body: _registered ? _registeredView() : _form(),
    );
  }

  Widget _registeredView() {
    final cash = _method == PaymentMethod.cashOnDelivery;
    return Center(
      key: const Key('delivery-registered'),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.check_circle_outline, size: 56, color: AppColors.success),
            const SizedBox(height: 16),
            Text(
              cash ? 'Pagamento em dinheiro na entrega registrado.' : 'Pagamento com cartão na entrega registrado.',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Você paga ${formatBrl(widget.order.totalAmount)} ao receber o pedido.',
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.textMutedLight),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              key: const Key('checkout-done'),
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Voltar ao pedido'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _form() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const Text('Total do pedido', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
        const SizedBox(height: 4),
        Text(
          formatBrl(widget.order.totalAmount),
          key: const Key('checkout-total'),
          style: const TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
        ),
        const SizedBox(height: 20),
        RadioGroup<PaymentMethod>(
          groupValue: _method,
          onChanged: (m) {
            if (m != null && !_submitting) {
              setState(() {
                _method = m;
                _changeError = null;
              });
            }
          },
          child: Column(
            children: [
              _methodTile(
                const Key('method-pix'),
                PaymentMethod.pix,
                'PIX',
                'Pague agora; a confirmação é automática.',
              ),
              _methodTile(
                const Key('method-cash'),
                PaymentMethod.cashOnDelivery,
                'Dinheiro na entrega',
                'Pague em espécie ao receber.',
              ),
              _methodTile(
                const Key('method-card'),
                PaymentMethod.cardOnDelivery,
                'Cartão na entrega',
                'Débito ou crédito na maquininha.',
              ),
            ],
          ),
        ),
        if (_method == PaymentMethod.cashOnDelivery) ...[
          const SizedBox(height: 12),
          TextField(
            key: const Key('change-field'),
            controller: _change,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: InputDecoration(
              labelText: 'Troco para quanto? (opcional)',
              prefixText: 'R\$ ',
              errorText: _changeError,
              errorMaxLines: 2,
            ),
          ),
          if (_changeError != null) const SizedBox(key: Key('change-error'), height: 0),
        ],
        if (_error != null) ...[
          const SizedBox(height: 16),
          Container(
            key: const Key('checkout-error'),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.error.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.error),
            ),
            child: Text(_error!),
          ),
        ],
        const SizedBox(height: 24),
        ElevatedButton(
          key: const Key('checkout-confirm'),
          onPressed: _submitting ? null : _confirm,
          child: _submitting
              ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
              : Text(_method == PaymentMethod.pix ? 'Gerar PIX' : 'Confirmar'),
        ),
      ],
    );
  }

  Widget _methodTile(Key key, PaymentMethod value, String title, String subtitle) {
    return Card(
      color: AppColors.surface,
      child: RadioListTile<PaymentMethod>(
        key: key,
        value: value,
        title: Text(title),
        subtitle: Text(subtitle, style: const TextStyle(color: AppColors.textMutedLight, fontSize: 13)),
      ),
    );
  }
}
