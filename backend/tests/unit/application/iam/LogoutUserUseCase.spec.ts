// backend/tests/unit/application/iam/LogoutUserUseCase.spec.ts
import jwt from 'jsonwebtoken';
import { LogoutUserUseCase } from '../../../../src/application/iam/LogoutUserUseCase';
import { IBlacklistTokenRepository } from '../../../../src/domain/iam/repositories/IBlacklistTokenRepository';

class InMemoryBlacklistTokenRepository implements IBlacklistTokenRepository {
  private blacklisted: Map<string, Date> = new Map();

  async add(token: string, expiresAt: Date): Promise<void> {
    this.blacklisted.set(token, expiresAt);
  }

  async isBlacklisted(token: string): Promise<boolean> {
    return this.blacklisted.has(token);
  }

  getExpiresAt(token: string): Date | undefined {
    return this.blacklisted.get(token);
  }
}

describe('LogoutUserUseCase', () => {
  let blacklistRepository: InMemoryBlacklistTokenRepository;
  let useCase: LogoutUserUseCase;
  const secret = 'jwt-test-secret-value';

  beforeEach(() => {
    process.env.JWT_SECRET = secret;
    blacklistRepository = new InMemoryBlacklistTokenRepository();
    useCase = new LogoutUserUseCase(blacklistRepository);
  });

  it('deve revogar um token válido e armazená-lo com a data de expiração correta', async () => {
    // 1. Gerar token válido expirando em 1 hora
    const token = jwt.sign({ sub: 'user-123', role: 'CELIACO' }, secret, { expiresIn: '1h' });
    const decoded = jwt.decode(token) as { exp: number };
    const expectedExpiration = new Date(decoded.exp * 1000);

    // 2. Executar caso de uso
    const result = await useCase.execute({ token });

    // 3. Asserções
    expect(result.isSuccess).toBe(true);
    
    const isBlacklisted = await blacklistRepository.isBlacklisted(token);
    expect(isBlacklisted).toBe(true);
    
    const storedExpiration = blacklistRepository.getExpiresAt(token);
    expect(storedExpiration?.getTime()).toBeCloseTo(expectedExpiration.getTime(), -3); // tolerância de ms
  });

  it('deve usar a expiração fallback de 7 dias se o token não contiver o campo exp', async () => {
    // 1. Gerar token sem expiração definida (mas o jwt.sign gera exp quando especificamos,
    // então usaremos jwt.decode simulado ou simplesmente assinamos sem expiração passando expiresIn undefined)
    const token = jwt.sign({ sub: 'user-123', role: 'CELIACO' }, secret);
    const beforeCall = Date.now();

    // 2. Executar caso de uso
    const result = await useCase.execute({ token });

    // 3. Asserções
    expect(result.isSuccess).toBe(true);
    
    const storedExpiration = blacklistRepository.getExpiresAt(token);
    expect(storedExpiration).toBeDefined();
    
    const diffMs = (storedExpiration as Date).getTime() - beforeCall;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    // O valor do diff deve ser aproximadamente 7 dias (tolerância de 5 segundos)
    expect(Math.abs(diffMs - sevenDaysMs)).toBeLessThan(5000);
  });

  it('deve retornar falha se o token não for fornecido', async () => {
    const result = await useCase.execute({ token: '' });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('Token não fornecido.');
  });
});
