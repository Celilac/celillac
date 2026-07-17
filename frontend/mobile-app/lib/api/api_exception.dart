/// Erro de API — carrega a mensagem `error` retornada pelo backend
/// (ver docs/API_CONTRACTS.md seção 1: formato de erro padrão).
class ApiException implements Exception {
  const ApiException(this.message, {required this.statusCode});

  final String message;
  final int statusCode;

  bool get isBadRequest => statusCode == 400;
  bool get isUnauthorized => statusCode == 401;
  bool get isConflict => statusCode == 409;

  @override
  String toString() => 'ApiException($statusCode): $message';
}
