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

class Product {
  const Product({
    required this.id,
    required this.name,
    required this.brand,
    required this.ingredients,
    required this.hasGluten,
    required this.crossContamination,
    required this.analysisStatus,
  });

  factory Product.fromJson(Map<String, dynamic> json) => Product(
        id: json['id'] as String,
        name: json['name'] as String,
        brand: (json['brand'] as String?) ?? '',
        ingredients: (json['ingredients'] as String?) ?? '',
        hasGluten: json['hasGluten'] as bool,
        crossContamination: (json['crossContamination'] as String?) ?? '',
        analysisStatus: AnalysisStatus.fromWire(json['analysisStatus'] as String),
      );

  final String id;
  final String name;
  final String brand;
  final String ingredients;
  final bool hasGluten;
  final String crossContamination;
  final AnalysisStatus analysisStatus;
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
