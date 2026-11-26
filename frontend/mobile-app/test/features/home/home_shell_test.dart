import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/api/api_client.dart';
import 'package:mobile_app/core/auth/session_controller.dart';
import 'package:mobile_app/core/links/external_link_launcher.dart';
import 'package:mobile_app/core/storage/recent_checks_storage.dart';
import 'package:mobile_app/features/home/home_screen.dart';
import 'package:mobile_app/features/home/home_shell.dart';
import 'package:mobile_app/features/scanner/scanner_screen.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';

import '../catalog/discovery_test_harness.dart' show FakeSession;
import 'home_test_harness.dart';

Future<HomeBackend> _pumpShell(WidgetTester tester) async {
  tester.view.physicalSize = const Size(800, 3000);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
  final backend = HomeBackend();
  final api = backend.recorder.client(token: 'tok');
  await tester.pumpWidget(
    MultiProvider(
      providers: [
        Provider<ApiClient>.value(value: api),
        Provider<RecentChecksStorage>.value(value: RecentChecksStorage(store: MemoryKeyValueStore())),
        Provider<ExternalLinkLauncher>(create: (_) => ExternalLinkLauncher()),
        ChangeNotifierProvider<SessionController>(create: (_) => FakeSession()),
      ],
      child: const MaterialApp(home: HomeShell()),
    ),
  );
  await tester.pumpAndSettle();
  return backend;
}

BottomNavigationBar _bar(WidgetTester tester) =>
    tester.widget<BottomNavigationBar>(find.byType(BottomNavigationBar));

String _currentLabel(WidgetTester tester) => _bar(tester).items[_bar(tester).currentIndex].label!;

void main() {
  testWidgets('Início é a primeira aba e a aba inicial', (tester) async {
    await _pumpShell(tester);
    expect(
      _bar(tester).items.map((i) => i.label),
      ['Início', 'Scanner', 'Buscar', 'Parceiros', 'Pedidos', 'Perfil'],
    );
    expect(_currentLabel(tester), 'Início');
    expect(find.byType(HomeScreen), findsOneWidget);
  });

  testWidgets('o Scanner só é criado, já ativo, na primeira visita', (tester) async {
    await _pumpShell(tester);
    expect(find.byType(ScannerScreen, skipOffstage: false), findsNothing);
    expect(find.byType(MobileScanner, skipOffstage: false), findsNothing);

    await tester.tap(find.byKey(const Key('home-shortcut-scanner')));
    await tester.pump();
    expect(_currentLabel(tester), 'Scanner');
    // Nasce ativo: a câmera é iniciada só pelo próprio MobileScanner.
    expect(tester.widget<ScannerScreen>(find.byType(ScannerScreen)).isActive, isTrue);

    await tester.tap(find.text('Início'));
    await tester.pump();
    final kept = tester.widget<ScannerScreen>(find.byType(ScannerScreen, skipOffstage: false));
    expect(kept.isActive, isFalse);
    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('atalhos e avisos trocam de aba', (tester) async {
    await _pumpShell(tester);

    await tester.tap(find.byKey(const Key('home-shortcut-search')));
    await tester.pumpAndSettle();
    expect(_currentLabel(tester), 'Buscar');
    expect(find.byKey(const Key('search-field')), findsOneWidget);

    await tester.tap(find.text('Início'));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('home-shortcut-partners')));
    await tester.pumpAndSettle();
    expect(_currentLabel(tester), 'Parceiros');

    await tester.tap(find.text('Início'));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('home-orders-all')));
    await tester.pumpAndSettle();
    expect(_currentLabel(tester), 'Pedidos');

    await tester.tap(find.text('Início'));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('home-view-profile')));
    await tester.pumpAndSettle();
    expect(_currentLabel(tester), 'Perfil');
  });

  testWidgets('voltar à aba Perfil recarrega o estado do e-mail', (tester) async {
    final backend = await _pumpShell(tester);
    final before = backend.count('GET /iam/me');

    await tester.tap(find.text('Perfil'));
    await tester.pumpAndSettle();

    expect(backend.count('GET /iam/me'), before + 1);
  });
}
