import 'package:url_launcher/url_launcher.dart' as ul;

/// Abre um [Uri] em app externo. Devolve `true` se abriu.
typedef LaunchFn = Future<bool> Function(Uri uri);

Future<bool> _defaultLaunch(Uri uri) => ul.launchUrl(uri, mode: ul.LaunchMode.externalApplication);

/// Construtores de links a partir de dados públicos do parceiro.
class ExternalLinks {
  ExternalLinks._();

  /// `tel:` com apenas dígitos e `+`. Nulo se não houver número plausível.
  static Uri? phone(String? raw) {
    if (raw == null) return null;
    final cleaned = raw.replaceAll(RegExp(r'[^0-9+]'), '');
    if (cleaned.replaceAll('+', '').length < 8) return null;
    return Uri(scheme: 'tel', path: cleaned);
  }

  /// Endereço em uma linha ("Rua, 1, Cidade - UF"). Nulo se não houver endereço.
  static String? place({required String? address, String? city, String? state}) {
    final street = address?.trim() ?? '';
    if (street.isEmpty) return null;
    final c = city?.trim() ?? '';
    final s = state?.trim() ?? '';
    final region = c.isNotEmpty && s.isNotEmpty ? '$c - $s' : (c.isNotEmpty ? c : s);
    return region.isEmpty ? street : '$street, $region';
  }

  /// Busca no app de mapas (link https, que o SO entrega ao app de mapas ou ao navegador).
  static Uri? map({required String? address, String? city, String? state}) {
    final query = place(address: address, city: city, state: state);
    if (query == null) return null;
    return Uri.https('www.google.com', '/maps/search/', {'api': '1', 'query': query});
  }
}

/// Único ponto de abertura de links externos. Só deixa passar esquemas
/// conhecidos e nunca lança: falha vira `false` para a tela avisar o usuário.
class ExternalLinkLauncher {
  ExternalLinkLauncher({LaunchFn? launch}) : _launch = launch ?? _defaultLaunch;

  static const allowedSchemes = {'http', 'https', 'tel', 'mailto', 'geo'};

  final LaunchFn _launch;

  Future<bool> open(Uri uri) async {
    if (!allowedSchemes.contains(uri.scheme.toLowerCase())) return false;
    try {
      return await _launch(uri);
    } catch (_) {
      return false;
    }
  }
}
