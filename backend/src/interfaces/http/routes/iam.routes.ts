// backend/src/interfaces/http/routes/iam.routes.ts
import { Router } from 'express';

import { pool } from '../../../infrastructure/database/connection';
import { PgUserRepository } from '../../../infrastructure/database/iam/PgUserRepository';
import { PgBlacklistTokenRepository } from '../../../infrastructure/database/iam/PgBlacklistTokenRepository';
import { RegisterUserUseCase } from '../../../application/iam/RegisterUserUseCase';
import { LoginUserUseCase } from '../../../application/iam/LoginUserUseCase';
import { LogoutUserUseCase } from '../../../application/iam/LogoutUserUseCase';
import { RegisterUserController } from '../controllers/iam/RegisterUserController';
import { LoginUserController } from '../controllers/iam/LoginUserController';
import { LogoutUserController } from '../controllers/iam/LogoutUserController';
import { authMiddleware } from '../middlewares/AuthMiddleware';

const router = Router();

// --- Composição das dependências (Composition Root) ---
const userRepository       = new PgUserRepository(pool);
const blacklistRepository  = new PgBlacklistTokenRepository(pool);

const registerUserUseCase  = new RegisterUserUseCase(userRepository);
const loginUserUseCase     = new LoginUserUseCase(userRepository);
const logoutUserUseCase    = new LogoutUserUseCase(blacklistRepository);

const registerUserController = new RegisterUserController(registerUserUseCase);
const loginUserController    = new LoginUserController(loginUserUseCase);
const logoutUserController   = new LogoutUserController(logoutUserUseCase);

// --- Definição das rotas IAM ---
router.post('/register', (req, res) => registerUserController.execute(req, res));
router.post('/login',    (req, res) => loginUserController.execute(req, res));
router.post('/logout',   authMiddleware, (req, res) => logoutUserController.execute(req, res));

export { router as iamRouter };
