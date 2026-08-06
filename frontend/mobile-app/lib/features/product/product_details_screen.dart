import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/api_client.dart';
import '../../api/models/compatibility_models.dart';
import '../../api/models/product_models.dart';
import '../../api/models/review_models.dart';
import '../../core/auth/session_controller.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/alert_banner.dart';
import '../../shared/widgets/loading_overlay.dart';

class ProductDetailsScreen extends StatefulWidget {
  const ProductDetailsScreen({super.key, required this.product, this.initialCompatibility});

  final Product product;
  final CompatibilityReport? initialCompatibility;

  @override
  State<ProductDetailsScreen> createState() => _ProductDetailsScreenState();
}

class _ProductDetailsScreenState extends State<ProductDetailsScreen> {
  CompatibilityReport? _compatibility;
  List<ReviewItem> _reviews = [];
  bool _isLoading = true;
  bool _isFavorite = false;

  @override
  void initState() {
    super.initState();
    _compatibility = widget.initialCompatibility;
    _loadData();
  }

  Future<void> _loadData() async {
    final userId = context.read<SessionController>().user?.id;
    final apiClient = context.read<ApiClient>();

    try {
      if (_compatibility == null && userId != null) {
        final comp = await apiClient.checkCompatibility(userId, widget.product.id);
        if (mounted) setState(() => _compatibility = comp);
      }

      final reviewsData = await apiClient.getProductReviews(widget.product.id);
      if (mounted) setState(() => _reviews = reviewsData);

      if (userId != null) {
        final favs = await apiClient.getFavorites();
        if (mounted) {
          setState(() {
            _isFavorite = favs.any((f) => f.productId == widget.product.id);
          });
        }
      }
    } catch (_) {
      // Ignora falhas não críticas ao carregar avaliações
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _toggleFavorite() async {
    final apiClient = context.read<ApiClient>();
    try {
      if (_isFavorite) {
        await apiClient.removeFavorite(widget.product.id);
        if (mounted) setState(() => _isFavorite = false);
      } else {
        await apiClient.addFavorite(productId: widget.product.id);
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
          productId: widget.product.id,
          rating: rating,
          comment: commentController.text.trim(),
        );
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Avaliação enviada com sucesso!')),
        );
        _loadData();
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
          productId: widget.product.id,
          reason: reasonController.text.trim(),
          isFoodSafetyRisk: isFoodSafetyRisk,
        );
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Denúncia enviada para análise.')),
        );
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
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.product.name),
        actions: [
          IconButton(
            icon: Icon(_isFavorite ? Icons.favorite : Icons.favorite_border, color: _isFavorite ? Colors.red : null),
            onPressed: _toggleFavorite,
          ),
          IconButton(
            icon: const Icon(Icons.flag_outlined, color: AppColors.error),
            onPressed: _openReportDialog,
          ),
        ],
      ),
      body: _isLoading
          ? const LoadingOverlay(message: 'Carregando detalhes...')
          : ListView(
              padding: const EdgeInsets.all(20),
              children: [
                Text(
                  widget.product.name,
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 4),
                Text(
                  'Marca / Parceiro: ${widget.product.brand}',
                  style: const TextStyle(fontSize: 14, color: AppColors.textMuted),
                ),
                const SizedBox(height: 16),
                if (_compatibility != null)
                  AlertBanner(
                    status: _compatibility!.riskLevel,
                    message: _compatibility!.isCompatible ? 'Compatível com seu perfil' : 'Incompatível com seu perfil',
                    reasoning: _compatibility!.reasoning,
                  ),
                const SizedBox(height: 20),
                const Text(
                  '📜 INGREDIENTES',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textMuted, letterSpacing: 1),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    widget.product.ingredients.isNotEmpty ? widget.product.ingredients : 'Não informado',
                    style: const TextStyle(fontSize: 14, color: AppColors.textPrimary, height: 1.4),
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  '⚠️ INFORMAÇÕES ALIMENTARES',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textMuted, letterSpacing: 1),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Glúten:', style: TextStyle(color: AppColors.textMuted)),
                          Text(
                            widget.product.hasGluten ? 'Contém Glúten' : 'Não Contém Glúten',
                            style: TextStyle(
                              color: widget.product.hasGluten ? AppColors.error : AppColors.success,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const Divider(height: 20),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Contaminação Cruzada:', style: TextStyle(color: AppColors.textMuted)),
                          Expanded(
                            child: Text(
                              widget.product.crossContamination,
                              textAlign: TextAlign.end,
                              style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
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
                if (_reviews.isEmpty)
                  const Text('Nenhuma avaliação cadastrada ainda.', style: TextStyle(color: AppColors.textMuted))
                else
                  ..._reviews.map(
                    (r) => Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text('⭐ ${r.rating}/5', style: const TextStyle(fontWeight: FontWeight.bold)),
                              const SizedBox(width: 8),
                              Text(r.createdAt.toString().split('T')[0], style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
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
            ),
    );
  }
}
