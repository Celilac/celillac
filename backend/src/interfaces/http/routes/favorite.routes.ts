// backend/src/interfaces/http/routes/favorite.routes.ts
import { Router } from 'express';
import { pool } from '../../../infrastructure/database/connection';
import { PgFavoriteRepository } from '../../../infrastructure/database/favorites/PgFavoriteRepository';
import { PgProductCatalogRepository } from '../../../infrastructure/database/catalog/PgProductCatalogRepository';
import { PgPartnerRepository } from '../../../infrastructure/database/partner/PgPartnerRepository';
import { AddFavoriteUseCase } from '../../../application/favorites/AddFavoriteUseCase';
import { RemoveFavoriteUseCase } from '../../../application/favorites/RemoveFavoriteUseCase';
import { ListFavoritesUseCase } from '../../../application/favorites/ListFavoritesUseCase';
import { FavoriteController } from '../controllers/favorites/FavoriteController';
import { authMiddleware, verifiedEmailOnlyMiddleware } from '../middlewares/AuthMiddleware';

const router = Router();

// --- Composition Root ---
const favoriteRepository = new PgFavoriteRepository(pool);
const productRepository = new PgProductCatalogRepository(pool);
const partnerRepository = new PgPartnerRepository(pool);

const addFavoriteUseCase = new AddFavoriteUseCase(
  favoriteRepository,
  productRepository,
  partnerRepository
);
const removeFavoriteUseCase = new RemoveFavoriteUseCase(favoriteRepository);
const listFavoritesUseCase = new ListFavoritesUseCase(favoriteRepository);

const favoriteController = new FavoriteController(
  addFavoriteUseCase,
  removeFavoriteUseCase,
  listFavoritesUseCase
);

// --- Rotas ---
router.post('/favorites', authMiddleware, verifiedEmailOnlyMiddleware, (req, res) => favoriteController.add(req, res));
router.delete('/favorites/:targetId', authMiddleware, verifiedEmailOnlyMiddleware, (req, res) => favoriteController.remove(req, res));
router.get('/favorites', authMiddleware, (req, res) => favoriteController.list(req, res));

export { router as favoriteRouter };
