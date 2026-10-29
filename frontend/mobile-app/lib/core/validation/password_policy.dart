/// Regra de senha forte — idêntica à do cadastro no web e ao backend:
/// 8+ caracteres, maiúscula, minúscula, número e símbolo.
final RegExp strongPasswordRegex =
    RegExp(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$');

const String passwordPolicyHint = 'Use 8+ caracteres com maiúscula, minúscula, número e símbolo.';

bool isStrongPassword(String password) => strongPasswordRegex.hasMatch(password);
