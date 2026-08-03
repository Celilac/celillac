// tests/unit/domain/food-profile/FoodProfile.spec.ts
import { FoodProfile } from '../../../../src/domain/food-profile/FoodProfile';
import { Restriction } from '../../../../src/domain/food-profile/Restriction';
import { AllergenType } from '../../../../src/domain/food-profile/value-objects/AllergenType';
import { SeverityLevel } from '../../../../src/domain/food-profile/value-objects/SeverityLevel';
import { RestrictionType } from '../../../../src/domain/food-profile/value-objects/RestrictionType';

const makeRestriction = (allergen: AllergenType, severity: SeverityLevel) =>
  Restriction.create({ allergen, severity, type: RestrictionType.INTOLERANCE }).getValue();

const USER_ID = 'user-uuid-123';

describe('FoodProfile Aggregate Root', () => {
  describe('create() — casos válidos', () => {
    it('deve criar um perfil com restrições', () => {
      const restrictions = [makeRestriction(AllergenType.GLUTEN, SeverityLevel.FATAL)];
      const result = FoodProfile.create({ userId: USER_ID, restrictions });
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().userId).toBe(USER_ID);
      expect(result.getValue().restrictions).toHaveLength(1);
    });

    it('deve criar um perfil vazio (sem restrições iniciais)', () => {
      const result = FoodProfile.create({ userId: USER_ID, restrictions: [] });
      expect(result.isSuccess).toBe(true);
    });
  });

  describe('isActive() — regra DOMAIN_MODEL.md', () => {
    it('deve ser ativo quando tem pelo menos uma restrição', () => {
      const profile = FoodProfile.create({
        userId: USER_ID,
        restrictions: [makeRestriction(AllergenType.GLUTEN, SeverityLevel.FATAL)],
      }).getValue();
      expect(profile.isActive()).toBe(true);
    });

    it('deve ser inativo quando não tem restrições', () => {
      const profile = FoodProfile.create({ userId: USER_ID, restrictions: [] }).getValue();
      expect(profile.isActive()).toBe(false);
    });
  });

  describe('addRestriction() — regras de negócio', () => {
    it('deve adicionar uma restrição ao perfil', () => {
      const profile = FoodProfile.create({ userId: USER_ID, restrictions: [] }).getValue();
      const restriction = makeRestriction(AllergenType.LACTOSE, SeverityLevel.MEDIUM);
      profile.addRestriction(restriction);
      expect(profile.restrictions).toHaveLength(1);
    });

    it('deve sinalizar revalidação quando restrição adicionada é FATAL', () => {
      const profile = FoodProfile.create({ userId: USER_ID, restrictions: [] }).getValue();
      const fatalRestriction = makeRestriction(AllergenType.GLUTEN, SeverityLevel.FATAL);
      profile.addRestriction(fatalRestriction);
      // Regra crítica: mudanças FATAL exigem revalidação
      expect(profile.requiresHistoryRevalidation).toBe(true);
    });

    it('não deve sinalizar revalidação para restrições não-FATAL', () => {
      const profile = FoodProfile.create({ userId: USER_ID, restrictions: [] }).getValue();
      profile.addRestriction(makeRestriction(AllergenType.SOY, SeverityLevel.LOW));
      expect(profile.requiresHistoryRevalidation).toBe(false);
    });

    it('deve impedir duplicidade de alérgeno no mesmo perfil', () => {
      const profile = FoodProfile.create({
        userId: USER_ID,
        restrictions: [makeRestriction(AllergenType.GLUTEN, SeverityLevel.FATAL)],
      }).getValue();
      // Tentar adicionar GLUTEN novamente
      const result = profile.addRestriction(makeRestriction(AllergenType.GLUTEN, SeverityLevel.HIGH));
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe('Alérgeno GLUTEN já existe neste perfil.');
    });
  });

  describe('create() — validações', () => {
    it('deve falhar se userId estiver vazio', () => {
      const result = FoodProfile.create({ userId: '', restrictions: [] });
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe('O userId do perfil não pode ser vazio.');
    });

    it('deve falhar se houver alérgenos duplicados nas restrições iniciais', () => {
      const restrictions = [
        makeRestriction(AllergenType.GLUTEN, SeverityLevel.FATAL),
        makeRestriction(AllergenType.GLUTEN, SeverityLevel.HIGH), // duplicado
      ];
      const result = FoodProfile.create({ userId: USER_ID, restrictions });
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('duplicado');
    });
  });
});
