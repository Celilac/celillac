import { Request, Response } from 'express';
import { SubmitReviewUseCase } from '../../../../application/reviews/SubmitReviewUseCase';
import { GetProductReviewsUseCase } from '../../../../application/reviews/GetProductReviewsUseCase';

export class ReviewController {
  constructor(
    private submitReviewUseCase: SubmitReviewUseCase,
    private getProductReviewsUseCase: GetProductReviewsUseCase
  ) {}

  public async submit(req: Request, res: Response): Promise<Response> {
    try {
      const { userId, productId, rating, comment } = req.body;

      if (!userId || !productId || rating === undefined) {
        return res.status(400).json({ error: 'userId, productId e rating (1-5) são obrigatórios.' });
      }

      if (req.user?.id !== userId && req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Você não tem permissão para enviar avaliação em nome de outro usuário.' });
      }

      const result = await this.submitReviewUseCase.execute({
        userId,
        productId,
        rating: Number(rating),
        comment,
      });

      if (result.isFailure) {
        if (result.getError() === 'Produto não encontrado no catálogo.') {
          return res.status(404).json({ error: result.getError() });
        }
        return res.status(400).json({ error: result.getError() });
      }

      const review = result.getValue();
      return res.status(201).json({
        id: review.id,
        userId: review.userId,
        productId: review.productId,
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
}
