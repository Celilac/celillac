// backend/tests/unit/domain/partner/Partner.spec.ts
import { Partner, PartnerType } from '../../../../src/domain/partner/Partner';

describe('Partner Domain Entity', () => {
  it('should successfully create a Partner instance with valid data', () => {
    const partnerResult = Partner.create({
      userId:      'user-uuid',
      name:        'Sabor Celíaco',
      cnpj:        '12.345.678/0001-95',
      description: 'Restaurante 100% sem glúten e sem contaminação.',
      address:     'Rua das Flores, 123',
      phone:       '(11) 99999-9999',
      type:        PartnerType.RESTAURANT,
      isActive:    true,
    });

    expect(partnerResult.isSuccess).toBe(true);
    const partner = partnerResult.getValue();
    expect(partner.userId).toBe('user-uuid');
    expect(partner.name).toBe('Sabor Celíaco');
    expect(partner.cnpj).toBe('12.345.678/0001-95');
    expect(partner.description).toBe('Restaurante 100% sem glúten e sem contaminação.');
    expect(partner.address).toBe('Rua das Flores, 123');
    expect(partner.phone).toBe('(11) 99999-9999');
    expect(partner.type).toBe(PartnerType.RESTAURANT);
    expect(partner.isActive).toBe(true);
  });

  it('should fail to create a Partner if userId is empty', () => {
    const partnerResult = Partner.create({
      userId:      '',
      name:        'Sabor Celíaco',
      address:     'Rua das Flores, 123',
      description: '',
      phone:       '',
      type:        PartnerType.RESTAURANT,
      isActive:    true,
    });

    expect(partnerResult.isFailure).toBe(true);
    expect(partnerResult.getError()).toContain('ID de usuário');
  });

  it('should fail to create a Partner if name is empty', () => {
    const partnerResult = Partner.create({
      userId:      'user-uuid',
      name:        '  ',
      address:     'Rua das Flores, 123',
      description: '',
      phone:       '',
      type:        PartnerType.RESTAURANT,
      isActive:    true,
    });

    expect(partnerResult.isFailure).toBe(true);
    expect(partnerResult.getError()).toContain('nome comercial');
  });

  it('should fail to create a Partner if address is empty', () => {
    const partnerResult = Partner.create({
      userId:      'user-uuid',
      name:        'Sabor Celíaco',
      address:     '  ',
      description: '',
      phone:       '',
      type:        PartnerType.RESTAURANT,
      isActive:    true,
    });

    expect(partnerResult.isFailure).toBe(true);
    expect(partnerResult.getError()).toContain('endereço');
  });

  it('should fail to create a Partner if CNPJ is invalid', () => {
    const partnerResult = Partner.create({
      userId:      'user-uuid',
      name:        'Sabor Celíaco',
      cnpj:        '12.345.678/0001-9', // 13 dígitos apenas
      address:     'Rua das Flores, 123',
      description: '',
      phone:       '',
      type:        PartnerType.RESTAURANT,
      isActive:    true,
    });

    expect(partnerResult.isFailure).toBe(true);
    expect(partnerResult.getError()).toContain('CNPJ inválido');
  });

  it('should fail to create a Partner if type is invalid', () => {
    const partnerResult = Partner.create({
      userId:      'user-uuid',
      name:        'Sabor Celíaco',
      address:     'Rua das Flores, 123',
      description: '',
      phone:       '',
      type:        'INVALID_TYPE' as any,
      isActive:    true,
    });

    expect(partnerResult.isFailure).toBe(true);
    expect(partnerResult.getError()).toContain('Tipo de parceiro inválido');
  });
});
