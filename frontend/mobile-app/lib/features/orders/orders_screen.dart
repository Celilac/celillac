import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/api_client.dart';
import '../../api/models/order_models.dart';
import '../../core/theme/app_colors.dart';
import 'order_details_screen.dart';
import 'order_error_messages.dart';
import 'widgets/order_card.dart';

/// Aba **Pedidos**. Polling leve só enquanto a aba está visível e existe pedido
/// em andamento; falhas do polling não substituem a lista já carregada.
class OrdersScreen extends StatefulWidget {
  const OrdersScreen({
    super.key,
    this.isActive = true,
    this.pollInterval = const Duration(seconds: 20),
  });

  final bool isActive;
  final Duration pollInterval;

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  List<Order>? _orders;
  String? _error;
  bool _loading = true;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(covariant OrdersScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isActive && !oldWidget.isActive) _load(silent: true);
    _syncPolling();
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
      final orders = await api.getMyOrders();
      orders.sort((a, b) => (b.createdAt ?? DateTime(0)).compareTo(a.createdAt ?? DateTime(0)));
      if (mounted) setState(() => _orders = orders);
    } catch (err) {
      if (mounted && !silent) setState(() => _error = OrderErrorMessages.list(err));
    } finally {
      if (mounted) {
        setState(() => _loading = false);
        _syncPolling();
      }
    }
  }

  void _syncPolling() {
    final shouldPoll = widget.isActive && (_orders?.any((o) => o.isInProgress) ?? false);
    if (shouldPoll && _timer == null) {
      _timer = Timer.periodic(widget.pollInterval, (_) => _load(silent: true));
    } else if (!shouldPoll) {
      _timer?.cancel();
      _timer = null;
    }
  }

  Future<void> _open(Order order) async {
    await Navigator.push(
      context,
      MaterialPageRoute<void>(builder: (_) => OrderDetailsScreen(orderId: order.id)),
    );
    if (mounted) _load(silent: true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Meus pedidos')),
      body: _body(),
    );
  }

  Widget _body() {
    final orders = _orders;
    if (_loading && orders == null) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }
    if (orders == null) {
      return Center(
        key: const Key('orders-error'),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(_error ?? OrderErrorMessages.list(Object()), textAlign: TextAlign.center),
              const SizedBox(height: 16),
              ElevatedButton(
                key: const Key('orders-retry'),
                onPressed: _load,
                child: const Text('Tentar novamente'),
              ),
            ],
          ),
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: () => _load(silent: true),
      child: orders.isEmpty
          ? ListView(
              children: const [
                SizedBox(height: 120),
                Center(
                  key: Key('orders-empty'),
                  child: Text('Você ainda não fez pedidos.', style: TextStyle(color: AppColors.textMuted)),
                ),
              ],
            )
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: orders.length,
              separatorBuilder: (_, _) => const SizedBox(height: 10),
              itemBuilder: (_, i) => OrderCard(order: orders[i], onTap: () => _open(orders[i])),
            ),
    );
  }
}
