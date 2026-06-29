import 'dotenv/config'; // deve ser a primeira importação
import express from 'express';

import { testDatabaseConnection } from './infrastructure/database/connection';
import { iamRouter } from './interfaces/http/routes/iam.routes';

const app  = express();
const port = process.env.PORT ?? 3000;

app.use(express.json());

// --- Rotas ---
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', service: 'CeLiLac Backend' });
});

app.use('/iam', iamRouter);

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

