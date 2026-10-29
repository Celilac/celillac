import 'package:flutter/material.dart';

import 'legal_document.dart';
import 'privacy_screen.dart';

// Texto copiado de frontend/web-app/src/app/termos/page.tsx (Versão 1.0).
// NÃO alterar o conteúdo sem aprovação humana (AGENTS.md — Ações Restritas).
const termsDocument = LegalDocument(
  bannerIcon: Icons.gavel,
  bannerTitle: 'Minuta dos Termos de Uso (Versão 1.0)',
  bannerText:
      'Este documento constitui o rascunho formal para validação e auditoria jurídica prévia ao lançamento público da plataforma CeLiLac.',
  title: 'Termos de Uso da Plataforma CeLiLac',
  subtitle: 'Última atualização: Outubro de 2026 • Versão 1.0 (Homologação com Usuários)',
  sections: [
    LegalSection(
      heading: '1. Objeto e Propósito da Plataforma',
      blocks: [
        LegalParagraph(
          'A **CeLiLac** é uma plataforma tecnológica de segurança alimentar desenvolvida especificamente para apoiar pessoas com Doença Celíaca, intolerâncias alimentares severas (como lactose) e alergias alimentares (incluindo trigo, centeio, cevada, aveia, soja, oleaginosas, leite e derivados).',
        ),
        LegalParagraph(
          'Nossa missão é disponibilizar ferramentas de triagem rápida, leitura de ingredientes, guia comercial geolocalizado de estabelecimentos parceiros e pedidos seguros com proteção alimentar por software.',
        ),
      ],
    ),
    LegalSection(
      heading: '2. Tratamento de Dados de Saúde e Consentimento Explícito (LGPD Art. 11)',
      blocks: [
        LegalParagraph(
          'Ao utilizar a plataforma, o Usuário declara estar ciente de que as informações relativas a suas restrições alimentares, alergias e diagnósticos (como condição celíaca) são classificadas legalmente como **dados pessoais sensíveis de saúde** pela Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD, Art. 11).',
        ),
        LegalParagraph(
          'O consentimento para o tratamento desses dados é concedido de forma **específica, informada e destacada** no ato do cadastro, tendo como finalidade exclusiva:',
        ),
        LegalBullets([
          'Execução do Motor Biológico de Compatibilidade Alimentar (Allergen Engine);',
          'Emissão de alertas preventivos contra contaminação cruzada e traços alergênicos;',
          'Bloqueio de pedidos e adição de produtos incompatíveis com a segurança do consumidor;',
          'Notificação a estabelecimentos parceiros sobre a severidade celíaca durante a preparação de alimentos.',
        ]),
      ],
    ),
    LegalSection(
      heading: '3. Caráter Tecnológico Preventivo e Limitações',
      blocks: [
        LegalParagraph(
          'O CeLiLac aplica regras implacáveis de conferência (incluindo a regra "FATAL" contra qualquer produto que apresente indicação de traços de glúten). No entanto, a plataforma opera como uma **ferramenta complementar de assistência e prevenção**:',
        ),
        LegalBullets([
          'A conferência visual final do rótulo físico ou embalagem do fabricante no momento do consumo é uma boa prática permanente recomendada a todo celíaco ou alérgico;',
          'Os estabelecimentos parceiros cadastrados são civilmente responsáveis pelas informações de composição, laudos laboratoriais, boas práticas de fabricação (BPF) e ausência de contaminação cruzada nas suas instalações;',
          'O CeLiLac não substitui aconselhamento, diagnóstico médico ou acompanhamento nutricional profissional individualizado.',
        ]),
      ],
    ),
    LegalSection(
      heading: '4. Cadastro, Segurança de Conta e Credenciais',
      blocks: [
        LegalParagraph(
          'O acesso à plataforma exige a criação de conta com e-mail válido e verificação obrigatória por código numérico de uso único (OTP). O usuário é o único responsável pela guarda e confidencialidade de suas credenciais de acesso.',
        ),
        LegalParagraph(
          'Tentativas de adulteração de perfil de alérgenos de terceiros, pedidos fraudulentos, cadastros fictícios ou ataques contra a disponibilidade do serviço ensejarão o bloqueio imediato da conta e eventual responsabilização legal.',
        ),
      ],
    ),
    LegalSection(
      heading: '5. Pedidos, Pagamentos e Relatos de Irregularidades',
      blocks: [
        LegalParagraph('A realização de pedidos através do CeLiLac segue rígido controle de prazos e conformidade:'),
        LegalBullets([
          '**Cancelamento Automático por Inação:** Pedidos não respondidos pelo parceiro em tempo hábil ou com timeout de pagamento são cancelados automaticamente pelo sistema para resguardar o consumidor;',
          '**Pagamento na Entrega:** Opção sujeita à elegibilidade da conta e conduta idônea do consumidor. Reclamações fundamentadas de não-pagamento ou recusa injustificada resultarão na revogação do método presencial;',
          '**Denúncias de Contaminação:** Todo usuário tem o direito e o dever comunitário de reportar suspeitas de contaminação cruzada ou rotulagem incorreta através da ferramenta nativa de denúncia do app.',
        ]),
      ],
    ),
    LegalSection(
      heading: '6. Alterações nos Termos e Legislação Aplicável',
      blocks: [
        LegalParagraph(
          'Estes Termos podem ser atualizados periodicamente para refletir evoluções regulatórias ou novos recursos de proteção. Qualquer alteração estrutural será notificada com solicitação de novo aceite do usuário.',
        ),
        LegalParagraph(
          'Estes Termos são regidos pelas leis da República Federativa do Brasil, em especial o Código de Defesa do Consumidor (Lei nº 8.078/1990) e a LGPD (Lei nº 13.709/2018).',
        ),
      ],
    ),
  ],
);

class TermsScreen extends StatelessWidget {
  const TermsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return LegalDocumentView(
      screenTitle: 'Termos de Uso',
      document: termsDocument,
      otherDocumentLabel: 'Ver Política de Privacidade →',
      onOpenOtherDocument: () => Navigator.of(context).push(
        MaterialPageRoute<void>(builder: (_) => const PrivacyScreen()),
      ),
    );
  }
}
