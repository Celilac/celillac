// backend/tests/unit/domain/partner/Partner.spec.ts
import { Partner, PartnerType, PartnerApprovalStatus, PartnerOperationalStatus } from '../../../../src/domain/partner/Partner';

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
      city:        'São Paulo',
      state:       'SP',
      deliveryRegion: 'Grande SP',
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
    expect(partner.city).toBe('São Paulo');
    expect(partner.state).toBe('SP');
    expect(partner.deliveryRegion).toBe('Grande SP');
    expect(partner.approvalStatus).toBe(PartnerApprovalStatus.DRAFT);
    expect(partner.operationalStatus).toBe(PartnerOperationalStatus.INACTIVE);
    expect(partner.isActive).toBe(false);
  });

  it('should fail to create a Partner if userId is empty', () => {
    const partnerResult = Partner.create({
      userId:      '',
      name:        'Sabor Celíaco',
      address:     'Rua das Flores, 123',
      description: '',
      phone:       '',
      type:        PartnerType.RESTAURANT,
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
    });

    expect(partnerResult.isFailure).toBe(true);
    expect(partnerResult.getError()).toContain('Tipo de parceiro inválido');
  });

  // ─── Testes de Fluxo e Transição de Estado ─────────────────────────────────

  it('should allow submit for review from DRAFT or REJECTED states', () => {
    const partner = Partner.create({
      userId:      'user-uuid',
      name:        'Sabor Celíaco',
      address:     'Rua das Flores, 123',
      description: '',
      phone:       '11999999999',
      type:        PartnerType.RESTAURANT,
    }).getValue();

    expect(partner.approvalStatus).toBe(PartnerApprovalStatus.DRAFT);
    const submitResult = partner.submitForReview();
    expect(submitResult.isSuccess).toBe(true);
    expect(partner.approvalStatus).toBe(PartnerApprovalStatus.PENDING_REVIEW);

    // Deve falhar ao submeter novamente
    const submitAgain = partner.submitForReview();
    expect(submitAgain.isFailure).toBe(true);
  });

  it('should fail submitForReview if name, address, or phone is missing', () => {
    // 1. Sem nome
    const partner1 = Partner.create({
      userId: 'user-uuid',
      name: 'Temp Name',
      address: 'Rua Flores',
      phone: '11999999999',
      type: PartnerType.RESTAURANT,
      description: '',
    }).getValue();
    (partner1 as any).props.name = '  ';
    const res1 = partner1.submitForReview();
    expect(res1.isFailure).toBe(true);
    expect(res1.getError()).toContain('nome comercial');

    // 2. Sem endereço
    const partner2 = Partner.create({
      userId: 'user-uuid',
      name: 'Temp Name',
      address: 'Rua Flores',
      phone: '11999999999',
      type: PartnerType.RESTAURANT,
      description: '',
    }).getValue();
    (partner2 as any).props.address = '  ';
    const res2 = partner2.submitForReview();
    expect(res2.isFailure).toBe(true);
    expect(res2.getError()).toContain('endereço');

    // 3. Sem telefone
    const partner3 = Partner.create({
      userId: 'user-uuid',
      name: 'Temp Name',
      address: 'Rua Flores',
      phone: '  ',
      type: PartnerType.RESTAURANT,
      description: '',
    }).getValue();
    const res3 = partner3.submitForReview();
    expect(res3.isFailure).toBe(true);
    expect(res3.getError()).toContain('telefone');
  });

  it('should allow approval from PENDING_REVIEW state', () => {
    const partner = Partner.create({
      userId:      'user-uuid',
      name:        'Sabor Celíaco',
      address:     'Rua das Flores, 123',
      description: '',
      phone:       '11999999999',
      type:        PartnerType.RESTAURANT,
      approvalStatus: PartnerApprovalStatus.PENDING_REVIEW,
    }).getValue();

    const approveResult = partner.approve();
    expect(approveResult.isSuccess).toBe(true);
    expect(partner.approvalStatus).toBe(PartnerApprovalStatus.APPROVED);
    expect(partner.rejectionReason).toBeUndefined();

    // Deve falhar ao aprovar novamente se não estiver pendente
    const approveAgain = partner.approve();
    expect(approveAgain.isFailure).toBe(true);
  });

  it('should allow rejection from PENDING_REVIEW if reason is provided', () => {
    const partner = Partner.create({
      userId:      'user-uuid',
      name:        'Sabor Celíaco',
      address:     'Rua das Flores, 123',
      description: '',
      phone:       '11999999999',
      type:        PartnerType.RESTAURANT,
      approvalStatus: PartnerApprovalStatus.PENDING_REVIEW,
    }).getValue();

    // Falha sem justificativa
    const rejectNoReason = partner.reject('');
    expect(rejectNoReason.isFailure).toBe(true);

    // Sucesso com justificativa
    const rejectResult = partner.reject('Documentação do CNPJ não enviada.');
    expect(rejectResult.isSuccess).toBe(true);
    expect(partner.approvalStatus).toBe(PartnerApprovalStatus.REJECTED);
    expect(partner.rejectionReason).toBe('Documentação do CNPJ não enviada.');

    // Deve falhar ao rejeitar se não estiver pendente
    const rejectAgain = partner.reject('Algum motivo');
    expect(rejectAgain.isFailure).toBe(true);
  });

  it('should allow suspension from APPROVED state and require reason', () => {
    const partner = Partner.create({
      userId:      'user-uuid',
      name:        'Sabor Celíaco',
      address:     'Rua das Flores, 123',
      description: '',
      phone:       '11999999999',
      type:        PartnerType.RESTAURANT,
      approvalStatus: PartnerApprovalStatus.APPROVED,
      operationalStatus: PartnerOperationalStatus.ACTIVE,
    }).getValue();

    // Falha sem justificativa
    const suspendNoReason = partner.suspend('');
    expect(suspendNoReason.isFailure).toBe(true);

    // Sucesso com justificativa
    const suspendResult = partner.suspend('Alerta de contaminação cruzada grave.');
    expect(suspendResult.isSuccess).toBe(true);
    expect(partner.approvalStatus).toBe(PartnerApprovalStatus.SUSPENDED);
    expect(partner.suspensionReason).toBe('Alerta de contaminação cruzada grave.');
    // Operação deve ser forçada para INACTIVE ao suspender
    expect(partner.operationalStatus).toBe(PartnerOperationalStatus.INACTIVE);

    // Falha ao suspender se não estiver aprovado
    const suspendAgain = partner.suspend('Outro motivo');
    expect(suspendAgain.isFailure).toBe(true);
  });

  it('should allow reactivation from SUSPENDED state', () => {
    const partner = Partner.create({
      userId:      'user-uuid',
      name:        'Sabor Celíaco',
      address:     'Rua das Flores, 123',
      description: '',
      phone:       '11999999999',
      type:        PartnerType.RESTAURANT,
      approvalStatus: PartnerApprovalStatus.SUSPENDED,
      suspensionReason: 'Irregularidade temporária',
    }).getValue();

    const reactivateResult = partner.reactivate();
    expect(reactivateResult.isSuccess).toBe(true);
    expect(partner.approvalStatus).toBe(PartnerApprovalStatus.APPROVED);
    expect(partner.suspensionReason).toBeUndefined();

    // Falha ao reativar se não estiver suspenso
    const reactivateAgain = partner.reactivate();
    expect(reactivateAgain.isFailure).toBe(true);
  });

  it('should prevent operational status changes for suspended partners', () => {
    const partner = Partner.create({
      userId:      'user-uuid',
      name:        'Sabor Celíaco',
      address:     'Rua das Flores, 123',
      description: '',
      phone:       '11999999999',
      type:        PartnerType.RESTAURANT,
      approvalStatus: PartnerApprovalStatus.SUSPENDED,
    }).getValue();

    const opResult = partner.updateOperationalStatus(PartnerOperationalStatus.ACTIVE);
    expect(opResult.isFailure).toBe(true);
    expect(opResult.getError()).toContain('suspensos não podem');
  });

  it('should allow operational status changes for non-suspended partners', () => {
    const partner = Partner.create({
      userId:      'user-uuid',
      name:        'Sabor Celíaco',
      address:     'Rua das Flores, 123',
      description: '',
      phone:       '11999999999',
      type:        PartnerType.RESTAURANT,
      approvalStatus: PartnerApprovalStatus.APPROVED,
    }).getValue();

    const opResult = partner.updateOperationalStatus(PartnerOperationalStatus.TEMPORARILY_CLOSED);
    expect(opResult.isSuccess).toBe(true);
    expect(partner.operationalStatus).toBe(PartnerOperationalStatus.TEMPORARILY_CLOSED);

    const invalidResult = partner.updateOperationalStatus('INVALID' as any);
    expect(invalidResult.isFailure).toBe(true);
  });

  // ─── Testes de Edição Crítica ──────────────────────────────────────────────

  it('should downgrade approval to PENDING_REVIEW if critical details change on an APPROVED partner', () => {
    const partner = Partner.create({
      userId:      'user-uuid',
      name:        'Sabor Celíaco',
      address:     'Rua das Flores, 123',
      description: '',
      phone:       '11999999999',
      type:        PartnerType.RESTAURANT,
      approvalStatus: PartnerApprovalStatus.APPROVED,
    }).getValue();

    // Alteração não crítica: descrição
    const updateDesc = partner.updateDetails({ description: 'Nova descrição do local' });
    expect(updateDesc.isSuccess).toBe(true);
    expect(partner.approvalStatus).toBe(PartnerApprovalStatus.APPROVED);

    // Alteração crítica: endereço
    const updateAddr = partner.updateDetails({ address: 'Av. Paulista, 500' });
    expect(updateAddr.isSuccess).toBe(true);
    expect(partner.approvalStatus).toBe(PartnerApprovalStatus.PENDING_REVIEW);
  });

  it('should validate inputs during updateDetails', () => {
    const partner = Partner.create({
      userId:      'user-uuid',
      name:        'Sabor Celíaco',
      address:     'Rua das Flores, 123',
      description: '',
      phone:       '11999999999',
      type:        PartnerType.RESTAURANT,
    }).getValue();

    // Nome vazio
    const resName = partner.updateDetails({ name: '  ' });
    expect(resName.isFailure).toBe(true);
    expect(resName.getError()).toContain('nome comercial');

    // Tipo inválido
    const resType = partner.updateDetails({ type: 'INVALID' as any });
    expect(resType.isFailure).toBe(true);
    expect(resType.getError()).toContain('Tipo de parceiro inválido');

    // Endereço vazio
    const resAddr = partner.updateDetails({ address: '  ' });
    expect(resAddr.isFailure).toBe(true);
    expect(resAddr.getError()).toContain('endereço');

    // CNPJ inválido
    const resCnpj = partner.updateDetails({ cnpj: '123' });
    expect(resCnpj.isFailure).toBe(true);
    expect(resCnpj.getError()).toContain('CNPJ inválido');

    // CNPJ válido e posterior limpeza
    const resCnpjOk = partner.updateDetails({ cnpj: '12.345.678/0001-95' });
    expect(resCnpjOk.isSuccess).toBe(true);
    expect(partner.cnpj).toBe('12.345.678/0001-95');

    const resCnpjClean = partner.updateDetails({ cnpj: '' });
    expect(resCnpjClean.isSuccess).toBe(true);
    expect(partner.cnpj).toBeUndefined();

    // Atualização de cidade, estado, região
    const resDetails = partner.updateDetails({
      city: 'São Paulo',
      state: 'SP',
      deliveryRegion: 'Zona Sul',
    });
    expect(resDetails.isSuccess).toBe(true);
    expect(partner.city).toBe('São Paulo');
    expect(partner.state).toBe('SP');
    expect(partner.deliveryRegion).toBe('Zona Sul');
  });

  it('should support creating and updating logoUrl without regressing approved status', () => {
    const partner = Partner.create({
      userId:      'user-uuid',
      name:        'Sabor Celíaco',
      address:     'Rua das Flores, 123',
      description: '',
      phone:       '11999999999',
      type:        PartnerType.RESTAURANT,
      logoUrl:     'data:image/webp;base64,sample123',
      approvalStatus: PartnerApprovalStatus.APPROVED,
    }).getValue();

    expect(partner.logoUrl).toBe('data:image/webp;base64,sample123');

    // Atualizar logoUrl em parceiro aprovado não deve regredir status
    const updateLogo = partner.updateDetails({ logoUrl: 'data:image/webp;base64,sample456' });
    expect(updateLogo.isSuccess).toBe(true);
    expect(partner.logoUrl).toBe('data:image/webp;base64,sample456');
    expect(partner.approvalStatus).toBe(PartnerApprovalStatus.APPROVED);

    // Limpar logoUrl
    const clearLogo = partner.updateDetails({ logoUrl: '' });
    expect(clearLogo.isSuccess).toBe(true);
    expect(partner.logoUrl).toBeUndefined();
  });

  it('should support legacy activate and inactivate methods', () => {
    const partner = Partner.create({
      userId:      'user-uuid',
      name:        'Sabor Celíaco',
      address:     'Rua das Flores, 123',
      description: '',
      phone:       '11999999999',
      type:        PartnerType.RESTAURANT,
    }).getValue();

    partner.activate();
    expect(partner.approvalStatus).toBe(PartnerApprovalStatus.APPROVED);
    expect(partner.operationalStatus).toBe(PartnerOperationalStatus.ACTIVE);
    expect(partner.isActive).toBe(true);

    partner.inactivate();
    expect(partner.operationalStatus).toBe(PartnerOperationalStatus.INACTIVE);
    expect(partner.isActive).toBe(false);
  });
});
