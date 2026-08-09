import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/api_client.dart';
import '../../api/models/compatibility_models.dart';
import '../../api/models/product_models.dart';
import '../../core/auth/session_controller.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/alert_banner.dart';
import '../product/product_details_screen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchReport {
  const _SearchReport(this.product, this.compatibility);

  final Product product;
  final CompatibilityReport compatibility;
}

class _SearchScreenState extends State<SearchScreen> {
  final _queryController = TextEditingController();
  List<Product> _products = [];
  bool _isSearching = false;
  bool _isChecking = false;
  _SearchReport? _report;

  @override
  void dispose() {
    _queryController.dispose();
    super.dispose();
  }

  Future<void> _handleSearch() async {
    final query = _queryController.text.trim();
    if (query.isEmpty) return;

    final apiClient = context.read<ApiClient>();
    setState(() {
      _isSearching = true;
      _report = null;
    });
    try {
      final result = await apiClient.searchProducts(query);
      if (mounted) setState(() => _products = result.data);
    } catch (_) {
      if (mounted) _showError('Não foi possível buscar produtos.');
    } finally {
      if (mounted) setState(() => _isSearching = false);
    }
  }

  Future<void> _handleCheck(Product product) async {
    final userId = context.read<SessionController>().user?.id;
    final apiClient = context.read<ApiClient>();
    if (userId == null) return;

    setState(() {
      _isChecking = true;
      _report = null;
    });
    try {
      final compatibility = await apiClient.checkCompatibility(userId, product.id);
      if (mounted) {
        setState(() {
          _report = _SearchReport(product, compatibility);
          _products = [];
        });
      }
    } catch (_) {
      if (mounted) _showError('Falha ao verificar compatibilidade.');
    } finally {
      if (mounted) setState(() => _isChecking = false);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
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
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _queryController,
                      decoration: const InputDecoration(hintText: 'Nome ou marca do produto...'),
                      style: const TextStyle(color: AppColors.textPrimary),
                      textInputAction: TextInputAction.search,
                      onSubmitted: (_) => _handleSearch(),
                    ),
                  ),
                  const SizedBox(width: 10),
                  IconButton(
                    onPressed: _isSearching ? null : _handleSearch,
                    icon: const Text('🔍', style: TextStyle(fontSize: 20)),
                    style: IconButton.styleFrom(
                      backgroundColor: AppColors.surface,
                      side: const BorderSide(color: AppColors.border),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ],
              ),
              if (_isSearching || _isChecking)
                const Padding(
                  padding: EdgeInsets.only(top: 20),
                  child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
                ),
              if (_report != null) ...[
                const SizedBox(height: 16),
                Text(
                  _report!.product.name,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  _report!.product.brand,
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
                ),
                AlertBanner(
                  status: _report!.compatibility.riskLevel,
                  message: _report!.compatibility.isCompatible
                      ? 'Compatível com seu perfil'
                      : 'Incompatível com seu perfil',
                  reasoning: _report!.compatibility.reasoning,
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => ProductDetailsScreen(
                                product: _report!.product,
                                initialCompatibility: _report!.compatibility,
                              ),
                            ),
                          );
                        },
                        icon: const Icon(Icons.info_outline, size: 18),
                        label: const Text('Ver Detalhes'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    TextButton(
                      onPressed: () => setState(() => _report = null),
                      child: const Text(
                        '← Voltar',
                        style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              ],
              if (_report == null)
                Expanded(
                  child: _products.isEmpty
                      ? (!_isSearching && _queryController.text.trim().isNotEmpty
                          ? Padding(
                              padding: const EdgeInsets.only(top: 40),
                              child: Text(
                                'Nenhum produto encontrado para "${_queryController.text.trim()}"',
                                textAlign: TextAlign.center,
                                style: const TextStyle(color: Color(0xFF475569), fontSize: 14),
                              ),
                            )
                          : const SizedBox.shrink())
                      : ListView.builder(
                          padding: const EdgeInsets.only(top: 16),
                          itemCount: _products.length,
                          itemBuilder: (context, index) {
                            final product = _products[index];
                            return InkWell(
                              onTap: () => _handleCheck(product),
                              child: Container(
                                margin: const EdgeInsets.only(bottom: 10),
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: AppColors.surface,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            product.name,
                                            style: const TextStyle(
                                              color: AppColors.textPrimary,
                                              fontSize: 16,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                          Text(
                                            product.brand,
                                            style: const TextStyle(
                                              color: AppColors.textMuted,
                                              fontSize: 13,
                                            ),
                                          ),
                                          const Text(
                                            'Toque para verificar compatibilidade com seu perfil',
                                            style: TextStyle(
                                              color: AppColors.textMutedLight,
                                              fontSize: 12,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const Text(
                                      'Verificar →',
                                      style: TextStyle(
                                        color: AppColors.primary,
                                        fontSize: 13,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
