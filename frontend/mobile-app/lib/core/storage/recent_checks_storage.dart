import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Armazenamento chave/valor local. Abstração mínima para poder simular
/// indisponibilidade nos testes.
abstract class LocalKeyValueStore {
  Future<String?> read(String key);
  Future<void> write(String key, String value);
  Future<void> delete(String key);
}

/// Usa Keychain/Keystore (único armazenamento local já presente no app),
/// pois o histórico de produtos consultados revela dados de saúde do usuário.
class SecureLocalKeyValueStore implements LocalKeyValueStore {
  SecureLocalKeyValueStore({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  @override
  Future<String?> read(String key) => _storage.read(key: key);

  @override
  Future<void> write(String key, String value) => _storage.write(key: key, value: value);

  @override
  Future<void> delete(String key) => _storage.delete(key: key);
}

/// Produto consultado recentemente. **Nunca guarda o veredito**: ele pode ficar
/// desatualizado (perfil/produto mudam) e só vale se vier de POST /compatibility/check.
class RecentCheck {
  const RecentCheck({
    required this.productId,
    required this.productName,
    required this.brand,
    this.checkedAt,
  });

  final String productId;
  final String productName;
  final String brand;
  final DateTime? checkedAt;

  Map<String, dynamic> toJson() => {
        'productId': productId,
        'productName': productName,
        'brand': brand,
        'checkedAt': checkedAt?.toIso8601String(),
      };

  static RecentCheck? tryParse(Object? raw) {
    if (raw is! Map) return null;
    final id = raw['productId'];
    final name = raw['productName'];
    if (id is! String || id.isEmpty || name is! String) return null;
    final brand = raw['brand'];
    final checkedAt = raw['checkedAt'];
    return RecentCheck(
      productId: id,
      productName: name,
      brand: brand is String ? brand : '',
      checkedAt: checkedAt is String ? DateTime.tryParse(checkedAt) : null,
    );
  }
}

/// Histórico "verificados recentemente" (equivalente a `recentChecks.ts` do web):
/// até [maxItems], sem duplicatas, isolado por usuário. Qualquer falha de
/// armazenamento é silenciosa — o histórico é um conforto, nunca bloqueia o fluxo.
class RecentChecksStorage {
  RecentChecksStorage({LocalKeyValueStore? store, DateTime Function()? now})
      : _store = store ?? SecureLocalKeyValueStore(),
        _now = now ?? DateTime.now;

  static const maxItems = 8;
  static const _prefix = 'celilac_recent_checks_';

  final LocalKeyValueStore _store;
  final DateTime Function() _now;

  String _key(String userId) => '$_prefix${userId.trim()}';

  Future<List<RecentCheck>> load(String userId) async {
    try {
      final raw = await _store.read(_key(userId));
      if (raw == null || raw.isEmpty) return [];
      final decoded = jsonDecode(raw);
      if (decoded is! List) return [];
      return decoded.map(RecentCheck.tryParse).whereType<RecentCheck>().take(maxItems).toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> save(String userId, RecentCheck item) async {
    try {
      final current = await load(userId);
      final updated = [
        RecentCheck(
          productId: item.productId,
          productName: item.productName,
          brand: item.brand,
          checkedAt: _now(),
        ),
        ...current.where((c) => c.productId != item.productId),
      ].take(maxItems).toList();
      await _store.write(_key(userId), jsonEncode(updated.map((e) => e.toJson()).toList()));
    } catch (_) {
      // Armazenamento local indisponível: segue sem histórico.
    }
  }

  Future<void> clear(String userId) async {
    try {
      await _store.delete(_key(userId));
    } catch (_) {}
  }
}
