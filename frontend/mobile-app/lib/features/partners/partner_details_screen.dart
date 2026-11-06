import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../api/api_client.dart';
import '../../api/models/partner_models.dart';
import '../../api/models/product_models.dart';
import '../../api/models/review_models.dart';
import '../../core/links/external_link_launcher.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/favorite_button.dart';
import '../../shared/widgets/loading_overlay.dart';
import '../../shared/widgets/report_dialog.dart';
import '../product/product_details_screen.dart';
import '../product/widgets/product_info_sections.dart' show formatNumber;
import 'partner_error_messages.dart';
import 'partner_labels.dart';
import 'widgets/partner_logo.dart';

/// Detalhe público do parceiro. Parceiro, produtos, avaliações e favoritos
/// carregam e falham de forma independente. Nenhum veredito de compatibilidade
/// é exibido aqui: ele só existe no detalhe do produto (`POST /compatibility/check`).
class PartnerDetailsScreen extends StatefulWidget {
  const PartnerDetailsScreen({super.key, required this.partnerId, this.partnerName});

  final String partnerId;

  /// Apenas para o título enquanto o parceiro carrega.
  final String? partnerName;

  @override
  State<PartnerDetailsScreen> createState() => _PartnerDetailsScreenState();
}

class _PartnerDetailsScreenState extends State<PartnerDetailsScreen> {
  static const _pageSize = 20;

  PublicPartner? _partner;
  String? _partnerError;
  bool _partnerLoading = true;

  List<Product> _products = [];
  int _productsTotal = 0;
  int _productsPage = 1;
  String? _productsError;
  bool _productsLoading = true;
  bool _productsLoadingMore = false;

  List<ReviewItem>? _reviews;
  String? _reviewsError;
  bool _reviewsLoading = true;

  bool _isFavorite = false;
  bool _favoriteReady = false;

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  void _loadAll() {
    _loadPartner();
    _loadProducts();
    _loadReviews();
    _loadFavoriteState();
  }

  Future<void> _loadPartner() async {
    final api = context.read<ApiClient>();
    setState(() {
      _partnerLoading = true;
      _partnerError = null;
    });
    try {
      final partner = await api.getPartner(widget.partnerId);
      if (mounted) setState(() => _partner = partner);
    } catch (err) {
      if (mounted) setState(() => _partnerError = PartnerErrorMessages.details(err));
    } finally {
      if (mounted) setState(() => _partnerLoading = false);
    }
  }

  Future<void> _loadProducts() async {
    final api = context.read<ApiClient>();
    setState(() {
      _productsLoading = true;
      _productsError = null;
    });
    try {
      final result = await api.getPartnerProducts(widget.partnerId, limit: _pageSize);
      if (!mounted) return;
      setState(() {
        _products = result.data;
        _productsTotal = result.total;
        _productsPage = 1;
      });
    } catch (err) {
      if (mounted) setState(() => _productsError = PartnerErrorMessages.products(err));
    } finally {
      if (mounted) setState(() => _productsLoading = false);
    }
  }

  Future<void> _loadMoreProducts() async {
    final api = context.read<ApiClient>();
    setState(() => _productsLoadingMore = true);
    try {
      final result = await api.getPartnerProducts(widget.partnerId, page: _productsPage + 1, limit: _pageSize);
      if (!mounted) return;
      setState(() {
        _products = [..._products, ...result.data];
        _productsTotal = result.total;
        _productsPage += 1;
      });
    } catch (err) {
      if (mounted) _snack(PartnerErrorMessages.products(err));
    } finally {
      if (mounted) setState(() => _productsLoadingMore = false);
    }
  }

  Future<void> _loadReviews() async {
    final api = context.read<ApiClient>();
    setState(() {
      _reviewsLoading = true;
      _reviewsError = null;
    });
    try {
      final reviews = await api.getPartnerReviews(widget.partnerId);
      if (mounted) setState(() => _reviews = reviews);
    } catch (err) {
      if (mounted) setState(() => _reviewsError = PartnerErrorMessages.reviews(err));
    } finally {
      if (mounted) setState(() => _reviewsLoading = false);
    }
  }

  /// O coração é conveniência: falha ao ler favoritos não atrapalha a tela.
  Future<void> _loadFavoriteState() async {
    final api = context.read<ApiClient>();
    var favorite = false;
    try {
      final favs = await api.getFavorites();
      favorite = favs.any((f) => f.partnerId == widget.partnerId);
    } catch (_) {}
    if (mounted) {
      setState(() {
        _isFavorite = favorite;
        _favoriteReady = true;
      });
    }
  }

