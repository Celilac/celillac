import { Request, Response } from 'express';
import { SubmitReviewUseCase } from '../../../../application/reviews/SubmitReviewUseCase';
import { GetProductReviewsUseCase } from '../../../../application/reviews/GetProductReviewsUseCase';
import { GetPartnerReviewsUseCase } from '../../../../application/reviews/GetPartnerReviewsUseCase';

export class ReviewController {
  constructor(
    private readonly submitReviewUseCase: SubmitReviewUseCase,
    private readonly getProductReviewsUseCase: GetProductReviewsUseCase,
    private readonly getPartnerReviewsUseCase: GetPartnerReviewsUseCase
  ) {}

  public async submit(req: Request, res: Response): Promise<Response> {
    try {
      const { userId, productId, partnerId, rating, comment } = req.body;

      if (!userId || (!productId && !partnerId) || rating === undefined) {
        return res.status(400).json({ error: 'Os campos userId, rating (1-5) e pelo menos um de productId ou partnerId são obrigatórios.' });
      }

      if (req.user?.id !== userId && req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Você não tem permissão para enviar avaliação em nome de outro usuário.' });
      }

      const result = await this.submitReviewUseCase.execute({
        userId,
        productId,
        partnerId,
        rating: Number(rating),
        comment,
      });

      if (result.isFailure) {
        const error = result.getError();
        if (error === 'Produto não encontrado no catálogo.' || error === 'Parceiro comercial não encontrado.') {
          return res.status(404).json({ error });
        }
        return res.status(400).json({ error });
      }

      const review = result.getValue();
      return res.status(201).json({
        id: review.id,
        userId: review.userId,
        productId: review.productId,
        partnerId: review.partnerId,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Erro interno no servidor ao submeter avaliação.' });
    }
  }

  public async getProductReviews(req: Request, res: Response): Promise<Response> {
    try {
      const { productId } = req.params;

      const result = await this.getProductReviewsUseCase.execute(productId);

      if (result.isFailure) {
        return res.status(400).json({ error: result.getError() });
      }

      return res.status(200).json(result.getValue());
    } catch (error: any) {
      return res.status(500).json({ error: 'Erro interno no servidor ao buscar avaliações.' });
    }
  }

  public async getPartnerReviews(req: Request, res: Response): Promise<Response> {
    try {
      const { partnerId } = req.params;

      const result = await this.getPartnerReviewsUseCase.execute(partnerId);

      if (result.isFailure) {
        return res.status(400).json({ error: result.getError() });
      }

      return res.status(200).json(result.getValue());
    } catch (error: any) {
      return res.status(500).json({ error: 'Erro interno no servidor ao buscar avaliações.' });
    }
  }
}
