import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import '../core/config/api_config.dart';
import 'api_exception.dart';
import 'models/account_models.dart';
import 'models/auth_models.dart';
import 'models/compatibility_models.dart';
import 'models/consumer_models.dart';
import 'models/enums.dart';
import 'models/favorite_models.dart';
import 'models/food_profile_models.dart';
import 'models/product_models.dart';
import 'models/report_models.dart';
import 'models/review_models.dart';

/// Camada única de comunicação HTTP do app mobile (docs/API_CONTRACTS.md §9).
/// NUNCA chamar a API de outro lugar do app — apenas via este cliente.
class ApiClient {
  ApiClient({http.Client? httpClient, String? baseUrl})
      : _httpClient = httpClient ?? http.Client(),
        _baseUrl = baseUrl ?? ApiConfig.baseUrl;

  final http.Client _httpClient;
  final String _baseUrl;
  String? _authToken;

  void setAuthToken(String? token) {
    _authToken = token;
  }

  Future<T> _request<T>(
    String path, {
    String method = 'GET',
    Map<String, dynamic>? body,
    required T Function(dynamic json) parse,
  }) async {
    final headers = <String, String>{'Content-Type': 'application/json'};
    if (_authToken != null) {
      headers['Authorization'] = 'Bearer $_authToken';
    }

    final uri = Uri.parse('$_baseUrl$path');
    final http.Response response;
    try {
      switch (method) {
        case 'POST':
          response = await _httpClient.post(uri, headers: headers, body: jsonEncode(body ?? {}));
          break;
        case 'PUT':
          response = await _httpClient.put(uri, headers: headers, body: jsonEncode(body ?? {}));
          break;
        case 'PATCH':
          response = await _httpClient.patch(uri, headers: headers, body: jsonEncode(body ?? {}));
          break;
        case 'DELETE':
          response = await _httpClient.delete(uri, headers: headers);
          break;
        case 'GET':
        default:
          response = await _httpClient.get(uri, headers: headers);
      }
    } on SocketException {
      throw ApiException.serviceUnavailable();
    } on http.ClientException {
      throw ApiException.serviceUnavailable();
    } on TimeoutException {
      throw ApiException.serviceUnavailable();
    }

    if (response.statusCode == 502 || response.statusCode == 503) {
      throw ApiException.serviceUnavailable(statusCode: response.statusCode);
    }

    dynamic decoded;
    try {
      decoded = response.body.isEmpty ? <String, dynamic>{} : jsonDecode(response.body);
    } on FormatException {
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw ApiException('Erro ${response.statusCode}', statusCode: response.statusCode);
      }
      rethrow;
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      final message = (decoded is Map && decoded['error'] is String)
          ? decoded['error'] as String
          : 'Erro ${response.statusCode}';
      throw ApiException(message, statusCode: response.statusCode);
    }

