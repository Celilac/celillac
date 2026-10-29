import '../../api/api_exception.dart';

/// Traduz erros dos fluxos de conta para mensagens amigáveis em PT-BR.
/// Nunca repassa o texto técnico do backend (docs/FRONTEND_STRATEGY.md); o
/// casamento por trecho do `error` serve apenas para escolher a mensagem.
class AccountErrorMessages {
  AccountErrorMessages._();

  static const rateLimited =
      'Muitas tentativas em pouco tempo. Aguarde alguns minutos antes de tentar novamente.';
  static const _generic = 'Não foi possível concluir a operação. Tente novamente.';

  static String? _common(Object error) {
    if (error is! ApiException) return _generic;
    if (error.isServiceUnavailable) return ApiException.serviceUnavailableMessage;
    if (error.isTooManyRequests) return rateLimited;
    return null;
  }

  static bool _has(Object error, String fragment) =>
      error is ApiException && error.message.toLowerCase().contains(fragment);

  static String passwordResetRequest(Object error) {
    final common = _common(error);
    if (common != null) return common;
    return 'Confira o e-mail informado e tente novamente.';
  }

  static String passwordResetConfirm(Object error) {
    final common = _common(error);
    if (common != null) return common;
    if (_has(error, 'expirou')) {
      return 'Este código expirou. Volte e solicite um novo código.';
    }
    if (_has(error, 'inválido') || _has(error, 'utilizado')) {
      return 'Código inválido ou já utilizado. Confira os 6 dígitos ou solicite um novo código.';
    }
    return 'Não foi possível redefinir a senha. Confira os dados e tente novamente.';
  }

  static String emailVerify(Object error) {
    final common = _common(error);
    if (common != null) return common;
    if (_has(error, 'expirado')) {
      return 'Este código expirou. Toque em "Reenviar código" para receber um novo.';
    }
    if (_has(error, 'incorreto') || _has(error, 'inexistente')) {
      return 'Código incorreto. Confira os 6 dígitos e tente novamente.';
    }
    return 'Não foi possível verificar o código. Tente novamente.';
  }

  static String emailResend(Object error) {
    final common = _common(error);
    if (common != null) return common;
    return 'Não foi possível reenviar o código. Tente novamente em instantes.';
  }

  /// `400 "E-mail já verificado."` no reenvio: o estado desejado já foi atingido.
  static bool isAlreadyVerified(Object error) =>
      error is ApiException && error.isBadRequest && _has(error, 'já verificado');
}
