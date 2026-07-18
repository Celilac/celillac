// backend/tests/unit/domain/catalog/Product.spec.ts
import { Product } from '../../../../src/domain/catalog/Product';

describe('Product Entity', () => {
  it('deve criar um produto ANALISADO se possuir ingredientes', () => {
    const result = Product.create({
      name: 'Arroz',
      brand: 'Marca A',
      ingredients: 'Arroz cru',
      hasGluten: false,
      crossContamination: '',
    });

    expect(result.isSuccess).toBe(true);
    const product = result.getValue();
    expect(product.analysisStatus).toBe('ANALISADO');
    expect(product.isActive).toBe(true); // Default
  });

  it('deve criar um produto PENDENTE_DE_ANALISE se não possuir ingredientes', () => {
    const result = Product.create({
      name: 'Arroz',
      brand: 'Marca A',
      ingredients: '',
      hasGluten: false,
      crossContamination: '',
    });

    expect(result.isSuccess).toBe(true);
    const product = result.getValue();
    expect(product.analysisStatus).toBe('PENDENTE_DE_ANALISE');
  });

  it('deve permitir criar produto inativo', () => {
    const result = Product.create({
      name: 'Arroz',
      brand: 'Marca A',
      ingredients: '',
      hasGluten: false,
      crossContamination: '',
      isActive: false,
    });

    expect(result.isSuccess).toBe(true);
    const product = result.getValue();
    expect(product.isActive).toBe(false);
  });

  it('deve inativar e reativar produto', () => {
    const product = Product.create({
      name: 'Arroz',
      brand: 'Marca A',
      ingredients: '',
      hasGluten: false,
      crossContamination: '',
    }).getValue();

    expect(product.isActive).toBe(true);
    product.inactivate();
    expect(product.isActive).toBe(false);
    product.activate();
    expect(product.isActive).toBe(true);
  });

  it('deve falhar se crossContamination não for fornecido', () => {
    const result = Product.create({
      name: 'Arroz',
      brand: 'Marca A',
      ingredients: '',
      hasGluten: false,
      crossContamination: undefined as any,
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('crossContamination é obrigatório');
  });

  it('deve falhar se o nome for vazio', () => {
    const result = Product.create({
      name: '   ',
      brand: 'Marca A',
      ingredients: 'Ingredientes',
      hasGluten: false,
      crossContamination: '',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('nome do produto é obrigatório');
  });

  it('deve atualizar ingredientes e recalcular status', () => {
    const product = Product.create({
      name: 'Arroz',
      brand: 'Marca A',
      ingredients: '',
      hasGluten: false,
      crossContamination: '',
    }).getValue();

    expect(product.analysisStatus).toBe('PENDENTE_DE_ANALISE');

    product.updateIngredients('Arroz agulhinha');
    expect(product.ingredients).toBe('Arroz agulhinha');
    expect(product.analysisStatus).toBe('ANALISADO');
  });
});
