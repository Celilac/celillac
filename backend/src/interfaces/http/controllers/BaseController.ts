// backend/src/interfaces/http/controllers/BaseController.ts
import { Request, Response } from 'express';

/**
 * BaseController — Contrato base para todos os controllers HTTP.
 * Métodos utilitários garantem respostas HTTP padronizadas em todo o sistema.
 * Controllers não decidem lógica de negócio — apenas traduzem HTTP ↔ Use Cases.
 */
export abstract class BaseController {
  protected abstract executeImpl(req: Request, res: Response): Promise<void | any>;

  public async execute(req: Request, res: Response): Promise<void> {
    try {
      await this.executeImpl(req, res);
    } catch (err) {
      console.error('[BaseController]: Erro não tratado no controller:', err);
      this.serverError(res, 'Erro interno do servidor.');
    }
  }

  protected ok<T>(res: Response, dto?: T): Response {
    return res.status(200).json(dto);
  }

  protected created<T>(res: Response, dto?: T): Response {
    return res.status(201).json(dto);
  }

  protected badRequest(res: Response, message: string): Response {
    return res.status(400).json({ error: message });
  }

  protected unauthorized(res: Response, message: string): Response {
    return res.status(401).json({ error: message });
  }

  protected forbidden(res: Response, message: string): Response {
    return res.status(403).json({ error: message });
  }

  protected conflict(res: Response, message: string): Response {
    return res.status(409).json({ error: message });
  }

  protected notFound(res: Response, message: string): Response {
    return res.status(404).json({ error: message });
  }

  protected serverError(res: Response, message: string): Response {
    return res.status(500).json({ error: message });
  }
}

