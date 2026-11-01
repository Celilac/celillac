import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/api/api_exception.dart';
import 'package:mobile_app/features/profile/consumer_error_messages.dart';

void main() {
  String msg(int status, [String text = 'detalhe técnico do backend']) =>
      ConsumerErrorMessages.generic(ApiException(text, statusCode: status));

  test('502/503 e rede usam a mensagem de indisponibilidade', () {
    expect(
      ConsumerErrorMessages.generic(ApiException.serviceUnavailable()),
      ApiException.serviceUnavailableMessage,
    );
  });

  test('429 → limite de tentativas', () {
    expect(msg(429), contains('Muitas tentativas'));
  });

  test('401 → sessão expirada', () {
    expect(msg(401), contains('sessão'));
  });

  test('400/404 e desconhecidos → mensagem genérica sem texto do backend', () {
    for (final s in [400, 404, 500]) {
      expect(msg(s), isNot(contains('técnico')));
    }
    expect(ConsumerErrorMessages.generic(Exception('x')), isNot(contains('x')));
  });
}
