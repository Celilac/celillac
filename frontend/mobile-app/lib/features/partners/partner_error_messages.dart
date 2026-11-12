import '../../api/api_exception.dart';
import '../account/account_error_messages.dart';
import '../catalog/catalog_error_messages.dart';

/// Mensagens amigáveis para parceiros públicos. Nunca repassa o texto técnico
/// do backend (mesmo padrão de [CatalogErrorMessages]).
class PartnerErrorMessages {
  PartnerErrorMessages._();

  static const emailNotVerified =
      'Verifique seu e-mail (Perfil › Conta) para usar esta ação.';

  static String? _common(Object error) {
    if (error is! ApiException) return null;
    if (error.isServiceUnavailable) return ApiException.serviceUnavailableMessage;
    if (error.isTooManyRequests) return AccountErrorMessages.rateLimited;
    if (error.isUnauthorized) return CatalogErrorMessages.sessionExpired;
    return null;
  }

  static String list(Object error) => _common(error) ?? 'Não foi possível carregar os parceiros. Tente novamente.';

  static String details(Object error) {
    final common = _common(error);
    if (common != null) return common;
    if (error is ApiException && error.statusCode == 404) {
      return 'Parceiro não encontrado. Ele pode ter ficado indisponível.';
    }
    return 'Não foi possível carregar este parceiro. Tente novamente.';
  }

  static String products(Object error) =>
      _common(error) ?? 'Não foi possível carregar os produtos deste parceiro. Tente novamente.';

  static String reviews(Object error) =>
      _common(error) ?? 'Não foi possível carregar as avaliações. Tente novamente.';

  static String favorite(Object error) {
    final common = _common(error);
    if (common != null) return common;
    if (error is ApiException && error.statusCode == 403) return emailNotVerified;
    return 'Não foi possível atualizar seus favoritos. Tente novamente.';
  }

  static String report(Object error) {
    final common = _common(error);
    if (common != null) return common;
    if (error is ApiException && error.statusCode == 403) return emailNotVerified;
    if (error is ApiException && error.isBadRequest) {
      return 'Não foi possível enviar a denúncia. Revise os dados e tente novamente.';
    }
    return 'Não foi possível enviar a denúncia. Tente novamente.';
  }
}
