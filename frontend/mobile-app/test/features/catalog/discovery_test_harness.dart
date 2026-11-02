import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/api/api_client.dart';
import 'package:mobile_app/core/auth/session_controller.dart';
import 'package:mobile_app/core/storage/recent_checks_storage.dart';
import 'package:provider/provider.dart';

class FakeSession extends SessionController {
  @override
  SessionUser? get user => const SessionUser(id: 'u1', role: 'CELIACO');
}

class MemoryKeyValueStore implements LocalKeyValueStore {
  final Map<String, String> data = {};

  @override
  Future<String?> read(String key) async => data[key];

  @override
  Future<void> write(String key, String value) async => data[key] = value;

  @override
  Future<void> delete(String key) async => data.remove(key);
}

/// Simula Keychain/Keystore indisponível.
class BrokenKeyValueStore implements LocalKeyValueStore {
  @override
  Future<String?> read(String key) async => throw StateError('indisponível');

  @override
  Future<void> write(String key, String value) async => throw StateError('indisponível');

  @override
  Future<void> delete(String key) async => throw StateError('indisponível');
}

/// Monta [home] com ApiClient, sessão fake e histórico local via Provider.
Future<void> pumpDiscovery(
  WidgetTester tester, {
  required ApiClient api,
  required RecentChecksStorage recents,
  required Widget home,
}) async {
  tester.view.physicalSize = const Size(800, 3000);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
  await tester.pumpWidget(
    MultiProvider(
      providers: [
        Provider<ApiClient>.value(value: api),
        Provider<RecentChecksStorage>.value(value: recents),
        ChangeNotifierProvider<SessionController>(create: (_) => FakeSession()),
      ],
      child: MaterialApp(home: home),
    ),
  );
}

const productSummary = {
  'id': 'p1',
  'name': 'Biscoito de Arroz',
  'brand': 'CeliFood',
  'ingredients': 'Arroz, sal.',
  'hasGluten': false,
  'crossContamination': '',
  'analysisStatus': 'ANALISADO',
};

Map<String, dynamic> catalogPage(List<Map<String, dynamic>> data, {int? total, int page = 1}) => {
      'data': data,
      'total': total ?? data.length,
      'page': page,
      'limit': 20,
    };
