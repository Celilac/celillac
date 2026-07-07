// backend/tests/unit/interfaces/http/middlewares/AuthMiddleware.spec.ts
import { authMiddleware } from '../../../../../src/interfaces/http/middlewares/AuthMiddleware';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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
  });

  it('deve retornar 401 se o header de autorização estiver ausente', () => {
    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Token de autenticação não fornecido.' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('deve retornar 401 se o token estiver malformado (sem Bearer)', () => {
    mockRequest.headers = { authorization: 'token-qualquer-sem-bearer' };

    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Token de autenticação malformado.' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('deve retornar 401 se a chave secreta do JWT nao estiver configurada no backend', () => {
    delete process.env.JWT_SECRET;
    mockRequest.headers = { authorization: 'Bearer token-valido-fake' };

    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Erro de configuração no servidor: JWT_SECRET não definido.' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('deve retornar 401 se o token for invalido ou estiver expirado', () => {
    mockRequest.headers = { authorization: 'Bearer token-invalido-ou-expirado' };

    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Token inválido ou expirado.' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('deve chamar next() e popular req.user com dados do payload se o token for valido', () => {
    const token = jwt.sign({ sub: 'user-uuid-123', role: 'CELIACO' }, 'test-secret-value');
    mockRequest.headers = { authorization: `Bearer ${token}` };

    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockRequest.user).toEqual({ id: 'user-uuid-123', role: 'CELIACO' });
  });
});
