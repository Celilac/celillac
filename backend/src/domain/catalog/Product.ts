// backend/src/domain/catalog/Product.ts
import { Entity } from '../Entity';
import { Result } from '../Result';

export type AnalysisStatus = 'PENDENTE_DE_ANALISE' | 'ANALISADO';

export interface ProductProps {
  name:               string;
  brand:              string;
  ingredients:        string;
  hasGluten:          boolean;
  crossContamination: string;
  analysisStatus:     AnalysisStatus;
}

/**
 * Product — Agregado Raiz do Contexto de Catálogo.
 * 
 * Regras:
 * 1. Produto sem ingredientes tem status PENDENTE_DE_ANALISE.
 * 2. cross_contamination é obrigatório (mesmo que string vazia).
 */
export class Product extends Entity<ProductProps> {
  private constructor(props: ProductProps, id?: string) {
    super(props, id);
  }

  get name(): string { return this.props.name; }
  get brand(): string { return this.props.brand; }
  get ingredients(): string { return this.props.ingredients; }
  get hasGluten(): boolean { return this.props.hasGluten; }
  get crossContamination(): string { return this.props.crossContamination; }
  get analysisStatus(): AnalysisStatus { return this.props.analysisStatus; }

  /**
   * Atualiza os ingredientes e recalcula o status de análise
   */
  updateIngredients(ingredients: string): void {
    this.props.ingredients = ingredients;
    this.props.analysisStatus = Product.determineAnalysisStatus(ingredients);
  }

  static create(
    props: Omit<ProductProps, 'analysisStatus'> & { analysisStatus?: AnalysisStatus },
    id?: string
  ): Result<Product> {
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail<Product>('O nome do produto é obrigatório.');
    }
    
    // crossContamination é obrigatório (pode ser vazio, mas não undefined/null)
    if (props.crossContamination === undefined || props.crossContamination === null) {
      return Result.fail<Product>('O campo crossContamination é obrigatório.');
    }

    const analysisStatus = props.analysisStatus ?? Product.determineAnalysisStatus(props.ingredients);

    return Result.ok<Product>(
      new Product(
        {
          name: props.name.trim(),
          brand: (props.brand || '').trim(),
          ingredients: (props.ingredients || '').trim(),
          hasGluten: props.hasGluten,
          crossContamination: props.crossContamination.trim(),
          analysisStatus,
        },
        id
      )
    );
  }

  private static determineAnalysisStatus(ingredients?: string): AnalysisStatus {
    if (!ingredients || ingredients.trim().length === 0) {
      return 'PENDENTE_DE_ANALISE';
    }
    return 'ANALISADO';
  }
}
