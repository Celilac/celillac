// backend/tests/unit/application/food-profile/UpdateFoodProfileUseCase.spec.ts
import { UpdateFoodProfileUseCase } from '../../../../src/application/food-profile/UpdateFoodProfileUseCase';
import { IFoodProfileRepository } from '../../../../src/domain/food-profile/repositories/IFoodProfileRepository';
import { IConsumerRepository } from '../../../../src/domain/consumer/repositories/IConsumerRepository';
import { IAuditLogRepository } from '../../../../src/domain/audit/repositories/IAuditLogRepository';
import { FoodProfile } from '../../../../src/domain/food-profile/FoodProfile';
import { Restriction } from '../../../../src/domain/food-profile/Restriction';
import { Consumer } from '../../../../src/domain/consumer/Consumer';
import { AllergenType } from '../../../../src/domain/food-profile/value-objects/AllergenType';
import { SeverityLevel } from '../../../../src/domain/food-profile/value-objects/SeverityLevel';

describe('UpdateFoodProfileUseCase', () => {
  let profileRepository: jest.Mocked<IFoodProfileRepository>;
  let consumerRepository: jest.Mocked<IConsumerRepository>;
  let auditLogRepository: jest.Mocked<IAuditLogRepository>;
  let useCase: UpdateFoodProfileUseCase;

  beforeEach(() => {
    profileRepository = {
      save: jest.fn(),
      update: jest.fn(),
      findByUserId: jest.fn(),
    };
    consumerRepository = {
      save: jest.fn(),
      findByUserId: jest.fn(),
      findById: jest.fn(),
    };
    auditLogRepository = {
      save: jest.fn(),
      findByEntity: jest.fn(),
    };
    useCase = new UpdateFoodProfileUseCase(profileRepository, consumerRepository, auditLogRepository);
  });

  it('deve retornar erro se o perfil não for encontrado', async () => {
    profileRepository.findByUserId.mockResolvedValue(null);

    const result = await useCase.execute({
      userId: 'user-123',
      restrictions: [{ allergen: 'GLUTEN', severity: 'FATAL' }],
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('Perfil alimentar não encontrado.');
  });

  it('deve atualizar o perfil com sucesso, sincronizar agregados e gravar auditoria', async () => {
    const existingProfile = FoodProfile.create({
      userId: 'user-123',
      restrictions: [
        Restriction.create({ allergen: AllergenType.LACTOSE, severity: SeverityLevel.LOW, type: 'INTOLERANCE' as any }).getValue(),
      ],
    }).getValue();

    const mockConsumer = Consumer.create({ userId: 'user-123' }).getValue();

    profileRepository.findByUserId.mockResolvedValue(existingProfile);
    consumerRepository.findByUserId.mockResolvedValue(mockConsumer);

    const result = await useCase.execute({
      userId: 'user-123',
      restrictions: [{ allergen: 'GLUTEN', severity: 'FATAL' }],
      acceptsCrossContamination: false,
    });

    expect(result.isSuccess).toBe(true);
    const dto = result.getValue();
    expect(dto.userId).toBe('user-123');
    expect(dto.restrictions).toHaveLength(1);
    expect(dto.restrictions[0].allergen).toBe('GLUTEN');
    expect(dto.requiresHistoryRevalidation).toBe(true);

    expect(profileRepository.update).toHaveBeenCalledWith(existingProfile);
    expect(consumerRepository.save).toHaveBeenCalledWith(mockConsumer);
    expect(auditLogRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'FoodProfile',
        action: 'UPDATE',
        actorId: 'user-123',
      }),
    );
  });

  it('deve falhar se houver restrições inválidas no DTO', async () => {
    const existingProfile = FoodProfile.create({ userId: 'user-123', restrictions: [] }).getValue();
    profileRepository.findByUserId.mockResolvedValue(existingProfile);

    const result = await useCase.execute({
      userId: 'user-123',
      restrictions: [{ allergen: 'INVALID_ALLERGEN' as any, severity: 'FATAL' }],
    });

    expect(result.isFailure).toBe(true);
  });

  it('deve falhar se houver restrições duplicadas no DTO de atualização', async () => {
    const existingProfile = FoodProfile.create({ userId: 'user-123', restrictions: [] }).getValue();
    profileRepository.findByUserId.mockResolvedValue(existingProfile);

    const result = await useCase.execute({
      userId: 'user-123',
      restrictions: [
        { allergen: 'GLUTEN', severity: 'FATAL' },
        { allergen: 'GLUTEN', severity: 'FATAL' },
      ],
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('Já existe uma restrição');
  });
});
