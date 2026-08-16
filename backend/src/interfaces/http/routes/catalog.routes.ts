// backend/src/interfaces/http/routes/catalog.routes.ts
import { Router } from 'express';

import { pool } from '../../../infrastructure/database/connection';
import { PgProductCatalogRepository } from '../../../infrastructure/database/catalog/PgProductCatalogRepository';
import { PgFoodProfileRepository } from '../../../infrastructure/database/food-profile/PgFoodProfileRepository';
import { PgPartnerRepository } from '../../../infrastructure/database/partner/PgPartnerRepository';

import { CreateProductUseCase } from '../../../application/catalog/CreateProductUseCase';
import { SearchProductsUseCase } from '../../../application/catalog/SearchProductsUseCase';
import { GetProductUseCase } from '../../../application/catalog/GetProductUseCase';
import { UpdateProductUseCase } from '../../../application/catalog/UpdateProductUseCase';
import { InactivateProductUseCase } from '../../../application/catalog/InactivateProductUseCase';

import { CreateProductController } from '../controllers/catalog/CreateProductController';
import { SearchProductsController } from '../controllers/catalog/SearchProductsController';
import { GetProductController } from '../controllers/catalog/GetProductController';
import { UpdateProductController } from '../controllers/catalog/UpdateProductController';
import { InactivateProductController } from '../controllers/catalog/InactivateProductController';

import { authMiddleware, optionalAuthMiddleware, verifiedEmailOnlyMiddleware } from '../middlewares/AuthMiddleware';

const router = Router();

// --- Composition Root ---
const catalogRepository = new PgProductCatalogRepository(pool);
const foodProfileRepository = new PgFoodProfileRepository(pool);
const partnerRepository = new PgPartnerRepository(pool);

const createProductUseCase = new CreateProductUseCase(catalogRepository, partnerRepository);
const searchProductsUseCase = new SearchProductsUseCase(catalogRepository, foodProfileRepository);
const getProductUseCase = new GetProductUseCase(catalogRepository, foodProfileRepository);
const updateProductUseCase = new UpdateProductUseCase(catalogRepository, partnerRepository);
const inactivateProductUseCase = new InactivateProductUseCase(catalogRepository, partnerRepository);

const createProductController = new CreateProductController(createProductUseCase);
const searchProductsController = new SearchProductsController(searchProductsUseCase);
const getProductController = new GetProductController(getProductUseCase);
const updateProductController = new UpdateProductController(updateProductUseCase);
const inactivateProductController = new InactivateProductController(inactivateProductUseCase);

// --- Rotas ---
router.post('/products', authMiddleware, verifiedEmailOnlyMiddleware, (req, res) => createProductController.execute(req, res));
router.get('/products', optionalAuthMiddleware, (req, res) => searchProductsController.execute(req, res));
router.get('/products/:id', optionalAuthMiddleware, (req, res) => getProductController.execute(req, res));
router.put('/products/:id', authMiddleware, (req, res) => updateProductController.execute(req, res));
router.patch('/products/:id/status', authMiddleware, (req, res) => inactivateProductController.execute(req, res));

export { router as catalogRouter };
