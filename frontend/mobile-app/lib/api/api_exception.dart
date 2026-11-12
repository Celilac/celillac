/// Erro de API — carrega a mensagem `error` retornada pelo backend
/// (ver docs/API_CONTRACTS.md seção 1: formato de erro padrão).
class ApiException implements Exception {
  const ApiException(this.message, {required this.statusCode});

  static const String serviceUnavailableMessage =
      'Serviço temporariamente indisponível. O backend está em manutenção ou inicializando.';

  /// Erro de rede (sem resposta HTTP) ou 502/503.
  factory ApiException.serviceUnavailable({int statusCode = 503}) =>
      ApiException(serviceUnavailableMessage, statusCode: statusCode);

  final String message;
  final int statusCode;

  bool get isBadRequest => statusCode == 400;
  bool get isUnauthorized => statusCode == 401;
  bool get isConflict => statusCode == 409;
  bool get isServiceUnavailable => message == serviceUnavailableMessage;

  @override
  String toString() => 'ApiException($statusCode): $message';
}
