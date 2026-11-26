import '../../api/api_exception.dart';
import '../account/account_error_messages.dart';
import '../catalog/catalog_error_messages.dart';

/// Mensagens amigáveis do checkout. Nunca repassa o texto técnico do backend
/// ou do gateway de pagamento.
class PaymentErrorMessages {
  PaymentErrorMessages._();

  static String? _common(Object error) {
    if (error is! ApiException) return null;
    if (error.isServiceUnavailable) return ApiException.serviceUnavailableMessage;
    if (error.isTooManyRequests) return AccountErrorMessages.rateLimited;
    if (error.isUnauthorized) return CatalogErrorMessages.sessionExpired;
    return null;
  }

  static bool _has(Object error, String fragment) =>
      error is ApiException && error.message.toLowerCase().contains(fragment);

  static String checkout(Object error) {
    final common = _common(error);
    if (common != null) return common;
    if (error is ApiException && error.isBadRequest) {
      if (_has(error, 'na entrega indisponível')) {
        return 'Pagamento na entrega indisponível para a sua conta. Pague antecipadamente com PIX.';
      }
      if (_has(error, 'troco')) {
        return 'O valor para troco deve ser maior ou igual ao total do pedido.';
      }
      if (_has(error, 'checkout de um pedido com status')) {
        return 'Este pedido não aceita mais pagamento.';
      }
      if (_has(error, 'não encontrado')) return 'Pedido não encontrado.';
    }
    if (error is ApiException && error.statusCode == 403) {
      return 'Você não tem permissão para pagar este pedido.';
    }
    return 'Não foi possível iniciar o pagamento. Tente novamente.';
  }

  static String status(Object error) =>
      _common(error) ?? 'Não foi possível atualizar o status do pagamento. Tente novamente.';
}
