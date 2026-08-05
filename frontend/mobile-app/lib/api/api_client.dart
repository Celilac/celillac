import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import 'api_exception.dart';
import 'models/auth_models.dart';
import 'models/compatibility_models.dart';
import 'models/favorite_models.dart';
import 'models/food_profile_models.dart';
import 'models/product_models.dart';
import 'models/report_models.dart';
import 'models/review_models.dart';

/// Camada única de comunicação HTTP do app mobile (docs/API_CONTRACTS.md §9).
/// NUNCA chamar a API de outro lugar do app — apenas via este cliente.
class ApiClient {
  ApiClient({http.Client? httpClient}) : _httpClient = httpClient ?? http.Client();

  final http.Client _httpClient;
  String? _authToken;

  static const int _devPort = 3002;

  static String get _baseUrl {
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:$_devPort';
    }
    return 'http://localhost:$_devPort';
  }

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
    switch (method) {
      case 'POST':
        response = await _httpClient.post(uri, headers: headers, body: jsonEncode(body ?? {}));
        break;
      case 'DELETE':
        response = await _httpClient.delete(uri, headers: headers);
        break;
      case 'GET':
      default:
        response = await _httpClient.get(uri, headers: headers);
    }

    final decoded = response.body.isEmpty ? <String, dynamic>{} : jsonDecode(response.body);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      final message = (decoded is Map && decoded['error'] != null)
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

  // ─── Catalog ────────────────────────────────────────────────────────────

  Future<CatalogResponse> searchProducts(String query, {int page = 1, int limit = 20}) {
    final q = Uri.encodeQueryComponent(query);
    return _request(
      '/catalog/products?q=$q&page=$page&limit=$limit',
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
        if (productId != null) 'productId': productId,
        if (partnerId != null) 'partnerId': partnerId,
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
        if (productId != null) 'productId': productId,
        if (partnerId != null) 'partnerId': partnerId,
        'rating': rating,
        if (comment != null && comment.isNotEmpty) 'comment': comment,
      },
      parse: (json) => ReviewItem.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<List<ReviewItem>> getProductReviews(String productId) {
    return _request(
      '/reviews/product/$productId',
      parse: (json) => (json as List<dynamic>)
          .map((e) => ReviewItem.fromJson(e as Map<String, dynamic>))
          .toList(),
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
        if (productId != null) 'productId': productId,
        if (partnerId != null) 'partnerId': partnerId,
        'reason': reason,
        if (details != null && details.isNotEmpty) 'details': details,
        'isFoodSafetyRisk': isFoodSafetyRisk,
      },
      parse: (json) => ReportItem.fromJson(json as Map<String, dynamic>),
    );
  }
}
