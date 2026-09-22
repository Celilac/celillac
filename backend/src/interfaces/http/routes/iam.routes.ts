// backend/src/interfaces/http/routes/iam.routes.ts
import { Router } from 'express';

import { pool } from '../../../infrastructure/database/connection';
import { PgUserRepository } from '../../../infrastructure/database/iam/PgUserRepository';
import { PgBlacklistTokenRepository } from '../../../infrastructure/database/iam/PgBlacklistTokenRepository';
import { PgEmailVerificationRepository } from '../../../infrastructure/database/iam/PgEmailVerificationRepository';
import { PgPasswordResetRepository } from '../../../infrastructure/database/iam/PgPasswordResetRepository';
import { EmailServiceFactory } from '../../../infrastructure/services/EmailServiceFactory';

import { RegisterUserUseCase } from '../../../application/iam/RegisterUserUseCase';
import { LoginUserUseCase } from '../../../application/iam/LoginUserUseCase';
import { LogoutUserUseCase } from '../../../application/iam/LogoutUserUseCase';
import { UpdateUserProfileUseCase } from '../../../application/iam/UpdateUserProfileUseCase';
import { SendEmailVerificationCodeUseCase } from '../../../application/iam/SendEmailVerificationCodeUseCase';
import { VerifyEmailCodeUseCase } from '../../../application/iam/VerifyEmailCodeUseCase';
import { RequestPasswordResetUseCase } from '../../../application/iam/RequestPasswordResetUseCase';
import { ResetPasswordUseCase } from '../../../application/iam/ResetPasswordUseCase';

import { RegisterUserController } from '../controllers/iam/RegisterUserController';
import { LoginUserController } from '../controllers/iam/LoginUserController';
import { LogoutUserController } from '../controllers/iam/LogoutUserController';
import { UpdateUserProfileController } from '../controllers/iam/UpdateUserProfileController';
import { GetUserProfileController } from '../controllers/iam/GetUserProfileController';
import { VerifyEmailCodeController } from '../controllers/iam/VerifyEmailCodeController';
import { ResendEmailVerificationCodeController } from '../controllers/iam/ResendEmailVerificationCodeController';
import { RequestPasswordResetController } from '../controllers/iam/RequestPasswordResetController';
import { ResetPasswordController } from '../controllers/iam/ResetPasswordController';

import { authMiddleware } from '../middlewares/AuthMiddleware';
import { createRateLimiter } from '../middlewares/RateLimitMiddleware';

const router = Router();

// Composition Root
const userRepository = new PgUserRepository(pool);
const blacklistRepository = new PgBlacklistTokenRepository(pool);
const emailVerificationRepository = new PgEmailVerificationRepository(pool);
const passwordResetRepository = new PgPasswordResetRepository(pool);
const emailService = EmailServiceFactory.getService();

const sendEmailVerificationCodeUseCase = new SendEmailVerificationCodeUseCase(
  userRepository,
  emailVerificationRepository,
  emailService,
);

const verifyEmailCodeUseCase = new VerifyEmailCodeUseCase(
  userRepository,
  emailVerificationRepository,
);

const requestPasswordResetUseCase = new RequestPasswordResetUseCase(
  userRepository,
  passwordResetRepository,
  emailService,
);

const resetPasswordUseCase = new ResetPasswordUseCase(
  userRepository,
  passwordResetRepository,
);

const registerUserUseCase = new RegisterUserUseCase(
  userRepository,
  sendEmailVerificationCodeUseCase,
  emailService,
);
const loginUserUseCase = new LoginUserUseCase(userRepository);
const logoutUserUseCase = new LogoutUserUseCase(blacklistRepository);
const updateUserProfileUseCase = new UpdateUserProfileUseCase(userRepository);

const registerUserController = new RegisterUserController(registerUserUseCase);
const loginUserController = new LoginUserController(loginUserUseCase);
const logoutUserController = new LogoutUserController(logoutUserUseCase);
const updateUserProfileController = new UpdateUserProfileController(updateUserProfileUseCase);
const getUserProfileController = new GetUserProfileController(userRepository);
const verifyEmailCodeController = new VerifyEmailCodeController(verifyEmailCodeUseCase);
const resendEmailVerificationCodeController = new ResendEmailVerificationCodeController(sendEmailVerificationCodeUseCase);
const requestPasswordResetController = new RequestPasswordResetController(requestPasswordResetUseCase);
const resetPasswordController = new ResetPasswordController(resetPasswordUseCase);

// Middlewares de Limitação de Taxa (Rate Limit) para proteção de endpoints com envio de e-mails
const passwordResetRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 3,                   // máximo 3 tentativas por IP a cada 15 minutos
  message: 'Muitas tentativas de recuperação de senha a partir deste endereço IP. Por favor, aguarde 15 minutos antes de tentar novamente.',
});

const emailVerificationRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 3,                   // máximo 3 reenvios de código por IP a cada 15 minutos
  message: 'Muitas tentativas de reenvio de código de verificação a partir deste endereço IP. Por favor, aguarde 15 minutos antes de tentar novamente.',
});

// Rotas IAM
router.post('/register', (req, res) => registerUserController.execute(req, res));
router.post('/login', (req, res) => loginUserController.execute(req, res));
router.post('/logout', authMiddleware, (req, res) => logoutUserController.execute(req, res));
router.get('/me', authMiddleware, (req, res) => getUserProfileController.execute(req, res));
router.put('/profile', authMiddleware, (req, res) => updateUserProfileController.execute(req, res));

// Rotas de Recuperação de Senha via OTP (Públicas)
router.post('/password-reset/request', passwordResetRateLimiter, (req, res) => requestPasswordResetController.execute(req, res));
router.post('/password-reset/confirm', (req, res) => resetPasswordController.execute(req, res));

// Rotas de Verificação de E-mail via OTP
router.post('/email-verification/verify', authMiddleware, (req, res) => verifyEmailCodeController.execute(req, res));
router.post('/email-verification/resend', authMiddleware, emailVerificationRateLimiter, (req, res) => resendEmailVerificationCodeController.execute(req, res));

export { router as iamRouter };
