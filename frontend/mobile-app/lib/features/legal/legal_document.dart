import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Texto jurídico estático. O conteúdo é cópia fiel das páginas do web
/// (`termos/page.tsx`, `privacidade/page.tsx`); alterá-lo exige aprovação
/// humana. `**trecho**` marca negrito e `_trecho_` itálico.
class LegalSection {
  const LegalSection({required this.heading, required this.blocks});

  final String heading;
  final List<LegalBlock> blocks;
}

sealed class LegalBlock {
  const LegalBlock();
}

class LegalParagraph extends LegalBlock {
  const LegalParagraph(this.text, {this.accent = false});

  final String text;

  /// Destaque em cor primária (usado no e-mail do encarregado).
  final bool accent;
}

class LegalBullets extends LegalBlock {
  const LegalBullets(this.items);

  final List<String> items;
}

class LegalDocument {
  const LegalDocument({
    required this.bannerIcon,
    required this.bannerTitle,
    required this.bannerText,
    required this.title,
    required this.subtitle,
    required this.sections,
  });

  final IconData bannerIcon;
  final String bannerTitle;
  final String bannerText;
  final String title;
  final String subtitle;
  final List<LegalSection> sections;
}

/// Converte a marcação `**negrito**` / `_itálico_` em [TextSpan]s.
List<InlineSpan> parseLegalMarkup(String text, TextStyle base) {
  final spans = <InlineSpan>[];
  final pattern = RegExp(r'\*\*(.+?)\*\*|_(.+?)_');
  var cursor = 0;
  for (final match in pattern.allMatches(text)) {
    if (match.start > cursor) {
      spans.add(TextSpan(text: text.substring(cursor, match.start), style: base));
    }
    if (match.group(1) != null) {
      spans.add(TextSpan(text: match.group(1), style: base.copyWith(fontWeight: FontWeight.w700)));
    } else {
      spans.add(TextSpan(text: match.group(2), style: base.copyWith(fontStyle: FontStyle.italic)));
    }
    cursor = match.end;
  }
  if (cursor < text.length) {
    spans.add(TextSpan(text: text.substring(cursor), style: base));
  }
  return spans;
}

/// Renderiza um [LegalDocument]; [otherDocumentLabel]/[onOpenOtherDocument]
/// compõem o link de rodapé para o outro documento.
class LegalDocumentView extends StatelessWidget {
  const LegalDocumentView({
    super.key,
    required this.screenTitle,
    required this.document,
    required this.otherDocumentLabel,
    required this.onOpenOtherDocument,
  });

  final String screenTitle;
  final LegalDocument document;
  final String otherDocumentLabel;
  final VoidCallback onOpenOtherDocument;

  @override
  Widget build(BuildContext context) {
    const body = TextStyle(color: AppColors.textMutedLight, fontSize: 14, height: 1.6);

    Widget paragraph(LegalParagraph p) => Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: RichText(
            text: TextSpan(
              children: parseLegalMarkup(
                p.text,
                p.accent ? body.copyWith(color: AppColors.primary, fontWeight: FontWeight.w600) : body,
              ),
            ),
          ),
        );

    Widget bullets(LegalBullets b) => Padding(
          padding: const EdgeInsets.only(bottom: 10, left: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              for (final item in b.items)
                Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('•  ', style: body),
                      Expanded(
                        child: RichText(text: TextSpan(children: parseLegalMarkup(item, body))),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        );

    return Scaffold(
      appBar: AppBar(title: Text(screenTitle)),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 40),
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(document.bannerIcon, color: AppColors.primary),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          document.bannerTitle,
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          document.bannerText,
                          style: const TextStyle(color: AppColors.textMutedLight, fontSize: 12.5),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Text(
              document.title,
              style: const TextStyle(
                color: AppColors.primary,
                fontSize: 24,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              document.subtitle,
              style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
            ),
            const Divider(height: 32, color: AppColors.border),
            for (final section in document.sections) ...[
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Text(
                  section.heading,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              for (final block in section.blocks)
                switch (block) {
                  LegalParagraph p => paragraph(p),
                  LegalBullets b => bullets(b),
                },
              const SizedBox(height: 14),
            ],
            const Divider(height: 24, color: AppColors.border),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                key: const Key('legal-other-document-link'),
                onPressed: onOpenOtherDocument,
                child: Text(otherDocumentLabel),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