  void _snack(String message) {
    ScaffoldMessenger.of(context)
      ..clearSnackBars()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _openReport(PublicPartner partner) async {
    final sent = await ReportDialog.show(
      context,
      partnerId: partner.id,
      targetName: partner.name,
      apiClient: context.read<ApiClient>(),
    );
    if (sent == true && mounted) _snack('Denúncia enviada para análise.');
  }

  Future<void> _open(Uri? uri, String failureMessage) async {
    if (uri == null) return;
    final ok = await context.read<ExternalLinkLauncher>().open(uri);
    if (!ok && mounted) _snack(failureMessage);
  }

  Future<void> _copy(String text, String confirmation) async {
    await Clipboard.setData(ClipboardData(text: text));
    if (mounted) _snack(confirmation);
  }

  @override
  Widget build(BuildContext context) {
    final partner = _partner;
    return Scaffold(
      appBar: AppBar(
        title: Text(partner?.name ?? widget.partnerName ?? 'Parceiro'),
        actions: [
          if (partner != null) ...[
            if (_favoriteReady)
              FavoriteButton(
                key: ValueKey('fav-$_isFavorite'),
                partnerId: partner.id,
                initialIsFavorite: _isFavorite,
                apiClient: context.read<ApiClient>(),
              ),
            IconButton(
              key: const Key('partner-report-button'),
              tooltip: 'Denunciar',
              icon: const Icon(Icons.flag_outlined, color: AppColors.error),
              onPressed: () => _openReport(partner),
            ),
          ],
        ],
      ),
      body: _body(partner),
    );
  }

  Widget _body(PublicPartner? partner) {
    if (_partnerLoading && partner == null) {
      return const KeyedSubtree(key: Key('partner-loading'), child: LoadingOverlay(message: 'Carregando parceiro...'));
    }
    if (partner == null) {
      return Center(
        key: const Key('partner-error'),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                _partnerError ?? PartnerErrorMessages.details(Object()),
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.textPrimary, fontSize: 15),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                key: const Key('partner-retry'),
                onPressed: _loadAll,
                child: const Text('Tentar novamente'),
              ),
            ],
          ),
        ),
      );
    }
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _header(partner),
        if (partner.isTemporarilyClosed) _closedBanner(),
        _about(partner),
        const SizedBox(height: 24),
        _productsSection(),
        const SizedBox(height: 24),
        _reviewsSection(),
      ],
    );
  }

  Widget _header(PublicPartner partner) {
    final nature = PartnerLabels.legalNature(partner.legalNature);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        PartnerLogo(logoUrl: partner.logoUrl, size: 64),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                partner.name,
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 4),
              Text(
                PartnerLabels.type(partner.type),
                style: const TextStyle(fontSize: 14, color: AppColors.textMutedLight),
              ),
              if (nature != null) ...[
                const SizedBox(height: 4),
                Text(nature, style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _closedBanner() {
    return Container(
      key: const Key('partner-closed-banner'),
      margin: const EdgeInsets.only(top: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.riskWarningBg,
        borderRadius: BorderRadius.circular(10),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.warning_amber_rounded, color: AppColors.textPrimary),
          SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Temporariamente fechado', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                SizedBox(height: 2),
                Text(
                  'Este estabelecimento está indisponível no momento. Você ainda pode ver os produtos dele.',
                  style: TextStyle(fontSize: 13, color: AppColors.textPrimary),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _about(PublicPartner partner) {
    final place = ExternalLinks.place(address: partner.address, city: partner.city, state: partner.state);
    final mapUri = ExternalLinks.map(address: partner.address, city: partner.city, state: partner.state);
    final phoneUri = ExternalLinks.phone(partner.phone);
    final description = partner.description?.trim() ?? '';
    final address = partner.address?.trim() ?? '';
    final phone = partner.phone?.trim() ?? '';
    return _Section(
      title: 'SOBRE O ESTABELECIMENTO',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (description.isNotEmpty) ...[
            Text(description, style: const TextStyle(fontSize: 14, color: AppColors.textPrimary, height: 1.4)),
            const SizedBox(height: 12),
          ],
          if (address.isNotEmpty)
            _InfoLine(
              icon: Icons.place_outlined,
              text: address,
              actions: [
                if (mapUri != null)
                  _LineAction(
                    key: const Key('partner-open-map'),
                    icon: Icons.map_outlined,
                    tooltip: 'Abrir no mapa',
                    onPressed: () => _open(mapUri, 'Não foi possível abrir o mapa. Tente copiar o endereço.'),
                  ),
                if (place != null)
                  _LineAction(
                    key: const Key('partner-copy-address'),
                    icon: Icons.copy_outlined,
                    tooltip: 'Copiar endereço',
                    onPressed: () => _copy(place, 'Endereço copiado.'),
                  ),
              ],
            ),
          _InfoLine(icon: Icons.location_city_outlined, text: PartnerLabels.cityState(partner.city, partner.state)),
          if (phone.isNotEmpty)
            _InfoLine(
              icon: Icons.phone_outlined,
              text: phone,
              actions: [
                if (phoneUri != null)
                  _LineAction(
                    key: const Key('partner-call'),
                    icon: Icons.call_outlined,
                    tooltip: 'Ligar',
                    onPressed: () => _open(phoneUri, 'Não foi possível abrir o telefone. Tente copiar o número.'),
                  ),
                _LineAction(
                  key: const Key('partner-copy-phone'),
                  icon: Icons.copy_outlined,
                  tooltip: 'Copiar telefone',
                  onPressed: () => _copy(phone, 'Telefone copiado.'),
                ),
              ],
            ),
          _InfoLine(icon: Icons.local_shipping_outlined, text: 'Atendimento: ${partner.deliveryRegion ?? 'Local'}'),
        ],
      ),
    );
  }

  Widget _productsSection() {
    final Widget content;
    if (_productsLoading && _products.isEmpty) {
      content = const Center(child: CircularProgressIndicator(color: AppColors.primary));
    } else if (_productsError != null && _products.isEmpty) {
      content = _InlineError(
        key: const Key('partner-products-error'),
        message: _productsError!,
        retryKey: const Key('partner-products-retry'),
        onRetry: _loadProducts,
      );
    } else if (_products.isEmpty) {
      content = const Text(
        'Nenhum produto cadastrado para este estabelecimento.',
        key: Key('partner-products-empty'),
        style: TextStyle(color: AppColors.textMuted),
      );
    } else {
      content = Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          for (final p in _products)
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(p.name, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600)),
              subtitle: p.brand.isEmpty ? null : Text(p.brand, style: const TextStyle(color: AppColors.textMuted)),
              trailing: const Icon(Icons.chevron_right, color: AppColors.textMuted),
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute<void>(
                  builder: (_) => ProductDetailsScreen(productId: p.id, productName: p.name),
                ),
              ),
            ),
          if (_products.length < _productsTotal)
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton(
                key: const Key('partner-products-more'),
                onPressed: _productsLoadingMore ? null : _loadMoreProducts,
                child: Text(_productsLoadingMore ? 'Carregando...' : 'Carregar mais'),
              ),
            ),
        ],
      );
    }
    return _Section(title: 'PRODUTOS OFERTADOS', child: content);
  }

  Widget _reviewsSection() {
    final reviews = _reviews;
    final Widget content;
    if (_reviewsLoading && reviews == null) {
      content = const Center(child: CircularProgressIndicator(color: AppColors.primary));
    } else if (_reviewsError != null && reviews == null) {
      content = _InlineError(
        key: const Key('partner-reviews-error'),
        message: _reviewsError!,
        retryKey: const Key('partner-reviews-retry'),
        onRetry: _loadReviews,
      );
    } else if (reviews == null || reviews.isEmpty) {
      content = const Text(
        'Nenhuma avaliação cadastrada ainda.',
        key: Key('partner-reviews-empty'),
        style: TextStyle(color: AppColors.textMuted),
      );
    } else {
      final average = reviews.fold<int>(0, (sum, r) => sum + r.rating) / reviews.length;
      content = Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${formatNumber((average * 10).round() / 10)} de 5 · ${reviews.length} '
            '${reviews.length == 1 ? 'avaliação' : 'avaliações'}',
            style: const TextStyle(color: AppColors.textMutedLight, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 8),
          for (final r in reviews)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(10)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text('⭐ ${r.rating}/5', style: const TextStyle(fontWeight: FontWeight.bold)),
                      const SizedBox(width: 8),
                      Text(r.createdAt.split('T').first, style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
                    ],
                  ),
                  if (r.comment != null && r.comment!.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(r.comment!, style: const TextStyle(fontSize: 13, color: AppColors.textPrimary)),
                  ],
                ],
              ),
            ),
        ],
      );
    }
    return _Section(title: 'AVALIAÇÕES', child: content);
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textMuted, letterSpacing: 1),
          ),
          const SizedBox(height: 8),
          child,
        ],
      ),
    );
  }
}

class _LineAction extends StatelessWidget {
  const _LineAction({super.key, required this.icon, required this.tooltip, required this.onPressed});

  final IconData icon;
  final String tooltip;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      visualDensity: VisualDensity.compact,
      tooltip: tooltip,
      icon: Icon(icon, size: 20, color: AppColors.primary),
      onPressed: onPressed,
    );
  }
}

class _InfoLine extends StatelessWidget {
  const _InfoLine({required this.icon, required this.text, this.actions = const []});

  final IconData icon;
  final String text;
  final List<Widget> actions;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.textMutedLight),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 14, color: AppColors.textPrimary))),
          ...actions,
        ],
      ),
    );
  }
}

class _InlineError extends StatelessWidget {
  const _InlineError({super.key, required this.message, required this.retryKey, required this.onRetry});

  final String message;
  final Key retryKey;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(message, style: const TextStyle(color: AppColors.textMutedLight)),
        TextButton(key: retryKey, onPressed: onRetry, child: const Text('Tentar novamente')),
      ],
    );
  }
}
