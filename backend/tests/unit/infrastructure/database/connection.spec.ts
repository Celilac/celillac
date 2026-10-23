// backend/tests/unit/infrastructure/database/connection.spec.ts
import { pool } from '../../../../src/infrastructure/database/connection';

describe('Database Connection Pool Configuration', () => {
  it('deve configurar o pool com capacidade expandida de no mínimo 35 conexões para escalabilidade na VPS', () => {
    const options = (pool as any).options;
    expect(options).toBeDefined();
    expect(options.max).toBe(35);
  });

  it('deve definir timeouts defensivos para liberar conexões ociosas e evitar bloqueios', () => {
    const options = (pool as any).options;
    expect(options.idleTimeoutMillis).toBe(30000);
    expect(options.connectionTimeoutMillis).toBe(5000);
  });
});
