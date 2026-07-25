// backend/tests/unit/interfaces/http/middlewares/AuthMiddleware.spec.ts
import { authMiddleware } from '../../../../../src/interfaces/http/middlewares/AuthMiddleware';
import { PgBlacklistTokenRepository } from '../../../../../src/infrastructure/database/iam/PgBlacklistTokenRepository';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Mock automático da classe PgBlacklistTokenRepository
jest.mock('../../../../../src/infrastructure/database/iam/PgBlacklistTokenRepository');

describe('AuthMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
    process.env.JWT_SECRET = 'test-secret-value';
    
    // Configura o comportamento padrão do mock para retornar falso (não revogado)
    (PgBlacklistTokenRepository.prototype.isBlacklisted as jest.Mock).mockReset();
    (PgBlacklistTokenRepository.prototype.isBlacklisted as jest.Mock).mockResolvedValue(false);
  });

  it('deve retornar 401 se o header de autorização estiver ausente', async () => {
    await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Token de autenticação não fornecido.' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('deve retornar 401 se o token estiver malformado (sem Bearer)', async () => {
    mockRequest.headers = { authorization: 'token-qualquer-sem-bearer' };

    await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Token de autenticação malformado.' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('deve retornar 401 se a chave secreta do JWT nao estiver configurada no backend', async () => {
    delete process.env.JWT_SECRET;
    mockRequest.headers = { authorization: 'Bearer token-valido-fake' };

    await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Erro de configuração no servidor: JWT_SECRET não definido.' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('deve retornar 401 se o token for invalido ou estiver expirado', async () => {
    mockRequest.headers = { authorization: 'Bearer token-invalido-ou-expirado' };

    await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Token inválido ou expirado.' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('deve chamar next() e popular req.user com dados do payload se o token for valido', async () => {
    const token = jwt.sign({ sub: 'user-uuid-123', role: 'CELIACO' }, 'test-secret-value');
    mockRequest.headers = { authorization: `Bearer ${token}` };

    await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockRequest.user).toEqual({ id: 'user-uuid-123', role: 'CELIACO' });
  });

  it('deve retornar 401 se o token for valido mas estiver revogado (blacklist)', async () => {
    const token = jwt.sign({ sub: 'user-uuid-123', role: 'CELIACO' }, 'test-secret-value');
    mockRequest.headers = { authorization: `Bearer ${token}` };
    
    // Configura o mock do repositório para simular que o token está na blacklist
    (PgBlacklistTokenRepository.prototype.isBlacklisted as jest.Mock).mockResolvedValue(true);

    await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Token revogado.' });
    expect(nextFunction).not.toHaveBeenCalled();
  });
});
