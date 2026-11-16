enum AnalysisStatus {
  pendente('PENDENTE_DE_ANALISE'),
  analisado('ANALISADO');

  const AnalysisStatus(this.wireValue);

  final String wireValue;

  static AnalysisStatus fromWire(String value) {
    return AnalysisStatus.values.firstWhere(
      (e) => e.wireValue == value,
      orElse: () => AnalysisStatus.pendente,
    );
  }
}

class ProductImage {
  const ProductImage({
    required this.id,
    required this.url,
    required this.imageType,
    this.caption,
    this.displayOrder = 0,
    this.isCover = false,
  });

  factory ProductImage.fromJson(Map<String, dynamic> json) => ProductImage(
        id: (json['id'] as String?) ?? '',
        url: json['url'] as String,
        imageType: (json['imageType'] as String?) ?? 'PRODUCT',
        caption: json['caption'] as String?,
        displayOrder: (json['displayOrder'] as num?)?.toInt() ?? 0,
        isCover: (json['isCover'] as bool?) ?? false,
      );

  final String id;
  final String url;

  /// PRODUCT | PACKAGING | LABEL | INGREDIENTS | NUTRITIONAL_INFO | CERTIFICATION.
  final String imageType;
  final String? caption;
  final int displayOrder;
  final bool isCover;
}

/// Tabela nutricional como cadastrada no catálogo (apenas exibição).
class NutritionalInfo {
  const NutritionalInfo({
    this.servingSize,
    this.calories,
    this.carbohydrates,
    this.totalSugars,
    this.addedSugars,
    this.proteins,
    this.totalFat,
    this.saturatedFat,
    this.dietaryFiber,
    this.sodium,
  });

  factory NutritionalInfo.fromJson(Map<String, dynamic> json) => NutritionalInfo(
        servingSize: json['servingSize'] as String?,
        calories: (json['calories'] as num?)?.toDouble(),
        carbohydrates: (json['carbohydrates'] as num?)?.toDouble(),
        totalSugars: (json['totalSugars'] as num?)?.toDouble(),
        addedSugars: (json['addedSugars'] as num?)?.toDouble(),
        proteins: (json['proteins'] as num?)?.toDouble(),
        totalFat: (json['totalFat'] as num?)?.toDouble(),
        saturatedFat: (json['saturatedFat'] as num?)?.toDouble(),
        dietaryFiber: (json['dietaryFiber'] as num?)?.toDouble(),
        sodium: (json['sodium'] as num?)?.toDouble(),
      );

  final String? servingSize;
  final double? calories; // kcal
  final double? carbohydrates; // g
  final double? totalSugars; // g
  final double? addedSugars; // g
  final double? proteins; // g
  final double? totalFat; // g
  final double? saturatedFat; // g
  final double? dietaryFiber; // g
  final double? sodium; // mg
}

class ProductCertification {
  const ProductCertification({
    required this.certificationType,
    required this.certifyingEntity,
    this.certificateCode,
    this.validUntil,
    this.imageId,
    this.verificationStatus,
  });

  factory ProductCertification.fromJson(Map<String, dynamic> json) => ProductCertification(
        certificationType: (json['certificationType'] as String?) ?? '',
        certifyingEntity: (json['certifyingEntity'] as String?) ?? '',
        certificateCode: json['certificateCode'] as String?,
        validUntil: json['validUntil'] as String?,
        imageId: json['imageId'] as String?,
        verificationStatus: json['verificationStatus'] as String?,
      );

  final String certificationType;
  final String certifyingEntity;
  final String? certificateCode;
  final String? validUntil;
  final String? imageId;

  /// DECLARED_BY_PARTNER | VERIFIED_BY_CELILAC | REJECTED.
  final String? verificationStatus;
}

/// Produto do catálogo. Modelo apenas de exibição: o app ignora qualquer
/// `compatibilityReport` embutido pelo backend — o veredito vem só de
/// POST /compatibility/check.
class Product {
  const Product({
    required this.id,
    required this.name,
    required this.brand,
    required this.ingredients,
    required this.hasGluten,
    required this.crossContamination,
    required this.analysisStatus,
    this.imageUrl,
    this.shortDescription,
    this.ean,
    this.mayContainTraces,
    this.images = const [],
    this.dietaryFeatures = const [],
    this.nutritionalInfo,
    this.certifications = const [],
    this.partnerId,
    this.price,
  });

  factory Product.fromJson(Map<String, dynamic> json) => Product(
        id: json['id'] as String,
        name: json['name'] as String,
        brand: (json['brand'] as String?) ?? '',
        ingredients: (json['ingredients'] as String?) ?? '',
        hasGluten: json['hasGluten'] as bool,
        crossContamination: (json['crossContamination'] as String?) ?? '',
        analysisStatus: AnalysisStatus.fromWire(json['analysisStatus'] as String),
        imageUrl: json['imageUrl'] as String?,
        shortDescription: json['shortDescription'] as String?,
        ean: json['ean'] as String?,
        mayContainTraces: json['mayContainTraces'] as String?,
        images: (json['images'] as List<dynamic>? ?? [])
            .map((e) => ProductImage.fromJson(e as Map<String, dynamic>))
            .toList(),
        dietaryFeatures: (json['dietaryFeatures'] as List<dynamic>? ?? []).whereType<String>().toList(),
        nutritionalInfo: json['nutritionalInfo'] is Map<String, dynamic>
            ? NutritionalInfo.fromJson(json['nutritionalInfo'] as Map<String, dynamic>)
            : null,
        certifications: (json['certifications'] as List<dynamic>? ?? [])
            .map((e) => ProductCertification.fromJson(e as Map<String, dynamic>))
            .toList(),
        partnerId: json['partnerId'] as String?,
        price: (json['price'] as num?)?.toDouble(),
      );

  final String id;
  final String name;
  final String brand;
  final String ingredients;
  final bool hasGluten;
  final String crossContamination;
  final AnalysisStatus analysisStatus;
  final String? imageUrl;
  final String? shortDescription;
  final String? ean;
  final String? mayContainTraces;
  final List<ProductImage> images;
  final List<String> dietaryFeatures;
  final NutritionalInfo? nutritionalInfo;
  final List<ProductCertification> certifications;

  /// Parceiro dono do produto e preço unitário (BRL). Ambos podem faltar
  /// (produto sem preço = "sob consulta", não pode ser pedido online).
  final String? partnerId;
  final double? price;

  bool get canBeOrdered => partnerId != null && price != null && price! > 0;
}

class CatalogResponse {
  const CatalogResponse({
    required this.data,
    required this.total,
    required this.page,
    required this.limit,
  });

  factory CatalogResponse.fromJson(Map<String, dynamic> json) => CatalogResponse(
        data: (json['data'] as List<dynamic>)
            .map((e) => Product.fromJson(e as Map<String, dynamic>))
            .toList(),
        total: json['total'] as int,
        page: json['page'] as int,
        limit: json['limit'] as int,
      );

  final List<Product> data;
  final int total;
  final int page;
  final int limit;
}
