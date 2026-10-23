// backend/tests/unit/infrastructure/storage/LocalStorageService.spec.ts
import fs from 'fs';
import path from 'path';
import { LocalStorageService } from '../../../../src/infrastructure/storage/LocalStorageService';

describe('LocalStorageService', () => {
  const testUploadsDir = path.join(__dirname, 'test-uploads-temp');
  let storageService: LocalStorageService;

  // Imagem WebP 1x1 pixel válida em Base64
  const validWebpBase64 =
    'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAQAcJaACdLoB+AAA/v6n/4H/7///8b//7//4f//m///b//3//wf//gAAAA==';

  // Imagem PNG 1x1 pixel válida em Base64
  const validPngBase64 =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  beforeEach(async () => {
    if (fs.existsSync(testUploadsDir)) {
      await fs.promises.rm(testUploadsDir, { recursive: true, force: true });
    }
    storageService = new LocalStorageService(testUploadsDir);
  });

  afterEach(async () => {
    if (fs.existsSync(testUploadsDir)) {
      await fs.promises.rm(testUploadsDir, { recursive: true, force: true });
    }
  });

  it('deve identificar corretamente uma Data URL base64', () => {
    expect(storageService.isDataUrl(validWebpBase64)).toBe(true);
    expect(storageService.isDataUrl('https://exemplo.com/foto.jpg')).toBe(false);
    expect(storageService.isDataUrl('/uploads/products/teste.webp')).toBe(false);
    expect(storageService.isDataUrl('')).toBe(false);
  });

  it('deve retornar a própria URL inalterada quando não for Base64 (HTTP/HTTPS ou /uploads/)', async () => {
    const httpUrl = 'https://images.unsplash.com/photo-123';
    const relativeUrl = '/uploads/products/existente.webp';

    const res1 = await storageService.saveImage(httpUrl);
    const res2 = await storageService.saveImage(relativeUrl);

    expect(res1).toBe(httpUrl);
    expect(res2).toBe(relativeUrl);
  });

  it('deve converter uma Data URL Base64 em arquivo físico e retornar a URL relativa /uploads/...', async () => {
    const publicUrl = await storageService.saveImage(validWebpBase64, 'products');

    expect(publicUrl).toMatch(/^\/uploads\/products\/[a-f0-9\-]+\.webp$/);

    const relativeSubPath = publicUrl.replace('/uploads/', '');
    const physicalPath = path.join(testUploadsDir, relativeSubPath);

    expect(fs.existsSync(physicalPath)).toBe(true);
    const fileStats = await fs.promises.stat(physicalPath);
    expect(fileStats.size).toBeGreaterThan(0);
  });

  it('deve suportar subpastas personalizadas como partners ou certifications', async () => {
    const publicUrl = await storageService.saveImage(validPngBase64, 'partners');

    expect(publicUrl).toMatch(/^\/uploads\/partners\/[a-f0-9\-]+\.png$/);

    const relativeSubPath = publicUrl.replace('/uploads/', '');
    const physicalPath = path.join(testUploadsDir, relativeSubPath);
    expect(fs.existsSync(physicalPath)).toBe(true);
  });

  it('deve rejeitar payloads base64 maliciosos ou corrompidos', async () => {
    const maliciousBase64 = 'data:image/png;base64,bm90YW5pbWFnZQ=='; // Não tem magic bytes PNG válidos

    await expect(storageService.saveImage(maliciousBase64, 'products')).rejects.toThrow();
  });

  it('deve excluir arquivo físico existente com deleteImage', async () => {
    const publicUrl = await storageService.saveImage(validWebpBase64, 'products');
    const relativeSubPath = publicUrl.replace('/uploads/', '');
    const physicalPath = path.join(testUploadsDir, relativeSubPath);

    expect(fs.existsSync(physicalPath)).toBe(true);

    await storageService.deleteImage(publicUrl);
    expect(fs.existsSync(physicalPath)).toBe(false);
  });

  it('não deve falhar ao tentar excluir um arquivo que não existe', async () => {
    await expect(
      storageService.deleteImage('/uploads/products/fantasma.webp'),
    ).resolves.not.toThrow();
  });

  it('deve proteger contra Directory Traversal em deleteImage', async () => {
    await expect(
      storageService.deleteImage('/uploads/../../etc/passwd'),
    ).resolves.not.toThrow();
  });
});
