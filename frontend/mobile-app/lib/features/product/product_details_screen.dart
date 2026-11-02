import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/api_client.dart';
import '../../api/models/compatibility_models.dart';
import '../../api/models/product_models.dart';
import '../../api/models/review_models.dart';
import '../../core/auth/session_controller.dart';
import '../../core/storage/recent_checks_storage.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/loading_overlay.dart';
import '../catalog/catalog_error_messages.dart';
import 'widgets/product_image_carousel.dart';
import 'widgets/product_info_sections.dart';
import 'widgets/verdict_section.dart';

/// Detalhe do produto. O produto vem de `GET /catalog/products/:id`; o veredito
/// vem **sempre** de `POST /compatibility/check` (o `compatibilityReport` que o
/// GET possa trazer é ignorado). Cada bloco carrega e falha de forma independente.
class ProductDetailsScreen extends StatefulWidget {
  const ProductDetailsScreen({super.key, required this.productId, this.productName});

  final String productId;

  /// Apenas para o título enquanto o produto carrega.
  final String? productName;

  @override
  State<ProductDetailsScreen> createState() => _ProductDetailsScreenState();
}

class _ProductDetailsScreenState extends State<ProductDetailsScreen> {
  Product? _product;
  String? _productError;
  bool _productLoading = true;

  CompatibilityReport? _verdict;
  String? _verdictError;
  bool _verdictLoading = true;

  ProductReviews? _reviews;
  String? _reviewsError;
  bool _reviewsLoading = true;

  bool _isFavorite = false;
  bool _recorded = false;

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  void _loadAll() {
    _loadProduct();
    _loadVerdict();
    _loadReviews();
    _loadFavoriteState();
  }

  Future<void> _loadProduct() async {
    final api = context.read<ApiClient>();
    setState(() {
      _productLoading = true;
      _productError = null;
    });
    try {
      final product = await api.getProductById(widget.productId);
      if (!mounted) return;
      setState(() => _product = product);
      _recordIfReady();
    } catch (err) {
      if (mounted) setState(() => _productError = CatalogErrorMessages.details(err));
    } finally {
      if (mounted) setState(() => _productLoading = false);
    }
  }

  Future<void> _loadVerdict() async {
    final api = context.read<ApiClient>();
    final userId = context.read<SessionController>().user?.id;
    setState(() {
      _verdictLoading = true;
      _verdictError = null;
      _verdict = null;
    });
    if (userId == null) {
      setState(() {
        _verdictLoading = false;
        _verdictError = CatalogErrorMessages.sessionExpired;
      });
      return;
    }
    try {
      final report = await api.checkCompatibility(userId, widget.productId);
      if (!mounted) return;
      setState(() => _verdict = report);
      _recordIfReady();
    } catch (err) {
      if (mounted) setState(() => _verdictError = CatalogErrorMessages.verdict(err));
    } finally {
      if (mounted) setState(() => _verdictLoading = false);
    }
  }

  Future<void> _loadReviews() async {
    final api = context.read<ApiClient>();
    setState(() {
      _reviewsLoading = true;
      _reviewsError = null;
    });
    try {
      final reviews = await api.getProductReviews(widget.productId);
      if (mounted) setState(() => _reviews = reviews);
    } catch (err) {
      if (mounted) setState(() => _reviewsError = CatalogErrorMessages.reviews(err));
    } finally {
      if (mounted) setState(() => _reviewsLoading = false);
    }
  }

  /// Estado do coração é conveniência: falha aqui não deve atrapalhar a tela.
  Future<void> _loadFavoriteState() async {
    try {
      final favs = await context.read<ApiClient>().getFavorites();
      if (mounted) setState(() => _isFavorite = favs.any((f) => f.productId == widget.productId));
    } catch (_) {}
  }

  /// Guarda id/nome/marca (nunca o veredito) quando produto e veredito chegaram.
  void _recordIfReady() {
    final product = _product;
    final userId = context.read<SessionController>().user?.id;
    if (_recorded || product == null || _verdict == null || userId == null) return;
    _recorded = true;
    context.read<RecentChecksStorage>().save(
          userId,
          RecentCheck(productId: product.id, productName: product.name, brand: product.brand),
        );
  }

