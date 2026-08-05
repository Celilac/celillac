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
      // type: INTOLERANCE para LOW — ALLERGY+LOW é rejeitado pela RN-CONSUMER-05
      const r = Restriction.create({ allergen: AllergenType.SOY, severity: SeverityLevel.LOW, type: RestrictionType.INTOLERANCE }, id).getValue();
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

// ============================================================
// RestrictionType — Cobertura do campo `type`
// Issue #34 / RN-CONSUMER-05
// ============================================================
import { RestrictionType } from '../../../../src/domain/food-profile/value-objects/RestrictionType';

describe('Restriction Entity — RestrictionType (Issue #34 / RN-CONSUMER-05)', () => {

  describe('type — valor padrão', () => {
    it('deve aplicar ALLERGY como tipo padrão quando type não é informado', () => {
      // Comportamento atual: Restriction.ts linha 25 usa `props.type || RestrictionType.ALLERGY`
      // Isso significa que TODOS os perfis criados sem `type` explícito são implicitamente ALLERGY.
      const r = Restriction.create({
        allergen: AllergenType.GLUTEN,
        severity: SeverityLevel.FATAL,
      }).getValue();
      expect(r.type).toBe(RestrictionType.ALLERGY);
    });
  });

  describe('type — todos os valores do enum são aceitos em create()', () => {
    const allTypes = [
      RestrictionType.ALLERGY,
      RestrictionType.INTOLERANCE,
      RestrictionType.MEDICAL_RESTRICTION,
      RestrictionType.DIETARY_PREFERENCE,
      RestrictionType.LIFESTYLE,
    ];

    allTypes.forEach((type) => {
      it(`deve criar restrição com type = ${type}`, () => {
        const result = Restriction.create({
          allergen: AllergenType.LACTOSE,
          severity: SeverityLevel.MEDIUM,
          type,
        });
        expect(result.isSuccess).toBe(true);
        expect(result.getValue().type).toBe(type);
      });
    });

    it('deve falhar para type inválido', () => {
      const result = Restriction.create({
        allergen: AllergenType.LACTOSE,
        severity: SeverityLevel.MEDIUM,
        type: 'INVALIDO' as RestrictionType,
      });
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('restrição inválido');
    });
  });

  describe('type — campo notes (opcional)', () => {
    it('deve armazenar notes quando informado', () => {
      const r = Restriction.create({
        allergen: AllergenType.NUTS,
        severity: SeverityLevel.HIGH,
        type: RestrictionType.ALLERGY,
        notes: 'Alergia diagnosticada por alergista em 2023.',
      }).getValue();
      expect(r.notes).toBe('Alergia diagnosticada por alergista em 2023.');
    });

    it('deve retornar undefined para notes quando não informado', () => {
      // type: INTOLERANCE para LOW — ALLERGY+LOW é rejeitado pela RN-CONSUMER-05
      const r = Restriction.create({
        allergen: AllergenType.SOY,
        severity: SeverityLevel.LOW,
        type: RestrictionType.INTOLERANCE,
      }).getValue();
      expect(r.notes).toBeUndefined();
    });
  });

  // ============================================================
  // RN-CONSUMER-05 — Implementado em 2026-08-01 (Issue #34)
  // Abordagem A: Restriction.create() rejeita ALLERGY + LOW/LIFESTYLE.
  // Severidade mínima para type === ALLERGY: MEDIUM.
  // ============================================================
  describe('RN-CONSUMER-05 — ALLERGY exige severidade mínima MEDIUM', () => {
    describe('combinações REJEITADAS — ALLERGY com severidade insuficiente', () => {
      it('ALLERGY + LOW: deve FALHAR com mensagem de severidade mínima', () => {
        const result = Restriction.create({
          allergen: AllergenType.NUTS,
          severity: SeverityLevel.LOW,
          type: RestrictionType.ALLERGY,
        });
        expect(result.isFailure).toBe(true);
        expect(result.getError()).toContain('Alergia (ALLERGY)');
        expect(result.getError()).toContain('LOW');
        expect(result.getError()).toContain('MEDIUM');
      });

      it('ALLERGY + LIFESTYLE: deve FALHAR com mensagem de severidade mínima', () => {
        const result = Restriction.create({
          allergen: AllergenType.SOY,
          severity: SeverityLevel.LIFESTYLE,
          type: RestrictionType.ALLERGY,
        });
        expect(result.isFailure).toBe(true);
        expect(result.getError()).toContain('Alergia (ALLERGY)');
        expect(result.getError()).toContain('LIFESTYLE');
        expect(result.getError()).toContain('MEDIUM');
      });

      it('sem type explícito + LOW: deve FALHAR (default ALLERGY aplica a regra)', () => {
        // O default `type: ALLERGY` significa que omitir o tipo não isenta da regra.
        const result = Restriction.create({
          allergen: AllergenType.FISH,
          severity: SeverityLevel.LOW,
          // type omitido → default ALLERGY
        });
        expect(result.isFailure).toBe(true);
        expect(result.getError()).toContain('MEDIUM');
      });

      it('sem type explícito + LIFESTYLE: deve FALHAR (default ALLERGY aplica a regra)', () => {
        const result = Restriction.create({
          allergen: AllergenType.EGGS,
          severity: SeverityLevel.LIFESTYLE,
        });
        expect(result.isFailure).toBe(true);
        expect(result.getError()).toContain('MEDIUM');
      });
    });

    describe('combinações PERMITIDAS — ALLERGY com severidade adequada', () => {
      it('ALLERGY + MEDIUM: deve ser criado com sucesso (piso mínimo)', () => {
        const result = Restriction.create({
          allergen: AllergenType.LACTOSE,
          severity: SeverityLevel.MEDIUM,
          type: RestrictionType.ALLERGY,
        });
        expect(result.isSuccess).toBe(true);
        expect(result.getValue().severity).toBe(SeverityLevel.MEDIUM);
        expect(result.getValue().type).toBe(RestrictionType.ALLERGY);
      });

      it('ALLERGY + HIGH: deve ser criado com sucesso', () => {
        const result = Restriction.create({
          allergen: AllergenType.NUTS,
          severity: SeverityLevel.HIGH,
          type: RestrictionType.ALLERGY,
        });
        expect(result.isSuccess).toBe(true);
      });

      it('ALLERGY + FATAL: deve ser criado com sucesso', () => {
        const result = Restriction.create({
          allergen: AllergenType.GLUTEN,
          severity: SeverityLevel.FATAL,
          type: RestrictionType.ALLERGY,
        });
        expect(result.isSuccess).toBe(true);
      });
    });

    describe('combinações PERMITIDAS — outros types não têm restrição de severidade', () => {
      it('DIETARY_PREFERENCE + LOW: deve ser criado com sucesso', () => {
        const result = Restriction.create({
          allergen: AllergenType.SOY,
          severity: SeverityLevel.LOW,
          type: RestrictionType.DIETARY_PREFERENCE,
        });
        expect(result.isSuccess).toBe(true);
      });

      it('LIFESTYLE + LIFESTYLE: deve ser criado com sucesso', () => {
        const result = Restriction.create({
          allergen: AllergenType.GLUTEN,
          severity: SeverityLevel.LIFESTYLE,
          type: RestrictionType.LIFESTYLE,
        });
        expect(result.isSuccess).toBe(true);
      });

      it('INTOLERANCE + LOW: deve ser criado com sucesso', () => {
        const result = Restriction.create({
          allergen: AllergenType.LACTOSE,
          severity: SeverityLevel.LOW,
          type: RestrictionType.INTOLERANCE,
        });
        expect(result.isSuccess).toBe(true);
      });

      it('MEDICAL_RESTRICTION + LOW: deve ser criado com sucesso', () => {
        const result = Restriction.create({
          allergen: AllergenType.SOY,
          severity: SeverityLevel.LOW,
          type: RestrictionType.MEDICAL_RESTRICTION,
        });
        expect(result.isSuccess).toBe(true);
      });
    });
  });
});
