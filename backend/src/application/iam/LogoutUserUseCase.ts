// backend/src/application/iam/LogoutUserUseCase.ts
import jwt from 'jsonwebtoken';
import { IBlacklistTokenRepository } from '../../domain/iam/repositories/IBlacklistTokenRepository';
import { Result } from '../../domain/Result';

export interface LogoutUserDTO {
  token: string;
}

/**
 * LogoutUserUseCase — Caso de uso responsável por invalidar o token de acesso de um usuário.
 * Adiciona o token à blacklist server-side com a sua data correspondente de expiração.
 */
export class LogoutUserUseCase {
  constructor(private readonly blacklistRepository: IBlacklistTokenRepository) {}

  async execute(dto: LogoutUserDTO): Promise<Result<void>> {
    try {
      if (!dto.token) {
        return Result.fail<void>('Token não fornecido.');
      }

      // Decodifica o token (sem verificar a assinatura, pois o middleware já a validou)
      // para obter o tempo de expiração (exp)
      const decoded = jwt.decode(dto.token) as { exp?: number } | null;

      let expiresAt: Date;
      if (decoded && decoded.exp) {
        expiresAt = new Date(decoded.exp * 1000);
      } else {
        // Fallback: se o token não contiver o campo 'exp', assume expiração em 7 dias
        expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      }

      // Adiciona o token na blacklist
      await this.blacklistRepository.add(dto.token, expiresAt);

      return Result.ok<void>(undefined);
    } catch (err) {
      return Result.fail<void>('Falha ao processar revogação do token.');
    }
  }
}
