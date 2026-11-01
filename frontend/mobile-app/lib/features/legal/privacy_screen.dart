import 'package:flutter/material.dart';

import 'legal_document.dart';
import 'terms_screen.dart';

// Texto copiado de frontend/web-app/src/app/privacidade/page.tsx (Versão 1.0).
// NÃO alterar o conteúdo sem aprovação humana (AGENTS.md — Ações Restritas).
const privacyDocument = LegalDocument(
  bannerIcon: Icons.shield_outlined,
  bannerTitle: 'Política de Privacidade e Proteção de Dados Sensíveis (Versão 1.0)',
  bannerText:
      'Elaborada em estrita conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 - LGPD), com foco especial em Dados Pessoais Sensíveis de Saúde (Art. 11).',
  title: 'Política de Privacidade CeLiLac',
  subtitle: 'Vigência: Homologação com Usuários • Versão 1.0 (Outubro/2026)',
  sections: [
    LegalSection(
      heading: '1. Compromisso com a Sua Privacidade',
      blocks: [
        LegalParagraph(
          'A **CeLiLac** reconhece a gravidade e o caráter confidencial das condições alimentares dos seus usuários. Entendemos que a informação sobre uma restrição alimentar ou alergia anafilática não é um dado comum: é uma informação vital de saúde humana.',
        ),
        LegalParagraph(
          'Por essa razão, adotamos o princípio da **Privacidade por Padrão e desde a Concepção (Privacy by Design and by Default)** em toda a nossa arquitetura tecnológica.',
        ),
      ],
    ),
    LegalSection(
      heading: '2. Tratamento de Dados Pessoais Sensíveis (LGPD Art. 11)',
      blocks: [
        LegalParagraph(
          'Nos termos do Art. 11 da LGPD, os dados referentes à saúde ou à vida sexual, dado genético ou biométrico, são classificados como dados pessoais sensíveis. Na CeLiLac:',
        ),
        LegalBullets([
          '**Quais dados de saúde coletamos:** Registro de condição celíaca (Doença Celíaca, dermatite herpetiforme ou sensibilidade ao glúten não celíaca), histórico de alergias alimentares (leite, soja, castanhas, etc.), grau de severidade clínica (moderado, grave, anafilático) e histórico de reações adversas;',
          '**Base legal utilizada:** Consentimento do titular fornecido de forma específica e destacada (LGPD, art. 11, I) e proteção da vida ou da incolumidade física do titular ou de terceiro (LGPD, art. 11, II, "e");',
          '**Finalidade restrita:** Alimentar o motor biológico de cruzamento de ingredientes em tempo real, alertar o consumidor antes da compra de qualquer produto inseguro e bloquear o envio de refeições com glúten para celíacos.',
        ]),
      ],
    ),
    LegalSection(
      heading: '3. Vedação Absoluta de Comercialização de Dados de Saúde',
      blocks: [
        LegalParagraph(
          '**A CeLiLac NUNCA comercializa, aluga, cede ou monetiza dados de saúde ou perfis alimentares com anunciantes, seguradoras, indústrias farmacêuticas ou corretores de dados (data brokers).**',
        ),
        LegalParagraph('O compartilhamento de dados ocorre única e exclusivamente no contexto operacional do pedido:'),
        LegalBullets([
          '**Com o Estabelecimento Parceiro:** Apenas os alertas de alergia estritamente necessários para a preparação segura do prato (ex.: _"Consumidor Celíaco - Alerta de Contaminação Cruzada"_), sem exposição de dados desnecessários;',
          '**Com Gateways de Pagamento (Asaas):** Apenas dados cadastrais e financeiros indispensáveis para o processamento da transação (dados de cartão e Pix são criptografados de ponta a ponta e protegidos pelo padrão PCI-DSS).',
        ]),
      ],
    ),
    LegalSection(
      heading: '4. Segurança da Informação, Criptografia e Mascaramento',
      blocks: [
        LegalParagraph('Empregamos salvaguardas técnicas avançadas para proteger seus dados contra acessos não autorizados:'),
        LegalBullets([
          'Senhas criptografadas com hash irreversível de alto custo computacional (Bcrypt salt rounds 10);',
          'Toda comunicação trafega sob criptografia TLS 1.3 / HTTPS com cabeçalhos rigorosos de segurança (HSTS, CSP, X-Frame-Options);',
          'Camada interna de mascaramento (DataMasker) que expurga e-mails, telefones e credenciais de qualquer log de servidor;',
          'Proteção contra bots maliciosos, web scrapers e ataques volumétricos L7.',
        ]),
      ],
    ),
    LegalSection(
      heading: '5. Seus Direitos como Titular de Dados (LGPD Art. 18)',
      blocks: [
        LegalParagraph(
          'Você possui total controle sobre suas informações. A qualquer momento, é possível exercer seus direitos legais diretamente pelo app ou por solicitação expressa:',
        ),
        LegalBullets([
          '**Confirmação e Acesso:** Verificar quais dados de saúde e preferências estão cadastrados;',
          '**Correção:** Atualizar suas alergias e contatos a qualquer momento nas configurações do seu perfil;',
          '**Revogação do Consentimento e Eliminação:** Revogar o consentimento para o tratamento de dados de saúde e solicitar a exclusão definitiva da sua conta;',
          '**Portabilidade:** Solicitar cópia estruturada dos seus dados cadastrais.',
        ]),
      ],
    ),
    LegalSection(
      heading: '6. Canal de Atendimento do Encarregado de Dados (DPO)',
      blocks: [
        LegalParagraph(
          'Para dúvidas sobre esta Política, solicitações de privacidade ou exercício de direitos de titular, entre em contato com nosso Encarregado pelo e-mail:',
        ),
        LegalParagraph('📧 privacidade@celilac.com.br (ou contato@celilac.com.br)', accent: true),
      ],
    ),
  ],
);

class PrivacyScreen extends StatelessWidget {
  const PrivacyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return LegalDocumentView(
      screenTitle: 'Política de Privacidade',
      document: privacyDocument,
      otherDocumentLabel: 'Ver Termos de Uso →',
      onOpenOtherDocument: () => Navigator.of(context).push(
        MaterialPageRoute<void>(builder: (_) => const TermsScreen()),
      ),
    );
  }
}
