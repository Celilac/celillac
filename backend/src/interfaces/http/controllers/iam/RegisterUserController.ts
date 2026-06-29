// backend/src/interfaces/http/controllers/iam/RegisterUserController.ts
import { Request, Response } from 'express';

import { BaseController } from '../BaseController';
import { RegisterUserUseCase } from '../../../../application/iam/RegisterUserUseCase';
import { UserRole } from '../../../../domain/iam/value-objects/UserRole';

/**
 * RegisterUserController — Traduz HTTP para o RegisterUserUseCase.
 * Responsabilidade: extrair e validar input HTTP, delegar ao Use Case, formatar resposta.
 * NÃO contém lógica de negócio.
 */
export class RegisterUserController extends BaseController {
  constructor(private readonly registerUserUseCase: RegisterUserUseCase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    const { email, password, role } = req.body;

    // Validação de input de interface (não de domínio)
    if (!email || !password || !role) {
      this.badRequest(res, 'Os campos email, password e role são obrigatórios.');
      return;
    }

    if (!Object.values(UserRole).includes(role as UserRole)) {
      this.badRequest(res, `Role inválida. Use: ${Object.values(UserRole).join(', ')}.`);
      return;
    }

    const result = await this.registerUserUseCase.execute({
      email,
      password,
      role: role as UserRole,
    });

    if (result.isFailure) {
      const error = result.getError();
      if (error === 'Este e-mail já está em uso.') {
        this.conflict(res, error);
      } else {
        this.badRequest(res, error);
      }
      return;
    }

    this.created(res, result.getValue());
  }
}
