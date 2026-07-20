// backend/tests/unit/domain/favorites/Favorite.spec.ts
import { Favorite } from '../../../../src/domain/favorites/Favorite';

describe('Favorite Entity', () => {
  it('deve criar um favorito de produto com sucesso', () => {
    const result = Favorite.create({
      userId: 'user-1',
      productId: 'product-1',
    });

    expect(result.isSuccess).toBe(true);
    const favorite = result.getValue();
    expect(favorite.userId).toBe('user-1');
    expect(favorite.productId).toBe('product-1');
    expect(favorite.partnerId).toBeUndefined();
  });

  it('deve criar um favorito de parceiro com sucesso', () => {
    const result = Favorite.create({
      userId: 'user-1',
      partnerId: 'partner-1',
    });

    expect(result.isSuccess).toBe(true);
    const favorite = result.getValue();
    expect(favorite.userId).toBe('user-1');
    expect(favorite.partnerId).toBe('partner-1');
    expect(favorite.productId).toBeUndefined();
  });

  it('deve falhar se o userId for vazio', () => {
    const result = Favorite.create({
      userId: '  ',
      productId: 'product-1',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('ID do usuário é obrigatório');
  });

  it('deve falhar se não houver produto nem parceiro comercial associado', () => {
    const result = Favorite.create({
      userId: 'user-1',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('associado a um produto ou a um parceiro comercial');
  });
});
