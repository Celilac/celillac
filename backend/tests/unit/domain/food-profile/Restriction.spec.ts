// tests/unit/domain/food-profile/Restriction.spec.ts
import { Restriction } from '../../../../src/domain/food-profile/Restriction';
import { AllergenType } from '../../../../src/domain/food-profile/value-objects/AllergenType';
import { SeverityLevel } from '../../../../src/domain/food-profile/value-objects/SeverityLevel';

describe('Restriction Entity', () => {
  describe('create() — casos válidos', () => {
    it('deve criar uma restrição GLUTEN FATAL', () => {
      const result = Restriction.create({ allergen: AllergenType.GLUTEN, severity: SeverityLevel.FATAL });
      expect(result.isSuccess).toBe(true);
      const r = result.getValue();
      expect(r.allergen).toBe(AllergenType.GLUTEN);
      expect(r.severity).toBe(SeverityLevel.FATAL);
    });

    it('deve criar uma restrição LACTOSE MEDIUM', () => {
      const result = Restriction.create({ allergen: AllergenType.LACTOSE, severity: SeverityLevel.MEDIUM });
      expect(result.isSuccess).toBe(true);
    });

    it('deve gerar ID único para cada restrição', () => {
      const r1 = Restriction.create({ allergen: AllergenType.NUTS, severity: SeverityLevel.HIGH }).getValue();
      const r2 = Restriction.create({ allergen: AllergenType.NUTS, severity: SeverityLevel.HIGH }).getValue();
      expect(r1.id).not.toBe(r2.id);
    });

    it('deve aceitar id fornecido (reconstituição do banco)', () => {
      const id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const r = Restriction.create({ allergen: AllergenType.SOY, severity: SeverityLevel.LOW }, id).getValue();
      expect(r.id).toBe(id);
    });
  });

  describe('isFatal()', () => {
    it('deve retornar true para SeverityLevel.FATAL', () => {
      const r = Restriction.create({ allergen: AllergenType.GLUTEN, severity: SeverityLevel.FATAL }).getValue();
      expect(r.isFatal()).toBe(true);
    });

    it('deve retornar false para severidades não FATAL', () => {
      const r = Restriction.create({ allergen: AllergenType.LACTOSE, severity: SeverityLevel.HIGH }).getValue();
      expect(r.isFatal()).toBe(false);
    });
  });

  describe('create() — casos inválidos', () => {
    it('deve falhar para allergen inválido', () => {
      const result = Restriction.create({
        allergen: 'INVALIDO' as AllergenType,
        severity: SeverityLevel.FATAL,
      });
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('alérgeno inválido');
    });

    it('deve falhar para severity inválida', () => {
      const result = Restriction.create({
        allergen: AllergenType.GLUTEN,
        severity: 'INVALIDO' as SeverityLevel,
      });
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('severidade inválido');
    });
  });
});
