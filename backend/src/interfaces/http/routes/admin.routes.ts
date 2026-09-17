// backend/src/interfaces/http/routes/admin.routes.ts
import { Router } from 'express';

import { pool } from '../../../infrastructure/database/connection';
import { PgReportRepository } from '../../../infrastructure/database/admin/PgReportRepository';
import { PgUserRepository } from '../../../infrastructure/database/iam/PgUserRepository';
import { PgConsumerRepository } from '../../../infrastructure/database/consumer/PgConsumerRepository';
import { PgAuditLogRepository } from '../../../infrastructure/database/audit/PgAuditLogRepository';
import { FakeEmailService } from '../../../infrastructure/services/FakeEmailService';

import { PgCategoryRepository } from '../../../infrastructure/database/catalog/PgCategoryRepository';
import { PgProductCertificationRepository } from '../../../infrastructure/database/catalog/PgProductCertificationRepository';

import { CreateReportUseCase } from '../../../application/admin/CreateReportUseCase';
import { ListReportsUseCase } from '../../../application/admin/ListReportsUseCase';
import { ReviewReportUseCase } from '../../../application/admin/ReviewReportUseCase';
import { ApproveAdminUserUseCase } from '../../../application/admin/ApproveAdminUserUseCase';
import { ListUsersUseCase } from '../../../application/admin/ListUsersUseCase';
import { EvaluateUserProfileUseCase } from '../../../application/admin/EvaluateUserProfileUseCase';
import { PromoteUserToAdminUseCase } from '../../../application/admin/PromoteUserToAdminUseCase';
import { DemoteAdminUseCase } from '../../../application/admin/DemoteAdminUseCase';
import { DeleteUserUseCase } from '../../../application/admin/DeleteUserUseCase';
import { ListAdminCategoriesUseCase } from '../../../application/admin/ListAdminCategoriesUseCase';
import { ReviewCategoryUseCase } from '../../../application/admin/ReviewCategoryUseCase';
import { ListAdminCertificationsUseCase } from '../../../application/admin/certifications/ListAdminCertificationsUseCase';
import { ReviewProductCertificationUseCase } from '../../../application/admin/certifications/ReviewProductCertificationUseCase';

import { CreateReportController } from '../controllers/admin/CreateReportController';
import { ListReportsController } from '../controllers/admin/ListReportsController';
import { ReviewReportController } from '../controllers/admin/ReviewReportController';
import { ApproveAdminUserController } from '../controllers/admin/ApproveAdminUserController';
import { ListUsersController } from '../controllers/admin/ListUsersController';
import { EvaluateUserProfileController } from '../controllers/admin/EvaluateUserProfileController';
import { PromoteUserToAdminController } from '../controllers/admin/PromoteUserToAdminController';
import { DemoteAdminController } from '../controllers/admin/DemoteAdminController';
import { DeleteUserController } from '../controllers/admin/DeleteUserController';
import { AdminCategoryController } from '../controllers/admin/AdminCategoryController';
import { AdminCertificationController } from '../controllers/admin/AdminCertificationController';

import { authMiddleware, adminOnlyMiddleware, verifiedEmailOnlyMiddleware } from '../middlewares/AuthMiddleware';

const router = Router();

// Composition Root
const reportRepository        = new PgReportRepository(pool);
const userRepository          = new PgUserRepository(pool);
const consumerRepository      = new PgConsumerRepository(pool);
const auditLogRepository      = new PgAuditLogRepository(pool);
const categoryRepository      = new PgCategoryRepository(pool);
const certificationRepository = new PgProductCertificationRepository(pool);
const emailService            = new FakeEmailService();

const createReportUseCase        = new CreateReportUseCase(reportRepository);
const listReportsUseCase         = new ListReportsUseCase(reportRepository);
const reviewReportUseCase        = new ReviewReportUseCase(reportRepository, auditLogRepository);
const approveAdminUserUseCase   = new ApproveAdminUserUseCase(userRepository, emailService);
const listUsersUseCase           = new ListUsersUseCase(userRepository);
const evaluateUserProfileUseCase = new EvaluateUserProfileUseCase(userRepository, consumerRepository, auditLogRepository);
const promoteUserToAdminUseCase  = new PromoteUserToAdminUseCase(userRepository);
const demoteAdminUseCase         = new DemoteAdminUseCase(userRepository);
const deleteUserUseCase          = new DeleteUserUseCase(userRepository);
const listAdminCategoriesUseCase = new ListAdminCategoriesUseCase(categoryRepository);
const reviewCategoryUseCase      = new ReviewCategoryUseCase(categoryRepository, auditLogRepository);
const listCertificationsUseCase  = new ListAdminCertificationsUseCase(certificationRepository);
const reviewCertificationUseCase = new ReviewProductCertificationUseCase(certificationRepository, auditLogRepository);

const createReportController        = new CreateReportController(createReportUseCase);
const listReportsController         = new ListReportsController(listReportsUseCase);
const reviewReportController        = new ReviewReportController(reviewReportUseCase);
const approveAdminUserController   = new ApproveAdminUserController(approveAdminUserUseCase);
const listUsersController           = new ListUsersController(listUsersUseCase);
const evaluateUserProfileController = new EvaluateUserProfileController(evaluateUserProfileUseCase);
const promoteUserToAdminController  = new PromoteUserToAdminController(promoteUserToAdminUseCase);
const demoteAdminController         = new DemoteAdminController(demoteAdminUseCase);
const deleteUserController          = new DeleteUserController(deleteUserUseCase);
const adminCategoryController       = new AdminCategoryController(listAdminCategoriesUseCase, reviewCategoryUseCase);
const adminCertificationController  = new AdminCertificationController(listCertificationsUseCase, reviewCertificationUseCase);

// Rotas
router.post('/reports', authMiddleware, verifiedEmailOnlyMiddleware, (req, res) => createReportController.execute(req, res));

// Rotas exclusivas de ADMIN
router.get('/reports', authMiddleware, adminOnlyMiddleware, (req, res) => listReportsController.execute(req, res));
router.patch('/reports/:id/status', authMiddleware, adminOnlyMiddleware, (req, res) => reviewReportController.execute(req, res));

// Gestão & Moderação de Usuários e Admins
router.get('/users', authMiddleware, adminOnlyMiddleware, (req, res) => listUsersController.execute(req, res));
router.patch('/users/:id/approve', authMiddleware, adminOnlyMiddleware, (req, res) => approveAdminUserController.execute(req, res));
router.patch('/users/:id/evaluate', authMiddleware, adminOnlyMiddleware, (req, res) => evaluateUserProfileController.execute(req, res));
router.patch('/users/:id/promote', authMiddleware, adminOnlyMiddleware, (req, res) => promoteUserToAdminController.execute(req, res));
router.patch('/users/:id/demote', authMiddleware, adminOnlyMiddleware, (req, res) => demoteAdminController.execute(req, res));
router.delete('/users/:id', authMiddleware, adminOnlyMiddleware, (req, res) => deleteUserController.execute(req, res));

// Moderação de Categorias de Produtos
router.get('/categories', authMiddleware, adminOnlyMiddleware, (req, res) => adminCategoryController.list(req, res));
router.patch('/categories/:id/review', authMiddleware, adminOnlyMiddleware, (req, res) => adminCategoryController.review(req, res));

// Moderação de Certificações e Laudos Técnicos de Produtos
router.get('/certifications', authMiddleware, adminOnlyMiddleware, (req, res) => adminCertificationController.list(req, res));
router.patch('/certifications/:id/review', authMiddleware, adminOnlyMiddleware, (req, res) => adminCertificationController.review(req, res));

export { router as adminRouter };

