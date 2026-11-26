import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/api_client.dart';
import '../../api/models/account_models.dart';
import '../../api/models/consumer_models.dart';
import '../../api/models/order_models.dart';
import '../../core/auth/session_controller.dart';
import '../../core/storage/recent_checks_storage.dart';
import '../../core/theme/app_colors.dart';
import '../account/verify_email_screen.dart';
import '../checkout/checkout_screen.dart';
import '../orders/order_details_screen.dart';
import '../orders/order_error_messages.dart';
import '../product/product_details_screen.dart';
import 'home_block.dart';
import 'home_error_messages.dart';
import 'home_tab.dart';
import 'widgets/account_notices.dart';
import 'widgets/active_orders_section.dart';
import 'widgets/home_section.dart';
import 'widgets/profile_summary_card.dart';
import 'widgets/recent_checks_section.dart';
import 'widgets/shortcuts_row.dart';

/// Aba **Início**. Cada bloco carrega e falha por conta própria; atualiza ao
/// voltar para a aba, ao retornar de uma tela aberta daqui e no *pull to
/// refresh* (sem polling). Não calcula nem exibe risco de produto.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, this.isActive = true, required this.onSelectTab});

  final bool isActive;
  final ValueChanged<HomeTab> onSelectTab;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late final HomeBlock<AccountInfo> _account;
  late final HomeBlock<ConsumerMe> _consumer;
  late final HomeBlock<List<Order>> _orders;
  late final HomeBlock<List<RecentCheck>> _recents;

  @override
  void initState() {
    super.initState();
    final api = context.read<ApiClient>();
    final storage = context.read<RecentChecksStorage>();
    final userId = context.read<SessionController>().user?.id;
    _account = HomeBlock(fetch: api.getAccount, errorMessage: HomeErrorMessages.account);
    _consumer = HomeBlock(fetch: api.getConsumerMe, errorMessage: HomeErrorMessages.profile);
    _orders = HomeBlock(fetch: () => _activeOrders(api), errorMessage: OrderErrorMessages.list);
    // O armazenamento local trata as próprias falhas devolvendo lista vazia.
    _recents = HomeBlock(
      fetch: () async => userId == null ? <RecentCheck>[] : await storage.load(userId),
      errorMessage: (_) => '',
    );
    _refresh();
  }

  @override
  void didUpdateWidget(covariant HomeScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isActive && !oldWidget.isActive) _refresh();
  }

  @override
  void dispose() {
    _account.dispose();
    _consumer.dispose();
    _orders.dispose();
    _recents.dispose();
    super.dispose();
  }

  static Future<List<Order>> _activeOrders(ApiClient api) async {
    final orders = (await api.getMyOrders()).where((o) => o.isInProgress).toList();
    orders.sort((a, b) => (b.createdAt ?? DateTime(0)).compareTo(a.createdAt ?? DateTime(0)));
    return orders;
  }

  Future<void> _refresh() => Future.wait([
        _account.load(),
        _consumer.load(),
        _orders.load(),
        _recents.load(),
      ]);

  /// Abre uma tela e atualiza o Início ao voltar.
  Future<T?> _push<T>(Widget screen) async {
    final result = await Navigator.push<T>(context, MaterialPageRoute<T>(builder: (_) => screen));
    if (mounted) _refresh();
    return result;
  }

  Future<void> _verifyEmail() async {
    final verified = await Navigator.push<bool>(
      context,
      MaterialPageRoute<bool>(builder: (_) => const VerifyEmailScreen()),
    );
    if (!mounted) return;
    final account = _account.data;
    if (verified == true && account != null) {
      _account.set(AccountInfo(email: account.email, fullName: account.fullName, isEmailVerified: true));
    }
    _refresh();
  }

  String get _greeting {
    final firstName = _account.data?.fullName?.trim().split(RegExp(r'\s+')).first ?? '';
    return firstName.isEmpty ? 'Olá!' : 'Olá, $firstName!';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _refresh,
          child: ListenableBuilder(
            listenable: Listenable.merge([_account, _consumer, _orders, _recents]),
            builder: (context, _) => ListView(
              key: const Key('home-list'),
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
              children: [
                Semantics(
                  header: true,
                  child: Text(
                    _greeting,
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                  ),
                ),
                AccountNotices(
                  account: _account,
                  consumer: _consumer,
                  onCompleteProfile: () => widget.onSelectTab(HomeTab.profile),
                  onVerifyEmail: _verifyEmail,
                ),
                const SizedBox(height: 20),
                ShortcutsRow(onSelectTab: widget.onSelectTab),
                HomeSection(
                  title: 'Seu perfil alimentar',
                  child: ProfileSummaryCard(
                    consumer: _consumer,
                    onViewProfile: () => widget.onSelectTab(HomeTab.profile),
                  ),
                ),
                HomeSection(
                  title: 'Pedidos em andamento',
                  child: ActiveOrdersSection(
                    orders: _orders,
                    onOpen: (order) => _push<void>(OrderDetailsScreen(orderId: order.id)),
                    onPay: (order) => _push<bool>(CheckoutScreen(order: order)),
                    onViewAll: () => widget.onSelectTab(HomeTab.orders),
                  ),
                ),
                HomeSection(
                  title: 'Verificados recentemente',
                  child: RecentChecksSection(
                    recents: _recents,
                    onOpen: (item) => _push<void>(
                      ProductDetailsScreen(productId: item.productId, productName: item.productName),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
