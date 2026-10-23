// backend/src/infrastructure/storage/LocalStorageService.ts
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { FileSecurityValidator } from '../services/FileSecurityValidator';

export interface IStorageService {
  saveImage(dataOrUrl: string, subfolder?: string): Promise<string>;
  deleteImage(relativeUrl: string): Promise<void>;
  isDataUrl(url: string): boolean;
}

export class LocalStorageService implements IStorageService {
  private readonly baseUploadDir: string;

  constructor(baseUploadDir?: string) {
    this.baseUploadDir = baseUploadDir || path.resolve(process.cwd(), 'uploads');
  }

  /**
   * Verifica se a string fornecida é um payload Base64 Data URL.
   */
  public isDataUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    return url.trim().startsWith('data:image/');
  }

  /**
   * Salva a imagem no armazenamento local persistente se for Base64,
   * ou retorna a URL existente caso seja link externo ou caminho já persistido.
   */
  public async saveImage(dataOrUrl: string, subfolder = 'products'): Promise<string> {
    if (!dataOrUrl || typeof dataOrUrl !== 'string') {
      return dataOrUrl;
    }

    const trimmed = dataOrUrl.trim();

    // Se já for uma URL externa ou caminho relativo estático existente (/uploads/...), retorna direto
    if (!this.isDataUrl(trimmed)) {
      return trimmed;
    }

    // Valida magic bytes e estrutura do payload base64 contra injeções maliciosas
    const validationResult = FileSecurityValidator.validateImagePayload(trimmed);
    if (validationResult.isFailure) {
      throw new Error(`Upload rejeitado por segurança: ${validationResult.getError()}`);
    }

    const match = trimmed.match(/^data:image\/([a-zA-Z0-9\+\-\.]+);base64,(.+)$/);
    if (!match) {
      throw new Error('Formato de Data URL inválido.');
    }

    const declaredFormat = match[1].toLowerCase();
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Mapeamento seguro de extensão
    let extension = 'webp';
    if (declaredFormat.includes('png')) extension = 'png';
    else if (declaredFormat.includes('jpeg') || declaredFormat.includes('jpg')) extension = 'jpg';
    else if (declaredFormat.includes('webp')) extension = 'webp';
    else if (declaredFormat.includes('gif')) extension = 'gif';

    const filename = `${crypto.randomUUID()}.${extension}`;
    const targetDir = path.join(this.baseUploadDir, subfolder);

    if (!fs.existsSync(targetDir)) {
      await fs.promises.mkdir(targetDir, { recursive: true });
    }

    const targetFilePath = path.join(targetDir, filename);
    await fs.promises.writeFile(targetFilePath, buffer);

    return `/uploads/${subfolder}/${filename}`;
  }

  /**
   * Exclui o arquivo do disco com proteção estrita contra directory traversal.
   */
  public async deleteImage(relativeUrl: string): Promise<void> {
    if (!relativeUrl || typeof relativeUrl !== 'string') return;
    if (!relativeUrl.startsWith('/uploads/')) return;

    // Normaliza para evitar Path Traversal (../)
    const sanitizedRelativePath = path.normalize(relativeUrl.replace(/^\/uploads\/?/, ''));
    const fullPhysicalPath = path.resolve(this.baseUploadDir, sanitizedRelativePath);

    // Garante que o caminho final ainda esteja estritamente dentro de baseUploadDir
    const resolvedBase = path.resolve(this.baseUploadDir);
    if (!fullPhysicalPath.startsWith(resolvedBase)) {
      return;
    }

    try {
      if (fs.existsSync(fullPhysicalPath)) {
        await fs.promises.unlink(fullPhysicalPath);
      }
    } catch {
      // Ignora erro de exclusão silenciosamente
    }
  }
}
