// backend/src/interfaces/http/middlewares/RateLimitMiddleware.ts
import { Request, Response, NextFunction } from 'express';

export interface RateLimitOptions {
  windowMs: number;                          // Duração da janela em ms (ex: 15 * 60 * 1000)
  max: number;                               // Número máximo de requisições por janela
  message?: string;                          // Mensagem de erro ao estourar o limite
  keyGenerator?: (req: Request) => string;   // Função para gerar a chave de rastreamento (padrão: IP)
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

/**
 * Extrai o endereço IP real do cliente considerando proxies reversos (Traefik, Nginx, Cloudflare).
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    if (typeof forwarded === 'string') {
      const firstIp = forwarded.split(',')[0].trim();
      if (firstIp) return firstIp;
    } else if (Array.isArray(forwarded) && forwarded.length > 0) {
      const firstIp = forwarded[0].split(',')[0].trim();
      if (firstIp) return firstIp;
    }
  }

  if (req.ip) {
    return req.ip;
  }

  if (req.socket?.remoteAddress) {
    return req.socket.remoteAddress;
  }

  return '127.0.0.1';
}

/**
 * Cria um middleware de limitação de taxa (Rate Limiter) em memória.
 * Zero dependências externas, alta performance e compatível com RFC 6585 (HTTP 429).
 */
export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = 'Muitas requisições enviadas. Por favor, aguarde antes de tentar novamente.',
    keyGenerator = getClientIp,
  } = options;

  const store = new Map<string, RateLimitRecord>();

  const limiter = (req: Request, res: Response, next: NextFunction): void => {
    const key = keyGenerator(req);
    const now = Date.now();

    // Limpeza preguiçosa (evita crescimento ilimitado do Map em memória)
    if (store.size > 200) {
      for (const [k, rec] of store.entries()) {
        if (now > rec.resetTime) {
          store.delete(k);
        }
      }
    }

    let record = store.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      store.set(key, record);
    } else {
      record.count += 1;
    }

    const resetSeconds = Math.ceil(record.resetTime / 1000);
    const remaining = Math.max(0, max - record.count);

    res.setHeader('X-RateLimit-Limit', max.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', resetSeconds.toString());

    if (record.count > max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
      res.setHeader('Retry-After', retryAfterSeconds.toString());

      res.status(429).json({ error: message });
      return;
    }

    next();
  };

  // Método auxiliar para testes unitários resetarem a memória
  limiter.reset = () => store.clear();

  return limiter;
}
