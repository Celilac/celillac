import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/validation/password_policy.dart';

void main() {
  test('aceita senha com 8+ caracteres, maiúscula, minúscula, número e símbolo', () {
    expect(isStrongPassword('Abcdef1!'), isTrue);
  });

  test('rejeita senhas que violam qualquer requisito', () {
    expect(isStrongPassword('Abcde1!'), isFalse); // 7 caracteres
    expect(isStrongPassword('abcdef1!'), isFalse); // sem maiúscula
    expect(isStrongPassword('ABCDEF1!'), isFalse); // sem minúscula
    expect(isStrongPassword('Abcdefg!'), isFalse); // sem número
    expect(isStrongPassword('Abcdefg1'), isFalse); // sem símbolo
  });
}
