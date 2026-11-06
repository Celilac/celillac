import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/api/api_exception.dart';
import 'package:mobile_app/features/profile/widgets/consumer_status_card.dart';

import '../account/account_test_harness.dart';

Map<String, dynamic> _me({String status = 'ATIVO', bool warning = false}) => {
  'consumer': {'id': 'c1', 'userId': 'u1', 'status': status},
  'foodProfile': null,
  'hasIncompleteProfileWarning': warning,
};

Future<void> _open(WidgetTester tester, RecordingHttp http) async {
  await pumpWithApi(
    tester,
    http.client(token: 'tok'),
    const Scaffold(body: SingleChildScrollView(child: ConsumerStatusCard())),
  );
}

void main() {
  testWidgets('mostra loading enquanto carrega', (tester) async {
    final pending = pendingResponse();
    await _open(tester, RecordingHttp((_) => pending.future));
    expect(find.byKey(const Key('consumer-status-loading')), findsOneWidget);
    pending.complete(jsonResponse(_me(), 200));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('consumer-status-loading')), findsNothing);
  });

  testWidgets('status ATIVO e botão de desativar', (tester) async {
    await _open(tester, RecordingHttp((_) async => jsonResponse(_me(), 200)));
    await tester.pumpAndSettle();
    expect(find.text('ATIVO'), findsOneWidget);
    expect(
      find.widgetWithText(OutlinedButton, 'Desativar perfil'),
      findsOneWidget,
    );
    expect(find.byKey(const Key('incomplete-profile-warning')), findsNothing);
  });

  testWidgets('status INATIVO oferece reativar', (tester) async {
    await _open(
      tester,
      RecordingHttp((_) async => jsonResponse(_me(status: 'INATIVO'), 200)),
    );
    await tester.pumpAndSettle();
    expect(find.text('INATIVO'), findsOneWidget);
    expect(
      find.widgetWithText(OutlinedButton, 'Reativar perfil'),
      findsOneWidget,
    );
  });

  testWidgets('exibe o aviso de perfil incompleto quando a API sinaliza', (
    tester,
  ) async {
    await _open(
      tester,
      RecordingHttp((_) async => jsonResponse(_me(warning: true), 200)),
    );
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('incomplete-profile-warning')), findsOneWidget);
  });

  testWidgets('erro mostra mensagem amigável e tenta novamente', (
    tester,
  ) async {
    var calls = 0;
    final http = RecordingHttp((_) async {
      calls++;
      if (calls == 1) {
        return jsonResponse({'error': 'boom: ECONNRESET stack'}, 502);
      }
      return jsonResponse(_me(), 200);
    });
    await _open(tester, http);
    await tester.pumpAndSettle();
    expect(find.text(ApiException.serviceUnavailableMessage), findsOneWidget);
    expect(find.textContaining('ECONNRESET'), findsNothing);

    await tester.tap(find.text('Tentar novamente'));
    await tester.pumpAndSettle();
    expect(find.text('ATIVO'), findsOneWidget);
  });

  testWidgets('desativar pede confirmação; cancelar não chama a API', (
    tester,
  ) async {
    final http = RecordingHttp((_) async => jsonResponse(_me(), 200));
    await _open(tester, http);
    await tester.pumpAndSettle();

    await tester.tap(find.text('Desativar perfil'));
    await tester.pumpAndSettle();
    expect(find.byType(AlertDialog), findsOneWidget);

    await tester.tap(find.text('Cancelar'));
    await tester.pumpAndSettle();

    expect(http.requests.where((r) => r.method == 'PATCH'), isEmpty);
    expect(find.text('ATIVO'), findsOneWidget);
  });

  testWidgets('confirmar desativa e reflete o status devolvido pela API', (
    tester,
  ) async {
    final http = RecordingHttp((req) async {
      if (req.method == 'PATCH') {
        return jsonResponse({
          'id': 'c1',
          'userId': 'u1',
          'status': 'INATIVO',
        }, 200);
      }
      return jsonResponse(_me(), 200);
    });
    await _open(tester, http);
    await tester.pumpAndSettle();

    await tester.tap(find.text('Desativar perfil'));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(TextButton, 'Desativar'));
    await tester.pumpAndSettle();

    final patch = http.requests.singleWhere((r) => r.method == 'PATCH');
    expect(patch.url.path, '/consumer/status');
    expect(jsonDecode(patch.body), {'action': 'DEACTIVATE'});
    expect(find.text('INATIVO'), findsOneWidget);
    expect(find.text('Reativar perfil'), findsOneWidget);
  });

  testWidgets('reativar não pede confirmação', (tester) async {
    final http = RecordingHttp((req) async {
      if (req.method == 'PATCH') {
        return jsonResponse({
          'id': 'c1',
          'userId': 'u1',
          'status': 'ATIVO',
        }, 200);
      }
      return jsonResponse(_me(status: 'INATIVO'), 200);
    });
    await _open(tester, http);
    await tester.pumpAndSettle();

    await tester.tap(find.text('Reativar perfil'));
    await tester.pumpAndSettle();

    expect(
      jsonDecode(http.requests.singleWhere((r) => r.method == 'PATCH').body),
      {'action': 'ACTIVATE'},
    );
    expect(find.text('ATIVO'), findsOneWidget);
  });

  testWidgets(
    'falha ao alterar status mantém o estado e mostra mensagem amigável',
    (tester) async {
      final http = RecordingHttp((req) async {
        if (req.method == 'PATCH') {
          return jsonResponse({'error': 'Ação inválida. SQL fail'}, 429);
        }
        return jsonResponse(_me(), 200);
      });
      await _open(tester, http);
      await tester.pumpAndSettle();

      await tester.tap(find.text('Desativar perfil'));
      await tester.pumpAndSettle();
      await tester.tap(find.widgetWithText(TextButton, 'Desativar'));
      await tester.pumpAndSettle();

      expect(find.text('ATIVO'), findsOneWidget);
      expect(find.textContaining('Muitas tentativas'), findsOneWidget);
      expect(find.textContaining('SQL'), findsNothing);
    },
  );
}
