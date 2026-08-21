// backend/src/interfaces/http/middlewares/SecurityMiddleware.ts
import { Request, Response, NextFunction } from 'express';

export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const defaultOrigins = [
    'http://localhost:3001',
    'http://localhost:3000',
    'http://localhost:3002',
    'http://localhost:3003',
    'https://celilac.com.br',
    'https://www.celilac.com.br',
    'https://api.celilac.com.br',
  ];

  const customOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
    : [];

  const allowedOrigins = [...new Set([...defaultOrigins, ...customOrigins])];
  const origin = req.headers.origin;

  if (origin) {
    const isDomainMatch = origin === 'https://celilac.com.br' || origin.endsWith('.celilac.com.br');
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin) || isDomainMatch || !process.env.ALLOWED_ORIGINS) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
    }
  } else {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins.includes('*') ? '*' : allowedOrigins[0]);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
}

export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  next();
}
