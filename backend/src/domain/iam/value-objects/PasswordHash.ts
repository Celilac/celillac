// backend/src/domain/iam/value-objects/PasswordHash.ts
import { Result } from '../../Result';

/**
 * PasswordHash — Value Object imutável.
 * A entidade de domínio NUNCA conhece a senha em plaintext.
 * O hash é sempre gerado na camada de Application (bcryptjs).
 * Zero dependências externas — pure domain.
 */
export class PasswordHash {
  private constructor(private readonly _value: string) {}

  get value(): string {
    return this._value;
  }

  /**
   * Reconstrói o VO a partir de um hash já existente
   * (ex: vindo do banco de dados ou gerado pelo Use Case).
   */
  static fromHash(hash: string): Result<PasswordHash> {
    if (!hash || hash.trim().length === 0) {
      return Result.fail<PasswordHash>('Hash de senha não pode ser vazio.');
    }
    return Result.ok<PasswordHash>(new PasswordHash(hash));
  }
}
