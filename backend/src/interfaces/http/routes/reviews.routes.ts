import { Router } from 'express';
import { ReviewController } from '../controllers/reviews/ReviewController';
import { SubmitReviewUseCase } from '../../../application/reviews/SubmitReviewUseCase';
import { GetProductReviewsUseCase } from '../../../application/reviews/GetProductReviewsUseCase';
import { PgReviewRepository } from '../../../infrastructure/database/reviews/PgReviewRepository';
import { pool } from '../../../infrastructure/database/connection';
import { PgProductRepository } from '../../../infrastructure/database/product/PgProductRepository';

export const reviewsRoutes = Router();

// Dependências
const reviewRepo = new PgReviewRepository(pool);
const productRepo = new PgProductRepository(pool);

const submitReviewUseCase = new SubmitReviewUseCase(reviewRepo, productRepo);
const getProductReviewsUseCase = new GetProductReviewsUseCase(reviewRepo);

const reviewController = new ReviewController(submitReviewUseCase, getProductReviewsUseCase);

// Rotas
reviewsRoutes.post('/', (req, res) => reviewController.submit(req, res));
reviewsRoutes.get('/product/:productId', (req, res) => reviewController.getProductReviews(req, res));