    return parse(decoded);
  }

  // ─── IAM ────────────────────────────────────────────────────────────────

  Future<RegisterResponse> register(RegisterPayload payload) {
    return _request(
      '/iam/register',
      method: 'POST',
      body: payload.toJson(),
      parse: (json) => RegisterResponse.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<LoginResponse> login(LoginPayload payload) {
    return _request(
      '/iam/login',
      method: 'POST',
      body: payload.toJson(),
      parse: (json) => LoginResponse.fromJson(json as Map<String, dynamic>),
    );
  }

  /// Público. O backend responde 200 com mensagem genérica mesmo se o e-mail
  /// não existir (anti-enumeração) — o app deve exibi-la sem distinção.
  Future<MessageResponse> requestPasswordReset(String email) {
    return _request(
      '/iam/password-reset/request',
      method: 'POST',
      body: {'email': email},
      parse: (json) => MessageResponse.fromJson(json as Map<String, dynamic>),
    );
  }

  /// Público. Valida o OTP de 6 dígitos e define a nova senha.
  Future<MessageResponse> confirmPasswordReset(ConfirmPasswordResetPayload payload) {
    return _request(
      '/iam/password-reset/confirm',
      method: 'POST',
      body: payload.toJson(),
      parse: (json) => MessageResponse.fromJson(json as Map<String, dynamic>),
    );
  }

  /// Autenticado (Bearer).
  Future<MessageResponse> verifyEmail(String code) {
    return _request(
      '/iam/email-verification/verify',
      method: 'POST',
      body: {'code': code},
      parse: (json) => MessageResponse.fromJson(json as Map<String, dynamic>),
    );
  }

  /// Autenticado (Bearer).
  Future<MessageResponse> resendEmailVerification() {
    return _request(
      '/iam/email-verification/resend',
      method: 'POST',
      parse: (json) => MessageResponse.fromJson(json as Map<String, dynamic>),
    );
  }

  /// Autenticado (Bearer). Fonte do estado "e-mail verificado" (`isEmailVerified`).
  Future<AccountInfo> getAccount() {
    return _request(
      '/iam/me',
      parse: (json) => AccountInfo.fromJson(json as Map<String, dynamic>),
    );
  }

  // ─── Food Profile ───────────────────────────────────────────────────────

  Future<FoodProfile> createFoodProfile(FoodProfilePayload payload) {
    return _request(
      '/food-profile',
      method: 'POST',
      body: payload.toJson(),
      parse: (json) => FoodProfile.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<FoodProfile> getFoodProfile(String userId) {
    return _request(
      '/food-profile/$userId',
      parse: (json) => FoodProfile.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<FoodProfile> updateFoodProfile(String userId, FoodProfilePayload payload) {
    return _request(
      '/food-profile/$userId',
      method: 'PUT',
      body: payload.toJson(),
      parse: (json) => FoodProfile.fromJson(json as Map<String, dynamic>),
    );
  }

  // ─── Consumer (docs/API_CONTRACTS.md §11) ───────────────────────────────

  Future<ConsumerMe> getConsumerMe() {
    return _request(
      '/consumer/me',
      parse: (json) => ConsumerMe.fromJson(json as Map<String, dynamic>),
    );
  }

  /// O alvo é sempre o usuário autenticado (nunca enviamos `targetUserId`).
  Future<ConsumerStatusResult> setConsumerStatus(ConsumerStatusAction action) {
    return _request(
      '/consumer/status',
      method: 'PATCH',
      body: {'action': action.wireValue},
      parse: (json) => ConsumerStatusResult.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<ConsumerFoodProfile> addConsumerRestriction({
    required AllergenType allergen,
    required SeverityLevel severity,
    String? type,
    String? notes,
  }) {
    return _request(
      '/consumer/restrictions',
      method: 'POST',
      body: {
        'allergen': allergen.wireValue,
        'severity': severity.wireValue,
        'type': ?type,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
      },
      parse: (json) => ConsumerFoodProfile.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<ConsumerFoodProfile> removeConsumerRestriction(AllergenType allergen) {
    return _request(
      '/consumer/restrictions/${allergen.wireValue}',
      method: 'DELETE',
      parse: (json) => ConsumerFoodProfile.fromJson(json as Map<String, dynamic>),
    );
  }

  // ─── Catalog ────────────────────────────────────────────────────────────

  /// Filtros espelham os parâmetros do backend (`avoidAllergens`, `onlyCompatible`);
  /// o app nunca filtra por segurança localmente.
  Future<CatalogResponse> searchProducts(
    String query, {
    int page = 1,
    int limit = 20,
    List<AllergenType> avoidAllergens = const [],
    bool onlyCompatible = false,
  }) {
    final params = StringBuffer('q=${Uri.encodeQueryComponent(query)}&page=$page&limit=$limit');
    if (avoidAllergens.isNotEmpty) {
      params.write('&avoidAllergens=${Uri.encodeQueryComponent(avoidAllergens.map((a) => a.wireValue).join(','))}');
    }
    if (onlyCompatible) params.write('&onlyCompatible=true');
    return _request(
      '/catalog/products?$params',
      parse: (json) => CatalogResponse.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<Product> getProductById(String id) {
    return _request(
      '/catalog/products/$id',
      parse: (json) => Product.fromJson(json as Map<String, dynamic>),
    );
  }

  // ─── Compatibility ──────────────────────────────────────────────────────

  Future<CompatibilityReport> checkCompatibility(String userId, String productId) {
    return _request(
      '/compatibility/check',
      method: 'POST',
      body: {'userId': userId, 'productId': productId},
      parse: (json) => CompatibilityReport.fromJson(json as Map<String, dynamic>),
    );
  }

  // ─── Favorites ──────────────────────────────────────────────────────────

  Future<FavoriteItem> addFavorite({String? productId, String? partnerId}) {
    return _request(
      '/favorites',
      method: 'POST',
      body: {
        'productId': ?productId,
        'partnerId': ?partnerId,
      },
      parse: (json) => FavoriteItem.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<void> removeFavorite(String targetId) {
    return _request(
      '/favorites/$targetId',
      method: 'DELETE',
      parse: (_) {},
    );
  }

  Future<List<FavoriteItem>> getFavorites() {
    return _request(
      '/favorites',
      parse: (json) => (json as List<dynamic>)
          .map((e) => FavoriteItem.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  // ─── Reviews ────────────────────────────────────────────────────────────

  Future<ReviewItem> submitReview({
    String? productId,
    String? partnerId,
    required int rating,
    String? comment,
  }) {
    return _request(
      '/reviews',
      method: 'POST',
      body: {
        'productId': ?productId,
        'partnerId': ?partnerId,
        'rating': rating,
        if (comment != null && comment.isNotEmpty) 'comment': comment,
      },
      parse: (json) => ReviewItem.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<ProductReviews> getProductReviews(String productId) {
    return _request(
      '/reviews/product/$productId',
      parse: (json) => ProductReviews.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<List<ReviewItem>> getPartnerReviews(String partnerId) {
    return _request(
      '/reviews/partner/$partnerId',
      parse: (json) => (json as List<dynamic>)
          .map((e) => ReviewItem.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  // ─── Reports ────────────────────────────────────────────────────────────

  Future<ReportItem> createReport({
    String? productId,
    String? partnerId,
    required String reason,
    String? details,
    bool isFoodSafetyRisk = false,
  }) {
    return _request(
      '/admin/reports',
      method: 'POST',
      body: {
        'productId': ?productId,
        'partnerId': ?partnerId,
        'reason': reason,
        if (details != null && details.isNotEmpty) 'details': details,
        'isFoodSafetyRisk': isFoodSafetyRisk,
      },
      parse: (json) => ReportItem.fromJson(json as Map<String, dynamic>),
    );
  }
}
