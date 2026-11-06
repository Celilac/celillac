import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/api_client.dart';
import '../../api/models/enums.dart';
import '../../api/models/product_models.dart';
import '../../core/auth/session_controller.dart';
import '../../core/storage/recent_checks_storage.dart';
import '../../core/theme/app_colors.dart';
import '../catalog/catalog_error_messages.dart';
import '../product/product_details_screen.dart';

/// Alérgenos oferecidos como filtro (mesmos grupos do filtro do web). São
/// enviados ao backend em `avoidAllergens`; o app nunca filtra por segurança.
const _avoidFilters = <AllergenType, String>{
  AllergenType.gluten: 'Evitar glúten',
  AllergenType.lactose: 'Evitar lactose',
  AllergenType.soy: 'Evitar soja',
  AllergenType.nuts: 'Evitar castanhas/amendoim',
  AllergenType.eggs: 'Evitar ovos',
};

enum _SearchStatus { idle, loading, error, loaded }

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  static const _pageSize = 20;

  final _queryController = TextEditingController();
  final _avoid = <AllergenType>{};
  bool _onlyCompatible = false;

  _SearchStatus _status = _SearchStatus.idle;
  String? _error;
  List<Product> _products = [];
  int _total = 0;
  int _page = 1;
  bool _loadingMore = false;
  String? _moreError;
  int _requestId = 0;

  List<RecentCheck> _recents = [];

  @override
  void initState() {
    super.initState();
    _loadRecents();
  }

  @override
  void dispose() {
    _queryController.dispose();
    super.dispose();
  }

  Future<void> _loadRecents() async {
    final userId = context.read<SessionController>().user?.id;
    if (userId == null) return;
    final items = await context.read<RecentChecksStorage>().load(userId);
    if (mounted) setState(() => _recents = items);
  }

  bool get _hasFilters => _avoid.isNotEmpty || _onlyCompatible;

  Future<void> _search() async {
    final query = _queryController.text.trim();
    if (query.isEmpty && !_hasFilters) {
      setState(() {
        _status = _SearchStatus.idle;
        _products = [];
      });
      return;
    }
    final api = context.read<ApiClient>();
    final id = ++_requestId;
    setState(() {
      _status = _SearchStatus.loading;
      _error = null;
      _moreError = null;
    });
    try {
      final result = await api.searchProducts(
        query,
        limit: _pageSize,
        avoidAllergens: _avoid.toList(),
        onlyCompatible: _onlyCompatible,
      );
      if (!mounted || id != _requestId) return;
      setState(() {
        _products = result.data;
        _total = result.total;
        _page = 1;
        _status = _SearchStatus.loaded;
      });
    } catch (err) {
      if (!mounted || id != _requestId) return;
      setState(() {
        _error = CatalogErrorMessages.search(err);
        _status = _SearchStatus.error;
      });
    }
  }

  Future<void> _loadMore() async {
    final api = context.read<ApiClient>();
    final id = _requestId;
    setState(() {
      _loadingMore = true;
      _moreError = null;
    });
    try {
      final result = await api.searchProducts(
        _queryController.text.trim(),
        page: _page + 1,
        limit: _pageSize,
        avoidAllergens: _avoid.toList(),
        onlyCompatible: _onlyCompatible,
      );
      if (!mounted || id != _requestId) return;
      setState(() {
        _products = [..._products, ...result.data];
        _total = result.total;
        _page += 1;
      });
    } catch (err) {
      if (mounted && id == _requestId) setState(() => _moreError = CatalogErrorMessages.search(err));
    } finally {
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  Future<void> _openProduct(String productId, String name) async {
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => ProductDetailsScreen(productId: productId, productName: name)),
    );
    if (mounted) _loadRecents();
  }

  void _toggleAvoid(AllergenType allergen) {
    setState(() {
      if (!_avoid.remove(allergen)) _avoid.add(allergen);
    });
    _search();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Buscar Produto',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      key: const Key('search-field'),
                      controller: _queryController,
                      decoration: const InputDecoration(hintText: 'Nome ou marca do produto...'),
                      style: const TextStyle(color: AppColors.textPrimary),
                      textInputAction: TextInputAction.search,
                      onSubmitted: (_) => _search(),
                    ),
                  ),
                  const SizedBox(width: 10),
                  IconButton(
                    key: const Key('search-button'),
                    tooltip: 'Buscar',
                    onPressed: _status == _SearchStatus.loading ? null : _search,
                    icon: const Icon(Icons.search, color: AppColors.textPrimary),
                    style: IconButton.styleFrom(
                      backgroundColor: AppColors.surface,
                      side: const BorderSide(color: AppColors.border),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _filters(),
              const SizedBox(height: 8),
              Expanded(child: _content()),
            ],
          ),
        ),
      ),
    );
  }

  Widget _filters() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              for (final entry in _avoidFilters.entries)
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    key: Key('filter-${entry.key.wireValue}'),
                    label: Text(entry.value),
                    selected: _avoid.contains(entry.key),
                    onSelected: (_) => _toggleAvoid(entry.key),
                  ),
                ),
              FilterChip(
                key: const Key('filter-only-compatible'),
                label: const Text('Somente compatíveis com meu perfil'),
                selected: _onlyCompatible,
                onSelected: (value) {
                  setState(() => _onlyCompatible = value);
                  _search();
                },
              ),
            ],
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Os filtros apenas reduzem a lista e não garantem segurança. '
          'Confirme sempre o veredito na tela do produto.',
          key: Key('filters-disclaimer'),
          style: TextStyle(color: AppColors.textMuted, fontSize: 11),
        ),
      ],
    );
  }

  Widget _content() {
    switch (_status) {
      case _SearchStatus.loading:
        return const Center(
          key: Key('search-loading'),
          child: CircularProgressIndicator(color: AppColors.primary),
        );
      case _SearchStatus.error:
        return Center(
          key: const Key('search-error'),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                _error ?? '',
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
              ),
              const SizedBox(height: 12),
              ElevatedButton(onPressed: _search, child: const Text('Tentar novamente')),
            ],
          ),
        );
      case _SearchStatus.loaded:
        return _products.isEmpty ? _empty() : _results();
      case _SearchStatus.idle:
        return _idle();
    }
  }

  Widget _empty() {
    final query = _queryController.text.trim();
    return Padding(
      key: const Key('search-empty'),
      padding: const EdgeInsets.only(top: 40),
      child: Text(
        query.isEmpty
            ? 'Nenhum produto encontrado com esses filtros.'
            : 'Nenhum produto encontrado para "$query"',
        textAlign: TextAlign.center,
        style: const TextStyle(color: AppColors.textMutedLight, fontSize: 14),
      ),
    );
  }

  Widget _results() {
    final canLoadMore = _products.length < _total;
    return ListView(
      padding: const EdgeInsets.only(top: 8),
      children: [
        for (final p in _products)
          _ProductTile(
            key: Key('product-result-${p.id}'),
            title: p.name,
            subtitle: p.brand,
            onTap: () => _openProduct(p.id, p.name),
          ),
        if (_moreError != null)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Text(_moreError!, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textMutedLight)),
          ),
        if (_loadingMore)
          const Padding(
            padding: EdgeInsets.all(12),
            child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
          )
        else if (canLoadMore)
          TextButton(key: const Key('load-more'), onPressed: _loadMore, child: const Text('Carregar mais')),
      ],
    );
  }

  Widget _idle() {
    return ListView(
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(vertical: 8),
          child: Text(
            'Busque por nome ou marca, ou use os filtros para explorar o catálogo.',
            key: Key('search-hint'),
            style: TextStyle(color: AppColors.textMuted, fontSize: 13),
          ),
        ),
        if (_recents.isNotEmpty) ...[
          const SizedBox(height: 8),
          const Text(
            'Verificados recentemente',
            key: Key('recent-checks'),
            style: TextStyle(color: AppColors.textMutedLight, fontSize: 13, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          for (final r in _recents)
            _ProductTile(
              key: Key('recent-${r.productId}'),
              title: r.productName,
              subtitle: r.brand,
              onTap: () => _openProduct(r.productId, r.productName),
            ),
        ],
      ],
    );
  }
}

class _ProductTile extends StatelessWidget {
  const _ProductTile({super.key, required this.title, required this.subtitle, required this.onTap});

  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12)),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                  if (subtitle.isNotEmpty)
                    Text(subtitle, style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: AppColors.textMuted),
          ],
        ),
      ),
    );
  }
}
