import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../api/api_client.dart';
import '../../api/models/order_models.dart';
import '../../api/models/payment_models.dart';
import '../../core/theme/app_colors.dart';
import '../orders/order_labels.dart';
import 'payment_error_messages.dart';

/// Pagamento via PIX: QR, copia-e-cola e acompanhamento por polling até `PAID`.
/// O polling para ao sair da tela, ao confirmar o pagamento e em segundo plano.
/// QR e código PIX nunca são logados nem persistidos.
class PixPaymentScreen extends StatefulWidget {
  const PixPaymentScreen({
    super.key,
    required this.order,
    required this.payment,
    this.pollInterval = const Duration(seconds: 5),
    this.now = DateTime.now,
  });

  final Order order;
  final Payment payment;
  final Duration pollInterval;
  final DateTime Function() now;

  @override
  State<PixPaymentScreen> createState() => _PixPaymentScreenState();
}

class _PixPaymentScreenState extends State<PixPaymentScreen> with WidgetsBindingObserver {
  late Payment _payment = widget.payment;
  Timer? _timer;
  bool _regenerating = false;
  String? _error;

  bool get _paid => _payment.isPaid;
  bool get _expired => _payment.isPixExpired(widget.now());
  bool get _needsNewCode => !_paid && (_payment.isTerminalUnpaid || _expired);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _syncPolling();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _timer?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _poll();
      _syncPolling();
    } else {
      _stopPolling();
    }
  }

  void _syncPolling() {
    if (_paid || _needsNewCode) {
      _stopPolling();
    } else {
      _timer ??= Timer.periodic(widget.pollInterval, (_) => _poll());
    }
  }

  void _stopPolling() {
    _timer?.cancel();
    _timer = null;
  }

  Future<void> _poll() async {
    if (_paid) return;
    final api = context.read<ApiClient>();
    try {
      final latest = await api.getPaymentByOrder(widget.order.id);
      if (!mounted) return;
      setState(() {
        _payment = _mergeLatest(latest);
        _error = null;
      });
      _syncPolling();
    } catch (err) {
      // Falha transitória: mantém o que está na tela e tenta no próximo ciclo.
      if (mounted) setState(() => _error = PaymentErrorMessages.status(err));
    }
  }

  /// `GET /payments/order/:id` não traz o PIX; preserva o que já temos.
  Payment _mergeLatest(Payment latest) => Payment(
        id: latest.id.isEmpty ? _payment.id : latest.id,
        orderId: _payment.orderId,
        method: latest.method.isEmpty ? _payment.method : latest.method,
        status: latest.status,
        grossAmount: latest.grossAmount > 0 ? latest.grossAmount : _payment.grossAmount,
        changeFor: _payment.changeFor,
        pixQrCode: latest.pixQrCode ?? _payment.pixQrCode,
        pixCopyPaste: latest.pixCopyPaste ?? _payment.pixCopyPaste,
        pixExpiresAt: latest.pixExpiresAt ?? _payment.pixExpiresAt,
        paidAt: latest.paidAt,
      );

  Future<void> _regenerate() async {
    final api = context.read<ApiClient>();
    setState(() {
      _regenerating = true;
      _error = null;
    });
    try {
      final fresh = await api.checkoutPayment(
        orderId: widget.order.id,
        method: PaymentMethod.pix,
        forceNew: true,
      );
      if (!mounted) return;
      setState(() => _payment = fresh);
      _stopPolling();
      _syncPolling();
    } catch (err) {
      if (mounted) setState(() => _error = PaymentErrorMessages.checkout(err));
    } finally {
      if (mounted) setState(() => _regenerating = false);
    }
  }

  Future<void> _copy() async {
    final code = _payment.pixCopyPaste;
    if (code == null || code.isEmpty) return;
    final messenger = ScaffoldMessenger.of(context);
    await Clipboard.setData(ClipboardData(text: code));
    messenger.showSnackBar(const SnackBar(content: Text('Código PIX copiado')));
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) Navigator.pop(context, _paid);
      },
      child: Scaffold(
        appBar: AppBar(title: const Text('Pagar com PIX')),
        body: _paid ? _paidView() : _pendingView(),
      ),
    );
  }

  Widget _paidView() {
    return Center(
      key: const Key('pix-paid'),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.check_circle_outline, size: 64, color: AppColors.success),
            const SizedBox(height: 16),
            const Text(
              'Pagamento confirmado!',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              formatBrl(_payment.grossAmount),
              style: const TextStyle(color: AppColors.textMutedLight),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              key: const Key('pix-back'),
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Voltar ao pedido'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _pendingView() {
    final code = _payment.pixCopyPaste ?? '';
    final needsNew = _needsNewCode;
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text(
          formatBrl(_payment.grossAmount),
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
        ),
        const SizedBox(height: 16),
        if (needsNew) ...[
          Container(
            key: const Key('pix-expired'),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12)),
            child: Text(
              _payment.isTerminalUnpaid
                  ? 'Este pagamento não foi concluído. Gere um novo código PIX para pagar.'
                  : 'Este código PIX expirou. Gere um novo para pagar.',
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            key: const Key('pix-regenerate'),
            onPressed: _regenerating ? null : _regenerate,
            child: _regenerating
                ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Gerar novo PIX'),
          ),
        ] else ...[
          Center(child: _PixQr(source: _payment.pixQrCode)),
          const SizedBox(height: 16),
          const Text('PIX copia e cola', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(10)),
            child: Text(code, key: const Key('pix-code'), maxLines: 4, overflow: TextOverflow.ellipsis),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            key: const Key('pix-copy'),
            onPressed: code.isEmpty ? null : _copy,
            icon: const Icon(Icons.copy, size: 18),
            label: const Text('Copiar código'),
          ),
          const SizedBox(height: 20),
          Row(
            key: const Key('pix-status'),
            mainAxisAlignment: MainAxisAlignment.center,
            children: const [
              SizedBox(height: 14, width: 14, child: CircularProgressIndicator(strokeWidth: 2)),
              SizedBox(width: 10),
              Text('Aguardando pagamento...', style: TextStyle(color: AppColors.textMutedLight)),
            ],
          ),
        ],
        if (_error != null) ...[
          const SizedBox(height: 12),
          Text(_error!, key: const Key('pix-error'), textAlign: TextAlign.center, style: const TextStyle(color: AppColors.error)),
        ],
      ],
    );
  }
}

/// QR do PIX. O gateway pode devolver URL http(s), data URI ou base64 puro;
/// qualquer falha oculta a imagem (o copia-e-cola continua disponível).
class _PixQr extends StatelessWidget {
  const _PixQr({required this.source});

  final String? source;

  Uint8List? _bytes(String value) {
    try {
      if (value.startsWith('data:image')) return UriData.parse(value).contentAsBytes();
      final bytes = base64Decode(value);
      return bytes.isEmpty ? null : bytes;
    } catch (_) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final value = source?.trim() ?? '';
    if (value.isEmpty) return const SizedBox.shrink();
    Widget? image;
    if (value.startsWith('http://') || value.startsWith('https://')) {
      image = Image.network(value, width: 220, height: 220, errorBuilder: (_, _, _) => const SizedBox.shrink());
    } else {
      final bytes = _bytes(value);
      if (bytes != null) {
        image = Image.memory(bytes, width: 220, height: 220, errorBuilder: (_, _, _) => const SizedBox.shrink());
      }
    }
    if (image == null) return const SizedBox.shrink();
    return Container(
      key: const Key('pix-qr'),
      padding: const EdgeInsets.all(10),
      color: Colors.white,
      child: image,
    );
  }
}
