import '../../api/api_exception.dart';
import '../account/account_error_messages.dart';
import '../catalog/catalog_error_messages.dart';

/// Mensagens amigáveis dos blocos de conta e perfil do Início (pedidos usam
/// `OrderErrorMessages`). Nunca repassa o texto técnico do backend.
class HomeErrorMessages {
  HomeErrorMessages._();

  static const _accountFallback = 'Não foi possível verificar sua conta. Tente novamente.';
  static const _profileFallback = 'Não foi possível carregar seu perfil alimentar. Tente novamente.';

  static String? _common(Object error) {
    if (error is! ApiException) return null;
    if (error.isServiceUnavailable) return ApiException.serviceUnavailableMessage;
    if (error.isTooManyRequests) return AccountErrorMessages.rateLimited;
    if (error.isUnauthorized) return CatalogErrorMessages.sessionExpired;
    return null;
  }

  static String account(Object error) => _common(error) ?? _accountFallback;

  static String profile(Object error) => _common(error) ?? _profileFallback;
}
