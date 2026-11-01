import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/features/legal/privacy_screen.dart';
import 'package:mobile_app/features/legal/terms_screen.dart';

String _allText(WidgetTester tester) => tester
    .widgetList<RichText>(find.byType(RichText))
    .map((w) => w.text.toPlainText())
    .join('\n');

void main() {
  testWidgets('Termos de Uso: título e seções do web (v1.0)', (tester) async {
    tester.view.physicalSize = const Size(800, 30000);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(const MaterialApp(home: TermsScreen()));
    final text = _allText(tester);

    expect(text, contains('Termos de Uso da Plataforma CeLiLac'));
    expect(text, contains('Última atualização: Outubro de 2026 • Versão 1.0 (Homologação com Usuários)'));
    for (final heading in [
      '1. Objeto e Propósito da Plataforma',
      '2. Tratamento de Dados de Saúde e Consentimento Explícito (LGPD Art. 11)',
      '3. Caráter Tecnológico Preventivo e Limitações',
      '4. Cadastro, Segurança de Conta e Credenciais',
      '5. Pedidos, Pagamentos e Relatos de Irregularidades',
      '6. Alterações nos Termos e Legislação Aplicável',
    ]) {
      expect(text, contains(heading));
    }
    expect(text, contains('Estes Termos são regidos pelas leis da República Federativa do Brasil'));
  });

  testWidgets('Política de Privacidade: título e seções do web (v1.0)', (tester) async {
    tester.view.physicalSize = const Size(800, 30000);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(const MaterialApp(home: PrivacyScreen()));
    final text = _allText(tester);

    expect(text, contains('Política de Privacidade CeLiLac'));
    expect(text, contains('Vigência: Homologação com Usuários • Versão 1.0 (Outubro/2026)'));
    for (final heading in [
      '1. Compromisso com a Sua Privacidade',
      '2. Tratamento de Dados Pessoais Sensíveis (LGPD Art. 11)',
      '3. Vedação Absoluta de Comercialização de Dados de Saúde',
      '4. Segurança da Informação, Criptografia e Mascaramento',
      '5. Seus Direitos como Titular de Dados (LGPD Art. 18)',
      '6. Canal de Atendimento do Encarregado de Dados (DPO)',
    ]) {
      expect(text, contains(heading));
    }
    expect(text, contains('privacidade@celilac.com.br (ou contato@celilac.com.br)'));
  });

  testWidgets('rodapé dos Termos leva à Política de Privacidade e vice-versa', (tester) async {
    tester.view.physicalSize = const Size(800, 30000);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(const MaterialApp(home: TermsScreen()));
    await tester.tap(find.byKey(const Key('legal-other-document-link')));
    await tester.pumpAndSettle();
    expect(find.byType(PrivacyScreen), findsOneWidget);

    await tester.tap(find.byKey(const Key('legal-other-document-link')));
    await tester.pumpAndSettle();
    expect(find.byType(TermsScreen), findsWidgets);
  });
}
