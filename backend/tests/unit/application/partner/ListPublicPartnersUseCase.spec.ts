// backend/tests/unit/application/partner/ListPublicPartnersUseCase.spec.ts
import { ListPublicPartnersUseCase } from '../../../../src/application/partner/ListPublicPartnersUseCase';
import { IPartnerRepository } from '../../../../src/domain/partner/repositories/IPartnerRepository';
import { Partner, PartnerType, PartnerApprovalStatus, PartnerOperationalStatus } from '../../../../src/domain/partner/Partner';

describe('ListPublicPartnersUseCase', () => {
  let partnerRepository: jest.Mocked<IPartnerRepository>;
  let useCase: ListPublicPartnersUseCase;

  const makePartner = (
    id: string,
    approvalStatus: PartnerApprovalStatus,
    operationalStatus: PartnerOperationalStatus,
  ) =>
    Partner.create({
      userId: `user-${id}`,
      name: `Parceiro ${id}`,
      address: 'Rua das Flores, 123',
      description: '',
      phone: '1234-5678',
      type: PartnerType.RESTAURANT,
      approvalStatus,
      operationalStatus,
    }, id).getValue();

  beforeEach(() => {
    partnerRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAllByUserId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    } as any;
    useCase = new ListPublicPartnersUseCase(partnerRepository);
  });

  it('deve listar apenas parceiros aprovados e ativos ou temporariamente fechados', async () => {
    partnerRepository.findAll.mockResolvedValue([
      makePartner('draft', PartnerApprovalStatus.DRAFT, PartnerOperationalStatus.INACTIVE),
      makePartner('pending', PartnerApprovalStatus.PENDING_REVIEW, PartnerOperationalStatus.INACTIVE),
      makePartner('rejected', PartnerApprovalStatus.REJECTED, PartnerOperationalStatus.INACTIVE),
      makePartner('suspended', PartnerApprovalStatus.SUSPENDED, PartnerOperationalStatus.INACTIVE),
      makePartner('approved-inactive', PartnerApprovalStatus.APPROVED, PartnerOperationalStatus.INACTIVE),
      makePartner('approved-active', PartnerApprovalStatus.APPROVED, PartnerOperationalStatus.ACTIVE),
      makePartner('approved-closed', PartnerApprovalStatus.APPROVED, PartnerOperationalStatus.TEMPORARILY_CLOSED),
    ]);

    const result = await useCase.execute();

    expect(result.isSuccess).toBe(true);
    const ids = result.getValue().map((p) => p.id);
    expect(ids).toEqual(['approved-active', 'approved-closed']);
    // RN-PARTNER-09: aprovado, mas operacionalmente inativo, não pode aparecer na busca pública
    expect(ids).not.toContain('approved-inactive');
  });
});
