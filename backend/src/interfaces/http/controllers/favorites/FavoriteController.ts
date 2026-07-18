// backend/src/interfaces/http/controllers/favorites/FavoriteController.ts
import { Request, Response } from 'express';
import { BaseController } from '../BaseController';
import { AddFavoriteUseCase } from '../../../../application/favorites/AddFavoriteUseCase';
import { RemoveFavoriteUseCase } from '../../../../application/favorites/RemoveFavoriteUseCase';
import { ListFavoritesUseCase } from '../../../../application/favorites/ListFavoritesUseCase';

export class FavoriteController extends BaseController {
  constructor(
    private readonly addFavoriteUseCase: AddFavoriteUseCase,
    private readonly removeFavoriteUseCase: RemoveFavoriteUseCase,
    private readonly listFavoritesUseCase: ListFavoritesUseCase
  ) {
    super();
  }

  // POST /favorites
  public async add(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      this.unauthorized(res, 'Usuário não autenticado.');
      return;
    }

    const { productId, partnerId } = req.body;

    const result = await this.addFavoriteUseCase.execute({
      userId,
      productId,
      partnerId,
    });

    if (result.isFailure) {
      this.badRequest(res, result.getError());
      return;
    }

    const fav = result.getValue();
    this.created(res, {
      id:        fav.id,
      userId:    fav.userId,
      productId: fav.productId,
      partnerId: fav.partnerId,
      createdAt: fav.createdAt,
    });
  }

  // DELETE /favorites/:targetId
  public async remove(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      this.unauthorized(res, 'Usuário não autenticado.');
      return;
    }

    const { targetId } = req.params;

    const result = await this.removeFavoriteUseCase.execute({
      userId,
      targetId,
    });

    if (result.isFailure) {
      this.badRequest(res, result.getError());
      return;
    }

    this.ok(res, { message: 'Favorito removido com sucesso.' });
  }

  // GET /favorites
  public async list(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      this.unauthorized(res, 'Usuário não autenticado.');
      return;
    }

    const result = await this.listFavoritesUseCase.execute(userId);

    if (result.isFailure) {
      this.badRequest(res, result.getError());
      return;
    }

    this.ok(res, result.getValue());
  }

  protected executeImpl(req: Request, res: Response): Promise<void> {
    // Não utilizado diretamente, as rotas mapeiam para os métodos específicos
    return Promise.resolve();
  }
}
