// backend/tests/unit/interfaces/http/controllers/reviews/ReviewController.spec.ts
import { Request, Response } from 'express';
import { ReviewController } from '../../../../../../src/interfaces/http/controllers/reviews/ReviewController';
import { SubmitReviewUseCase } from '../../../../../../src/application/reviews/SubmitReviewUseCase';
import { GetProductReviewsUseCase } from '../../../../../../src/application/reviews/GetProductReviewsUseCase';
import { GetPartnerReviewsUseCase } from '../../../../../../src/application/reviews/GetPartnerReviewsUseCase';
import { Result } from '../../../../../../src/domain/Result';
import { Review } from '../../../../../../src/domain/reviews/Review';

describe('ReviewController', () => {
  let controller: ReviewController;
  let submitMock: jest.Mocked<SubmitReviewUseCase>;
  let getProductReviewsMock: jest.Mocked<GetProductReviewsUseCase>;
  let getPartnerReviewsMock: jest.Mocked<GetPartnerReviewsUseCase>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    submitMock = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<SubmitReviewUseCase>;

    getProductReviewsMock = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetProductReviewsUseCase>;

    getPartnerReviewsMock = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetPartnerReviewsUseCase>;

    controller = new ReviewController(submitMock, getProductReviewsMock, getPartnerReviewsMock);

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    res = {
      status: statusMock,
      json: jsonMock,
    };
  });

  describe('submit', () => {
    it('deve usar req.user.id do token mesmo quando o body não envia userId', async () => {
      req = {
        body: {
          productId: 'prod-123',
          rating: 5,
          comment: 'Muito bom!',
        },
        user: { id: 'user-auth-id', role: 'CELIACO' } as any,
      };

      const mockReview = Review.create({
        userId: 'user-auth-id',
        productId: 'prod-123',
        rating: 5,
        comment: 'Muito bom!',
      }, 'rev-123').getValue();

      submitMock.execute.mockResolvedValue(Result.ok(mockReview));

      await controller.submit(req as Request, res as Response);

      expect(submitMock.execute).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user-auth-id',
        productId: 'prod-123',
        rating: 5,
      }));
      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it('deve rejeitar com 403 se usuário comum tentar enviar em nome de outro userId no body', async () => {
      req = {
        body: {
          userId: 'outro-user-id',
          productId: 'prod-123',
          rating: 5,
        },
        user: { id: 'user-auth-id', role: 'CELIACO' } as any,
      };

      await controller.submit(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Você não tem permissão para enviar avaliação em nome de outro usuário.',
      });
      expect(submitMock.execute).not.toHaveBeenCalled();
    });

    it('deve rejeitar com 400 se faltar rating ou se não tiver productId nem partnerId', async () => {
      req = {
        body: {},
        user: { id: 'user-auth-id', role: 'CELIACO' } as any,
      };

      await controller.submit(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(submitMock.execute).not.toHaveBeenCalled();
    });
  });

  describe('getProductReviews', () => {
    it('deve retornar avaliações do produto com status 200', async () => {
      req = {
        params: { productId: 'prod-123' },
      };

      getProductReviewsMock.execute.mockResolvedValue(
        Result.ok({
          productId: 'prod-123',
          totalReviews: 1,
          averageRating: 5,
          reviews: [],
        })
      );

      await controller.getProductReviews(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(getProductReviewsMock.execute).toHaveBeenCalledWith('prod-123');
    });
  });

  describe('getPartnerReviews', () => {
    it('deve retornar avaliações do parceiro mapeadas em DTO com status 200', async () => {
      req = {
        params: { partnerId: 'partner-123' },
      };

      const mockReview = Review.create(
        {
          userId: 'user-abc',
          partnerId: 'partner-123',
          rating: 5,
          comment: 'Excelente atendimento sem glúten!',
          createdAt: new Date('2026-09-17T12:00:00Z'),
        },
        'review-xyz'
      ).getValue();

      getPartnerReviewsMock.execute.mockResolvedValue(Result.ok([mockReview]));

      await controller.getPartnerReviews(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(getPartnerReviewsMock.execute).toHaveBeenCalledWith('partner-123');
      expect(jsonMock).toHaveBeenCalledWith([
        {
          id: 'review-xyz',
          userId: 'user-abc',
          productId: undefined,
          partnerId: 'partner-123',
          rating: 5,
          comment: 'Excelente atendimento sem glúten!',
          createdAt: new Date('2026-09-17T12:00:00Z'),
        },
      ]);
    });

    it('deve retornar 400 se o caso de uso falhar', async () => {
      req = {
        params: { partnerId: ' ' },
      };

      getPartnerReviewsMock.execute.mockResolvedValue(
        Result.fail('O ID do parceiro comercial é obrigatório.')
      );

      await controller.getPartnerReviews(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'O ID do parceiro comercial é obrigatório.',
      });
    });
  });
});
