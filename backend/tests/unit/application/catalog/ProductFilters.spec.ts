// backend/tests/unit/application/catalog/ProductFilters.spec.ts
import {
  filterAndSortProducts,
  isProductGlutenFree,
  isProductMilkFree,
  isProductVegan,
  countActiveFilters,
  INITIAL_PRODUCT_FILTER_STATE,
  ProductFilterState,
} from '../../../../../frontend/web-app/src/utils/productFilters';

describe('ProductFilters and Sorting Utility', () => {
  const sampleProducts: any[] = [
    {
      id: 'prod-1',
      name: 'Pão Francês Sem Glúten',
      brand: 'CeliBakery',
      ingredients: 'Farinha de arroz, polvilho doce, água, fermento.',
      hasGluten: false,
      crossContamination: 'Ambiente livre de glúten e leite.',
      analysisStatus: 'APPROVED',
      price: 15.5,
      category: 'Pães e Massas',
      dietaryFeatures: ['VEGAN'],
    },
    {
      id: 'prod-2',
      name: 'Bolo de Chocolate com Leite',
      brand: 'ChocoSafe',
      ingredients: 'Farinha de arroz, leite integral, cacau, açúcar.',
      hasGluten: false,
      crossContamination: 'Pode conter traços de leite.',
      analysisStatus: 'APPROVED',
      price: 32.0,
      category: 'Doces e Sobremesas',
      dietaryFeatures: [],
    },
    {
      id: 'prod-3',
      name: 'Biscoito Tradicional',
      brand: 'MassaReal',
      ingredients: 'Farinha de trigo, açúcar, manteiga.',
      hasGluten: true,
      crossContamination: 'Contém trigo e glúten.',
      analysisStatus: 'APPROVED',
      price: 8.0,
      category: 'Biscoitos e Snacks',
      dietaryFeatures: [],
    },
    {
      id: 'prod-4',
      name: 'Cerveja Artesanal de Sorgo',
      brand: 'ZeroCevada',
      ingredients: 'Água, sorgo, lúpulo.',
      hasGluten: false,
      crossContamination: 'Livre de glúten.',
      analysisStatus: 'APPROVED',
      price: 22.0,
      category: 'Bebidas',
      dietaryFeatures: ['VEGAN'],
      compatibilityReport: {
        riskLevel: 'SAFE',
      },
    },
    {
      id: 'prod-5',
      name: 'Queijo Vegano de Castanhas',
      brand: 'PlantCheese',
      ingredients: 'Castanha de caju, água, fermentos, sal.',
      hasGluten: false,
      crossContamination: 'Contém castanha.',
      analysisStatus: 'APPROVED',
      price: 45.0,
      category: 'Laticínios Vegetais',
      dietaryFeatures: ['VEGAN'],
      compatibilityReport: {
        riskLevel: 'WARNING',
      },
    },
    {
      id: 'prod-6',
      name: 'Farinha Especial Sob Consulta',
      brand: 'GrãoPuro',
      ingredients: 'Farinha de amêndoas pura.',
      hasGluten: false,
      crossContamination: 'Contém amêndoa.',
      analysisStatus: 'APPROVED',
      price: 0, // Sob consulta
      category: 'Farinhas e Grãos',
      dietaryFeatures: ['VEGAN'],
    },
  ];

  it('deve identificar corretamente produtos sem glúten', () => {
    expect(isProductGlutenFree(sampleProducts[0])).toBe(true);
    expect(isProductGlutenFree(sampleProducts[2])).toBe(false); // Contém trigo/glúten
  });

  it('deve identificar corretamente produtos sem leite/lactose', () => {
    expect(isProductMilkFree(sampleProducts[0])).toBe(true);
    expect(isProductMilkFree(sampleProducts[1])).toBe(false); // Leite nos ingredientes e traços
  });

  it('deve ordenar produtos por menor preço (preço crescente com sob consulta ao final)', () => {
    const filters: ProductFilterState = {
      ...INITIAL_PRODUCT_FILTER_STATE,
      sortBy: 'price-asc',
    };

    const result = filterAndSortProducts(sampleProducts, filters);
    const prices = result.map((p) => p.price);
    
    // Itens com preço positivo devem estar em ordem crescente, 0 no final
    expect(prices).toEqual([8.0, 15.5, 22.0, 32.0, 45.0, 0]);
  });

  it('deve ordenar produtos por maior preço (preço decrescente com sob consulta ao final)', () => {
    const filters: ProductFilterState = {
      ...INITIAL_PRODUCT_FILTER_STATE,
      sortBy: 'price-desc',
    };

    const result = filterAndSortProducts(sampleProducts, filters);
    const prices = result.map((p) => p.price);
    
    expect(prices).toEqual([45.0, 32.0, 22.0, 15.5, 8.0, 0]);
  });

  it('deve filtrar produtos 100% sem glúten', () => {
    const filters: ProductFilterState = {
      ...INITIAL_PRODUCT_FILTER_STATE,
      freeOfGluten: true,
    };

    const result = filterAndSortProducts(sampleProducts, filters);
    expect(result.some((p) => p.hasGluten)).toBe(false);
    expect(result.map((p) => p.id)).not.toContain('prod-3');
  });

  it('deve filtrar produtos sem leite e sem lactose', () => {
    const filters: ProductFilterState = {
      ...INITIAL_PRODUCT_FILTER_STATE,
      freeOfMilk: true,
    };

    const result = filterAndSortProducts(sampleProducts, filters);
    expect(result.map((p) => p.id)).not.toContain('prod-2'); // Bolo com leite
  });

  it('deve filtrar por faixa de preço mínima e máxima', () => {
    const filters: ProductFilterState = {
      ...INITIAL_PRODUCT_FILTER_STATE,
      minPrice: '15',
      maxPrice: '30',
    };

    const result = filterAndSortProducts(sampleProducts, filters);
    const ids = result.map((p) => p.id);
    expect(ids).toContain('prod-1'); // 15.5
    expect(ids).toContain('prod-4'); // 22.0
    expect(ids).not.toContain('prod-2'); // 32.0 (acima do max)
    expect(ids).not.toContain('prod-3'); // 8.0 (abaixo do min)
  });

  it('deve filtrar apenas produtos compatíveis com o perfil do usuário (SAFE)', () => {
    const filters: ProductFilterState = {
      ...INITIAL_PRODUCT_FILTER_STATE,
      onlySafeCompatibility: true,
    };

    const result = filterAndSortProducts(sampleProducts, filters);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('prod-4');
  });

  it('deve contar corretamente filtros ativos', () => {
    expect(countActiveFilters(INITIAL_PRODUCT_FILTER_STATE)).toBe(0);

    const activeFilters: ProductFilterState = {
      ...INITIAL_PRODUCT_FILTER_STATE,
      sortBy: 'price-asc',
      freeOfGluten: true,
      minPrice: '10',
    };
    expect(countActiveFilters(activeFilters)).toBe(3);
  });
});
