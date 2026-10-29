import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/api/api_client.dart';
import 'package:mobile_app/core/auth/session_controller.dart';
import 'package:mobile_app/features/account/forgot_password_screen.dart';
import 'package:mobile_app/features/auth/login_screen.dart';
import 'package:provider/provider.dart';

void main() {
  testWidgets('login mostra "Esqueci minha senha" e abre a tela de recuperação', (tester) async {
    tester.view.physicalSize = const Size(800, 2000);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    final api = ApiClient(baseUrl: 'http://api.test');
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          Provider<ApiClient>.value(value: api),
          ChangeNotifierProvider<SessionController>(create: (_) => SessionController(apiClient: api)),
        ],
        child: MaterialApp(home: LoginScreen(onNavigateToRegister: () {})),
      ),
    );

    await tester.tap(find.byKey(const Key('forgot-password-link')));
    await tester.pumpAndSettle();

    expect(find.byType(ForgotPasswordScreen), findsOneWidget);
  });
}
