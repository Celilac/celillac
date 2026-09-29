// backend/src/interfaces/http/routes/compatibility.routes.ts
import { Router } from 'express';

import { pool } from '../../../infrastructure/database/connection';
import { PgFoodProfileRepository } from '../../../infrastructure/database/food-profile/PgFoodProfileRepository';
import { PgProductRepository } from '../../../infrastructure/database/product/PgProductRepository';
import { CheckCompatibilityUseCase } from '../../../application/allergen-engine/CheckCompatibilityUseCase';
import { CheckCompatibilityController } from '../controllers/allergen-engine/CheckCompatibilityController';

import { authMiddleware } from '../middlewares/AuthMiddleware';
import { createRateLimiter } from '../middlewares/RateLimitMiddleware';

const router = Router();

// --- Composition Root ---
const profileRepository = new PgFoodProfileRepository(pool);
const productRepository = new PgProductRepository(pool);

const checkCompatibilityUseCase = new CheckCompatibilityUseCase(
  profileRepository,
  productRepository,
);

const checkCompatibilityController = new CheckCompatibilityController(checkCompatibilityUseCase);

// Limiter para proteger processamento de regras do motor de alérgenos contra abusos
const compatibilityRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Limite de checagens de compatibilidade excedido. Por favor, aguarde um minuto.',
});

// --- Rotas ---
router.post('/check', authMiddleware, compatibilityRateLimiter, (req, res) => checkCompatibilityController.execute(req, res));

export { router as compatibilityRouter };
