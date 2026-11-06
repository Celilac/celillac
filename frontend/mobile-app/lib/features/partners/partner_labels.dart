/// Rótulos de exibição de parceiros (mesmos textos do web).
class PartnerLabels {
  PartnerLabels._();

  static const _types = {
    'RESTAURANT': 'Restaurante / Lanchonete',
    'MARKET': 'Mercado / Empório',
    'INDEPENDENT_PRODUCER': 'Produtor Independente',
    'BAKERY': 'Padaria / Confeitaria',
    'CAFE': 'Cafeteria',
    'SUPERMARKET': 'Supermercado',
    'OTHER': 'Outro',
  };

  static String type(String raw) => _types[raw.trim().toUpperCase()] ?? raw;

  /// "PJ • Empresa" / "PF • Produtor"; nulo se a natureza não vier da API.
  static String? legalNature(String? raw) {
    switch (raw?.toUpperCase()) {
      case 'PJ':
        return 'PJ • Empresa';
      case 'PF':
        return 'PF • Produtor';
      default:
        return null;
    }
  }

  static String cityState(String? city, String? state) {
    final c = city?.trim() ?? '';
    if (c.isEmpty) return 'Sem cidade';
    final s = state?.trim() ?? '';
    return s.isEmpty ? c : '$c - $s';
  }
}
