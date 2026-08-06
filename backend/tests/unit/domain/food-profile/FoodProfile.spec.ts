// tests/unit/domain/food-profile/FoodProfile.spec.ts
import { FoodProfile } from '../../../../src/domain/food-profile/FoodProfile';
import { Restriction } from '../../../../src/domain/food-profile/Restriction';
import { AllergenType } from '../../../../src/domain/food-profile/value-objects/AllergenType';
import { SeverityLevel } from '../../../../src/domain/food-profile/value-objects/SeverityLevel';
import { RestrictionType } from '../../../../src/domain/food-profile/value-objects/RestrictionType';

const makeRestriction = (allergen: AllergenType, severity: SeverityLevel, type?: RestrictionType) =>
  Restriction.create({ allergen, severity, type: type || RestrictionType.INTOLERANCE }).getValue();

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

    it('deve impedir duplicidade de alérgeno + tipo no mesmo perfil', () => {
      const profile = FoodProfile.create({
        userId: USER_ID,
        restrictions: [makeRestriction(AllergenType.GLUTEN, SeverityLevel.FATAL, RestrictionType.ALLERGY)],
      }).getValue();
      // Tentar adicionar GLUTEN/ALLERGY novamente
      const result = profile.addRestriction(
        makeRestriction(AllergenType.GLUTEN, SeverityLevel.HIGH, RestrictionType.ALLERGY),
      );
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(
        'Já existe uma restrição do tipo ALLERGY para o alérgeno GLUTEN neste perfil.',
      );
    });

    it('RN-CONSUMER-03: deve permitir o mesmo alérgeno com tipos diferentes (ex.: OTHER/LIFESTYLE + OTHER/ALLERGY)', () => {
      const profile = FoodProfile.create({
        userId: USER_ID,
        restrictions: [makeRestriction(AllergenType.OTHER, SeverityLevel.LIFESTYLE, RestrictionType.LIFESTYLE)],
      }).getValue();
      // Vegetariano (OTHER/LIFESTYLE) + alergia a um alérgeno não listado (OTHER/ALLERGY) simultaneamente
      const result = profile.addRestriction(
        makeRestriction(AllergenType.OTHER, SeverityLevel.HIGH, RestrictionType.ALLERGY),
      );
      expect(result.isSuccess).toBe(true);
      expect(profile.restrictions).toHaveLength(2);
    });
  });

  describe('create() — validações', () => {
    it('deve falhar se userId estiver vazio', () => {
      const result = FoodProfile.create({ userId: '', restrictions: [] });
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe('O userId do perfil não pode ser vazio.');
    });

    it('deve permitir múltiplas restrições do tipo OTHER desde que possuam tipos de restrição diferentes (RN-CONSUMER-03)', () => {
      const r1 = Restriction.create({ allergen: AllergenType.OTHER, severity: SeverityLevel.MEDIUM, type: RestrictionType.LIFESTYLE }).getValue();
      const r2 = Restriction.create({ allergen: AllergenType.OTHER, severity: SeverityLevel.HIGH, type: RestrictionType.ALLERGY }).getValue();

      const profileRes = FoodProfile.create({ userId: USER_ID, restrictions: [r1, r2] });
      expect(profileRes.isSuccess).toBe(true);
      expect(profileRes.getValue().restrictions).toHaveLength(2);

      const addRes = profileRes.getValue().addRestriction(
        Restriction.create({ allergen: AllergenType.OTHER, severity: SeverityLevel.LOW, type: RestrictionType.MEDICAL_RESTRICTION }).getValue(),
      );
      expect(addRes.isSuccess).toBe(true);
      expect(profileRes.getValue().restrictions).toHaveLength(3);
    });

    it('deve impedir a adição de restrições OTHER com o mesmo tipo de restrição', () => {
      const r1 = Restriction.create({ allergen: AllergenType.OTHER, severity: SeverityLevel.MEDIUM, type: RestrictionType.LIFESTYLE }).getValue();
      const r2 = Restriction.create({ allergen: AllergenType.OTHER, severity: SeverityLevel.HIGH, type: RestrictionType.LIFESTYLE }).getValue();

      const profileRes = FoodProfile.create({ userId: USER_ID, restrictions: [r1, r2] });
      expect(profileRes.isFailure).toBe(true);
    });
  });
});
