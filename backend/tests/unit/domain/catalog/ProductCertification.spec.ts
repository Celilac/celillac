// backend/tests/unit/domain/catalog/ProductCertification.spec.ts
import { ProductCertification } from '../../../../src/domain/catalog/ProductCertification';

describe('ProductCertification Entity', () => {
  it('deve criar uma certificação válida com valores padrão', () => {
    const result = ProductCertification.create({
      certificationType: 'ACELBRA_SEAL',
      certifyingEntity: 'ACELBRA Nacional',
      certificateCode: 'BR-2026-9921',
      validUntil: '2027-12-31',
    });

    expect(result.isSuccess).toBe(true);
    const cert = result.getValue();
    expect(cert.id).toBeDefined();
    expect(cert.certificationType).toBe('ACELBRA_SEAL');
    expect(cert.certifyingEntity).toBe('ACELBRA Nacional');
    expect(cert.certificateCode).toBe('BR-2026-9921');
    expect(cert.validUntil).toBe('2027-12-31');
    expect(cert.verificationStatus).toBe('DECLARED_BY_PARTNER');
  });

  it('deve falhar se certificationType for vazio', () => {
    const result = ProductCertification.create({
      certificationType: '   ',
      certifyingEntity: 'ACELBRA Nacional',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('tipo de certificação');
  });

  it('deve falhar se certifyingEntity for vazio', () => {
    const result = ProductCertification.create({
      certificationType: 'ORGANIC_BRAZIL',
      certifyingEntity: '',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('entidade certificadora');
  });

  it('deve permitir atualizar status para verificado ou rejeitado com notas', () => {
    const cert = ProductCertification.create({
      certificationType: 'VEGAN_SVB',
      certifyingEntity: 'Sociedade Vegetariana Brasileira',
    }).getValue();

    expect(cert.verificationStatus).toBe('DECLARED_BY_PARTNER');

    cert.markAsVerified('Laudo técnico auditado pela equipe CeLiLac');
    expect(cert.verificationStatus).toBe('VERIFIED_BY_CELILAC');
    expect(cert.verificationNotes).toBe('Laudo técnico auditado pela equipe CeLiLac');

    cert.markAsRejected('Certificado expirado no órgão emissor');
    expect(cert.verificationStatus).toBe('REJECTED');
    expect(cert.verificationNotes).toBe('Certificado expirado no órgão emissor');
  });

  it('deve permitir vincular imagem comprobatória da galeria', () => {
    const cert = ProductCertification.create({
      certificationType: 'LAUDO_GLUTEN_FREE',
      certifyingEntity: 'Laboratório Eurofins',
    }).getValue();

    cert.linkImage('img-uuid-12345');
    expect(cert.imageId).toBe('img-uuid-12345');
  });
});
