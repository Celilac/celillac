import 'dotenv/config'; // deve ser a primeira importação
import express from 'express';

import { testDatabaseConnection } from './infrastructure/database/connection';
import { iamRouter } from './interfaces/http/routes/iam.routes';
import { foodProfileRouter } from './interfaces/http/routes/food-profile.routes';
import { compatibilityRouter } from './interfaces/http/routes/compatibility.routes';
import { catalogRouter } from './interfaces/http/routes/catalog.routes';
import { adminRouter } from './interfaces/http/routes/admin.routes';
import { reviewsRoutes } from './interfaces/http/routes/reviews.routes';
import { partnerRouter } from './interfaces/http/routes/partner.routes';
import { favoriteRouter } from './interfaces/http/routes/favorite.routes';
import { consumerRouter } from './interfaces/http/routes/consumer.routes';
import { corsMiddleware, securityHeadersMiddleware } from './interfaces/http/middlewares/SecurityMiddleware';

const app  = express();
const port = process.env.PORT ?? 3000;

app.use(corsMiddleware);
app.use(securityHeadersMiddleware);

// Permite upload de imagens de avatar de até 10MB em base64
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// --- Rotas ---
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', service: 'CeLiLac Backend' });
});

app.use('/iam',          iamRouter);
app.use('/consumers',    consumerRouter);
app.use('/food-profile', foodProfileRouter);
app.use('/compatibility', compatibilityRouter);
app.use('/catalog',      catalogRouter);
app.use('/admin',        adminRouter);
app.use('/reviews',      reviewsRoutes);
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
    app.listen(port, () => {
      console.log(`[Server]: CeLiLac Backend rodando em http://localhost:${port}`);
    });
  } catch (error) {
    console.error('[Server]: Falha ao conectar com o banco de dados. Verifique se o Docker está rodando.');
    console.error(error);
    process.exit(1);
  }
}

bootstrap();
