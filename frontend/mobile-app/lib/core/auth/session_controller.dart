import 'package:flutter/foundation.dart';

import '../../api/api_client.dart';
import '../../api/api_exception.dart';
import '../../api/models/auth_models.dart';
import '../storage/secure_token_storage.dart';
import 'jwt.dart';

class SessionUser {
  const SessionUser({required this.id, required this.role});

  final String id;
  final String role;
}

/// Estado global de autenticação + sessão.
/// Port de src/context/AuthContext.tsx (Expo) para ChangeNotifier.
///
/// Também resolve o gate de onboarding (hasFoodProfile), que na versão Expo
/// original nunca era realmente disparado (bug conhecido — ver PLAN):
/// aqui GET /food-profile/:userId decide corretamente entre onboarding e home.
class SessionController extends ChangeNotifier {
  SessionController({ApiClient? apiClient, SecureTokenStorage? storage})
      : _api = apiClient ?? ApiClient(),
        _storage = storage ?? SecureTokenStorage();

  final ApiClient _api;
  final SecureTokenStorage _storage;

  SessionUser? _user;
  bool _isAuthenticated = false;
  bool _isLoading = true;
  bool? _hasFoodProfile; // null = ainda não verificado / verificando
  Object? _foodProfileError;

  SessionUser? get user => _user;
  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  bool? get hasFoodProfile => _hasFoodProfile;
  Object? get foodProfileError => _foodProfileError;

  Future<void> restoreSession() async {
    try {
      final stored = await _storage.read();
      if (stored != null && !isTokenExpired(stored)) {
        final payload = decodeJwt(stored);
        if (payload != null) {
          _api.setAuthToken(stored);
          _user = SessionUser(id: payload.sub, role: payload.role);
          _isAuthenticated = true;
          _isLoading = false;
          notifyListeners();
          await refreshFoodProfileStatus();
          return;
        }
      }
      await _storage.delete();
    } catch (_) {
      // Falha ao ler o storage — trata como sessão inexistente.
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    final response = await _api.login(LoginPayload(email: email, password: password));
    await _applyToken(response.token);
  }

  Future<void> register(RegisterPayload payload) async {
    await _api.register(payload);
    // Após registrar, faz login automaticamente (mesmo comportamento do Expo).
    await login(payload.email, payload.password);
  }

  Future<void> _applyToken(String token) async {
    final payload = decodeJwt(token);
    if (payload == null) {
      throw const ApiException('Token inválido recebido do servidor.', statusCode: 500);
    }
    await _storage.write(token);
    _api.setAuthToken(token);
    _user = SessionUser(id: payload.sub, role: payload.role);
    _isAuthenticated = true;
    _isLoading = false;
    _hasFoodProfile = null;
    _foodProfileError = null;
    notifyListeners();
    await refreshFoodProfileStatus();
  }

  /// Verifica se o usuário já tem perfil alimentar cadastrado.
  /// 200 → tem perfil (home). 400 → sem perfil (onboarding).
  /// Qualquer outro erro (rede, 5xx) fica registrado em [foodProfileError]
  /// para a UI oferecer "tentar novamente", nunca assumindo silenciosamente
  /// nenhum dos dois estados.
  Future<void> refreshFoodProfileStatus() async {
    if (_user == null) return;
    _foodProfileError = null;
    notifyListeners();
    try {
      await _api.getFoodProfile(_user!.id);
      _hasFoodProfile = true;
    } on ApiException catch (e) {
      if (e.isBadRequest) {
        _hasFoodProfile = false;
      } else {
        _hasFoodProfile = null;
        _foodProfileError = e;
      }
    } catch (e) {
      _hasFoodProfile = null;
      _foodProfileError = e;
    }
    notifyListeners();
  }

  Future<void> logout() async {
    await _storage.delete();
    _api.setAuthToken(null);
    _user = null;
    _isAuthenticated = false;
    _isLoading = false;
    _hasFoodProfile = null;
    _foodProfileError = null;
    notifyListeners();
  }
}
