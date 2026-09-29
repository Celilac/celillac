// backend/src/interfaces/http/middlewares/BotBlockerMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { SecurityLogger } from '../../../infrastructure/logging/SecurityLogger';

/**
 * Lista de identificadores de agentes de inteligência artificial,
 * scrapers agressivos e ferramentas de extração automatizada não autorizadas.
 */
export const BLOCKED_BOT_PATTERNS = [
  // Agentes de IA e Crawlers de LLM
  'gptbot',
  'chatgpt-user',
  'claudebot',
  'anthropic-ai',
  'ccbot',
  'bytespider',
  'perplexitybot',
  'amazonbot',
  'facebookbot',
  'cohere-ai',
  'diffbot',
  'seekr',
  'youbot',
  // Ferramentas de extração e scrapers automatizados
  'scrapy',
  'python-requests',
  'python-urllib',
  'go-http-client',
  'aiohttp',
  'wget/',
  'curl/',
];

export interface BotBlockerOptions {
  allowAuthenticated?: boolean; // Permite bypass se houver Authorization Header válido
  exemptPaths?: string[];       // Rotas isentas de validação de bot (ex: /health)
}

/**
 * Middleware para identificação e bloqueio de tráfego de agentes automatizados,
 * scrapers de dados e bots que possam sobrecarregar a API ou extrair conteúdo.
 */
export function createBotBlocker(options: BotBlockerOptions = {}) {
  const {
    allowAuthenticated = true,
    exemptPaths = ['/health'],
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    // 1. Isenção para rotas de monitoramento / healthcheck
    const path = req.path || req.url || '';
    if (exemptPaths.some((exempt) => path.startsWith(exempt))) {
      next();
      return;
    }

    // 2. Libera clientes com credencial válida (ex: app mobile ou web autenticado)
    if (allowAuthenticated && req.headers.authorization) {
      next();
      return;
    }

    // 3. Validação de User-Agent
    const rawUserAgent = req.headers['user-agent'];

    if (!rawUserAgent || rawUserAgent.trim().length === 0) {
      SecurityLogger.logAccessForbidden(req.ip || '127.0.0.1', path, 'User-Agent ausente ou vazio');
      res.status(403).json({
        error: 'Acesso negado: identificador de cliente (User-Agent) ausente ou inválido.',
      });
      return;
    }

    const userAgent = rawUserAgent.toLowerCase();

    // 4. Checagem contra padrões de agentes e scrapers
    const matchedBot = BLOCKED_BOT_PATTERNS.find((pattern) => userAgent.includes(pattern));

    if (matchedBot) {
      SecurityLogger.logBotBlocked(req.ip || '127.0.0.1', rawUserAgent, path, matchedBot);
      res.status(403).json({
        error: 'Acesso negado: agentes automatizados e scrapers não são permitidos nesta rota.',
      });
      return;
    }

    next();
  };
}

export const botBlockerMiddleware = createBotBlocker();
