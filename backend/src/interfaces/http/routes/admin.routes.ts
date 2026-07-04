// backend/src/interfaces/http/routes/admin.routes.ts
import { Router } from 'express';

import { pool } from '../../../infrastructure/database/connection';
import { PgReportRepository } from '../../../infrastructure/database/admin/PgReportRepository';

import { CreateReportUseCase } from '../../../application/admin/CreateReportUseCase';
import { ListReportsUseCase } from '../../../application/admin/ListReportsUseCase';
import { ReviewReportUseCase } from '../../../application/admin/ReviewReportUseCase';

import { CreateReportController } from '../controllers/admin/CreateReportController';
import { ListReportsController } from '../controllers/admin/ListReportsController';
import { ReviewReportController } from '../controllers/admin/ReviewReportController';

const router = Router();

// --- Composition Root ---
const reportRepository = new PgReportRepository(pool);

const createReportUseCase = new CreateReportUseCase(reportRepository);
const listReportsUseCase = new ListReportsUseCase(reportRepository);
const reviewReportUseCase = new ReviewReportUseCase(reportRepository);

const createReportController = new CreateReportController(createReportUseCase);
const listReportsController = new ListReportsController(listReportsUseCase);
const reviewReportController = new ReviewReportController(reviewReportUseCase);

// --- Rotas ---
// Usuário autenticado pode criar
router.post('/reports', (req, res) => createReportController.execute(req, res));

// Apenas ADMIN
router.get('/reports', (req, res) => listReportsController.execute(req, res));
router.patch('/reports/:id/status', (req, res) => reviewReportController.execute(req, res));

export { router as adminRouter };
