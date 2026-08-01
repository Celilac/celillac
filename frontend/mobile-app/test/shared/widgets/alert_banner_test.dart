import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/api/models/enums.dart';
import 'package:mobile_app/core/theme/app_colors.dart';
import 'package:mobile_app/shared/widgets/alert_banner.dart';

Future<void> _pump(WidgetTester tester, RiskLevel status) async {
  await tester.pumpWidget(
    MaterialApp(
      home: Scaffold(
        body: AlertBanner(status: status, message: 'mensagem', reasoning: 'motivo'),
      ),
    ),
  );
}

Color _backgroundOf(WidgetTester tester) {
  final container = tester.widget<Container>(find.byType(Container).first);
  return (container.decoration as BoxDecoration).color!;
}

void main() {
  testWidgets('SAFE renders green background, check icon and label', (tester) async {
    await _pump(tester, RiskLevel.safe);
    expect(_backgroundOf(tester), AppColors.riskSafeBg);
    expect(find.text('✅'), findsOneWidget);
    expect(find.text('COMPATÍVEL'), findsOneWidget);
  });

  testWidgets('WARNING renders amber background and warning label', (tester) async {
    await _pump(tester, RiskLevel.warning);
    expect(_backgroundOf(tester), AppColors.riskWarningBg);
    expect(find.text('🟡'), findsOneWidget);
    expect(find.text('ATENÇÃO'), findsOneWidget);
  });

  testWidgets('DANGER renders orange background and danger label', (tester) async {
    await _pump(tester, RiskLevel.danger);
    expect(_backgroundOf(tester), AppColors.riskDangerBg);
    expect(find.text('⚠️'), findsOneWidget);
    expect(find.text('PERIGO'), findsOneWidget);
  });

  testWidgets('BLOCKED renders red background and blocked label', (tester) async {
    await _pump(tester, RiskLevel.blocked);
    expect(_backgroundOf(tester), AppColors.riskBlockedBg);
    expect(find.text('⛔'), findsOneWidget);
    expect(find.text('BLOQUEADO'), findsOneWidget);
  });

  testWidgets('renders message and reasoning text', (tester) async {
    await _pump(tester, RiskLevel.safe);
    expect(find.text('mensagem'), findsOneWidget);
    expect(find.text('motivo'), findsOneWidget);
  });
}
