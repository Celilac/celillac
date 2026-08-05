// backend/tests/unit/interfaces/http/middlewares/AuthMiddleware.spec.ts
import { authMiddleware, optionalAuthMiddleware, adminOnlyMiddleware } from '../../../../../src/interfaces/http/middlewares/AuthMiddleware';
import { PgBlacklistTokenRepository } from '../../../../../src/infrastructure/database/iam/PgBlacklistTokenRepository';
import { pool } from '../../../../../src/infrastructure/database/connection';
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
    process.env.NODE_ENV = 'test';

    // Configura o comportamento padrão do mock para retornar falso (não revogado)
    (PgBlacklistTokenRepository.prototype.isBlacklisted as jest.Mock).mockReset();
    (PgBlacklistTokenRepository.prototype.isBlacklisted as jest.Mock).mockResolvedValue(false);

    jest.restoreAllMocks();
  });

  it('deve retornar 401 se o header de autorização estiver ausente', async () => {
    await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Token de autenticação não fornecido.' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('deve retornar 401 se o token estiver malformado (sem espaço/Bearer)', async () => {
    mockRequest.headers = { authorization: 'token-qualquer-sem-bearer' };

    await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Token de autenticação malformado.' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('deve retornar 401 se o esquema for diferente de Bearer (ex: Basic token)', async () => {
    mockRequest.headers = { authorization: 'Basic token-qualquer' };

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

    (PgBlacklistTokenRepository.prototype.isBlacklisted as jest.Mock).mockResolvedValue(true);

    await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Token revogado.' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  // ----------------------------------------------------------------------
  // TESTES DE ACEITE DA ISSUE #26
  // ----------------------------------------------------------------------

  it('[Issue #26] NÃO deve disparar query de account_status no banco se o usuario NAO for ADMIN', async () => {
    const token = jwt.sign({ sub: 'consumer-uuid-999', role: 'CELIACO' }, 'test-secret-value');
    mockRequest.headers = { authorization: `Bearer ${token}` };

    const poolSpy = jest.spyOn(pool, 'query');

    await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(poolSpy).not.toHaveBeenCalled();
    expect(nextFunction).toHaveBeenCalled();
    expect(mockRequest.user).toEqual({ id: 'consumer-uuid-999', role: 'CELIACO' });
  });

  it('[Issue #26] deve retornar 403 se o usuario for ADMIN e account_status estiver em PENDING_APPROVAL', async () => {
    const token = jwt.sign({ sub: 'admin-uuid-888', role: 'ADMIN' }, 'test-secret-value');
    mockRequest.headers = { authorization: `Bearer ${token}` };

    jest.spyOn(pool, 'query').mockImplementation(async () => ({
      rows: [{ account_status: 'PENDING_APPROVAL' }],
    } as any));

    await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Sua conta de Administrador aguarda aprovação prévia de um administrador existente.',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('[Issue #26] deve liberar acesso (next) se o usuario for ADMIN e account_status estiver em ACTIVE', async () => {
    const token = jwt.sign({ sub: 'admin-uuid-777', role: 'ADMIN' }, 'test-secret-value');
    mockRequest.headers = { authorization: `Bearer ${token}` };

    jest.spyOn(pool, 'query').mockImplementation(async () => ({
      rows: [{ account_status: 'ACTIVE' }],
    } as any));

    await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockRequest.user).toEqual({ id: 'admin-uuid-777', role: 'ADMIN' });
  });

  it('[Issue #26] deve logar e retornar 500 em erro inesperado de banco em producao', async () => {
    process.env.NODE_ENV = 'production';
    const token = jwt.sign({ sub: 'admin-uuid-555', role: 'ADMIN' }, 'test-secret-value');
    mockRequest.headers = { authorization: `Bearer ${token}` };

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(pool, 'query').mockImplementation(async () => {
      throw new Error('PostgreSQL connection timeout');
    });

    await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[AuthMiddleware] Erro inesperado ao verificar aprovação de ADMIN:',
      expect.any(Error),
    );
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Erro ao verificar permissão do usuário.',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  describe('optionalAuthMiddleware', () => {
    it('deve chamar next() sem popular req.user quando header de autorização estiver ausente', async () => {
      await optionalAuthMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    it('deve chamar next() sem popular req.user quando token for malformado (sem partes)', async () => {
      mockRequest.headers = { authorization: 'token-sem-espaco' };
      await optionalAuthMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    it('deve chamar next() sem popular req.user quando esquema nao for Bearer', async () => {
      mockRequest.headers = { authorization: 'Basic token-abc' };
      await optionalAuthMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    it('deve chamar next() sem popular req.user em token expirado ou invalido', async () => {
      mockRequest.headers = { authorization: 'Bearer token-invalido' };
      await optionalAuthMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    it('deve chamar next() e popular req.user em token valido e nao revogado', async () => {
      const token = jwt.sign({ sub: 'user-guest-1', role: 'CELIACO' }, 'test-secret-value');
      mockRequest.headers = { authorization: `Bearer ${token}` };

      await optionalAuthMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toEqual({ id: 'user-guest-1', role: 'CELIACO' });
    });

    it('deve chamar next() sem popular req.user se o token for valido mas estiver revogado', async () => {
      const token = jwt.sign({ sub: 'user-guest-1', role: 'CELIACO' }, 'test-secret-value');
      mockRequest.headers = { authorization: `Bearer ${token}` };
      (PgBlacklistTokenRepository.prototype.isBlacklisted as jest.Mock).mockResolvedValue(true);

      await optionalAuthMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });
  });

  describe('adminOnlyMiddleware', () => {
    it('deve retornar 403 Forbidden se o perfil do usuario NAO for ADMIN', () => {
      mockRequest.user = { id: 'celiaco-1', role: 'CELIACO' };

      adminOnlyMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Acesso negado. Apenas administradores possuem acesso a esta funcionalidade.',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('deve chamar next() se o perfil do usuario for ADMIN', () => {
      mockRequest.user = { id: 'admin-1', role: 'ADMIN' };

      adminOnlyMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});
