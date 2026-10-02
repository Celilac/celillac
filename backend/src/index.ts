import 'dotenv/config'; // deve ser a primeira importação
import express from 'express';

import { pool, testDatabaseConnection } from './infrastructure/database/connection';
import { iamRouter } from './interfaces/http/routes/iam.routes';
import { foodProfileRouter } from './interfaces/http/routes/food-profile.routes';
import { compatibilityRouter } from './interfaces/http/routes/compatibility.routes';
import { catalogRouter } from './interfaces/http/routes/catalog.routes';
import { adminRouter } from './interfaces/http/routes/admin.routes';
import { reviewsRoutes } from './interfaces/http/routes/reviews.routes';
import { partnerRouter } from './interfaces/http/routes/partner.routes';
import { favoriteRouter } from './interfaces/http/routes/favorite.routes';
import { consumerRouter } from './interfaces/http/routes/consumer.routes';
import orderRouter from './interfaces/http/routes/order.routes';
import paymentRouter from './interfaces/http/routes/payment.routes';
import { corsMiddleware, securityHeadersMiddleware } from './interfaces/http/middlewares/SecurityMiddleware';
import { botBlockerMiddleware } from './interfaces/http/middlewares/BotBlockerMiddleware';
import { createRateLimiter } from './interfaces/http/middlewares/RateLimitMiddleware';

const app  = express();
const port = process.env.PORT ?? 3000;

// Oculta header que identifica Express para dificultar fingerprinting
app.disable('x-powered-by');

// Configuração para proxies reversos (Traefik, Nginx, Cloudflare)
app.set('trust proxy', 1);

app.use(corsMiddleware);
app.use(securityHeadersMiddleware);

// Bloqueia crawlers abusivos, web scrapers conhecidos e bots de IA antes de qualquer processamento
app.use(botBlockerMiddleware);

// Limite rigoroso de payload para prevenir DoS por esgotamento de memória.
// Permite 25MB apenas em rotas autorizadas de upload de imagens (catálogo e perfil de parceiro), 2MB no restante.
app.use((req, res, next) => {
  const isImageUploadRoute =
    (req.path.startsWith('/catalog/products') || req.path.startsWith('/partner/profile')) &&
    (req.method === 'POST' || req.method === 'PUT');

  const limit = isImageUploadRoute ? '25mb' : '2mb';
  express.json({ limit })(req, res, (err) => {
    if (err) return next(err);
    express.urlencoded({ limit, extended: true })(req, res, next);
  });
});

// Limiter global contra flood / ataques volumétricos L7 (120 req/min por IP)
const globalApiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: 'Taxa máxima de requisições excedida. Por favor, aguarde um minuto.',
});

// --- Rotas ---
// Healthcheck com diagnóstico ativo de conectividade do banco
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({
      status: 'OK',
      service: 'CeLiLac Backend',
      database: 'CONNECTED',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'DEGRADED',
      service: 'CeLiLac Backend',
      database: 'DISCONNECTED',
      error: err?.message || 'Database unavailable',
      timestamp: new Date().toISOString(),
    });
  }
});

// Aplica limiter global em todas as rotas da API
app.use(globalApiRateLimiter);

app.use('/iam',          iamRouter);
app.use('/consumer',     consumerRouter);
app.use('/consumers',    consumerRouter);
app.use('/food-profile', foodProfileRouter);
app.use('/compatibility', compatibilityRouter);
app.use('/catalog',      catalogRouter);
app.use('/admin',        adminRouter);
app.use('/reviews',      reviewsRoutes);
app.use('/orders',       orderRouter);
app.use('/payments',     paymentRouter);
app.use('/',             paymentRouter);
app.use('/',             partnerRouter);
app.use('/',             favoriteRouter);

// --- Middleware Global de Tratamento de Erros ---
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error Handler]:', err);
  if (err.type === 'entity.too.large') {
    res.status(413).json({ error: 'O arquivo de imagem enviado é muito grande. O limite máximo é de 10MB.' });
    return;
  }
  res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
});

// --- Boot ---
async function bootstrap(): Promise<void> {
  try {
    await testDatabaseConnection();
  } catch (error) {
    console.error('[Server]: Falha na sincronização inicial do banco de dados (o servidor continuará ativo em modo degradado):', error);
  }

  app.listen(port, () => {
    console.log(`[Server]: CeLiLac Backend rodando em http://localhost:${port}`);
  });
}

bootstrap();
