import 'package:flutter/material.dart';

import '../../api/api_client.dart';
import '../../api/models/favorite_models.dart';
import '../../shared/widgets/brand_logo.dart';

class FavoritesScreen extends StatefulWidget {
  const FavoritesScreen({
    super.key,
    required this.apiClient,
  });

  final ApiClient apiClient;

  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen> {
  List<FavoriteItem> _favorites = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchFavorites();
  }

  Future<void> _fetchFavorites() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final list = await widget.apiClient.getFavorites();
      setState(() {
        _favorites = list;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _removeFavorite(String targetId) async {
    try {
      await widget.apiClient.removeFavorite(targetId);
      setState(() {
        _favorites.removeWhere(
          (f) => f.productId == targetId || f.partnerId == targetId,
        );
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Removido dos favoritos.')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: const [
            BrandLogo(size: 24),
            SizedBox(width: 8),
            Text('Meus Favoritos'),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(_error!, style: const TextStyle(color: Colors.red)),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: _fetchFavorites,
                        child: const Text('Tentar novamente'),
                      ),
                    ],
                  ),
                )
              : _favorites.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Icon(Icons.favorite_border, size: 64, color: Colors.grey),
                          SizedBox(height: 16),
                          Text(
                            'Nenhum favorito salvo ainda.',
                            style: TextStyle(fontSize: 16, color: Colors.grey),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _fetchFavorites,
                      child: ListView.builder(
                        itemCount: _favorites.length,
                        padding: const EdgeInsets.all(12),
                        itemBuilder: (context, index) {
                          final item = _favorites[index];
                          final isPartner = item.partnerId != null;
                          final title = isPartner
                              ? item.partnerName ?? 'Parceiro Comercial'
                              : item.productName ?? 'Produto';
                          final targetId = item.partnerId ?? item.productId ?? '';

                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            child: ListTile(
                              leading: CircleAvatar(
                                backgroundColor: isPartner ? Colors.blue.shade50 : Colors.green.shade50,
                                child: Icon(
                                  isPartner ? Icons.storefront : Icons.shopping_bag,
                                  color: isPartner ? Colors.blue : Colors.green,
                                ),
                              ),
                              title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
                              subtitle: Text(
                                isPartner ? 'Parceiro Comercial' : 'Produto no Catálogo',
                                style: const TextStyle(fontSize: 12),
                              ),
                              trailing: IconButton(
                                icon: const Icon(Icons.delete_outline, color: Colors.red),
                                onPressed: () => _removeFavorite(targetId),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
    );
  }
}
