// backend/tests/unit/interfaces/http/middlewares/SecurityMiddleware.spec.ts
import { corsMiddleware, securityHeadersMiddleware } from '../../../../../src/interfaces/http/middlewares/SecurityMiddleware';
import { Request, Response, NextFunction } from 'express';

describe('SecurityMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    mockRequest = {
      headers: {},
      method: 'GET',
    };
    mockResponse = {
      setHeader: jest.fn(),
      sendStatus: jest.fn(),
    };
    nextFunction = jest.fn();
    delete process.env.ALLOWED_ORIGINS;
  });

  describe('corsMiddleware', () => {
    it('deve configurar headers de CORS e chamar next() em rotas normais', () => {
      mockRequest.headers = { origin: 'http://localhost:3001' };

      corsMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://localhost:3001');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('deve retornar status 200 para requisicoes OPTIONS (Preflight) sem chamar next()', () => {
      mockRequest.method = 'OPTIONS';
      mockRequest.headers = { origin: 'http://localhost:3001' };

      corsMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.sendStatus).toHaveBeenCalledWith(200);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('deve adotar a origem de fallback caso nao haja header Origin na requisicao', () => {
      corsMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://localhost:3001');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('deve aceitar multiplas origens configuradas via variavel de ambiente ALLOWED_ORIGINS', () => {
      process.env.ALLOWED_ORIGINS = 'http://localhost:3001, https://celilac.dev';
      mockRequest.headers = { origin: 'https://celilac.dev' };

      corsMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'https://celilac.dev');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('deve refletir a origem remota/VPS quando ALLOWED_ORIGINS nao estiver definido', () => {
      mockRequest.headers = { origin: 'http://163.176.195.210:3001' };

      corsMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://163.176.195.210:3001');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('deve aceitar qualquer origem quando ALLOWED_ORIGINS for igual a *', () => {
      process.env.ALLOWED_ORIGINS = '*';
      mockRequest.headers = { origin: 'http://qualquer-dominio.com' };

      corsMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://qualquer-dominio.com');
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('securityHeadersMiddleware', () => {
    it('deve injetar headers recomendados pela OWASP e chamar next()', () => {
      securityHeadersMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'no-referrer-when-downgrade');
      expect(nextFunction).toHaveBeenCalled();
    });
  });
});