  Future<void> _toggleFavorite() async {
    final apiClient = context.read<ApiClient>();
    try {
      if (_isFavorite) {
        await apiClient.removeFavorite(widget.productId);
        if (mounted) setState(() => _isFavorite = false);
      } else {
        await apiClient.addFavorite(productId: widget.productId);
        if (mounted) setState(() => _isFavorite = true);
      }
    } catch (err) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Não foi possível atualizar favoritos.')),
        );
      }
    }
  }

  Future<void> _openReviewDialog() async {
    int rating = 5;
    final commentController = TextEditingController();

    final result = await showDialog<bool>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Avaliar Produto'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (index) {
                  return IconButton(
                    icon: Icon(
                      index < rating ? Icons.star : Icons.star_border,
                      color: Colors.amber,
                    ),
                    onPressed: () => setDialogState(() => rating = index + 1),
                  );
                }),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: commentController,
                decoration: const InputDecoration(hintText: 'Deixe seu comentário (opcional)...'),
                maxLines: 3,
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
            TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Enviar')),
          ],
        ),
      ),
    );

    if (result == true && mounted) {
      try {
        final apiClient = context.read<ApiClient>();
        await apiClient.submitReview(
          productId: widget.productId,
          rating: rating,
          comment: commentController.text.trim(),
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Avaliação enviada com sucesso!')),
          );
          _loadReviews();
        }
      } catch (err) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Erro ao enviar avaliação.')),
          );
        }
      }
    }
  }

  Future<void> _openReportDialog() async {
    final reasonController = TextEditingController();
    bool isFoodSafetyRisk = false;

    final result = await showDialog<bool>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Denunciar Produto'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: reasonController,
                decoration: const InputDecoration(hintText: 'Descreva o motivo da denúncia...'),
                maxLines: 3,
              ),
              CheckboxListTile(
                title: const Text('Risco de Segurança Alimentar'),
                value: isFoodSafetyRisk,
                onChanged: (val) => setDialogState(() => isFoodSafetyRisk = val ?? false),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
            TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Denunciar')),
          ],
        ),
      ),
    );

    if (result == true && reasonController.text.trim().isNotEmpty && mounted) {
      try {
        final apiClient = context.read<ApiClient>();
        await apiClient.createReport(
          productId: widget.productId,
          reason: reasonController.text.trim(),
          isFoodSafetyRisk: isFoodSafetyRisk,
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Denúncia enviada para análise.')),
          );
        }
      } catch (_) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Erro ao enviar denúncia.')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final product = _product;
    return Scaffold(
      appBar: AppBar(
        title: Text(product?.name ?? widget.productName ?? 'Produto'),
        actions: [
          if (product != null) ...[
            IconButton(
              icon: Icon(_isFavorite ? Icons.favorite : Icons.favorite_border, color: _isFavorite ? Colors.red : null),
              onPressed: _toggleFavorite,
            ),
            IconButton(
              icon: const Icon(Icons.flag_outlined, color: AppColors.error),
              onPressed: _openReportDialog,
            ),
          ],
        ],
      ),
      body: _body(product),
    );
  }

  Widget _body(Product? product) {
    if (_productLoading && product == null) {
      return const LoadingOverlay(message: 'Carregando detalhes...');
    }
    if (product == null) {
      return Center(
        key: const Key('product-error'),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                _productError ?? CatalogErrorMessages.details(Object()),
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.textPrimary, fontSize: 15),
              ),
              const SizedBox(height: 16),
              ElevatedButton(onPressed: _loadAll, child: const Text('Tentar novamente')),
            ],
          ),
        ),
      );
    }
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        ProductImageCarousel(images: product.images, fallbackUrl: product.imageUrl),
        const SizedBox(height: 16),
        Text(
          product.name,
          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
        ),
        const SizedBox(height: 4),
        Text('Marca / Parceiro: ${product.brand}', style: const TextStyle(fontSize: 14, color: AppColors.textMuted)),
        if (product.shortDescription != null && product.shortDescription!.isNotEmpty) ...[
          const SizedBox(height: 6),
          Text(product.shortDescription!, style: const TextStyle(fontSize: 14, color: AppColors.textMutedLight)),
        ],
        const SizedBox(height: 12),
        VerdictSection(
          isLoading: _verdictLoading,
          report: _verdict,
          errorMessage: _verdictError,
          onRetry: _loadVerdict,
        ),
        ProductSection(
          title: '📜 INGREDIENTES',
          child: Text(
            product.ingredients.isNotEmpty ? product.ingredients : 'Não informado',
            style: const TextStyle(fontSize: 14, color: AppColors.textPrimary, height: 1.4),
          ),
        ),
        ProductSection(
          title: '⚠️ INFORMADO NO CADASTRO',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Dados cadastrados com o produto. Não substituem a verificação de compatibilidade acima.',
                style: TextStyle(color: AppColors.textMuted, fontSize: 12),
              ),
              const SizedBox(height: 10),
              _InfoRow('Glúten', product.hasGluten ? 'Contém glúten' : 'Sem glúten declarado'),
              const Divider(height: 20),
              _InfoRow(
                'Contaminação cruzada',
                product.crossContamination.isNotEmpty ? product.crossContamination : 'Não informado',
              ),
              if (product.mayContainTraces != null && product.mayContainTraces!.isNotEmpty) ...[
                const Divider(height: 20),
                _InfoRow('Pode conter traços', product.mayContainTraces!),
              ],
            ],
          ),
        ),
        if (product.dietaryFeatures.isNotEmpty) DietaryFeaturesCard(features: product.dietaryFeatures),
        if (NutritionCard.hasContent(product.nutritionalInfo)) NutritionCard(info: product.nutritionalInfo!),
        if (CertificationsCard.visible(product.certifications).isNotEmpty)
          CertificationsCard(certifications: CertificationsCard.visible(product.certifications)),
        const SizedBox(height: 24),
        _reviewsSection(),
      ],
    );
  }

  Widget _reviewsSection() {
    final reviews = _reviews;
    return Column(
      key: const Key('reviews-section'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              '⭐ AVALIAÇÕES',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textMuted, letterSpacing: 1),
            ),
            TextButton.icon(
              onPressed: _openReviewDialog,
              icon: const Icon(Icons.rate_review_outlined, size: 18),
              label: const Text('Avaliar'),
            ),
          ],
        ),
        const SizedBox(height: 8),
        if (_reviewsLoading && reviews == null)
          const Center(child: CircularProgressIndicator(color: AppColors.primary))
        else if (_reviewsError != null)
          Column(
            key: const Key('reviews-error'),
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(_reviewsError!, style: const TextStyle(color: AppColors.textMutedLight)),
              TextButton(
                key: const Key('reviews-retry'),
                onPressed: _loadReviews,
                child: const Text('Tentar novamente'),
              ),
            ],
          )
        else if (reviews == null || reviews.reviews.isEmpty)
          const Text('Nenhuma avaliação cadastrada ainda.', style: TextStyle(color: AppColors.textMuted))
        else ...[
          Text(
            '${formatNumber(reviews.averageRating)} de 5 · ${reviews.totalReviews} '
            '${reviews.totalReviews == 1 ? 'avaliação' : 'avaliações'}',
            style: const TextStyle(color: AppColors.textMutedLight, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 8),
          ...reviews.reviews.map(
            (r) => Container(
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
                      Text(
                        r.createdAt.split('T').first,
                        style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                      ),
                    ],
                  ),
                  if (r.comment != null && r.comment!.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(r.comment!, style: const TextStyle(fontSize: 13, color: AppColors.textPrimary)),
                  ],
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow(this.label, this.value);

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text('$label:', style: const TextStyle(color: AppColors.textMuted)),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            value,
            textAlign: TextAlign.end,
            style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }
}
