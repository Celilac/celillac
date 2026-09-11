// backend/src/domain/catalog/ProductImage.ts
import { Entity } from '../Entity';
import { Result } from '../Result';

export type ProductImageType = 
  | 'PRODUCT'           // Visão comercial do produto
  | 'PACKAGING'         // Embalagem externa
  | 'LABEL'             // Rótulo frontal
  | 'INGREDIENTS'       // Foto da lista de ingredientes e alérgenos impressos
  | 'NUTRITIONAL_INFO'  // Tabela de informações nutricionais
  | 'CERTIFICATION';    // Selo ou Laudo Técnico oficial

export const VALID_PRODUCT_IMAGE_TYPES: ProductImageType[] = [
  'PRODUCT',
  'PACKAGING',
  'LABEL',
  'INGREDIENTS',
  'NUTRITIONAL_INFO',
  'CERTIFICATION',
];

export interface ProductImageProps {
  productId?:    string;
  url:           string;
  imageType:     ProductImageType;
  caption?:      string;
  displayOrder:  number;
  isCover:       boolean;
}

export class ProductImage extends Entity<ProductImageProps> {
  private constructor(props: ProductImageProps, id?: string) {
    super(props, id);
  }

  get productId(): string | undefined { return this.props.productId; }
  get url(): string { return this.props.url; }
  get imageType(): ProductImageType { return this.props.imageType; }
  get caption(): string | undefined { return this.props.caption; }
  get displayOrder(): number { return this.props.displayOrder; }
  get isCover(): boolean { return this.props.isCover; }

  markAsCover(): void {
    this.props.isCover = true;
  }

  unmarkAsCover(): void {
    this.props.isCover = false;
  }

  setDisplayOrder(order: number): void {
    this.props.displayOrder = Math.max(0, order);
  }

  setCaption(caption?: string): void {
    this.props.caption = caption ? caption.trim() : undefined;
  }

  setImageType(type: ProductImageType): void {
    if (VALID_PRODUCT_IMAGE_TYPES.includes(type)) {
      this.props.imageType = type;
    }
  }

  static create(
    props: {
      productId?:    string;
      url:           string;
      imageType?:    ProductImageType;
      caption?:      string;
      displayOrder?: number;
      isCover?:      boolean;
    },
    id?: string
  ): Result<ProductImage> {
    if (!props.url || props.url.trim().length === 0) {
      return Result.fail<ProductImage>('A URL da imagem é obrigatória.');
    }

    const trimmedUrl = props.url.trim();
    // Suporta URLs http/https e Data URLs (base64)
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://') && !trimmedUrl.startsWith('data:image/')) {
      return Result.fail<ProductImage>('A URL da imagem deve ser um link HTTP/HTTPS válido ou uma Data URL (base64).');
    }

    const imageType: ProductImageType = props.imageType ?? 'PRODUCT';
    if (!VALID_PRODUCT_IMAGE_TYPES.includes(imageType)) {
      return Result.fail<ProductImage>(`Tipo de imagem inválido. Permitidos: ${VALID_PRODUCT_IMAGE_TYPES.join(', ')}.`);
    }

    const displayOrder = props.displayOrder !== undefined ? Math.max(0, props.displayOrder) : 0;
    const isCover = props.isCover ?? false;

    return Result.ok<ProductImage>(
      new ProductImage(
        {
          productId:    props.productId,
          url:          trimmedUrl,
          imageType,
          caption:      props.caption ? props.caption.trim() : undefined,
          displayOrder,
          isCover,
        },
        id
      )
    );
  }
}
