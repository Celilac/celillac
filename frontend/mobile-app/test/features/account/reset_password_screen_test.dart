import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/api/api_exception.dart';
import 'package:mobile_app/features/account/reset_password_screen.dart';

import 'account_test_harness.dart';

Finder get _submit => find.widgetWithText(ElevatedButton, 'Redefinir senha');
Finder get _email => find.byKey(const Key('reset-email'));
Finder get _code => find.byKey(const Key('reset-code'));
Finder get _password => find.byKey(const Key('reset-password'));
Finder get _confirm => find.byKey(const Key('reset-confirm'));

Future<void> _fillValid(WidgetTester tester, {String email = 'a@b.com'}) async {
  await tester.enterText(_email, email);
  await tester.enterText(_code, '123456');
  await tester.enterText(_password, 'Abcdef1!');
  await tester.enterText(_confirm, 'Abcdef1!');
  await tester.pump();
}

bool _enabled(WidgetTester tester) => tester.widget<ElevatedButton>(_submit).onPressed != null;

void main() {
  testWidgets('e-mail inicial é preenchido e o botão começa desabilitado', (tester) async {
    final http = RecordingHttp((_) async => jsonResponse({'message': 'ok'}, 200));
    await pumpWithApi(tester, http.client(), const ResetPasswordScreen(initialEmail: 'a@b.com'));

    expect(find.text('a@b.com'), findsOneWidget);
    expect(_enabled(tester), isFalse);
  });

  testWidgets('código aceita apenas dígitos e no máximo 6', (tester) async {
    final http = RecordingHttp((_) async => jsonResponse({'message': 'ok'}, 200));
    await pumpWithApi(tester, http.client(), const ResetPasswordScreen());

    await tester.enterText(_code, '12ab34567890');
    await tester.pump();
    expect(find.text('123456'), findsOneWidget);
  });

  testWidgets('senha fraca mostra o aviso e mantém o botão desabilitado', (tester) async {
    final http = RecordingHttp((_) async => jsonResponse({'message': 'ok'}, 200));
    await pumpWithApi(tester, http.client(), const ResetPasswordScreen());

    await _fillValid(tester);
    expect(_enabled(tester), isTrue);

    await tester.enterText(_password, 'fraca');
    await tester.enterText(_confirm, 'fraca');
    await tester.pump();

    expect(find.byKey(const Key('password-strength-error')), findsOneWidget);
    expect(_enabled(tester), isFalse);
  });

  testWidgets('confirmação diferente desabilita o botão e avisa', (tester) async {
    final http = RecordingHttp((_) async => jsonResponse({'message': 'ok'}, 200));
    await pumpWithApi(tester, http.client(), const ResetPasswordScreen());

    await _fillValid(tester);
    await tester.enterText(_confirm, 'Outra1!aa');
    await tester.pump();

    expect(find.text('As senhas devem ser iguais.'), findsOneWidget);
    expect(_enabled(tester), isFalse);
  });

  testWidgets('código com menos de 6 dígitos mantém o botão desabilitado', (tester) async {
    final http = RecordingHttp((_) async => jsonResponse({'message': 'ok'}, 200));
    await pumpWithApi(tester, http.client(), const ResetPasswordScreen());

    await _fillValid(tester);
    await tester.enterText(_code, '12345');
    await tester.pump();
    expect(_enabled(tester), isFalse);
  });

  testWidgets('sucesso envia o corpo correto e volta à primeira rota com confirmação', (tester) async {
    final http = RecordingHttp((_) async => jsonResponse({'message': 'Senha redefinida'}, 200));
    final api = http.client();
    await pumpWithApi(
      tester,
      api,
      Builder(
        builder: (context) => Scaffold(
          body: Center(
            child: ElevatedButton(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute<void>(builder: (_) => const ResetPasswordScreen(initialEmail: 'a@b.com')),
              ),
              child: const Text('abrir'),
            ),
          ),
        ),
      ),
    );
    await tester.tap(find.text('abrir'));
    await tester.pumpAndSettle();

    await tester.enterText(_code, '123456');
    await tester.enterText(_password, 'Abcdef1!');
    await tester.enterText(_confirm, 'Abcdef1!');
    await tester.pump();
    await tester.tap(_submit);
    await tester.pumpAndSettle();

    final req = http.requests.single;
    expect(req.url.path, '/iam/password-reset/confirm');
    expect(req.body, contains('"email":"a@b.com"'));
    expect(req.body, contains('"code":"123456"'));
    expect(req.body, contains('"newPassword":"Abcdef1!"'));
    expect(find.byType(ResetPasswordScreen), findsNothing);
    expect(find.textContaining('Senha redefinida com sucesso'), findsOneWidget);
  });

  testWidgets('400 de código inválido mostra mensagem amigável e não vaza o texto do backend', (tester) async {
    final http = RecordingHttp(
      (_) async => jsonResponse({'error': 'Código de recuperação inválido ou já utilizado.'}, 400),
    );
    await pumpWithApi(tester, http.client(), const ResetPasswordScreen());

    await _fillValid(tester);
    await tester.tap(_submit);
    await tester.pumpAndSettle();

    expect(find.textContaining('Código inválido ou já utilizado'), findsOneWidget);
    expect(find.text('Código de recuperação inválido ou já utilizado.'), findsNothing);
  });

  testWidgets('400 de código expirado mostra a mensagem de expiração', (tester) async {
    final http = RecordingHttp(
      (_) async => jsonResponse({'error': 'Este código de recuperação expirou. Por favor, solicite um novo código.'}, 400),
    );
    await pumpWithApi(tester, http.client(), const ResetPasswordScreen());

    await _fillValid(tester);
    await tester.tap(_submit);
    await tester.pumpAndSettle();

    expect(find.textContaining('Este código expirou'), findsOneWidget);
  });

  testWidgets('429 e 503 têm mensagens próprias', (tester) async {
    var status = 429;
    final http = RecordingHttp((_) async => jsonResponse({'error': 'x'}, status));
    await pumpWithApi(tester, http.client(), const ResetPasswordScreen());

    await _fillValid(tester);
    await tester.tap(_submit);
    await tester.pumpAndSettle();
    expect(find.textContaining('Muitas tentativas em pouco tempo'), findsOneWidget);

    status = 503;
    await tester.tap(_submit);
    await tester.pumpAndSettle();
    expect(find.text(ApiException.serviceUnavailableMessage), findsOneWidget);
  });

  testWidgets('loading: botão desabilitado e indicador visível até a resposta', (tester) async {
    final pending = pendingResponse();
    final http = RecordingHttp((_) => pending.future);
    await pumpWithApi(tester, http.client(), const ResetPasswordScreen());

    await _fillValid(tester);
    await tester.tap(_submit);
    await tester.pump();

    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    expect(_enabled(tester), isFalse);

    pending.complete(jsonResponse({'error': 'x'}, 400));
    await tester.pumpAndSettle();
    expect(find.byType(CircularProgressIndicator), findsNothing);
  });
}
