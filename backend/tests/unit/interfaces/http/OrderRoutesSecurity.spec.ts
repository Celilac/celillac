// backend/tests/unit/interfaces/http/OrderRoutesSecurity.spec.ts
import fs from 'fs';
import path from 'path';

describe('Order Routes Security Guardrails', () => {
  const orderRoutesPath = path.resolve(__dirname, '../../../../src/interfaces/http/routes/order.routes.ts');
  const hubPath = path.resolve(__dirname, '../../../../src/infrastructure/notifications/SseOrderNotificationHub.ts');

  it('não deve conter a rota não autenticada POST /test-notification em order.routes.ts', () => {
    const content = fs.readFileSync(orderRoutesPath, 'utf-8');

    // Nenhuma rota para /test-notification pode existir no arquivo
    expect(content).not.toContain('/test-notification');
    expect(content).not.toContain('broadcastTestNotification');
  });

  it('deve garantir que SseOrderNotificationHub não possui o método broadcastTestNotification', () => {
    const content = fs.readFileSync(hubPath, 'utf-8');

    expect(content).not.toContain('broadcastTestNotification');
  });
});
