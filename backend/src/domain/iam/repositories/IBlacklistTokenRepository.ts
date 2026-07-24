// backend/src/domain/iam/repositories/IBlacklistTokenRepository.ts

/**
 * Interface do repositório para revogação de tokens JWT (Blacklist).
 * Permite invalidar tokens antes do seu tempo natural de expiração.
 */
export interface IBlacklistTokenRepository {
  /**
   * Adiciona um token à lista negra até a sua data de expiração original.
   */
  add(token: string, expiresAt: Date): Promise<void>;

  /**
   * Verifica se o token está contido na lista negra.
   */
  isBlacklisted(token: string): Promise<boolean>;
}
