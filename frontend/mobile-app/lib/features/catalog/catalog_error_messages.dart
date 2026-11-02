import '../../api/api_exception.dart';
import '../account/account_error_messages.dart';

/// Mensagens amigáveis para busca, detalhe e veredito de produtos. Nunca repassa
/// o texto técnico do backend (mesmo padrão de [AccountErrorMessages]).
class CatalogErrorMessages {
  CatalogErrorMessages._();

  static const sessionExpired = 'Sua sessão expirou. Entre novamente para continuar.';
  static const _searchFallback = 'Não foi possível buscar produtos. Tente novamente.';
  static const _detailsFallback = 'Não foi possível carregar este produto. Tente novamente.';
  static const _verdictFallback = 'Não foi possível verificar a compatibilidade agora. Tente novamente.';
  static const _reviewsFallback = 'Não foi possível carregar as avaliações. Tente novamente.';

  static String? _common(Object error) {
    if (error is! ApiException) return null;
    if (error.isServiceUnavailable) return ApiException.serviceUnavailableMessage;
    if (error.isTooManyRequests) return AccountErrorMessages.rateLimited;
    if (error.isUnauthorized) return sessionExpired;
    return null;
  }

  static String search(Object error) => _common(error) ?? _searchFallback;

  static String details(Object error) {
    final common = _common(error);
    if (common != null) return common;
    if (error is ApiException && error.statusCode == 404) {
      return 'Produto não encontrado. Ele pode ter sido removido do catálogo.';
    }
    return _detailsFallback;
  }

  /// 400/404 do `POST /compatibility/check` costumam indicar perfil ausente ou
  /// produto indisponível; orientamos sem expor o erro do backend.
  static String verdict(Object error) {
    final common = _common(error);
    if (common != null) return common;
    if (error is ApiException && (error.isBadRequest || error.statusCode == 404)) {
      return 'Não foi possível avaliar este produto com o seu perfil. '
          'Revise seu perfil alimentar e tente novamente.';
    }
    return _verdictFallback;
  }

  static String reviews(Object error) => _common(error) ?? _reviewsFallback;
}
