// backend/src/domain/catalog/ProductCertification.ts
import { Entity } from '../Entity';
import { Result } from '../Result';

export type CertificationVerificationStatus =
  | 'DECLARED_BY_PARTNER'
  | 'VERIFIED_BY_CELILAC'
  | 'REJECTED';

export interface ProductCertificationProps {
  productId?:           string;
  certificationType:    string;
  certifyingEntity:     string;
  certificateCode?:     string;
  validUntil?:          string; // YYYY-MM-DD
  imageId?:             string; // UUID da foto do laudo/selo em product_images
  verificationStatus?:  CertificationVerificationStatus;
  verificationNotes?:   string;
  createdAt?:           string;
  updatedAt?:           string;
}

export class ProductCertification extends Entity<ProductCertificationProps> {
  get productId(): string | undefined {
    return this.props.productId;
  }

  get certificationType(): string {
    return this.props.certificationType;
  }

  get certifyingEntity(): string {
    return this.props.certifyingEntity;
  }

  get certificateCode(): string | undefined {
    return this.props.certificateCode;
  }

  get validUntil(): string | undefined {
    return this.props.validUntil;
  }

  get imageId(): string | undefined {
    return this.props.imageId;
  }

  get verificationStatus(): CertificationVerificationStatus {
    return this.props.verificationStatus || 'DECLARED_BY_PARTNER';
  }

  get isVerified(): boolean {
    return this.verificationStatus === 'VERIFIED_BY_CELILAC';
  }

  get verificationNotes(): string | undefined {
    return this.props.verificationNotes;
  }

  get createdAt(): string {
    return this.props.createdAt || new Date().toISOString();
  }

  get updatedAt(): string {
    return this.props.updatedAt || new Date().toISOString();
  }

  public markAsVerified(notes?: string): void {
    this.props.verificationStatus = 'VERIFIED_BY_CELILAC';
    if (notes) this.props.verificationNotes = notes;
    this.props.updatedAt = new Date().toISOString();
  }

  public markAsRejected(reason: string): void {
    this.props.verificationStatus = 'REJECTED';
    this.props.verificationNotes = reason;
    this.props.updatedAt = new Date().toISOString();
  }

  public updateCertificateCode(code: string): void {
    this.props.certificateCode = code.trim();
    this.props.updatedAt = new Date().toISOString();
  }

  public linkImage(imageId: string): void {
    this.props.imageId = imageId;
    this.props.updatedAt = new Date().toISOString();
  }

  public static create(
    props: {
      productId?:           string;
      certificationType:    string;
      certifyingEntity:     string;
      certificateCode?:     string;
      validUntil?:          string;
      imageId?:             string;
      verificationStatus?:  CertificationVerificationStatus;
      verificationNotes?:   string;
      createdAt?:           string;
      updatedAt?:           string;
    },
    id?: string
  ): Result<ProductCertification> {
    if (!props.certificationType || props.certificationType.trim().length === 0) {
      return Result.fail<ProductCertification>('O tipo de certificação é obrigatório.');
    }

    if (!props.certifyingEntity || props.certifyingEntity.trim().length === 0) {
      return Result.fail<ProductCertification>('A entidade certificadora é obrigatória.');
    }

    if (props.validUntil && props.validUntil.trim().length > 0) {
      const parsedDate = new Date(props.validUntil);
      if (isNaN(parsedDate.getTime())) {
        return Result.fail<ProductCertification>('A data de validade da certificação é inválida.');
      }
    }

    const verificationStatus: CertificationVerificationStatus =
      props.verificationStatus || 'DECLARED_BY_PARTNER';

    const now = new Date().toISOString();

    return Result.ok<ProductCertification>(
      new ProductCertification(
        {
          productId: props.productId,
          certificationType: props.certificationType.trim(),
          certifyingEntity: props.certifyingEntity.trim(),
          certificateCode: props.certificateCode ? props.certificateCode.trim() : undefined,
          validUntil: props.validUntil ? props.validUntil.trim() : undefined,
          imageId: props.imageId ? props.imageId.trim() : undefined,
          verificationStatus,
          verificationNotes: props.verificationNotes ? props.verificationNotes.trim() : undefined,
          createdAt: props.createdAt || now,
          updatedAt: props.updatedAt || now,
        },
        id
      )
    );
  }
}
