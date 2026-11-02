import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/api/api_exception.dart';
import 'package:mobile_app/features/account/account_error_messages.dart';
import 'package:mobile_app/features/catalog/catalog_error_messages.dart';

void main() {
  const technical = 'SQLSTATE 42P01: relation "products" does not exist';

  test('rede/502/503 usam a mensagem padrão de indisponibilidade', () {
    final e = ApiException.serviceUnavailable();
    expect(CatalogErrorMessages.search(e), ApiException.serviceUnavailableMessage);
    expect(CatalogErrorMessages.details(e), ApiException.serviceUnavailableMessage);
    expect(CatalogErrorMessages.verdict(e), ApiException.serviceUnavailableMessage);
    expect(CatalogErrorMessages.reviews(e), ApiException.serviceUnavailableMessage);
  });

  test('429 usa a mensagem de limite', () {
    const e = ApiException('Muitas consultas', statusCode: 429);
    expect(CatalogErrorMessages.search(e), AccountErrorMessages.rateLimited);
    expect(CatalogErrorMessages.verdict(e), AccountErrorMessages.rateLimited);
  });

  test('401 pede novo login', () {
    const e = ApiException('Token inválido', statusCode: 401);
    expect(CatalogErrorMessages.search(e), contains('sessão expirou'));
    expect(CatalogErrorMessages.verdict(e), contains('sessão expirou'));
  });

  test('404 do detalhe diz que o produto não foi encontrado', () {
    const e = ApiException('Produto não encontrado.', statusCode: 404);
    expect(CatalogErrorMessages.details(e), contains('não encontrado'));
  });

  test('400/404 do veredito não repassa texto do backend e orienta revisar o perfil', () {
    for (final status in [400, 404]) {
      final msg = CatalogErrorMessages.verdict(ApiException(technical, statusCode: status));
      expect(msg, isNot(contains('SQLSTATE')));
      expect(msg, contains('perfil'));
    }
  });

  test('nunca vaza texto técnico em nenhum fluxo', () {
    const e = ApiException(technical, statusCode: 500);
    for (final msg in [
      CatalogErrorMessages.search(e),
      CatalogErrorMessages.details(e),
      CatalogErrorMessages.verdict(e),
      CatalogErrorMessages.reviews(e),
      CatalogErrorMessages.search(StateError(technical)),
    ]) {
      expect(msg, isNot(contains('SQLSTATE')));
      expect(msg, isNotEmpty);
    }
  });
}
