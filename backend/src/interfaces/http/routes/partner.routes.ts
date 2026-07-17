// backend/src/interfaces/http/routes/partner.routes.ts
import { Router } from 'express';
import { pool } from '../../../infrastructure/database/connection';
import { PgPartnerRepository } from '../../../infrastructure/database/partner/PgPartnerRepository';
import { PgUserRepository } from '../../../infrastructure/database/iam/PgUserRepository';
import { RegisterPartnerUseCase } from '../../../application/partner/RegisterPartnerUseCase';
import { GetPartnerUseCase } from '../../../application/partner/GetPartnerUseCase';
import { RegisterPartnerController } from '../controllers/partner/RegisterPartnerController';
import { GetPartnerController } from '../controllers/partner/GetPartnerController';
import { authMiddleware } from '../middlewares/AuthMiddleware';

const router = Router();

// --- Composition Root ---
const partnerRepository = new PgPartnerRepository(pool);
const userRepository = new PgUserRepository(pool);

const registerPartnerUseCase = new RegisterPartnerUseCase(partnerRepository, userRepository);
const getPartnerUseCase = new GetPartnerUseCase(partnerRepository);

const registerPartnerController = new RegisterPartnerController(registerPartnerUseCase);
const getPartnerController = new GetPartnerController(getPartnerUseCase);

// --- Rotas ---
// Cadastro de parceiro (restrito a usuários logados com role PARCEIRO)
router.post('/partners', authMiddleware, (req, res) => registerPartnerController.execute(req, res));

// Obter dados do parceiro logado
router.get('/partners/me', authMiddleware, (req, res) => getPartnerController.execute(req, res));

// Obter dados públicos de um parceiro
router.get('/partners/:id', (req, res) => getPartnerController.execute(req, res));

export { router as partnerRouter };
