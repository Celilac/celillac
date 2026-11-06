import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/api/api_exception.dart';
import 'package:mobile_app/features/account/account_error_messages.dart';

void main() {
  const rateLimited = ApiException('Muitas tentativas de recuperação ... IP', statusCode: 429);

  test('429 vira mensagem amigável, sem texto técnico do backend', () {
    final msg = AccountErrorMessages.passwordResetRequest(rateLimited);
    expect(msg, contains('Muitas tentativas'));
    expect(msg, isNot(contains('IP')));
  });

  test('rede/502/503 usa a mensagem padrão de indisponibilidade', () {
    final unavailable = ApiException.serviceUnavailable();
    expect(AccountErrorMessages.passwordResetRequest(unavailable), ApiException.serviceUnavailableMessage);
    expect(AccountErrorMessages.passwordResetConfirm(unavailable), ApiException.serviceUnavailableMessage);
    expect(AccountErrorMessages.emailVerify(unavailable), ApiException.serviceUnavailableMessage);
    expect(AccountErrorMessages.emailResend(unavailable), ApiException.serviceUnavailableMessage);
  });

  test('reset: 400 de código expirado e de código inválido têm mensagens distintas', () {
    final expired = AccountErrorMessages.passwordResetConfirm(const ApiException(
        'Este código de recuperação expirou. Por favor, solicite um novo código.',
        statusCode: 400));
    final invalid = AccountErrorMessages.passwordResetConfirm(
        const ApiException('Código de recuperação inválido ou já utilizado.', statusCode: 400));
    expect(expired, contains('expirou'));
    expect(invalid, contains('inválido'));
    expect(expired, isNot(invalid));
  });

  test('verificação: 400 expirado vs incorreto', () {
    expect(
      AccountErrorMessages.emailVerify(const ApiException('Código de verificação expirado.', statusCode: 400)),
      contains('expirou'),
    );
    expect(
      AccountErrorMessages.emailVerify(
          const ApiException('Código de verificação incorreto ou inexistente.', statusCode: 400)),
      contains('incorreto'),
    );
  });

  test('reenvio: reconhece "E-mail já verificado."', () {
    expect(
      AccountErrorMessages.isAlreadyVerified(const ApiException('E-mail já verificado.', statusCode: 400)),
      isTrue,
    );
    expect(
      AccountErrorMessages.isAlreadyVerified(const ApiException('Outro erro', statusCode: 400)),
      isFalse,
    );
  });

  test('erros inesperados caem em mensagem genérica', () {
    expect(AccountErrorMessages.emailVerify(StateError('x')), isNotEmpty);
    expect(AccountErrorMessages.passwordResetRequest(StateError('x')), isNotEmpty);
  });
}
