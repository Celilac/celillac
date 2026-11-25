import '../../api/api_client.dart';
import '../../api/models/compatibility_models.dart';
import '../../api/models/product_models.dart';
import '../catalog/catalog_error_messages.dart';

/// Resultado de uma leitura de código de barras.
///
/// O app **nunca** fabrica um [CompatibilityReport]: só existe veredito quando
/// ele vem de `POST /compatibility/check`. "Não encontrado" e "falha" são
/// estados neutros, sem nível de risco.
sealed class ScanResult {
  const ScanResult();
}

/// Produto do catálogo com o veredito devolvido pelo backend.
class ScanFound extends ScanResult {
  const ScanFound(this.product, this.report);

  final Product product;
  final CompatibilityReport report;
}

/// Nenhum produto do catálogo tem exatamente esse código.
class ScanNotFound extends ScanResult {
  const ScanNotFound();
}

/// Produto encontrado, mas o veredito não pôde ser obtido.
class ScanVerdictUnavailable extends ScanResult {
  const ScanVerdictUnavailable(this.product, this.message);

  final Product product;
  final String message;
}

/// Falha ao consultar o catálogo (rede, 5xx, sessão...).
class ScanFailed extends ScanResult {
  const ScanFailed(this.message);

  final String message;
}

class ScanLookup {
  const ScanLookup(this._api);

  final ApiClient _api;

  Future<ScanResult> lookup(String code, String userId) async {
    final Product product;
    try {
      final catalog = await _api.searchProducts(code);
      // A busca é textual: só aceitamos o produto cujo EAN é exatamente o lido.
      // Pegar o "primeiro resultado" poderia exibir o veredito de outro produto.
      final match = catalog.data.where((p) => p.ean == code).firstOrNull;
      if (match == null) return const ScanNotFound();
      product = match;
    } catch (e) {
      return ScanFailed(CatalogErrorMessages.search(e));
    }

    try {
      final report = await _api.checkCompatibility(userId, product.id);
      return ScanFound(product, report);
    } catch (e) {
      return ScanVerdictUnavailable(product, CatalogErrorMessages.verdict(e));
    }
  }
}
