import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:mobile_app/api/api_client.dart';
import 'package:mobile_app/api/api_exception.dart';
import 'package:mobile_app/core/auth/session_controller.dart';
import 'package:mobile_app/features/profile/profile_screen.dart';
import 'package:provider/provider.dart';

import '../account/account_test_harness.dart';

class _FakeSession extends SessionController {
  @override
  SessionUser? get user => const SessionUser(id: 'u1', role: 'CELIACO');
}

const _profile = {
  'id': 'p1',
  'userId': 'u1',
  'isActive': true,
  'requiresHistoryRevalidation': false,
  'acceptsCrossContamination': false,
  'restrictions': [
    {'id': 'r1', 'allergen': 'GLUTEN', 'severity': 'FATAL'},
    {'id': 'r2', 'allergen': 'OTHER', 'severity': 'LOW'},
  ],
};

http.Response _route(
  http.Request req, {
  http.Response? foodProfile,
  Object iam = const {
    'id': 'u1',
    'email': 'a@b.com',
    'role': 'CELIACO',
    'isEmailVerified': true,
  },
}) {
  switch (req.url.path) {
    case '/iam/me':
      return jsonResponse(iam, 200);
    case '/consumer/me':
      return jsonResponse({
        'consumer': {'id': 'c1', 'userId': 'u1', 'status': 'ATIVO'},
        'foodProfile': null,
        'hasIncompleteProfileWarning': false,
      }, 200);
    case '/food-profile/u1':
      return foodProfile ?? jsonResponse(_profile, 200);
  }
  return jsonResponse({'error': 'not found'}, 404);
}

Future<void> _open(WidgetTester tester, RecordingHttp http) async {
  tester.view.physicalSize = const Size(800, 3000);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
  await tester.pumpWidget(
    MultiProvider(
      providers: [
        Provider<ApiClient>.value(value: http.client(token: 'tok')),
        ChangeNotifierProvider<SessionController>(
          create: (_) => _FakeSession(),
        ),
      ],
      child: const MaterialApp(home: ProfileScreen()),
    ),
  );
  await tester.pumpAndSettle();
}

void main() {
  group('card Conta', () {
    testWidgets('e-mail verificado', (tester) async {
      await _open(tester, RecordingHttp((r) async => _route(r)));
      expect(find.byKey(const Key('email-verified-status')), findsOneWidget);
      expect(find.text('E-mail verificado'), findsOneWidget);
      expect(find.text('Verificar e-mail'), findsNothing);
    });

    testWidgets('e-mail não verificado oferece verificação', (tester) async {
      await _open(
        tester,
        RecordingHttp(
          (r) async => _route(
            r,
            iam: {
              'id': 'u1',
              'email': 'a@b.com',
              'role': 'CELIACO',
              'isEmailVerified': false,
            },
          ),
        ),
      );
      expect(find.byKey(const Key('email-unverified-status')), findsOneWidget);
      expect(
        find.widgetWithText(OutlinedButton, 'Verificar e-mail'),
        findsOneWidget,
      );
    });

    testWidgets('falha ao consultar /iam/me oculta o estado (informativo)', (
      tester,
    ) async {
      await _open(
        tester,
        RecordingHttp(
          (r) async => r.url.path == '/iam/me'
              ? jsonResponse({'error': 'x'}, 500)
              : _route(r),
        ),
      );
      expect(find.byKey(const Key('email-verified-status')), findsNothing);
      expect(find.byKey(const Key('email-unverified-status')), findsNothing);
      expect(find.text('Termos de Uso'), findsOneWidget);
    });
  });

  group('restrições', () {
    testWidgets('lista com pictogramas (e fallback para alérgeno sem ícone)', (
      tester,
    ) async {
      await _open(tester, RecordingHttp((r) async => _route(r)));
      expect(find.text('Glúten'), findsOneWidget);
      expect(find.byType(SvgPicture), findsOneWidget);
      expect(
        find.byKey(const Key('allergen-pictogram-fallback')),
        findsOneWidget,
      );
    });

    testWidgets('perfil inexistente (400) mostra estado vazio', (tester) async {
      await _open(
        tester,
        RecordingHttp(
          (r) async => _route(
            r,
            foodProfile: jsonResponse({
              'error': 'Perfil alimentar não encontrado',
            }, 400),
          ),
        ),
      );
      expect(find.text('Nenhuma restrição cadastrada.'), findsOneWidget);
    });

    testWidgets('falha de rede NÃO é exibida como "sem restrições"', (
      tester,
    ) async {
      await _open(
        tester,
        RecordingHttp(
          (r) async =>
              _route(r, foodProfile: jsonResponse({'error': 'x'}, 502)),
        ),
      );
      expect(find.text('Nenhuma restrição cadastrada.'), findsNothing);
      expect(find.text(ApiException.serviceUnavailableMessage), findsOneWidget);
      expect(find.text('Tentar novamente'), findsWidgets);
    });
  });

  testWidgets('inclui o card de perfil de consumidor', (tester) async {
    await _open(tester, RecordingHttp((r) async => _route(r)));
    expect(find.text('PERFIL DE CONSUMIDOR'), findsOneWidget);
    expect(find.text('ATIVO'), findsOneWidget);
  });
}
