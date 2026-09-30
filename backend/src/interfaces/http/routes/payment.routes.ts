// backend/src/interfaces/http/routes/payment.routes.ts
import { Router } from 'express';
import { pool } from '../../../infrastructure/database/connection';

import { PgPaymentRepository } from '../../../infrastructure/database/payment/PgPaymentRepository';
import { PgPartnerFinancialAccountRepository } from '../../../infrastructure/database/payment/PgPartnerFinancialAccountRepository';
import { PgOrderRepository } from '../../../infrastructure/database/order/PgOrderRepository';
import { PgPartnerRepository } from '../../../infrastructure/database/partner/PgPartnerRepository';
import { AsaasPaymentGateway } from '../../../infrastructure/gateways/AsaasPaymentGateway';

import { CheckoutOrderUseCase } from '../../../application/payment/CheckoutOrderUseCase';
import { SetupPartnerFinancialAccountUseCase } from '../../../application/payment/SetupPartnerFinancialAccountUseCase';
import { HandleAsaasWebhookUseCase } from '../../../application/payment/HandleAsaasWebhookUseCase';

import { PaymentController } from '../controllers/payment/PaymentController';
import { WebhookController } from '../controllers/payment/WebhookController';
import { authMiddleware } from '../middlewares/AuthMiddleware';

const router = Router();

// --- Composition Root ---
const paymentRepository = new PgPaymentRepository(pool);
const financialAccountRepository = new PgPartnerFinancialAccountRepository(pool);
const orderRepository = new PgOrderRepository(pool);
const partnerRepository = new PgPartnerRepository(pool);
const paymentGateway = new AsaasPaymentGateway();

const checkoutOrderUseCase = new CheckoutOrderUseCase(
  orderRepository,
  paymentRepository,
  financialAccountRepository,
  paymentGateway
);

const setupFinancialAccountUseCase = new SetupPartnerFinancialAccountUseCase(
  partnerRepository,
  financialAccountRepository,
  paymentGateway
);

const handleAsaasWebhookUseCase = new HandleAsaasWebhookUseCase(
  paymentRepository,
  orderRepository
);

const paymentController = new PaymentController(
  checkoutOrderUseCase,
  setupFinancialAccountUseCase,
  paymentRepository,
  financialAccountRepository
);

const webhookController = new WebhookController(handleAsaasWebhookUseCase);

// Rotas de Checkout e Pagamentos (Celíaco)
router.post('/checkout', authMiddleware, (req, res) => paymentController.checkout(req, res));
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
