// backend/src/interfaces/http/routes/order.routes.ts
import { Router } from 'express';
import { pool } from '../../../infrastructure/database/connection';
import { PgOrderRepository } from '../../../infrastructure/database/order/PgOrderRepository';
import { PgProductCatalogRepository } from '../../../infrastructure/database/catalog/PgProductCatalogRepository';
import { PgPartnerRepository } from '../../../infrastructure/database/partner/PgPartnerRepository';
import { PgFoodProfileRepository } from '../../../infrastructure/database/food-profile/PgFoodProfileRepository';

import { PgPaymentRepository } from '../../../infrastructure/database/payment/PgPaymentRepository';
import { PgPaymentRefundRepository } from '../../../infrastructure/database/payment/PgPaymentRefundRepository';
import { PgAuditLogRepository } from '../../../infrastructure/database/audit/PgAuditLogRepository';
import { PgReportRepository } from '../../../infrastructure/database/admin/PgReportRepository';
import { PgConsumerRepository } from '../../../infrastructure/database/consumer/PgConsumerRepository';
import { AsaasPaymentGateway } from '../../../infrastructure/gateways/AsaasPaymentGateway';
import { RefundPaymentUseCase } from '../../../application/payment/RefundPaymentUseCase';

import { CreateOrderUseCase } from '../../../application/order/CreateOrderUseCase';
import { CancelOrderUseCase } from '../../../application/order/CancelOrderUseCase';
import { GetOrderUseCase } from '../../../application/order/GetOrderUseCase';
import { ListConsumerOrdersUseCase } from '../../../application/order/ListConsumerOrdersUseCase';
import { ListPartnerOrdersUseCase } from '../../../application/order/ListPartnerOrdersUseCase';
import { UpdateOrderStatusUseCase } from '../../../application/order/UpdateOrderStatusUseCase';
import { ReportOrderNonPaymentUseCase } from '../../../application/order/ReportOrderNonPaymentUseCase';
import { CancelExpiredOrdersUseCase } from '../../../application/order/CancelExpiredOrdersUseCase';
import { OrderExpirationWorker } from '../../../infrastructure/workers/OrderExpirationWorker';
import { sseOrderNotificationHub } from '../../../infrastructure/notifications/SseOrderNotificationHub';

import { OrderController } from '../controllers/order/OrderController';
import { authMiddleware } from '../middlewares/AuthMiddleware';

const router = Router();

// --- Composition Root ---
const orderRepository = new PgOrderRepository(pool);
const productRepository = new PgProductCatalogRepository(pool);
const partnerRepository = new PgPartnerRepository(pool);
const foodProfileRepository = new PgFoodProfileRepository(pool);
const paymentRepository = new PgPaymentRepository(pool);
const paymentRefundRepository = new PgPaymentRefundRepository(pool);
const auditLogRepository = new PgAuditLogRepository(pool);
const reportRepository = new PgReportRepository(pool);
const consumerRepository = new PgConsumerRepository(pool);
const paymentGateway = new AsaasPaymentGateway();

const refundPaymentUseCase = new RefundPaymentUseCase(
  paymentRepository,
  paymentRefundRepository,
  paymentGateway,
  auditLogRepository
);

const cancelExpiredOrdersUseCase = new CancelExpiredOrdersUseCase(
  orderRepository,
  paymentRepository,
  refundPaymentUseCase,
  sseOrderNotificationHub,
  auditLogRepository
);

// Inicializa o worker em segundo plano para varredura ultra-leve (intervalo de 60s)
const orderExpirationWorker = new OrderExpirationWorker(cancelExpiredOrdersUseCase);
orderExpirationWorker.start();

