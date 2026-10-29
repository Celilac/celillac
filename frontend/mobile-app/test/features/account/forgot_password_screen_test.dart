import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/api/api_exception.dart';
import 'package:mobile_app/features/account/forgot_password_screen.dart';
import 'package:mobile_app/features/account/reset_password_screen.dart';

import 'account_test_harness.dart';

const _genericMessage = 'Se o endereço de e-mail estiver cadastrado, você receberá um código.';

Finder get _submit => find.widgetWithText(ElevatedButton, 'Enviar código');

void main() {
  testWidgets('botão desabilitado enquanto o e-mail está vazio', (tester) async {
    final http = RecordingHttp((_) async => jsonResponse({'message': _genericMessage}, 200));
    await pumpWithApi(tester, http.client(), const ForgotPasswordScreen());

    expect(tester.widget<ElevatedButton>(_submit).onPressed, isNull);

    await tester.enterText(find.byType(TextField), 'a@b.com');
    await tester.pump();
    expect(tester.widget<ElevatedButton>(_submit).onPressed, isNotNull);
  });

  testWidgets('envia o e-mail normalizado e mostra a mensagem genérica do backend', (tester) async {
    final http = RecordingHttp((_) async => jsonResponse({'message': _genericMessage}, 200));
    await pumpWithApi(tester, http.client(), const ForgotPasswordScreen());

    await tester.enterText(find.byType(TextField), '  Fulano@Exemplo.com ');
    await tester.pump();
    await tester.tap(_submit);
    await tester.pumpAndSettle();

    expect(http.requests.single.url.path, '/iam/password-reset/request');
    expect(http.requests.single.body, contains('"email":"fulano@exemplo.com"'));
    expect(find.text(_genericMessage), findsOneWidget);
    expect(find.widgetWithText(ElevatedButton, 'Já tenho o código'), findsOneWidget);
  });

  testWidgets('mostra a mesma mensagem genérica ao usar fallback quando o backend não envia texto', (tester) async {
    final http = RecordingHttp((_) async => jsonResponse(<String, dynamic>{}, 200));
    await pumpWithApi(tester, http.client(), const ForgotPasswordScreen());

    await tester.enterText(find.byType(TextField), 'a@b.com');
    await tester.pump();
    await tester.tap(_submit);
    await tester.pumpAndSettle();

    expect(find.byKey(const Key('forgot-success-message')), findsOneWidget);
  });

  testWidgets('"Já tenho o código" abre a tela de redefinição com o e-mail preenchido', (tester) async {
    final http = RecordingHttp((_) async => jsonResponse({'message': _genericMessage}, 200));
    await pumpWithApi(tester, http.client(), const ForgotPasswordScreen());

    await tester.enterText(find.byType(TextField), 'a@b.com');
    await tester.pump();
    await tester.tap(_submit);
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(ElevatedButton, 'Já tenho o código'));
    await tester.pumpAndSettle();

    expect(find.byType(ResetPasswordScreen), findsOneWidget);
    expect(find.text('a@b.com'), findsOneWidget);
  });

  testWidgets('429 mostra mensagem clara, sem texto técnico do backend', (tester) async {
    final http = RecordingHttp(
      (_) async => jsonResponse({'error': 'Muitas tentativas ... endereço IP ...'}, 429),
    );
    await pumpWithApi(tester, http.client(), const ForgotPasswordScreen());

    await tester.enterText(find.byType(TextField), 'a@b.com');
    await tester.pump();
    await tester.tap(_submit);
    await tester.pumpAndSettle();

    expect(find.textContaining('Muitas tentativas em pouco tempo'), findsOneWidget);
    expect(find.textContaining('endereço IP'), findsNothing);
  });

  testWidgets('503 mostra a mensagem de serviço indisponível', (tester) async {
    final http = RecordingHttp((_) async => jsonResponse({'error': 'x'}, 503));
    await pumpWithApi(tester, http.client(), const ForgotPasswordScreen());

    await tester.enterText(find.byType(TextField), 'a@b.com');
    await tester.pump();
    await tester.tap(_submit);
    await tester.pumpAndSettle();

    expect(find.text(ApiException.serviceUnavailableMessage), findsOneWidget);
  });

  testWidgets('estado de loading: botão desabilitado e indicador visível até a resposta', (tester) async {
    final pending = pendingResponse();
    final http = RecordingHttp((_) => pending.future);
    await pumpWithApi(tester, http.client(), const ForgotPasswordScreen());

    await tester.enterText(find.byType(TextField), 'a@b.com');
    await tester.pump();
    await tester.tap(_submit);
    await tester.pump();

    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    expect(tester.widget<ElevatedButton>(_submit).onPressed, isNull);

    pending.complete(jsonResponse({'message': _genericMessage}, 200));
    await tester.pumpAndSettle();
    expect(find.byType(CircularProgressIndicator), findsNothing);
  });
}
