// backend/tests/unit/domain/catalog/ProductImage.spec.ts
import { ProductImage, ProductImageType, VALID_PRODUCT_IMAGE_TYPES } from '../../../../src/domain/catalog/ProductImage';

describe('ProductImage Domain Entity', () => {
  it('deve criar uma imagem com atributos válidos', () => {
    const result = ProductImage.create({
      url: 'https://cdn.celilac.com/rotulo.jpg',
      imageType: 'LABEL',
      caption: 'Rótulo frontal detalhado',
      displayOrder: 1,
      isCover: true,
    });

    expect(result.isSuccess).toBe(true);
    const img = result.getValue();
    expect(img.url).toBe('https://cdn.celilac.com/rotulo.jpg');
    expect(img.imageType).toBe('LABEL');
    expect(img.caption).toBe('Rótulo frontal detalhado');
    expect(img.displayOrder).toBe(1);
    expect(img.isCover).toBe(true);
  });

  it('deve aceitar Data URLs base64', () => {
    const result = ProductImage.create({
      url: 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAQAcJaACdLoAAP7/2QAA',
      imageType: 'INGREDIENTS',
    });

    expect(result.isSuccess).toBe(true);
    const img = result.getValue();
    expect(img.imageType).toBe('INGREDIENTS');
    expect(img.isCover).toBe(false);
    expect(img.displayOrder).toBe(0);
  });

  it('deve aceitar todos os 6 tipos válidos de imagem recomendados', () => {
    VALID_PRODUCT_IMAGE_TYPES.forEach((type) => {
      const result = ProductImage.create({
        url: 'https://example.com/photo.png',
        imageType: type,
      });
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().imageType).toBe(type);
    });
  });

  it('deve falhar se URL for vazia ou inválida', () => {
    const emptyRes = ProductImage.create({ url: '' });
    expect(emptyRes.isFailure).toBe(true);
    expect(emptyRes.getError()).toContain('URL da imagem é obrigatória');

    const invalidRes = ProductImage.create({ url: 'ftp://arquivo.jpg' });
    expect(invalidRes.isFailure).toBe(true);
    expect(invalidRes.getError()).toContain('link HTTP/HTTPS válido ou uma Data URL');
  });

  it('deve falhar se o tipo de imagem for inválido', () => {
    const invalidTypeRes = ProductImage.create({
      url: 'https://example.com/foto.jpg',
      imageType: 'TIPO_INEXISTENTE' as ProductImageType,
    });

    expect(invalidTypeRes.isFailure).toBe(true);
    expect(invalidTypeRes.getError()).toContain('Tipo de imagem inválido');
  });

  it('deve alterar status de capa e atributos auxiliares', () => {
    const img = ProductImage.create({
      url: 'https://example.com/foto.jpg',
      imageType: 'PRODUCT',
    }).getValue();

    expect(img.isCover).toBe(false);
    img.markAsCover();
    expect(img.isCover).toBe(true);
    img.unmarkAsCover();
    expect(img.isCover).toBe(false);

    img.setDisplayOrder(5);
    expect(img.displayOrder).toBe(5);

    img.setCaption('Foto da embalagem');
    expect(img.caption).toBe('Foto da embalagem');

    img.setImageType('PACKAGING');
    expect(img.imageType).toBe('PACKAGING');
  });
});
