// backend/src/interfaces/http/routes/iam.routes.ts
import { Router } from 'express';

import { pool } from '../../../infrastructure/database/connection';
import { PgUserRepository } from '../../../infrastructure/database/iam/PgUserRepository';
import { RegisterUserUseCase } from '../../../application/iam/RegisterUserUseCase';
import { LoginUserUseCase } from '../../../application/iam/LoginUserUseCase';
import { RegisterUserController } from '../controllers/iam/RegisterUserController';
import { LoginUserController } from '../controllers/iam/LoginUserController';

const router = Router();

// --- Composição das dependências (Composition Root) ---
const userRepository       = new PgUserRepository(pool);
const registerUserUseCase  = new RegisterUserUseCase(userRepository);
const loginUserUseCase     = new LoginUserUseCase(userRepository);
const registerUserController = new RegisterUserController(registerUserUseCase);
const loginUserController    = new LoginUserController(loginUserUseCase);

// --- Definição das rotas IAM ---
router.post('/register', (req, res) => registerUserController.execute(req, res));
router.post('/login',    (req, res) => loginUserController.execute(req, res));

export { router as iamRouter };
