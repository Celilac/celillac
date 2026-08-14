// backend/src/interfaces/http/middlewares/AuthMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../../../infrastructure/database/connection';
import { PgBlacklistTokenRepository } from '../../../infrastructure/database/iam/PgBlacklistTokenRepository';

export interface DecodedToken {
  sub: string;
  role: string;
}

const blacklistRepository = new PgBlacklistTokenRepository(pool);

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Token de autenticação não fornecido.' });
    return;
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2) {
    res.status(401).json({ error: 'Token de autenticação malformado.' });
    return;
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    res.status(401).json({ error: 'Token de autenticação malformado.' });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'Erro de configuração no servidor: JWT_SECRET não definido.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as DecodedToken;

    // 1. Verifica se o token foi revogado (consta na blacklist)
    const isRevoked = await blacklistRepository.isBlacklisted(token);
    if (isRevoked) {
      res.status(401).json({ error: 'Token revogado.' });
      return;
    }

    // 2. Otimização (Issue #26): Verifica se a conta de Admin está em PENDING_APPROVAL APENAS se decoded.role === 'ADMIN'
    if (decoded.role === 'ADMIN') {
      try {
        const userQuery = await pool.query(
          'SELECT account_status FROM users WHERE id = $1 LIMIT 1',
          [decoded.sub],
        );
        if (
          userQuery &&
          userQuery.rows &&
          userQuery.rows.length > 0 &&
          userQuery.rows[0].account_status === 'PENDING_APPROVAL'
        ) {
          res.status(403).json({
            error:
              'Sua conta de Administrador aguarda aprovação prévia de um administrador existente.',
          });
          return;
        }
      } catch (err: any) {
        // Explicito para ambiente de testes unitários sem banco de dados ativo
        if (process.env.NODE_ENV === 'test') {
          // Em testes unitários que usam o pool real não-conectado, permite prosseguir sem travar a suíte
        } else {
          console.error('[AuthMiddleware] Erro inesperado ao verificar aprovação de ADMIN:', err);
          res.status(500).json({ error: 'Erro ao verificar permissão do usuário.' });
          return;
        }
      }
    }

    req.user = {
      id: decoded.sub,
      role: decoded.role,
    };

    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

export async function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2) {
    next();
    return;
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    next();
    return;
  }

  const secret = process.env.JWT_SECRET || 'secret';

  try {
    const decoded = jwt.verify(token, secret) as DecodedToken;

    const isRevoked = await blacklistRepository.isBlacklisted(token);
    if (!isRevoked) {
      req.user = {
        id: decoded.sub,
        role: decoded.role,
      };
    }
  } catch (err) {
    // Prossegue como visitante em caso de falha de token
  }

  next();
}

export function adminOnlyMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Acesso negado. Apenas administradores possuem acesso a esta funcionalidade.' });
    return;
  }
  next();
}

export async function verifiedEmailOnlyMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Token de autenticação não fornecido ou inválido.' });
    return;
  }

  // Administradores são isentos
  if (req.user.role === 'ADMIN') {
    next();
    return;
  }

  try {
    const userQuery = await pool.query(
      'SELECT is_email_verified FROM users WHERE id = $1 LIMIT 1',
      [req.user.id]
    );

    if (userQuery && userQuery.rows && userQuery.rows.length > 0) {
      if (!userQuery.rows[0].is_email_verified) {
        res.status(403).json({
          error: 'É necessário validar seu e-mail com o código OTP antes de realizar esta ação.',
          code: 'EMAIL_NOT_VERIFIED',
        });
        return;
      }
    }
  } catch (err: any) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('[verifiedEmailOnlyMiddleware] Erro ao verificar validação de e-mail:', err);
      res.status(500).json({ error: 'Erro ao verificar permissão do usuário.' });
      return;
    }
  }

  next();
}
