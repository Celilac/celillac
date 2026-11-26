import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:mobile_app/api/api_client.dart';
import 'package:mobile_app/core/auth/session_controller.dart';
import 'package:mobile_app/core/storage/recent_checks_storage.dart';
import 'package:mobile_app/features/home/home_screen.dart';
import 'package:mobile_app/features/home/home_tab.dart';
import 'package:provider/provider.dart';

import '../../api/order_api_test.dart' show orderJson;
import '../account/account_test_harness.dart';
import '../catalog/discovery_test_harness.dart' show FakeSession, MemoryKeyValueStore;

export '../account/account_test_harness.dart' show jsonResponse;
export '../catalog/discovery_test_harness.dart' show BrokenKeyValueStore, MemoryKeyValueStore;

typedef Responder = FutureOr<http.Response> Function();

Map<String, dynamic> accountJson({String? fullName = 'Maria da Silva', bool verified = true}) => {
      'id': 'u1',
      'email': 'maria@exemplo.com',
      'role': 'CELIACO',
      'fullName': fullName,
      'isEmailVerified': verified,
    };

Map<String, dynamic> consumerJson({
  String status = 'ATIVO',
  bool warning = false,
  bool hasProfile = true,
  bool acceptsCrossContamination = false,
  List<Map<String, dynamic>> restrictions = const [
    {'id': 'r1', 'allergen': 'GLUTEN', 'severity': 'FATAL'},
  ],
}) =>
    {
      'consumer': {'id': 'c1', 'userId': 'u1', 'status': status},
      'foodProfile': hasProfile
          ? {'acceptsCrossContamination': acceptsCrossContamination, 'restrictions': restrictions}
          : null,
      'hasIncompleteProfileWarning': warning,
    };

Map<String, dynamic> homeOrder(
  String id, {
  String status = 'PREPARING',
  String createdAt = '2026-11-20T12:00:00.000Z',
}) =>
    {...orderJson, 'id': id, 'status': status, 'createdAt': createdAt};

/// Backend falso do Início. Cada bloco responde de forma independente e pode
/// ser trocado durante o teste.
class HomeBackend {
  Responder account = () => jsonResponse(accountJson(), 200);
  Responder consumer = () => jsonResponse(consumerJson(), 200);
  Responder orders = () => jsonResponse([], 200);

  late final RecordingHttp recorder = RecordingHttp((request) async {
    final path = request.url.path;
    if (path == '/iam/me') return await account();
    if (path == '/consumer/me') return await consumer();
    if (path == '/orders/me') return await orders();
    if (path == '/iam/email-verification/verify') return jsonResponse({'message': 'ok'}, 200);
    if (path.startsWith('/orders/')) return jsonResponse(homeOrder(path.split('/').last), 200);
    return jsonResponse({'error': 'not found'}, 404);
  });

  List<String> get calls => [for (final r in recorder.requests) '${r.method} ${r.url.path}'];

  int count(String call) => calls.where((c) => c == call).length;
}

class HomeHandle {
  HomeHandle(this.active);

  final ValueNotifier<bool> active;
  final List<HomeTab> selected = [];
}

/// Monta o [HomeScreen] com os mesmos providers do app. [settle] falso deixa as
/// requisições pendentes visíveis (estado de carregamento).
Future<HomeHandle> pumpHome(
  WidgetTester tester,
  HomeBackend backend, {
  RecentChecksStorage? recents,
  bool settle = true,
}) async {
  tester.view.physicalSize = const Size(800, 3000);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
  final api = backend.recorder.client(token: 'tok');
  final handle = HomeHandle(ValueNotifier(true));
  await tester.pumpWidget(
    MultiProvider(
      providers: [
        Provider<ApiClient>.value(value: api),
        Provider<RecentChecksStorage>.value(
          value: recents ?? RecentChecksStorage(store: MemoryKeyValueStore()),
        ),
        ChangeNotifierProvider<SessionController>(create: (_) => FakeSession()),
      ],
      child: MaterialApp(
        home: ValueListenableBuilder<bool>(
          valueListenable: handle.active,
          builder: (_, isActive, _) => HomeScreen(isActive: isActive, onSelectTab: handle.selected.add),
        ),
      ),
    ),
  );
  if (settle) await tester.pumpAndSettle();
  return handle;
}
