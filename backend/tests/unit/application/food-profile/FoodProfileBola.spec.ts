// backend/tests/unit/application/food-profile/FoodProfileBola.spec.ts
import { GetFoodProfileUseCase } from '../../../../src/application/food-profile/GetFoodProfileUseCase';
import { UpdateFoodProfileUseCase } from '../../../../src/application/food-profile/UpdateFoodProfileUseCase';
import { IFoodProfileRepository } from '../../../../src/domain/food-profile/repositories/IFoodProfileRepository';
import { FoodProfile } from '../../../../src/domain/food-profile/FoodProfile';
import { Restriction } from '../../../../src/domain/food-profile/Restriction';
import { AllergenType } from '../../../../src/domain/food-profile/value-objects/AllergenType';
import { SeverityLevel } from '../../../../src/domain/food-profile/value-objects/SeverityLevel';
import { RestrictionType } from '../../../../src/domain/food-profile/value-objects/RestrictionType';

describe('BOLA / IDOR Defense (A01: Broken Object Level Authorization)', () => {
  let mockProfileRepo: jest.Mocked<IFoodProfileRepository>;
  let getUseCase: GetFoodProfileUseCase;
  let updateUseCase: UpdateFoodProfileUseCase;

  const targetUserId = 'user-owner-123';
  const attackerUserId = 'user-attacker-456';
  const adminUserId = 'user-admin-789';

  beforeEach(() => {
    const existingProfile = FoodProfile.create({
      userId: targetUserId,
      restrictions: [
        Restriction.create({
          allergen: AllergenType.GLUTEN,
          severity: SeverityLevel.FATAL,
          type: RestrictionType.ALLERGY,
        }).getValue(),
      ],
      acceptsCrossContamination: false,
    }).getValue();

    mockProfileRepo = {
      findByUserId: jest.fn().mockResolvedValue(existingProfile),
      save: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };

    getUseCase = new GetFoodProfileUseCase(mockProfileRepo);
    updateUseCase = new UpdateFoodProfileUseCase(mockProfileRepo);
  });

  describe('GetFoodProfileUseCase', () => {
    it('deve bloquear acesso de leitura quando o solicitante não for o dono nem ADMIN (IDOR)', async () => {
      const result = await getUseCase.execute({
        userId: targetUserId,
        actorId: attackerUserId,
        actorRole: 'CONSUMER',
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Acesso negado');
      expect(mockProfileRepo.findByUserId).not.toHaveBeenCalled();
    });

    it('deve permitir acesso de leitura quando o solicitante for o próprio dono', async () => {
      const result = await getUseCase.execute({
        userId: targetUserId,
        actorId: targetUserId,
        actorRole: 'CONSUMER',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().userId).toBe(targetUserId);
    });

    it('deve permitir acesso de leitura quando o solicitante for ADMIN', async () => {
      const result = await getUseCase.execute({
        userId: targetUserId,
        actorId: adminUserId,
        actorRole: 'ADMIN',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().userId).toBe(targetUserId);
    });
  });

  describe('UpdateFoodProfileUseCase', () => {
    it('deve bloquear mutação quando o solicitante não for o dono nem ADMIN (IDOR)', async () => {
      const result = await updateUseCase.execute({
        userId: targetUserId,
        actorId: attackerUserId,
        actorRole: 'CONSUMER',
        restrictions: [
          {
            allergen: AllergenType.LACTOSE,
            severity: SeverityLevel.LOW,
            type: RestrictionType.INTOLERANCE,
          },
        ],
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Acesso negado');
      expect(mockProfileRepo.update).not.toHaveBeenCalled();
    });

    it('deve permitir mutação quando o solicitante for o próprio dono', async () => {
      const result = await updateUseCase.execute({
        userId: targetUserId,
        actorId: targetUserId,
        actorRole: 'CONSUMER',
        restrictions: [
          {
            allergen: AllergenType.SOY,
            severity: SeverityLevel.MEDIUM,
            type: RestrictionType.INTOLERANCE,
          },
        ],
      });

      expect(result.isSuccess).toBe(true);
      expect(mockProfileRepo.update).toHaveBeenCalled();
    });
  });
});
