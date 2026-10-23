// backend/tests/unit/infrastructure/cache/CacheService.spec.ts
import { CacheService } from '../../../../src/infrastructure/cache/CacheService';

describe('CacheService (Híbrido Resiliente em Memória)', () => {
  let cache: CacheService;

  beforeEach(() => {
    cache = new CacheService({ maxEntries: 100, defaultTtlSeconds: 60 });
  });

  afterEach(async () => {
    await cache.clear();
  });

  it('deve armazenar e recuperar um valor tipado', async () => {
    await cache.set('user:123', { name: 'Everton', role: 'ADMIN' }, 10);
    const result = await cache.get<{ name: string; role: string }>('user:123');

    expect(result).toEqual({ name: 'Everton', role: 'ADMIN' });
  });

  it('deve retornar null para chaves inexistentes', async () => {
    const result = await cache.get('chave:inexistente');
    expect(result).toBeNull();
  });

  it('deve expirar itens após o tempo de TTL', async () => {
    // TTL de 1 segundo
    await cache.set('token:temp', 'valor', 1);

    expect(await cache.get('token:temp')).toBe('valor');

    // Avança o tempo ou simula expiração
    await new Promise((resolve) => setTimeout(resolve, 1100));

    expect(await cache.get('token:temp')).toBeNull();
  });

  it('deve excluir uma chave específica com del', async () => {
    await cache.set('item:1', 'teste');
    expect(await cache.get('item:1')).toBe('teste');

    await cache.del('item:1');
    expect(await cache.get('item:1')).toBeNull();
  });

  it('deve invalidar chaves que coincidam com um padrão de prefixo (flushPattern)', async () => {
    await cache.set('catalog:search:gluten_free', { total: 10 });
    await cache.set('catalog:search:lactose_free', { total: 5 });
    await cache.set('partner:profile:123', { name: 'Padaria' });

    await cache.flushPattern('catalog:search:*');

    expect(await cache.get('catalog:search:gluten_free')).toBeNull();
    expect(await cache.get('catalog:search:lactose_free')).toBeNull();
    expect(await cache.get('partner:profile:123')).toEqual({ name: 'Padaria' });
  });

  it('deve respeitar o limite máximo de entradas (evitando estouro de memória)', async () => {
    const smallCache = new CacheService({ maxEntries: 3, defaultTtlSeconds: 60 });

    await smallCache.set('k1', 1);
    await smallCache.set('k2', 2);
    await smallCache.set('k3', 3);
    await smallCache.set('k4', 4); // Deve descartar a mais antiga (k1)

    expect(await smallCache.get('k1')).toBeNull();
    expect(await smallCache.get('k2')).toBe(2);
    expect(await smallCache.get('k3')).toBe(3);
    expect(await smallCache.get('k4')).toBe(4);
  });
});
