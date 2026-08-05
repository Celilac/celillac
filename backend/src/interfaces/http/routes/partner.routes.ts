// backend/src/interfaces/http/routes/partner.routes.ts
import { Router } from 'express';
import { pool } from '../../../infrastructure/database/connection';
import { PgPartnerRepository } from '../../../infrastructure/database/partner/PgPartnerRepository';
import { PgUserRepository } from '../../../infrastructure/database/iam/PgUserRepository';
import { PgAuditLogRepository } from '../../../infrastructure/database/audit/PgAuditLogRepository';

// Casos de Uso
import { RegisterPartnerUseCase } from '../../../application/partner/RegisterPartnerUseCase';
import { GetPartnerUseCase } from '../../../application/partner/GetPartnerUseCase';
import { ApprovePartnerUseCase } from '../../../application/partner/ApprovePartnerUseCase';
import { SubmitPartnerForReviewUseCase } from '../../../application/partner/SubmitPartnerForReviewUseCase';
import { UpdatePartnerUseCase } from '../../../application/partner/UpdatePartnerUseCase';
import { RejectPartnerUseCase } from '../../../application/partner/RejectPartnerUseCase';
import { SuspendPartnerUseCase } from '../../../application/partner/SuspendPartnerUseCase';
import { ReactivatePartnerUseCase } from '../../../application/partner/ReactivatePartnerUseCase';
import { UpdatePartnerOperationalStatusUseCase } from '../../../application/partner/UpdatePartnerOperationalStatusUseCase';
import { ListUserPartnersUseCase } from '../../../application/partner/ListUserPartnersUseCase';
import { ListAdminPartnersUseCase } from '../../../application/partner/ListAdminPartnersUseCase';
import { ListPublicPartnersUseCase } from '../../../application/partner/ListPublicPartnersUseCase';

// Controladores e Middleware
import { PartnerController } from '../controllers/partner/PartnerController';
import { authMiddleware, adminOnlyMiddleware } from '../middlewares/AuthMiddleware';

const router = Router();

// --- Composition Root ---
const partnerRepository  = new PgPartnerRepository(pool);
const userRepository     = new PgUserRepository(pool);
const auditLogRepository = new PgAuditLogRepository(pool);

const registerPartnerUseCase = new RegisterPartnerUseCase(partnerRepository, userRepository);
const getPartnerUseCase = new GetPartnerUseCase(partnerRepository);
const approvePartnerUseCase = new ApprovePartnerUseCase(partnerRepository, userRepository, auditLogRepository);
const submitPartnerForReviewUseCase = new SubmitPartnerForReviewUseCase(partnerRepository, userRepository);
const updatePartnerUseCase = new UpdatePartnerUseCase(partnerRepository, userRepository);
const rejectPartnerUseCase = new RejectPartnerUseCase(partnerRepository, userRepository, auditLogRepository);
const suspendPartnerUseCase = new SuspendPartnerUseCase(partnerRepository, userRepository, auditLogRepository);
const reactivatePartnerUseCase = new ReactivatePartnerUseCase(partnerRepository, userRepository, auditLogRepository);
const updatePartnerOperationalStatusUseCase = new UpdatePartnerOperationalStatusUseCase(partnerRepository, userRepository);
const listUserPartnersUseCase = new ListUserPartnersUseCase(partnerRepository);
const listAdminPartnersUseCase = new ListAdminPartnersUseCase(partnerRepository, userRepository);
const listPublicPartnersUseCase = new ListPublicPartnersUseCase(partnerRepository);

const partnerController = new PartnerController(
  registerPartnerUseCase,
  getPartnerUseCase,
  approvePartnerUseCase,
  submitPartnerForReviewUseCase,
  updatePartnerUseCase,
  rejectPartnerUseCase,
  suspendPartnerUseCase,
  reactivatePartnerUseCase,
  updatePartnerOperationalStatusUseCase,
  listUserPartnersUseCase,
  listAdminPartnersUseCase,
  listPublicPartnersUseCase
);

// ══════════════════════════════════════════════════════════════
// ⚠️ ATENÇÃO: Rotas específicas (/partners/me/all e /partners/me)
// DEVEM ser registradas ANTES das rotas parametrizadas (/partners/:id)
// ══════════════════════════════════════════════════════════════

// --- Rotas Autenticadas (Dono / Parceiro) ---
// Listar os parceiros administrados pelo usuário logado
router.get('/partners/me/all', authMiddleware, (req, res) => partnerController.listUserPartners(req, res));

// Obter o primeiro parceiro cadastrado do usuário logado (legado)
router.get('/partners/me', authMiddleware, (req, res) => {
  req.params.id = ''; // força busca por req.user.id no GetPartnerUseCase
  const getPartnerUseCaseCompat = new GetPartnerUseCase(partnerRepository);
  getPartnerUseCaseCompat.execute({ userId: req.user?.id }).then(result => {
    if (result.isFailure) return res.status(404).json({ success: false, error: result.getError() });
    return res.status(200).json({ success: true, data: result.getValue() });
  }).catch(err => res.status(500).json({ success: false, error: err.message }));
});

// Cadastrar um novo parceiro
router.post('/partners', authMiddleware, (req, res) => partnerController.register(req, res));

// Submeter parceiro para revisão
router.post('/partners/:id/submit', authMiddleware, (req, res) => partnerController.submitForReview(req, res));

// Atualizar status operacional (Ativo, Inativo, Fechado)
router.patch('/partners/:id/operational-status', authMiddleware, (req, res) => partnerController.updateOperationalStatus(req, res));

// Atualizar cadastro do parceiro
router.put('/partners/:id', authMiddleware, (req, res) => partnerController.update(req, res));

// --- Rotas Públicas e Parametrizadas ---
// Listar parceiros públicos
router.get('/partners', (req, res) => partnerController.listPublicPartners(req, res));

// Obter dados de um parceiro específico
router.get('/partners/:id', (req, res) => partnerController.getPartner(req, res));

// --- Rotas Administrativas (Administração) ---
// Listar todos os parceiros para moderação
router.get('/admin/partners', authMiddleware, adminOnlyMiddleware, (req, res) => partnerController.listAdminPartners(req, res));

// Aprovar parceiro
router.post('/partners/:id/approve', authMiddleware, adminOnlyMiddleware, (req, res) => partnerController.approve(req, res));

// Rejeitar parceiro (exige motivo no body)
router.post('/partners/:id/reject', authMiddleware, adminOnlyMiddleware, (req, res) => partnerController.reject(req, res));

// Suspender parceiro (exige motivo no body)
router.post('/partners/:id/suspend', authMiddleware, adminOnlyMiddleware, (req, res) => partnerController.suspend(req, res));

// Reativar parceiro
router.post('/partners/:id/reactivate', authMiddleware, adminOnlyMiddleware, (req, res) => partnerController.reactivate(req, res));

export { router as partnerRouter };
