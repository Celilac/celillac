// backend/tests/unit/application/favorites/FavoriteUseCases.spec.ts
import { AddFavoriteUseCase } from '../../../../src/application/favorites/AddFavoriteUseCase';
import { RemoveFavoriteUseCase } from '../../../../src/application/favorites/RemoveFavoriteUseCase';
import { ListFavoritesUseCase } from '../../../../src/application/favorites/ListFavoritesUseCase';
import { IFavoriteRepository } from '../../../../src/domain/favorites/repositories/IFavoriteRepository';
import { IProductCatalogRepository } from '../../../../src/domain/catalog/repositories/IProductCatalogRepository';
import { IPartnerRepository } from '../../../../src/domain/partner/repositories/IPartnerRepository';
import { Product } from '../../../../src/domain/catalog/Product';
import { Partner, PartnerType } from '../../../../src/domain/partner/Partner';
import { Favorite } from '../../../../src/domain/favorites/Favorite';

describe('Favorite Use Cases', () => {
  let mockFavoriteRepo: jest.Mocked<IFavoriteRepository>;
  let mockProductRepo: jest.Mocked<IProductCatalogRepository>;
  let mockPartnerRepo: jest.Mocked<IPartnerRepository>;

  let addUseCase: AddFavoriteUseCase;
  let removeUseCase: RemoveFavoriteUseCase;
  let listUseCase: ListFavoritesUseCase;

  const mockProduct = Product.create({
    name: 'Pão de Queijo',
    brand: 'Padaria',
    ingredients: 'Polvilho, queijo',
    hasGluten: false,
    crossContamination: '',
  }, 'product-1').getValue();

  const mockPartner = Partner.create({
    userId: 'user-2',
    name: 'Confeitaria SemG',
    cnpj: '12.345.678/0001-90',
    address: 'Rua Principal, 200',
    description: 'Tudo gluten-free',
    phone: '1234-5678',
    type: PartnerType.INDEPENDENT_PRODUCER,
    isActive: true,
  }, 'partner-1').getValue();

  beforeEach(() => {
    mockFavoriteRepo = {
      save: jest.fn(),
      delete: jest.fn(),
      findByUser: jest.fn(),
      findByUserAndProduct: jest.fn(),
      findByUserAndPartner: jest.fn(),
    };

    mockProductRepo = {
      create: jest.fn(),
      search: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };

    mockPartnerRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      update: jest.fn(),
    };

    addUseCase = new AddFavoriteUseCase(mockFavoriteRepo, mockProductRepo, mockPartnerRepo);
    removeUseCase = new RemoveFavoriteUseCase(mockFavoriteRepo);
    listUseCase = new ListFavoritesUseCase(mockFavoriteRepo);
  });

  describe('AddFavoriteUseCase', () => {
    it('deve favoritar um produto com sucesso', async () => {
      mockProductRepo.findById.mockResolvedValue(mockProduct);
      mockFavoriteRepo.findByUserAndProduct.mockResolvedValue(null);

      const result = await addUseCase.execute({
        userId: 'user-1',
        productId: 'product-1',
      });

      expect(result.isSuccess).toBe(true);
      expect(mockFavoriteRepo.save).toHaveBeenCalled();
      expect(result.getValue().productId).toBe('product-1');
    });

    it('deve retornar o favorito existente se já foi favoritado', async () => {
      mockProductRepo.findById.mockResolvedValue(mockProduct);
      const existing = Favorite.create({ userId: 'user-1', productId: 'product-1' }).getValue();
      mockFavoriteRepo.findByUserAndProduct.mockResolvedValue(existing);

      const result = await addUseCase.execute({
        userId: 'user-1',
        productId: 'product-1',
      });

      expect(result.isSuccess).toBe(true);
      expect(mockFavoriteRepo.save).not.toHaveBeenCalled();
    });

    it('deve falhar se o produto não existir', async () => {
      mockProductRepo.findById.mockResolvedValue(null);

      const result = await addUseCase.execute({
        userId: 'user-1',
        productId: 'product-inexistente',
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe('Produto não encontrado.');
    });

    it('deve favoritar um parceiro com sucesso', async () => {
      mockPartnerRepo.findById.mockResolvedValue(mockPartner);
      mockFavoriteRepo.findByUserAndPartner.mockResolvedValue(null);

      const result = await addUseCase.execute({
        userId: 'user-1',
        partnerId: 'partner-1',
      });

      expect(result.isSuccess).toBe(true);
      expect(mockFavoriteRepo.save).toHaveBeenCalled();
      expect(result.getValue().partnerId).toBe('partner-1');
    });
  });

  describe('RemoveFavoriteUseCase', () => {
    it('deve desfavoritar com sucesso', async () => {
      const result = await removeUseCase.execute({
        userId: 'user-1',
        targetId: 'product-1',
      });

      expect(result.isSuccess).toBe(true);
      expect(mockFavoriteRepo.delete).toHaveBeenCalledWith('user-1', 'product-1');
    });
  });

  describe('ListFavoritesUseCase', () => {
    it('deve listar os favoritos de um usuário', async () => {
      const fav = Favorite.create({ userId: 'user-1', productId: 'product-1' }).getValue();
      mockFavoriteRepo.findByUser.mockResolvedValue([fav]);

      const result = await listUseCase.execute('user-1');

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toHaveLength(1);
      expect(result.getValue()[0].productId).toBe('product-1');
    });
  });
});
