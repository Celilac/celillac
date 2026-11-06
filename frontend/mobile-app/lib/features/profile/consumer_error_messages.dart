import '../../api/api_exception.dart';
import '../account/account_error_messages.dart';

/// Mensagens amigáveis para os fluxos de perfil do consumidor. Nunca repassa o
/// texto técnico do backend (mesmo padrão de [AccountErrorMessages]).
class ConsumerErrorMessages {
  ConsumerErrorMessages._();

  static const sessionExpired =
      'Sua sessão expirou. Entre novamente para continuar.';
  static const _fallback =
      'Não foi possível concluir a operação. Tente novamente.';

  static String generic(Object error) {
    if (error is! ApiException) return _fallback;
    if (error.isServiceUnavailable) {
      return ApiException.serviceUnavailableMessage;
    }
    if (error.isTooManyRequests) return AccountErrorMessages.rateLimited;
    if (error.isUnauthorized) return sessionExpired;
    return _fallback;
  }
}
