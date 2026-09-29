// backend/src/infrastructure/services/FileSecurityValidator.ts
import { Result } from '../../domain/Result';

export interface ValidatedImageInfo {
  format: 'png' | 'jpeg' | 'webp' | 'gif' | 'svg' | 'url';
}

/**
 * FileSecurityValidator (A08: Upload Seguro)
 *
 * Responsável por:
 * 1. Validar a integridade binária (Magic Bytes) de arquivos de imagem em base64.
 * 2. Impedir que executáveis, scripts ou arquivos maliciosos sejam mascarados como imagens.
 * 3. Sanitizar e rejeitar SVGs contendo vetores de injeção XSS/XXE (<script>, onload, javascript:).
 */
export class FileSecurityValidator {
  private static readonly DANGEROUS_SVG_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /\bon\w+\s*=/gi,                       // ex: onload=, onerror=, onclick=
    /javascript\s*:/gi,                   // ex: href="javascript:..."
    /<!ENTITY/gi,                         // XXE entity injection
    /<!DOCTYPE/gi,                        // XXE doctype injection
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
  ];

  /**
   * Valida uma URL HTTP(S) ou Data URL Base64 de imagem.
   */
  static validateImagePayload(urlOrBase64: string): Result<ValidatedImageInfo> {
    if (!urlOrBase64 || typeof urlOrBase64 !== 'string') {
      return Result.fail<ValidatedImageInfo>('O payload da imagem é obrigatório.');
    }

    const trimmed = urlOrBase64.trim();

    // 1. Link HTTP/HTTPS
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return Result.ok<ValidatedImageInfo>({ format: 'url' });
    }

    // 2. Data URL Base64
    if (!trimmed.startsWith('data:image/')) {
      return Result.fail<ValidatedImageInfo>(
        'Formato inválido: a imagem deve ser uma URL HTTP/HTTPS ou uma Data URL base64 iniciada em data:image/.',
      );
    }

    const match = trimmed.match(/^data:image\/([a-zA-Z0-9\+\-\.]+);base64,(.+)$/);
    if (!match) {
      return Result.fail<ValidatedImageInfo>(
        'Formato Data URL malformado ou codificação base64 inválida.',
      );
    }

    const declaredType = match[1].toLowerCase();
    const base64Data = match[2];

    let buffer: Buffer;
    try {
      buffer = Buffer.from(base64Data, 'base64');
    } catch {
      return Result.fail<ValidatedImageInfo>('Falha ao decodificar dados base64 da imagem.');
    }

    if (buffer.length === 0) {
      return Result.fail<ValidatedImageInfo>('O arquivo de imagem enviado está vazio.');
    }

    // 3. Validação de Magic Bytes por formato
    if (declaredType === 'png') {
      // Magic Bytes PNG: 89 50 4E 47 0D 0A 1A 0A
      const isPng =
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a;

      if (!isPng) {
        return Result.fail<ValidatedImageInfo>(
          'Arquivo inválido: os cabeçalhos binários (magic bytes) não correspondem a uma imagem PNG autêntica.',
        );
      }
      return Result.ok<ValidatedImageInfo>({ format: 'png' });
    }

    if (declaredType === 'jpeg' || declaredType === 'jpg') {
      // Magic Bytes JPEG: FF D8 FF
      const isJpeg =
        buffer.length >= 3 &&
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff;

      if (!isJpeg) {
        return Result.fail<ValidatedImageInfo>(
          'Arquivo inválido: os cabeçalhos binários (magic bytes) não correspondem a uma imagem JPEG autêntica.',
        );
      }
      return Result.ok<ValidatedImageInfo>({ format: 'jpeg' });
    }

    if (declaredType === 'webp') {
      // Magic Bytes WebP: RIFF .... WEBP
      const isWebp =
        buffer.length >= 12 &&
        buffer.toString('ascii', 0, 4) === 'RIFF' &&
        buffer.toString('ascii', 8, 12) === 'WEBP';

      if (!isWebp) {
        return Result.fail<ValidatedImageInfo>(
          'Arquivo inválido: os cabeçalhos binários (magic bytes) não correspondem a uma imagem WebP autêntica.',
        );
      }
      return Result.ok<ValidatedImageInfo>({ format: 'webp' });
    }

    if (declaredType === 'gif') {
      // Magic Bytes GIF: GIF8
      const isGif = buffer.length >= 4 && buffer.toString('ascii', 0, 4) === 'GIF8';
      if (!isGif) {
        return Result.fail<ValidatedImageInfo>(
          'Arquivo inválido: os cabeçalhos binários (magic bytes) não correspondem a uma imagem GIF autêntica.',
        );
      }
      return Result.ok<ValidatedImageInfo>({ format: 'gif' });
    }

    if (declaredType.includes('svg')) {
      const svgContent = buffer.toString('utf-8');

      // Verifica tags e atributos perigosos no SVG (XSS/XXE)
      for (const pattern of this.DANGEROUS_SVG_PATTERNS) {
        if (pattern.test(svgContent)) {
          return Result.fail<ValidatedImageInfo>(
            'Arquivo rejeitado por segurança: o SVG enviado contém scripts, atributos de evento ou entidades externas potencialmente maliciosas.',
          );
        }
      }

      if (!svgContent.includes('<svg') && !svgContent.includes('<?xml')) {
        return Result.fail<ValidatedImageInfo>(
          'Arquivo inválido: o conteúdo textual não corresponde a um documento SVG bem formado.',
        );
      }

      return Result.ok<ValidatedImageInfo>({ format: 'svg' });
    }

    return Result.fail<ValidatedImageInfo>(
      `Tipo de imagem não suportado: ${declaredType}. Permitidos: PNG, JPEG, WebP, GIF e SVG seguro.`,
    );
  }
}
