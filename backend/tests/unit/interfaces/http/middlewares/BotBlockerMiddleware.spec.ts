// backend/tests/unit/interfaces/http/middlewares/BotBlockerMiddleware.spec.ts
import { Request, Response, NextFunction } from 'express';
import { createBotBlocker, BLOCKED_BOT_PATTERNS } from '../../../../../src/interfaces/http/middlewares/BotBlockerMiddleware';

describe('BotBlockerMiddleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    res = {
      status: statusMock,
    };
    next = jest.fn();
    req = {
      headers: {},
      path: '/catalog/products',
      method: 'GET',
    };
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('deve permitir requisições com User-Agent legítimo de navegador (Chrome/Safari)', () => {
    req.headers = {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    };

    const blocker = createBotBlocker();
    blocker(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(statusMock).not.toHaveBeenCalled();
  });

  it('deve permitir requisições para rotas isentas como /health', () => {
    (req as any).path = '/health';
    req.headers = {
      'user-agent': 'python-requests/2.31.0', // Mesmo com bot, /health é isento
    };

    const blocker = createBotBlocker();
    blocker(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(statusMock).not.toHaveBeenCalled();
  });

  it('deve permitir requisições autenticadas por Bearer Token mesmo sem browser', () => {
    req.headers = {
      authorization: 'Bearer token_valido_123',
      'user-agent': 'curl/7.88.1',
    };

    const blocker = createBotBlocker();
    blocker(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(statusMock).not.toHaveBeenCalled();
  });

  it('deve bloquear requisição com User-Agent ausente com 403 Forbidden', () => {
    req.headers = {}; // sem user-agent

    const blocker = createBotBlocker();
    blocker(req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('User-Agent'),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('deve bloquear agentes de IA conhecidos como GPTBot', () => {
    req.headers = {
      'user-agent': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.0; +https://openai.com/gptbot)',
    };

    const blocker = createBotBlocker();
    blocker(req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('agentes automatizados'),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('deve bloquear crawlers de LLM como ClaudeBot e Bytespider', () => {
    const bots = ['ClaudeBot/1.0', 'Bytespider', 'CCBot/2.0', 'PerplexityBot/1.0'];

    for (const bot of bots) {
      statusMock.mockClear();
      jsonMock.mockClear();
      next.mockClear();

      req.headers = { 'user-agent': bot };

      const blocker = createBotBlocker();
      blocker(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    }
  });

  it('deve bloquear ferramentas de scraping automatizado sem autenticação (python-requests, Scrapy, curl)', () => {
    const scrapers = ['python-requests/2.31.0', 'Scrapy/2.11.0 (+https://scrapy.org)', 'curl/8.4.0'];

    for (const scraper of scrapers) {
      statusMock.mockClear();
      jsonMock.mockClear();
      next.mockClear();

      req.headers = { 'user-agent': scraper };

      const blocker = createBotBlocker();
      blocker(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    }
  });
});
