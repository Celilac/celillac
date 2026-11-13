import '../../api/api_exception.dart';
import '../account/account_error_messages.dart';
import '../catalog/catalog_error_messages.dart';

/// Falha ao criar pedido. [safetyBlock] é o bloqueio do AllergenEngine
/// (`BLOQUEIO DE SEGURANÇA ALIMENTAR`): [message] é o texto do próprio backend,
/// exibido como veredito, nunca contornado nem recalculado.
class OrderCreateFailure {
  const OrderCreateFailure(this.message, {this.safetyBlock = false});

  final String message;
  final bool safetyBlock;
}

/// Mensagens amigáveis para pedidos. Fora o bloqueio de segurança alimentar,
/// nunca repassa o texto técnico do backend.
class OrderErrorMessages {
  OrderErrorMessages._();

  static const _safetyBlockPrefix = 'bloqueio de segurança alimentar';

  static String? _common(Object error) {
    if (error is! ApiException) return null;
    if (error.isServiceUnavailable) return ApiException.serviceUnavailableMessage;
    if (error.isTooManyRequests) return AccountErrorMessages.rateLimited;
    if (error.isUnauthorized) return CatalogErrorMessages.sessionExpired;
    return null;
  }

  static bool _has(Object error, String fragment) =>
      error is ApiException && error.message.toLowerCase().contains(fragment);

  static bool isSafetyBlock(Object error) =>
      error is ApiException && error.isBadRequest && error.message.toLowerCase().startsWith(_safetyBlockPrefix);

  static OrderCreateFailure create(Object error) {
    final common = _common(error);
    if (common != null) return OrderCreateFailure(common);
    if (isSafetyBlock(error)) {
      return OrderCreateFailure((error as ApiException).message, safetyBlock: true);
    }
    if (error is ApiException && error.isBadRequest) {
      if (_has(error, 'perfil alimentar')) {
        return const OrderCreateFailure(
          'Ative seu perfil alimentar (Perfil) para fazer pedidos com segurança.',
        );
      }
      if (_has(error, 'não está apto') || _has(error, 'não foi encontrado') || _has(error, 'não encontrado')) {
        return const OrderCreateFailure('Este estabelecimento não está recebendo pedidos no momento.');
      }
      if (_has(error, 'sob consulta')) {
        return const OrderCreateFailure('Este produto está sob consulta e não pode ser pedido pelo app.');
      }
      if (_has(error, 'inativo')) {
        return const OrderCreateFailure('Este produto está indisponível para pedidos.');
      }
    }
    if (error is ApiException && error.statusCode == 403) {
      return const OrderCreateFailure('Verifique seu e-mail (Perfil › Conta) para fazer pedidos.');
    }
    return const OrderCreateFailure('Não foi possível criar o pedido. Tente novamente.');
  }

  static String list(Object error) =>
      _common(error) ?? 'Não foi possível carregar seus pedidos. Tente novamente.';

  static String details(Object error) {
    final common = _common(error);
    if (common != null) return common;
    if (error is ApiException && error.statusCode == 404) return 'Pedido não encontrado.';
    return 'Não foi possível carregar este pedido. Tente novamente.';
  }

  static String cancel(Object error) {
    final common = _common(error);
    if (common != null) return common;
    if (error is ApiException && error.isBadRequest) {
      if (_has(error, 'não é mais permitido')) {
        return 'O estabelecimento já confirmou este pedido; não é mais possível cancelar por aqui.';
      }
      if (_has(error, 'já está cancelado')) return 'Este pedido já foi cancelado.';
      if (_has(error, 'estorno')) {
        return 'Não foi possível processar o estorno agora. Tente novamente em instantes.';
      }
    }
    return 'Não foi possível cancelar o pedido. Tente novamente.';
  }
}
