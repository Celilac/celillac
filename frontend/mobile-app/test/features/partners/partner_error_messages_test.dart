import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/api/api_exception.dart';
import 'package:mobile_app/features/account/account_error_messages.dart';
import 'package:mobile_app/features/catalog/catalog_error_messages.dart';
import 'package:mobile_app/features/partners/partner_error_messages.dart';

void main() {
  const technical = 'ERRO TECNICO: relation "partners" does not exist';
  ApiException err(int status) => ApiException(technical, statusCode: status);

  final all = <String, String Function(Object)>{
    'list': PartnerErrorMessages.list,
    'details': PartnerErrorMessages.details,
    'products': PartnerErrorMessages.products,
    'reviews': PartnerErrorMessages.reviews,
    'favorite': PartnerErrorMessages.favorite,
    'report': PartnerErrorMessages.report,
  };

  for (final entry in all.entries) {
    group(entry.key, () {
      test('nunca expõe o texto técnico do backend', () {
        for (final status in [400, 401, 403, 404, 409, 429, 500, 502, 503]) {
          expect(entry.value(err(status)), isNot(contains('ERRO TECNICO')), reason: 'status $status');
        }
        expect(entry.value(Exception('socket boom')), isNot(contains('boom')));
      });

      test('502/503/rede usam a mensagem de indisponibilidade', () {
        expect(entry.value(ApiException.serviceUnavailable()), ApiException.serviceUnavailableMessage);
        expect(entry.value(ApiException.serviceUnavailable(statusCode: 502)), ApiException.serviceUnavailableMessage);
      });

      test('429 usa a mensagem de limite', () {
        expect(entry.value(err(429)), AccountErrorMessages.rateLimited);
      });

      test('401 pede novo login', () {
        expect(entry.value(err(401)), CatalogErrorMessages.sessionExpired);
      });
    });
  }

  test('detalhe 404 explica que o parceiro está indisponível', () {
    expect(PartnerErrorMessages.details(err(404)), contains('não encontrado'));
  });

  test('favorito e denúncia 403 orientam a verificar o e-mail', () {
    expect(PartnerErrorMessages.favorite(err(403)), contains('e-mail'));
    expect(PartnerErrorMessages.report(err(403)), contains('e-mail'));
  });
}
