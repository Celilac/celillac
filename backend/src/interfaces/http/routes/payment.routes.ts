// backend/src/interfaces/http/routes/payment.routes.ts
import { Router } from 'express';
import { pool } from '../../../infrastructure/database/connection';

import { PgPaymentRepository } from '../../../infrastructure/database/payment/PgPaymentRepository';
import { PgPartnerFinancialAccountRepository } from '../../../infrastructure/database/payment/PgPartnerFinancialAccountRepository';
import { PgOrderRepository } from '../../../infrastructure/database/order/PgOrderRepository';
import { PgPartnerRepository } from '../../../infrastructure/database/partner/PgPartnerRepository';
import { PgAuditLogRepository } from '../../../infrastructure/database/audit/PgAuditLogRepository';
import { PgConsumerRepository } from '../../../infrastructure/database/consumer/PgConsumerRepository';
import { AsaasPaymentGateway } from '../../../infrastructure/gateways/AsaasPaymentGateway';

import { CheckoutOrderUseCase } from '../../../application/payment/CheckoutOrderUseCase';
import { SetupPartnerFinancialAccountUseCase } from '../../../application/payment/SetupPartnerFinancialAccountUseCase';
import { HandleAsaasWebhookUseCase } from '../../../application/payment/HandleAsaasWebhookUseCase';
import { sseOrderNotificationHub } from '../../../infrastructure/notifications/SseOrderNotificationHub';

import { PaymentController } from '../controllers/payment/PaymentController';
import { WebhookController } from '../controllers/payment/WebhookController';
import { authMiddleware } from '../middlewares/AuthMiddleware';
import { createRateLimiter, getClientIp } from '../middlewares/RateLimitMiddleware';

const router = Router();

// Rate limiter específico e rigoroso para checkout (5 tentativas por minuto por usuário/IP)
const checkoutRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Muitas tentativas de pagamento consecutivas. Por favor, aguarde 1 minuto antes de tentar novamente.',
  keyGenerator: (req) => (req as any).user?.id || getClientIp(req),
});

// --- Composition Root ---
const paymentRepository = new PgPaymentRepository(pool);
const financialAccountRepository = new PgPartnerFinancialAccountRepository(pool);
const orderRepository = new PgOrderRepository(pool);
const partnerRepository = new PgPartnerRepository(pool);
const auditLogRepository = new PgAuditLogRepository(pool);
const consumerRepository = new PgConsumerRepository(pool);
const paymentGateway = new AsaasPaymentGateway();

const checkoutOrderUseCase = new CheckoutOrderUseCase(
  orderRepository,
  paymentRepository,
  financialAccountRepository,
  paymentGateway,
  consumerRepository,
  sseOrderNotificationHub,
  auditLogRepository
);

const setupFinancialAccountUseCase = new SetupPartnerFinancialAccountUseCase(
  partnerRepository,
  financialAccountRepository,
  paymentGateway,
  auditLogRepository
);

const handleAsaasWebhookUseCase = new HandleAsaasWebhookUseCase(
  paymentRepository,
  orderRepository,
  auditLogRepository,
  sseOrderNotificationHub
);

const paymentController = new PaymentController(
  checkoutOrderUseCase,
  setupFinancialAccountUseCase,
  paymentRepository,
  financialAccountRepository,
  orderRepository,
  partnerRepository
);

const webhookController = new WebhookController(handleAsaasWebhookUseCase);

// Rotas de Checkout e Pagamentos (Celíaco)
router.post('/checkout', authMiddleware, checkoutRateLimiter, (req, res) => paymentController.checkout(req, res));
router.get('/order/:orderId', authMiddleware, (req, res) => paymentController.getPaymentByOrderId(req, res));

// Rotas de Subconta e Gestão Financeira (Parceiro)
router.post('/partner/:partnerId/financial-account', authMiddleware, (req, res) =>
  paymentController.setupFinancialAccount(req, res)
);
router.get('/partner/:partnerId/financial-account', authMiddleware, (req, res) =>
  paymentController.getPartnerFinancialAccount(req, res)
);

// Webhook Asaas (Notificações Assíncronas de Pagamento e Estorno)
router.post('/webhook/asaas', (req, res) => webhookController.handleAsaas(req, res));

export default router;
