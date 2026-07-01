// backend/src/interfaces/http/routes/compatibility.routes.ts
import { Router } from 'express';

import { pool } from '../../../infrastructure/database/connection';
import { PgFoodProfileRepository } from '../../../infrastructure/database/food-profile/PgFoodProfileRepository';
import { PgProductRepository } from '../../../infrastructure/database/product/PgProductRepository';
import { CheckCompatibilityUseCase } from '../../../application/allergen-engine/CheckCompatibilityUseCase';
import { CheckCompatibilityController } from '../controllers/allergen-engine/CheckCompatibilityController';

const router = Router();

// --- Composition Root ---
const profileRepository = new PgFoodProfileRepository(pool);
const productRepository = new PgProductRepository(pool);

const checkCompatibilityUseCase = new CheckCompatibilityUseCase(
  profileRepository,
  productRepository,
);

const checkCompatibilityController = new CheckCompatibilityController(checkCompatibilityUseCase);

// --- Rotas ---
router.post('/check', (req, res) => checkCompatibilityController.execute(req, res));

export { router as compatibilityRouter };
