import { Router } from 'express';
import { ReviewController } from '../controllers/reviews/ReviewController';
import { SubmitReviewUseCase } from '../../../application/reviews/SubmitReviewUseCase';
import { GetProductReviewsUseCase } from '../../../application/reviews/GetProductReviewsUseCase';
import { PgReviewRepository } from '../../../infrastructure/database/reviews/PgReviewRepository';
import { dbPool } from '../../../infrastructure/database/pool';
import { PgProductRepository } from '../../../infrastructure/database/catalog/PgProductRepository';

export const reviewsRoutes = Router();

// Dependências
const reviewRepo = new PgReviewRepository(dbPool);
const productRepo = new PgProductRepository(dbPool);

const submitReviewUseCase = new SubmitReviewUseCase(reviewRepo, productRepo);
const getProductReviewsUseCase = new GetProductReviewsUseCase(reviewRepo);

const reviewController = new ReviewController(submitReviewUseCase, getProductReviewsUseCase);

// Rotas
reviewsRoutes.post('/', (req, res) => reviewController.submit(req, res));
reviewsRoutes.get('/product/:productId', (req, res) => reviewController.getProductReviews(req, res));
