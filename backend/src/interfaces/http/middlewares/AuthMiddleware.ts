// backend/src/interfaces/http/middlewares/AuthMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface DecodedToken {
  sub: string;
  role: string;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
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
    
    req.user = {
      id: decoded.sub,
      role: decoded.role,
    };
    
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
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
    
    req.user = {
      id: decoded.sub,
      role: decoded.role,
    };
  } catch (err) {
    // Prossegue como visitante em caso de falha de token
  }
  
  next();
}
