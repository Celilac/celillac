// backend/src/interfaces/http/routes/consumer.routes.ts
import { Router } from 'express';
import { pool } from '../../../infrastructure/database/connection';
import { PgConsumerRepository } from '../../../infrastructure/database/consumer/PgConsumerRepository';
import { PgFoodProfileRepository } from '../../../infrastructure/database/food-profile/PgFoodProfileRepository';

import { GetConsumerProfileUseCase } from '../../../application/consumer/GetConsumerProfileUseCase';
import { UpdateConsumerPreferencesUseCase } from '../../../application/consumer/UpdateConsumerPreferencesUseCase';
import { AddRestrictionUseCase } from '../../../application/food-profile/AddRestrictionUseCase';
import { RemoveRestrictionUseCase } from '../../../application/food-profile/RemoveRestrictionUseCase';

import { GetConsumerProfileController } from '../controllers/consumer/GetConsumerProfileController';
import { UpdateConsumerPreferencesController } from '../controllers/consumer/UpdateConsumerPreferencesController';
import { AddRestrictionController } from '../controllers/consumer/AddRestrictionController';
import { RemoveRestrictionController } from '../controllers/consumer/RemoveRestrictionController';

import { authMiddleware } from '../middlewares/AuthMiddleware';

const router = Router();

// Composition Root
const consumerRepository = new PgConsumerRepository(pool);
const foodProfileRepository = new PgFoodProfileRepository(pool);

const getConsumerProfileUseCase = new GetConsumerProfileUseCase(consumerRepository, foodProfileRepository);
const updatePreferencesUseCase = new UpdateConsumerPreferencesUseCase(consumerRepository);
const addRestrictionUseCase = new AddRestrictionUseCase(foodProfileRepository, consumerRepository);
const removeRestrictionUseCase = new RemoveRestrictionUseCase(foodProfileRepository, consumerRepository);

const getConsumerProfileController = new GetConsumerProfileController(getConsumerProfileUseCase);
const updatePreferencesController = new UpdateConsumerPreferencesController(updatePreferencesUseCase);
const addRestrictionController = new AddRestrictionController(addRestrictionUseCase);
const removeRestrictionController = new RemoveRestrictionController(removeRestrictionUseCase);

// Rotas de Consumidor
router.get('/me', authMiddleware, (req, res) => getConsumerProfileController.execute(req, res));
router.put('/preferences', authMiddleware, (req, res) => updatePreferencesController.execute(req, res));
router.post('/restrictions', authMiddleware, (req, res) => addRestrictionController.execute(req, res));
router.delete('/restrictions/:allergen', authMiddleware, (req, res) => removeRestrictionController.execute(req, res));

export { router as consumerRouter };
