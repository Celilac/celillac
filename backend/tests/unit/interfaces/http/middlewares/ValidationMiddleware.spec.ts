// backend/tests/unit/interfaces/http/middlewares/ValidationMiddleware.spec.ts
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateBody } from '../../../../../src/interfaces/http/middlewares/ValidationMiddleware';

describe('ValidationMiddleware (A03: Injection Defense)', () => {
  const DummySchema = z.object({
    email: z.string().email('E-mail inválido'),
    age: z.number().min(18, 'Idade mínima 18 anos'),
  });

  const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
  };

  it('deve chamar next() e sanitizar body quando os dados forem válidos', () => {
    const req = {
      body: {
        email: 'test@celilac.com.br',
        age: 25,
        injectedField: 'malicious-data',
      },
    } as unknown as Request;

    const res = mockResponse();
    const next = jest.fn();

    const middleware = validateBody(DummySchema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    // Verifica que o Zod filtrou campos desconhecidos
    expect(req.body).toEqual({
      email: 'test@celilac.com.br',
      age: 25,
    });
  });

  it('deve retornar HTTP 400 com lista de detalhes quando o schema for violado', () => {
    const req = {
      body: {
        email: 'invalid-email',
        age: 15,
      },
    } as unknown as Request;

    const res = mockResponse();
    const next = jest.fn();

    const middleware = validateBody(DummySchema);
    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Dados da requisição inválidos.',
      details: [
        { field: 'email', message: 'E-mail inválido' },
        { field: 'age', message: 'Idade mínima 18 anos' },
      ],
    });
  });

  it('deve retornar HTTP 400 se o corpo for vazio ou inválido', () => {
    const req = {
      body: null,
    } as unknown as Request;

    const res = mockResponse();
    const next = jest.fn();

    const middleware = validateBody(DummySchema);
    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
