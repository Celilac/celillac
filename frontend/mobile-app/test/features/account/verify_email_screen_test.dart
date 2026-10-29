import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/api/api_exception.dart';
import 'package:mobile_app/features/account/verify_email_screen.dart';

import 'account_test_harness.dart';

Finder get _verify => find.widgetWithText(ElevatedButton, 'Verificar e-mail');
Finder get _resend => find.widgetWithText(TextButton, 'Reenviar código');
Finder get _code => find.byKey(const Key('otp-code'));

bool _verifyEnabled(WidgetTester tester) => tester.widget<ElevatedButton>(_verify).onPressed != null;

/// Abre a tela via push e devolve o resultado do pop em [result].
Future<void> _open(WidgetTester tester, RecordingHttp http, List<bool?> result) async {
  await pumpWithApi(
    tester,
    http.client(token: 'tok'),
    Builder(
      builder: (context) => Scaffold(
        body: Center(
          child: ElevatedButton(
            onPressed: () async {
              final r = await Navigator.of(context).push<bool>(
                MaterialPageRoute(builder: (_) => const VerifyEmailScreen()),
              );
              result.add(r);
            },
            child: const Text('abrir'),
          ),
        ),
      ),
    ),
  );
  await tester.tap(find.text('abrir'));
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('botão desabilitado até o código ter 6 dígitos', (tester) async {
    final http = RecordingHttp((_) async => jsonResponse({'message': 'ok'}, 200));
    await _open(tester, http, []);

    expect(_verifyEnabled(tester), isFalse);
    await tester.enterText(_code, '12345');
    await tester.pump();
    expect(_verifyEnabled(tester), isFalse);
    await tester.enterText(_code, '123456');
    await tester.pump();
    expect(_verifyEnabled(tester), isTrue);
  });

  testWidgets('sucesso chama verify com Authorization e devolve true', (tester) async {
    final http = RecordingHttp((_) async => jsonResponse({'message': 'ok'}, 200));
    final result = <bool?>[];
    await _open(tester, http, result);

    await tester.enterText(_code, '123456');
    await tester.pump();
    await tester.tap(_verify);
    await tester.pumpAndSettle();

    final req = http.requests.single;
    expect(req.url.path, '/iam/email-verification/verify');
    expect(req.body, contains('"code":"123456"'));
    expect(req.headers['Authorization'], 'Bearer tok');
    expect(result, [true]);
    expect(find.byType(VerifyEmailScreen), findsNothing);
  });

  testWidgets('400 de código incorreto mostra mensagem amigável e permanece na tela', (tester) async {
    final http = RecordingHttp(
      (_) async => jsonResponse({'error': 'Código de verificação incorreto ou inexistente.'}, 400),
    );
    await _open(tester, http, []);

    await tester.enterText(_code, '123456');
    await tester.pump();
    await tester.tap(_verify);
    await tester.pumpAndSettle();

    expect(find.textContaining('Código incorreto'), findsOneWidget);
    expect(find.text('Código de verificação incorreto ou inexistente.'), findsNothing);
    expect(find.byType(VerifyEmailScreen), findsOneWidget);
  });

  testWidgets('400 de código expirado orienta a reenviar', (tester) async {
    final http = RecordingHttp(
      (_) async => jsonResponse({'error': 'Código de verificação expirado.'}, 400),
    );
    await _open(tester, http, []);

    await tester.enterText(_code, '123456');
    await tester.pump();
    await tester.tap(_verify);
    await tester.pumpAndSettle();

    expect(find.textContaining('expirou'), findsOneWidget);
  });

  testWidgets('reenviar: sucesso confirma o envio', (tester) async {
    final http = RecordingHttp((_) async => jsonResponse({'message': 'Novo código enviado'}, 200));
    await _open(tester, http, []);

    await tester.tap(_resend);
    await tester.pumpAndSettle();

    final req = http.requests.single;
    expect(req.url.path, '/iam/email-verification/resend');
    expect(req.headers['Authorization'], 'Bearer tok');
    expect(find.textContaining('enviamos um novo código'), findsOneWidget);
  });

  testWidgets('reenviar: 400 "E-mail já verificado." conclui o fluxo devolvendo true', (tester) async {
    final http = RecordingHttp((_) async => jsonResponse({'error': 'E-mail já verificado.'}, 400));
    final result = <bool?>[];
    await _open(tester, http, result);

    await tester.tap(_resend);
    await tester.pumpAndSettle();

    expect(result, [true]);
  });

  testWidgets('reenviar: 429 mostra mensagem de limite', (tester) async {
    final http = RecordingHttp((_) async => jsonResponse({'error': 'Muitas tentativas ... IP'}, 429));
    await _open(tester, http, []);

    await tester.tap(_resend);
    await tester.pumpAndSettle();

    expect(find.textContaining('Muitas tentativas em pouco tempo'), findsOneWidget);
    expect(find.textContaining('IP'), findsNothing);
  });

  testWidgets('serviço indisponível usa a mensagem padrão', (tester) async {
    final http = RecordingHttp((_) async => jsonResponse({'error': 'x'}, 502));
    await _open(tester, http, []);

    await tester.enterText(_code, '123456');
    await tester.pump();
    await tester.tap(_verify);
    await tester.pumpAndSettle();

    expect(find.text(ApiException.serviceUnavailableMessage), findsOneWidget);
  });

  testWidgets('loading: botões desabilitados e indicador visível até a resposta', (tester) async {
    final pending = pendingResponse();
    final http = RecordingHttp((_) => pending.future);
    await _open(tester, http, []);

    await tester.enterText(_code, '123456');
    await tester.pump();
    await tester.tap(_verify);
    await tester.pump();

    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    expect(_verifyEnabled(tester), isFalse);
    expect(tester.widget<TextButton>(_resend).onPressed, isNull);

    pending.complete(jsonResponse({'error': 'Código de verificação incorreto ou inexistente.'}, 400));
    await tester.pumpAndSettle();
    expect(find.byType(CircularProgressIndicator), findsNothing);
  });
}
