// backend/tests/unit/application/partner/ListUserPartnersUseCase.spec.ts
import { ListUserPartnersUseCase } from '../../../../src/application/partner/ListUserPartnersUseCase';
import { IPartnerRepository } from '../../../../src/domain/partner/repositories/IPartnerRepository';
import { Partner, PartnerType, PartnerApprovalStatus } from '../../../../src/domain/partner/Partner';

describe('ListUserPartnersUseCase', () => {
  let partnerRepository: jest.Mocked<IPartnerRepository>;
  let useCase: ListUserPartnersUseCase;

  beforeEach(() => {
    partnerRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAllByUserId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    } as any;
    useCase = new ListUserPartnersUseCase(partnerRepository);
  });

  it('deve listar todos os parceiros do usuário logado, em qualquer estado (11.9)', async () => {
    const draft = Partner.create({
      userId: 'user-1', name: 'Rascunho', address: 'Rua A', description: '', phone: '111',
      type: PartnerType.RESTAURANT, approvalStatus: PartnerApprovalStatus.DRAFT,
    }, 'partner-1').getValue();
    const suspended = Partner.create({
      userId: 'user-1', name: 'Suspenso', address: 'Rua B', description: '', phone: '222',
      type: PartnerType.MARKET, approvalStatus: PartnerApprovalStatus.SUSPENDED,
    }, 'partner-2').getValue();

    partnerRepository.findAllByUserId.mockResolvedValue([draft, suspended]);

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toHaveLength(2);
    expect(result.getValue().map((p) => p.id)).toEqual(['partner-1', 'partner-2']);
    expect(partnerRepository.findAllByUserId).toHaveBeenCalledWith('user-1');
  });

  it('deve retornar lista vazia quando o usuário não possui parceiros cadastrados', async () => {
    partnerRepository.findAllByUserId.mockResolvedValue([]);

    const result = await useCase.execute({ userId: 'user-sem-parceiros' });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toEqual([]);
  });
});
