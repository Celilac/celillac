// backend/src/interfaces/http/routes/catalog.routes.ts
import { Router } from 'express';

import { pool } from '../../../infrastructure/database/connection';
import { PgProductCatalogRepository } from '../../../infrastructure/database/catalog/PgProductCatalogRepository';
import { CreateProductUseCase } from '../../../application/catalog/CreateProductUseCase';
import { SearchProductsUseCase } from '../../../application/catalog/SearchProductsUseCase';
import { CreateProductController } from '../controllers/catalog/CreateProductController';
import { SearchProductsController } from '../controllers/catalog/SearchProductsController';

const router = Router();

// --- Composition Root ---
const catalogRepository = new PgProductCatalogRepository(pool);

const createProductUseCase = new CreateProductUseCase(catalogRepository);
const searchProductsUseCase = new SearchProductsUseCase(catalogRepository);

const createProductController = new CreateProductController(createProductUseCase);
const searchProductsController = new SearchProductsController(searchProductsUseCase);

// --- Rotas ---
router.post('/products', (req, res) => createProductController.execute(req, res));
router.get('/products',  (req, res) => searchProductsController.execute(req, res));

export { router as catalogRouter };