const createOrderUseCase = new CreateOrderUseCase(
  orderRepository,
  productRepository,
  partnerRepository,
  foodProfileRepository
);
const cancelOrderUseCase = new CancelOrderUseCase(
  orderRepository,
  partnerRepository,
  paymentRepository,
  refundPaymentUseCase
);
const getOrderUseCase = new GetOrderUseCase(
  orderRepository,
  partnerRepository,
  cancelExpiredOrdersUseCase
);
const listConsumerOrdersUseCase = new ListConsumerOrdersUseCase(orderRepository);
const listPartnerOrdersUseCase = new ListPartnerOrdersUseCase(orderRepository, partnerRepository);
const updateOrderStatusUseCase = new UpdateOrderStatusUseCase(
  orderRepository,
  partnerRepository,
  sseOrderNotificationHub,
  paymentRepository
);
const reportOrderNonPaymentUseCase = new ReportOrderNonPaymentUseCase(
  orderRepository,
  partnerRepository,
  paymentRepository,
  reportRepository,
  consumerRepository,
  sseOrderNotificationHub,
  auditLogRepository
);

const orderController = new OrderController(
  createOrderUseCase,
  cancelOrderUseCase,
  getOrderUseCase,
  listConsumerOrdersUseCase,
  listPartnerOrdersUseCase,
  updateOrderStatusUseCase,
  reportOrderNonPaymentUseCase
);

// Rotas de Pedidos (Orders)
router.post('/', authMiddleware, (req, res) => orderController.createOrder(req, res));
router.get('/me', authMiddleware, (req, res) => orderController.listMyOrders(req, res));

// Rota de Notificações em Tempo Real (Server-Sent Events — SSE)
router.get('/stream', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  if (!user || !user.id) {
    res.status(401).json({ error: 'Usuário não autenticado.' });
    return;
  }

  // Identificar estabelecimentos do parceiro associados ao usuário
  const userPartners = await partnerRepository.findAllByUserId(user.id);
  const userPartnerIds = userPartners.map((p) => p.id);

  // Se o parceiro especificou um partnerId na query, valida que pertence a ele (ou admin)
  const requestedPartnerId = typeof req.query.partnerId === 'string' ? req.query.partnerId : undefined;
  if (requestedPartnerId && user.role !== 'ADMIN' && !userPartnerIds.includes(requestedPartnerId)) {
    res.status(403).json({ error: 'Acesso negado ao canal deste parceiro comercial.' });
    return;
  }

  const targetPartnerId = requestedPartnerId || (userPartnerIds.length > 0 ? userPartnerIds[0] : undefined);

  // Configuração de socket e cabeçalhos HTTP obrigatórios para Server-Sent Events (SSE)
  if (req.socket) {
    req.socket.setTimeout(0);
    req.socket.setNoDelay(true);
    req.socket.setKeepAlive(true);
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();

  const clientId = `sse_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  sseOrderNotificationHub.addClient({
    id: clientId,
    userId: user.id,
    partnerId: targetPartnerId,
    partnerIds: userPartnerIds,
    userRole: user.role,
    res,
  });

  // Mensagem inicial de conexão imediata
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId, partnerId: targetPartnerId, timestamp: new Date().toISOString() })}\n\n`);
  (res as any).flush?.();

  req.on('close', () => {
    sseOrderNotificationHub.removeClient(clientId);
  });
});

router.get('/:id', authMiddleware, (req, res) => orderController.getOrder(req, res));
router.get('/partner/:partnerId', authMiddleware, (req, res) => orderController.listPartnerOrders(req, res));
router.post('/:id/cancel', authMiddleware, (req, res) => orderController.cancelOrder(req, res));
router.patch('/:id/status', authMiddleware, (req, res) => orderController.updateStatus(req, res));
router.post('/:id/report-non-payment', authMiddleware, (req, res) => orderController.reportNonPayment(req, res));
router.post('/:id/report-problem', authMiddleware, (req, res) => orderController.reportNonPayment(req, res));
router.post('/test-notification', (req, res) => {
  sseOrderNotificationHub.broadcastTestNotification(req.body || {});
  res.json({ success: true, message: 'Notificação de teste transmitida com sucesso!' });
});

export default router;
