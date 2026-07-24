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
    
    // Verifica se o token foi revogado (consta na blacklist)
    const isRevoked = await blacklistRepository.isBlacklisted(token);
    if (isRevoked) {
      res.status(401).json({ error: 'Token revogado.' });
      return;
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
    
    // Se o token estiver na blacklist, não o atribui ao usuário
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
