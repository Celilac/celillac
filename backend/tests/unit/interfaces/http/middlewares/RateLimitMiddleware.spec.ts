// backend/tests/unit/interfaces/http/middlewares/RateLimitMiddleware.spec.ts
import { Request, Response, NextFunction } from 'express';
import { createRateLimiter, getClientIp } from '../../../../../src/interfaces/http/middlewares/RateLimitMiddleware';

describe('RateLimitMiddleware', () => {
  describe('getClientIp', () => {
    it('deve extrair o primeiro IP de um cabeçalho x-forwarded-for com múltiplos IPs', () => {
      const req = {
        headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178' },
      } as unknown as Request;

      expect(getClientIp(req)).toBe('203.0.113.195');
    });

    it('deve extrair IP de x-forwarded-for quando for array', () => {
      const req = {
        headers: { 'x-forwarded-for': ['198.51.100.1, 10.0.0.1'] },
      } as unknown as Request;

      expect(getClientIp(req)).toBe('198.51.100.1');
    });

    it('deve usar req.ip quando x-forwarded-for não estiver presente', () => {
      const req = {
        headers: {},
        ip: '192.168.1.50',
      } as unknown as Request;

      expect(getClientIp(req)).toBe('192.168.1.50');
    });

    it('deve usar req.socket.remoteAddress como fallback', () => {
      const req = {
        headers: {},
        socket: { remoteAddress: '10.0.0.42' },
      } as unknown as Request;

      expect(getClientIp(req)).toBe('10.0.0.42');
    });

    it('deve retornar 127.0.0.1 se nenhuma informação de IP for encontrada', () => {
      const req = { headers: {} } as unknown as Request;
      expect(getClientIp(req)).toBe('127.0.0.1');
    });
  });

  describe('createRateLimiter', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;
    let headers: Record<string, string>;
    let statusMock: jest.Mock;
    let jsonMock: jest.Mock;

    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
      headers = {};
      jsonMock = jest.fn();
      statusMock = jest.fn().mockReturnValue({ json: jsonMock });
      next = jest.fn();
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      req = {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      };

      res = {
        setHeader: jest.fn((name: string, value: string) => {
          headers[name] = value;
          return res as Response;
        }),
        status: statusMock,
        json: jsonMock,
      };
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('deve permitir requisições dentro do limite configurado e definir os cabeçalhos corretos', () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        max: 5,
        message: 'Limite excedido',
      });

      // 1ª requisição
      limiter(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(headers['X-RateLimit-Limit']).toBe('5');
      expect(headers['X-RateLimit-Remaining']).toBe('4');
      expect(headers['X-RateLimit-Reset']).toBeDefined();
      expect(statusMock).not.toHaveBeenCalled();

      // 2ª requisição
      limiter(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledTimes(2);
      expect(headers['X-RateLimit-Remaining']).toBe('3');
    });

    it('deve bloquear a requisição com 429 quando ultrapassar o limite e emitir log no console', () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        max: 5,
        message: 'Limite excedido',
      });

      // Dispara 5 requisições normais
      for (let i = 1; i <= 5; i++) {
        limiter(req as Request, res as Response, next);
      }
      expect(next).toHaveBeenCalledTimes(5);

      // 6ª requisição (deve estourar o limite)
      limiter(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledTimes(5); // next NÃO foi chamado
      expect(statusMock).toHaveBeenCalledWith(429);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Limite excedido' });
      expect(headers['Retry-After']).toBeDefined();
      expect(parseInt(headers['Retry-After'], 10)).toBeGreaterThanOrEqual(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[RateLimitMiddleware]: 🛑 Limite de requisições excedido para o IP 1.2.3.4')
      );
    });

    it('deve rastrear IPs diferentes de forma independente', () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        max: 2,
      });

      const reqA = { headers: { 'x-forwarded-for': '10.0.0.1' } } as unknown as Request;
      const reqB = { headers: { 'x-forwarded-for': '10.0.0.2' } } as unknown as Request;

      // IP A faz 2 requisições (atinge limite)
      limiter(reqA, res as Response, next);
      limiter(reqA, res as Response, next);
      expect(next).toHaveBeenCalledTimes(2);

      // IP A faz 3ª requisição (bloqueado)
      limiter(reqA, res as Response, next);
      expect(statusMock).toHaveBeenCalledWith(429);

      // IP B faz requisição (deve passar normalmente)
      statusMock.mockClear();
      limiter(reqB, res as Response, next);
      expect(next).toHaveBeenCalledTimes(3);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('deve redefinir o contador após expirar o tempo da janela windowMs', () => {
      jest.useFakeTimers();
      const limiter = createRateLimiter({
        windowMs: 10000, // 10 segundos
        max: 2,
      });

      // 2 requisições esgotam a cota
      limiter(req as Request, res as Response, next);
      limiter(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledTimes(2);

      // 3ª requisição bloqueada
      limiter(req as Request, res as Response, next);
      expect(statusMock).toHaveBeenCalledWith(429);

      // Avança o tempo além dos 10 segundos da janela
      jest.advanceTimersByTime(11000);
      statusMock.mockClear();

      // Nova requisição deve ser permitida e reiniciar a contagem
      limiter(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledTimes(3);
      expect(statusMock).not.toHaveBeenCalled();
      expect(headers['X-RateLimit-Remaining']).toBe('1');

      jest.useRealTimers();
    });

    it('deve realizar limpeza de registros expirados quando a memória atinge limite de registros', () => {
      const limiter = createRateLimiter({
        windowMs: -1000, // Imediatamente expirado
        max: 5,
      });

      // Cria mais de 200 entradas expiradas
      for (let i = 0; i < 205; i++) {
        const dummyReq = { headers: { 'x-forwarded-for': `192.168.0.${i}` } } as unknown as Request;
        limiter(dummyReq, res as Response, next);
      }

      // Ao disparar a próxima requisição, o lazy cleanup é acionado
      limiter(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
    });

    it('deve limpar todos os registros quando limiter.reset for chamado', () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        max: 1,
      });

      limiter(req as Request, res as Response, next);
      limiter(req as Request, res as Response, next);
      expect(statusMock).toHaveBeenCalledWith(429);

      // Reseta o store
      limiter.reset();
      statusMock.mockClear();

      // Nova requisição deve passar normalmente
      limiter(req as Request, res as Response, next);
      expect(statusMock).not.toHaveBeenCalled();
    });
  });
});
