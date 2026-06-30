// backend/src/interfaces/http/routes/food-profile.routes.ts
import { Router } from 'express';

import { pool } from '../../../infrastructure/database/connection';
import { PgFoodProfileRepository } from '../../../infrastructure/database/food-profile/PgFoodProfileRepository';
import { CreateFoodProfileUseCase } from '../../../application/food-profile/CreateFoodProfileUseCase';
import { GetFoodProfileUseCase } from '../../../application/food-profile/GetFoodProfileUseCase';
import { CreateFoodProfileController } from '../controllers/food-profile/CreateFoodProfileController';
import { GetFoodProfileController } from '../controllers/food-profile/GetFoodProfileController';

const router = Router();

// --- Composition Root ---
const profileRepository       = new PgFoodProfileRepository(pool);
const createProfileUseCase    = new CreateFoodProfileUseCase(profileRepository);
const getProfileUseCase       = new GetFoodProfileUseCase(profileRepository);
const createProfileController = new CreateFoodProfileController(createProfileUseCase);
const getProfileController    = new GetFoodProfileController(getProfileUseCase);

// --- Rotas ---
router.post('/',           (req, res) => createProfileController.execute(req, res));
router.get('/:userId',     (req, res) => getProfileController.execute(req, res));

export { router as foodProfileRouter };
