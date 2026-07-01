// backend/src/interfaces/http/routes/food-profile.routes.ts
import { Router } from 'express';

import { pool } from '../../../infrastructure/database/connection';
import { PgFoodProfileRepository } from '../../../infrastructure/database/food-profile/PgFoodProfileRepository';
import { CreateFoodProfileUseCase } from '../../../application/food-profile/CreateFoodProfileUseCase';
import { GetFoodProfileUseCase } from '../../../application/food-profile/GetFoodProfileUseCase';
import { CreateFoodProfileController } from '../controllers/food-profile/CreateFoodProfileController';
import { GetFoodProfileController } from '../controllers/food-profile/GetFoodProfileController';
import { UpdateFoodProfileUseCase } from '../../../application/food-profile/UpdateFoodProfileUseCase';
import { UpdateFoodProfileController } from '../controllers/food-profile/UpdateFoodProfileController';

const router = Router();

// --- Composition Root ---
const profileRepository       = new PgFoodProfileRepository(pool);
const createProfileUseCase    = new CreateFoodProfileUseCase(profileRepository);
const getProfileUseCase       = new GetFoodProfileUseCase(profileRepository);
const updateProfileUseCase    = new UpdateFoodProfileUseCase(profileRepository);

const createProfileController = new CreateFoodProfileController(createProfileUseCase);
const getProfileController    = new GetFoodProfileController(getProfileUseCase);
const updateProfileController = new UpdateFoodProfileController(updateProfileUseCase);

// --- Rotas ---
router.post('/',           (req, res) => createProfileController.execute(req, res));
router.get('/:userId',     (req, res) => getProfileController.execute(req, res));
router.put('/:userId',     (req, res) => updateProfileController.execute(req, res));

export { router as foodProfileRouter };
