// backend/src/interfaces/http/middlewares/ValidationMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware para validação estrita de DTOs recebidos no corpo da requisição (A03: Injection).
 * Sanitiza e remove propriedades espúrias não declaradas no schema.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));

        res.status(400).json({
          error: 'Dados da requisição inválidos.',
          details: issues,
        });
        return;
      }

      res.status(400).json({ error: 'Falha ao processar corpo da requisição.' });
    }
  };
}
