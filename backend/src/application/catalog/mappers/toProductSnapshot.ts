// backend/src/application/catalog/mappers/toProductSnapshot.ts
import { Product } from '../../../domain/catalog/Product';
import { ProductSnapshot } from '../../../domain/allergen-engine/ProductSnapshot';

/**
 * toProductSnapshot — Adapta um Product do catálogo para o ProductSnapshot
 * consumido pelo AllergenEngine. Único ponto de conversão entre os dois
 * contextos; evita reconstruir o snapshot manualmente em cada use case.
 */
export function toProductSnapshot(product: Product): ProductSnapshot {
  return {
    id:                 product.id,
    name:               product.name,
    ingredients:        product.ingredients,
    hasGluten:          product.hasGluten,
    crossContamination: product.crossContamination,
    declaredAllergens:  product.declaredAllergens,
    crossContaminationDetails: product.crossContaminationDetails ? {
      environmentRisk:       product.crossContaminationDetails.environmentRisk,
      allergenRisks:         product.crossContaminationDetails.allergenRisks,
      cleaningProtocolNotes: product.crossContaminationDetails.cleaningProtocolNotes,
      riskLevel:             product.crossContaminationDetails.riskLevel || product.crossContaminationDetails.environmentRisk,
      isolationProtocols:    product.crossContaminationDetails.isolationProtocols,
      sanitizationProtocol:  product.crossContaminationDetails.sanitizationProtocol || product.crossContaminationDetails.cleaningProtocolNotes,
    } : undefined,
    certifications:     product.certifications.map(c => ({
      certificationType: c.certificationType,
      certifyingEntity:  c.certifyingEntity,
      certificateCode:   c.certificateCode,
      validUntil:        c.validUntil,
      isVerified:        c.verificationStatus === 'VERIFIED_BY_CELILAC',
    })),
    informationOrigin:  product.informationOrigin,
  };
}
