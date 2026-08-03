// backend/tests/unit/application/food-profile/UpdateFoodProfileUseCase.spec.ts
import { UpdateFoodProfileUseCase } from '../../../../src/application/food-profile/UpdateFoodProfileUseCase';
import { IFoodProfileRepository } from '../../../../src/domain/food-profile/repositories/IFoodProfileRepository';
import { FoodProfile } from '../../../../src/domain/food-profile/FoodProfile';
import { Restriction } from '../../../../src/domain/food-profile/Restriction';
import { AllergenType } from '../../../../src/domain/food-profile/value-objects/AllergenType';
import { SeverityLevel } from '../../../../src/domain/food-profile/value-objects/SeverityLevel';

describe('UpdateFoodProfileUseCase', () => {
  let profileRepository: jest.Mocked<IFoodProfileRepository>;
  let useCase: UpdateFoodProfileUseCase;

  beforeEach(() => {
    profileRepository = {
      save: jest.fn(),
      update: jest.fn(),
      findByUserId: jest.fn(),
    };
    useCase = new UpdateFoodProfileUseCase(profileRepository);
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

  it('deve atualizar o perfil com sucesso', async () => {
    const existingProfile = FoodProfile.create({
      userId: 'user-123',
      restrictions: [
        // type: INTOLERANCE para LOW — ALLERGY+LOW é rejeitado pela RN-CONSUMER-05
        Restriction.create({ allergen: AllergenType.LACTOSE, severity: SeverityLevel.LOW, type: 'INTOLERANCE' as any }).getValue(),
      ],
    }).getValue();

    profileRepository.findByUserId.mockResolvedValue(existingProfile);

    const result = await useCase.execute({
      userId: 'user-123',
      restrictions: [{ allergen: 'GLUTEN', severity: 'FATAL' }],
    });

    expect(result.isSuccess).toBe(true);
    const dto = result.getValue();
    expect(dto.userId).toBe('user-123');
    expect(dto.restrictions).toHaveLength(1);
    expect(dto.restrictions[0].allergen).toBe('GLUTEN');
    expect(dto.requiresHistoryRevalidation).toBe(true); // Pois adicionou FATAL

    expect(profileRepository.update).toHaveBeenCalledWith(existingProfile);
  });

  it('deve falhar se houver restrições duplicadas no DTO de atualização', async () => {
    const existingProfile = FoodProfile.create({ userId: 'user-123', restrictions: [] }).getValue();
    profileRepository.findByUserId.mockResolvedValue(existingProfile);

    const result = await useCase.execute({
      userId: 'user-123',
      restrictions: [
        { allergen: 'GLUTEN', severity: 'FATAL' },
        { allergen: 'GLUTEN', severity: 'FATAL' }, // duplicado — deve falhar com "já existe neste perfil"
      ],
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('já existe neste perfil');
  });
});
