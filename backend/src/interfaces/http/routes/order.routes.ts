// backend/src/interfaces/http/routes/order.routes.ts
import { Router } from 'express';
import { pool } from '../../../infrastructure/database/connection';
import { PgOrderRepository } from '../../../infrastructure/database/order/PgOrderRepository';
import { PgProductCatalogRepository } from '../../../infrastructure/database/catalog/PgProductCatalogRepository';
import { PgPartnerRepository } from '../../../infrastructure/database/partner/PgPartnerRepository';
import { PgFoodProfileRepository } from '../../../infrastructure/database/food-profile/PgFoodProfileRepository';

import { CreateOrderUseCase } from '../../../application/order/CreateOrderUseCase';
import { CancelOrderUseCase } from '../../../application/order/CancelOrderUseCase';
import { GetOrderUseCase } from '../../../application/order/GetOrderUseCase';
import { ListConsumerOrdersUseCase } from '../../../application/order/ListConsumerOrdersUseCase';
import { ListPartnerOrdersUseCase } from '../../../application/order/ListPartnerOrdersUseCase';
import { UpdateOrderStatusUseCase } from '../../../application/order/UpdateOrderStatusUseCase';

import { OrderController } from '../controllers/order/OrderController';
import { authMiddleware } from '../middlewares/AuthMiddleware';

const router = Router();

// --- Composition Root ---
const orderRepository = new PgOrderRepository(pool);
const productRepository = new PgProductCatalogRepository(pool);
const partnerRepository = new PgPartnerRepository(pool);
const foodProfileRepository = new PgFoodProfileRepository(pool);

const createOrderUseCase = new CreateOrderUseCase(
  orderRepository,
  productRepository,
  partnerRepository,
  foodProfileRepository
);
const cancelOrderUseCase = new CancelOrderUseCase(orderRepository, partnerRepository);
const getOrderUseCase = new GetOrderUseCase(orderRepository, partnerRepository);
const listConsumerOrdersUseCase = new ListConsumerOrdersUseCase(orderRepository);
const listPartnerOrdersUseCase = new ListPartnerOrdersUseCase(orderRepository, partnerRepository);
const updateOrderStatusUseCase = new UpdateOrderStatusUseCase(orderRepository, partnerRepository);

const orderController = new OrderController(
  createOrderUseCase,
  cancelOrderUseCase,
  getOrderUseCase,
  listConsumerOrdersUseCase,
  listPartnerOrdersUseCase,
  updateOrderStatusUseCase
);

// Rotas de Pedidos (Orders)
router.post('/', authMiddleware, (req, res) => orderController.createOrder(req, res));
router.get('/me', authMiddleware, (req, res) => orderController.listMyOrders(req, res));
router.get('/:id', authMiddleware, (req, res) => orderController.getOrder(req, res));
router.get('/partner/:partnerId', authMiddleware, (req, res) => orderController.listPartnerOrders(req, res));
router.post('/:id/cancel', authMiddleware, (req, res) => orderController.cancelOrder(req, res));
router.patch('/:id/status', authMiddleware, (req, res) => orderController.updateStatus(req, res));

export default router;
