import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/api/api_client.dart';
import 'package:mobile_app/core/auth/session_controller.dart';
import 'package:mobile_app/features/auth/register_screen.dart';
import 'package:mobile_app/features/legal/privacy_screen.dart';
import 'package:mobile_app/features/legal/terms_screen.dart';
import 'package:provider/provider.dart';

Finder get _submit => find.widgetWithText(ElevatedButton, 'Cadastrar e Entrar');
Finder get _consent => find.byKey(const Key('register-consent'));

Future<void> _pump(WidgetTester tester) async {
  tester.view.physicalSize = const Size(800, 2400);
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
      child: MaterialApp(home: RegisterScreen(onNavigateToLogin: () {})),
    ),
  );
}

Future<void> _fillValid(WidgetTester tester) async {
  final fields = find.byType(TextField);
  await tester.enterText(fields.at(0), 'a@b.com');
  await tester.enterText(fields.at(1), 'Abcdef1!');
  await tester.enterText(fields.at(2), 'Abcdef1!');
  await tester.pump();
}

void main() {
  testWidgets('com dados válidos, o cadastro continua bloqueado sem o consentimento', (tester) async {
    await _pump(tester);
    await _fillValid(tester);

    expect(tester.widget<CheckboxListTile>(_consent).value, isFalse);
    expect(tester.widget<ElevatedButton>(_submit).onPressed, isNull);
  });

  testWidgets('marcar o consentimento habilita o cadastro; desmarcar bloqueia de novo', (tester) async {
    await _pump(tester);
    await _fillValid(tester);

    await tester.tap(_consent);
    await tester.pump();
    expect(tester.widget<ElevatedButton>(_submit).onPressed, isNotNull);

    await tester.tap(_consent);
    await tester.pump();
    expect(tester.widget<ElevatedButton>(_submit).onPressed, isNull);
  });

  testWidgets('consentimento marcado não habilita o cadastro com dados inválidos', (tester) async {
    await _pump(tester);
    await tester.tap(_consent);
    await tester.pump();
    expect(tester.widget<ElevatedButton>(_submit).onPressed, isNull);
  });

  testWidgets('exibe o texto de consentimento LGPD Art. 11 igual ao do web', (tester) async {
    await _pump(tester);
    final text = tester
        .widgetList<RichText>(find.descendant(of: _consent, matching: find.byType(RichText)))
        .map((w) => w.text.toPlainText())
        .join();
    expect(
      text,
      'Li e concordo com os Termos de Uso e a Política de Privacidade, e dou meu '
      'consentimento expresso (LGPD Art. 11) para o tratamento dos meus dados de saúde e '
      'restrições alimentares com a finalidade exclusiva de segurança alimentar.',
    );
  });

  testWidgets('links abrem Termos de Uso e Política de Privacidade', (tester) async {
    await _pump(tester);

    await tester.tapOnText(find.textRange.ofSubstring('Termos de Uso'));
    await tester.pumpAndSettle();
    expect(find.byType(TermsScreen), findsOneWidget);
    Navigator.of(tester.element(find.byType(TermsScreen))).pop();
    await tester.pumpAndSettle();

    await tester.tapOnText(find.textRange.ofSubstring('Política de Privacidade'));
    await tester.pumpAndSettle();
    expect(find.byType(PrivacyScreen), findsOneWidget);
  });
}
