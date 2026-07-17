import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Armazena o JWT de forma segura (Keychain/Keystore).
/// Conforme docs/API_CONTRACTS.md §9 e docs/FRONTEND_STRATEGY.md:
/// o token nunca deve ser guardado em SharedPreferences sem criptografia.
class SecureTokenStorage {
  SecureTokenStorage({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage();

  static const _tokenKey = 'celilac_auth_token';

  final FlutterSecureStorage _storage;

  Future<String?> read() => _storage.read(key: _tokenKey);

  Future<void> write(String token) => _storage.write(key: _tokenKey, value: token);

  Future<void> delete() => _storage.delete(key: _tokenKey);
}
