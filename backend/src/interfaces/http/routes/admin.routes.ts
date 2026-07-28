// backend/src/interfaces/http/routes/admin.routes.ts
import { Router } from 'express';

import { pool } from '../../../infrastructure/database/connection';
import { PgReportRepository } from '../../../infrastructure/database/admin/PgReportRepository';
import { PgUserRepository } from '../../../infrastructure/database/iam/PgUserRepository';
import { FakeEmailService } from '../../../infrastructure/services/FakeEmailService';

import { CreateReportUseCase } from '../../../application/admin/CreateReportUseCase';
import { ListReportsUseCase } from '../../../application/admin/ListReportsUseCase';
import { ReviewReportUseCase } from '../../../application/admin/ReviewReportUseCase';
import { ApproveAdminUserUseCase } from '../../../application/admin/ApproveAdminUserUseCase';
import { ListUsersUseCase } from '../../../application/admin/ListUsersUseCase';
import { EvaluateUserProfileUseCase } from '../../../application/admin/EvaluateUserProfileUseCase';

import { CreateReportController } from '../controllers/admin/CreateReportController';
import { ListReportsController } from '../controllers/admin/ListReportsController';
import { ReviewReportController } from '../controllers/admin/ReviewReportController';
import { ApproveAdminUserController } from '../controllers/admin/ApproveAdminUserController';
import { ListUsersController } from '../controllers/admin/ListUsersController';
import { EvaluateUserProfileController } from '../controllers/admin/EvaluateUserProfileController';

import { authMiddleware } from '../middlewares/AuthMiddleware';

const router = Router();

// Composition Root
const reportRepository = new PgReportRepository(pool);
const userRepository = new PgUserRepository(pool);
const emailService = new FakeEmailService();

const createReportUseCase = new CreateReportUseCase(reportRepository);
const listReportsUseCase = new ListReportsUseCase(reportRepository);
const reviewReportUseCase = new ReviewReportUseCase(reportRepository);
const approveAdminUserUseCase = new ApproveAdminUserUseCase(userRepository, emailService);
const listUsersUseCase = new ListUsersUseCase(userRepository);
const evaluateUserProfileUseCase = new EvaluateUserProfileUseCase(userRepository);

const createReportController = new CreateReportController(createReportUseCase);
const listReportsController = new ListReportsController(listReportsUseCase);
const reviewReportController = new ReviewReportController(reviewReportUseCase);
const approveAdminUserController = new ApproveAdminUserController(approveAdminUserUseCase);
const listUsersController = new ListUsersController(listUsersUseCase);
const evaluateUserProfileController = new EvaluateUserProfileController(evaluateUserProfileUseCase);

// Rotas
router.post('/reports', authMiddleware, (req, res) => createReportController.execute(req, res));

// Rotas exclusivas de ADMIN
router.get('/reports', authMiddleware, (req, res) => listReportsController.execute(req, res));
router.patch('/reports/:id/status', authMiddleware, (req, res) => reviewReportController.execute(req, res));

// Gestão & Moderação de Usuários e Admins
router.get('/users', authMiddleware, (req, res) => listUsersController.execute(req, res));
router.patch('/users/:id/approve', authMiddleware, (req, res) => approveAdminUserController.execute(req, res));
router.patch('/users/:id/evaluate', authMiddleware, (req, res) => evaluateUserProfileController.execute(req, res));

export { router as adminRouter };
