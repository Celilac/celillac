import { Router } from 'express';
import { ReviewController } from '../controllers/reviews/ReviewController';
import { SubmitReviewUseCase } from '../../../application/reviews/SubmitReviewUseCase';
import { GetProductReviewsUseCase } from '../../../application/reviews/GetProductReviewsUseCase';
import { GetPartnerReviewsUseCase } from '../../../application/reviews/GetPartnerReviewsUseCase';
import { PgReviewRepository } from '../../../infrastructure/database/reviews/PgReviewRepository';
import { PgProductRepository } from '../../../infrastructure/database/product/PgProductRepository';
import { PgPartnerRepository } from '../../../infrastructure/database/partner/PgPartnerRepository';
import { pool } from '../../../infrastructure/database/connection';

import { authMiddleware, verifiedEmailOnlyMiddleware } from '../middlewares/AuthMiddleware';

export const reviewsRoutes = Router();

// Dependências
const reviewRepo = new PgReviewRepository(pool);
const productRepo = new PgProductRepository(pool);
const partnerRepo = new PgPartnerRepository(pool);

const submitReviewUseCase = new SubmitReviewUseCase(reviewRepo, productRepo, partnerRepo);
const getProductReviewsUseCase = new GetProductReviewsUseCase(reviewRepo);
const getPartnerReviewsUseCase = new GetPartnerReviewsUseCase(reviewRepo);

const reviewController = new ReviewController(
  submitReviewUseCase,
  getProductReviewsUseCase,
  getPartnerReviewsUseCase
);

// Rotas
reviewsRoutes.post('/', authMiddleware, verifiedEmailOnlyMiddleware, (req, res) => reviewController.submit(req, res));
reviewsRoutes.get('/product/:productId', (req, res) => reviewController.getProductReviews(req, res));
reviewsRoutes.get('/partner/:partnerId', (req, res) => reviewController.getPartnerReviews(req, res));
