import 'package:flutter/material.dart';

import '../../../api/models/product_models.dart';
import '../../../core/theme/app_colors.dart';

const _typeLabels = <String, String>{
  'PRODUCT': 'Produto',
  'PACKAGING': 'Embalagem',
  'LABEL': 'Rótulo',
  'INGREDIENTS': 'Ingredientes',
  'NUTRITIONAL_INFO': 'Tabela nutricional',
  'CERTIFICATION': 'Laudo / Certificação',
};

/// Carrossel de imagens, rótulos e laudos. Capa primeiro, depois `displayOrder`.
/// Sem galeria usa o `imageUrl` legado; sem nada, mostra um aviso.
class ProductImageCarousel extends StatefulWidget {
  const ProductImageCarousel({super.key, required this.images, this.fallbackUrl});

  final List<ProductImage> images;
  final String? fallbackUrl;

  @override
  State<ProductImageCarousel> createState() => _ProductImageCarouselState();
}

class _ProductImageCarouselState extends State<ProductImageCarousel> {
  int _page = 0;

  List<ProductImage> get _ordered {
    if (widget.images.isNotEmpty) {
      return [...widget.images]..sort((a, b) {
          if (a.isCover != b.isCover) return a.isCover ? -1 : 1;
          return a.displayOrder.compareTo(b.displayOrder);
        });
    }
    final legacy = widget.fallbackUrl;
    if (legacy != null && legacy.isNotEmpty) {
      return [ProductImage(id: 'legacy', url: legacy, imageType: 'PRODUCT', isCover: true)];
    }
    return const [];
  }

  @override
  Widget build(BuildContext context) {
    final images = _ordered;
    if (images.isEmpty) {
      return Container(
        key: const Key('product-no-images'),
        height: 120,
        alignment: Alignment.center,
        decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12)),
        child: const Text('Sem imagens cadastradas', style: TextStyle(color: AppColors.textMuted)),
      );
    }
    final current = images[_page.clamp(0, images.length - 1)];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: SizedBox(
            height: 240,
            child: Stack(
              children: [
                PageView.builder(
                  key: const Key('product-carousel'),
                  itemCount: images.length,
                  onPageChanged: (i) => setState(() => _page = i),
                  itemBuilder: (_, i) => _NetworkImage(url: images[i].url),
                ),
                if (images.length > 1)
                  Positioned(
                    right: 8,
                    bottom: 8,
                    child: Container(
                      key: const Key('carousel-page-indicator'),
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(10)),
                      child: Text(
                        '${_page + 1} / ${images.length}',
                        style: const TextStyle(color: Colors.white, fontSize: 12),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          _typeLabels[current.imageType] ?? 'Imagem',
          style: const TextStyle(color: AppColors.textMutedLight, fontSize: 12, fontWeight: FontWeight.w600),
        ),
        if (current.caption != null && current.caption!.isNotEmpty)
          Text(current.caption!, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
      ],
    );
  }
}

class _NetworkImage extends StatelessWidget {
  const _NetworkImage({required this.url});

  final String url;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.surface,
      width: double.infinity,
      child: Image.network(
        url,
        fit: BoxFit.contain,
        loadingBuilder: (context, child, progress) => progress == null
            ? child
            : const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        errorBuilder: (_, _, _) => const Center(
          child: Text('Imagem indisponível', style: TextStyle(color: AppColors.textMuted)),
        ),
      ),
    );
  }
}
