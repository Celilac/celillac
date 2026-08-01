// tests/unit/domain/allergen-engine/AllergenEngine.spec.ts
// ⚠️ ARQUIVO DE ALTA CRITICIDADE — Testes de Segurança Alimentar
// Aprovado em: 2026-06-30 conforme GUARDRAILS.md e ALLERGEN_ENGINE.md
import { AllergenEngine } from '../../../../src/domain/allergen-engine/AllergenEngine';
import { FoodProfile } from '../../../../src/domain/food-profile/FoodProfile';
import { Restriction } from '../../../../src/domain/food-profile/Restriction';
import { AllergenType } from '../../../../src/domain/food-profile/value-objects/AllergenType';
import { SeverityLevel } from '../../../../src/domain/food-profile/value-objects/SeverityLevel';
import { RiskLevel } from '../../../../src/domain/allergen-engine/RiskLevel';
import { ProductSnapshot } from '../../../../src/domain/allergen-engine/ProductSnapshot';

// --- Helpers ---
const makeRestriction = (allergen: AllergenType, severity: SeverityLevel) =>
  Restriction.create({ allergen, severity }).getValue();

const makeProfile = (restrictions: Restriction[]) =>
  FoodProfile.create({ userId: 'user-test', restrictions }).getValue();

const makeProduct = (overrides: Partial<ProductSnapshot> = {}): ProductSnapshot => ({
  id:                 'prod-test',
  name:               'Produto Teste',
  ingredients:        'farinha de trigo, água, sal',
  hasGluten:          true,
  crossContamination: '',
  ...overrides,
});

// ============================================================
// TC-01: Celíaco + produto COM glúten → BLOCKED
// ============================================================
describe('TC-01: Celíaco + produto com glúten declarado', () => {
  it('deve retornar BLOCKED e isCompatible=false', () => {
    const profile = makeProfile([makeRestriction(AllergenType.GLUTEN, SeverityLevel.FATAL)]);
    const product = makeProduct({ hasGluten: true });
    const report  = AllergenEngine.check(profile, product);

    expect(report.riskLevel).toBe(RiskLevel.BLOCKED);
    expect(report.isCompatible).toBe(false);
    expect(report.conflicts.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================
// TC-02: Celíaco + produto com "traços de glúten" → BLOCKED
// REGRA CRÍTICA: risco FATAL não aceita traços
// ============================================================
describe('TC-02: Celíaco + produto com traços de glúten (cross_contamination)', () => {
  it('deve retornar BLOCKED mesmo quando has_gluten=false', () => {
    const profile = makeProfile([makeRestriction(AllergenType.GLUTEN, SeverityLevel.FATAL)]);
    const product = makeProduct({
      hasGluten:          false,
      ingredients:        'arroz, água, sal',
      crossContamination: 'Pode conter traços de glúten.',
    });
    const report = AllergenEngine.check(profile, product);

    expect(report.riskLevel).toBe(RiskLevel.BLOCKED);
    expect(report.isCompatible).toBe(false);
  });
});

// ============================================================
// TC-03: Celíaco + produto SEGURO → SAFE
// ============================================================
describe('TC-03: Celíaco + produto sem glúten e sem traços', () => {
  it('deve retornar SAFE', () => {
    const profile = makeProfile([makeRestriction(AllergenType.GLUTEN, SeverityLevel.FATAL)]);
    const product = makeProduct({
      hasGluten:          false,
      ingredients:        'arroz, milho, batata',
      crossContamination: '',
    });
    const report = AllergenEngine.check(profile, product);

    expect(report.riskLevel).toBe(RiskLevel.SAFE);
    expect(report.isCompatible).toBe(true);
    expect(report.conflicts).toHaveLength(0);
  });
});

// ============================================================
// TC-04: Restrição HIGH + alérgeno presente → DANGER
// ============================================================
describe('TC-04: Restrição HIGH + alérgeno presente nos ingredientes', () => {
  it('deve retornar DANGER', () => {
    const profile = makeProfile([makeRestriction(AllergenType.NUTS, SeverityLevel.HIGH)]);
    const product = makeProduct({
      hasGluten:   false,
      ingredients: 'chocolate, amendoim, açúcar',
    });
    const report = AllergenEngine.check(profile, product);

    expect(report.riskLevel).toBe(RiskLevel.DANGER);
    expect(report.isCompatible).toBe(false);
  });
});

// ============================================================
// TC-05: Restrição MEDIUM + alérgeno presente → WARNING
// ============================================================
describe('TC-05: Restrição MEDIUM + alérgeno presente nos ingredientes', () => {
  it('deve retornar WARNING', () => {
    const profile = makeProfile([makeRestriction(AllergenType.LACTOSE, SeverityLevel.MEDIUM)]);
    const product = makeProduct({
      hasGluten:   false,
      ingredients: 'leite integral, açúcar, cacao',
    });
    const report = AllergenEngine.check(profile, product);

    expect(report.riskLevel).toBe(RiskLevel.WARNING);
    expect(report.isCompatible).toBe(false);
  });
});

// ============================================================
// TC-06: Produto sem ingredientes → BLOCKED (princípio da precaução)
// ============================================================
describe('TC-06: Produto sem ingredientes declarados', () => {
  it('deve retornar BLOCKED por princípio da precaução', () => {
    const profile  = makeProfile([makeRestriction(AllergenType.GLUTEN, SeverityLevel.FATAL)]);
    const product  = makeProduct({ ingredients: '', hasGluten: false, crossContamination: '' });
    const report   = AllergenEngine.check(profile, product);

    expect(report.riskLevel).toBe(RiskLevel.BLOCKED);
    expect(report.isCompatible).toBe(false);
    expect(report.reasoning).toContain('ingredientes');
  });
});

// ============================================================
// TC-07: Múltiplas restrições — apenas uma com conflito
// ============================================================
describe('TC-07: Múltiplas restrições, apenas uma em conflito', () => {
  it('deve retornar apenas o conflito específico', () => {
    const profile = makeProfile([
      makeRestriction(AllergenType.GLUTEN, SeverityLevel.FATAL),
      makeRestriction(AllergenType.LACTOSE, SeverityLevel.MEDIUM),
    ]);
    const product = makeProduct({
      hasGluten:   false,
      ingredients: 'arroz, leite, açúcar', // tem lactose, sem glúten
      crossContamination: '',
    });
    const report = AllergenEngine.check(profile, product);

    expect(report.conflicts).toHaveLength(1);
    expect(report.conflicts[0].allergen).toBe(AllergenType.LACTOSE);
  });
});

// ============================================================
// TC-08: Múltiplas restrições — TODAS em conflito
// ============================================================
describe('TC-08: Múltiplas restrições, todas em conflito', () => {
  it('deve retornar todos os conflitos e o risco mais alto', () => {
    const profile = makeProfile([
      makeRestriction(AllergenType.GLUTEN,  SeverityLevel.FATAL),
      makeRestriction(AllergenType.LACTOSE, SeverityLevel.MEDIUM),
    ]);
    const product = makeProduct({
      hasGluten:   true,
      ingredients: 'farinha de trigo, leite, açúcar',
    });
    const report = AllergenEngine.check(profile, product);

    expect(report.conflicts).toHaveLength(2);
    // O risco final deve ser o mais alto (BLOCKED por causa do FATAL)
    expect(report.riskLevel).toBe(RiskLevel.BLOCKED);
  });
});

// ============================================================
// TC-09: Perfil inativo (sem restrições) + qualquer produto → SAFE
// ============================================================
describe('TC-09: Perfil sem restrições — produto qualquer', () => {
  it('deve retornar SAFE pois não há dados de restrição', () => {
    const profile = makeProfile([]);
    const product = makeProduct({ hasGluten: true });
    const report  = AllergenEngine.check(profile, product);

    expect(report.riskLevel).toBe(RiskLevel.SAFE);
    expect(report.isCompatible).toBe(true);
  });
});

// ============================================================
// TC-10: Invariante 11.5 — HIGH + traços + acceptsCrossContamination=false → DANGER
// ============================================================
describe('TC-10: Invariante 11.5 — HIGH + traços + não aceita contaminação cruzada', () => {
  it('deve retornar DANGER quando a severidade é HIGH e o consumidor NÃO aceita contaminação cruzada', () => {
    const profile = FoodProfile.create({
      userId: 'user-test',
      restrictions: [makeRestriction(AllergenType.NUTS, SeverityLevel.HIGH)],
      acceptsCrossContamination: false,
    }).getValue();

    const product = makeProduct({
      hasGluten: false,
      ingredients: 'chocolate, açúcar, cacau',
      crossContamination: 'Pode conter traços de nozes e amendoim.',
    });

    const report = AllergenEngine.check(profile, product);

    expect(report.riskLevel).toBe(RiskLevel.DANGER);
    expect(report.isCompatible).toBe(false);
    expect(report.conflicts).toHaveLength(1);
    expect(report.conflicts[0].allergen).toBe(AllergenType.NUTS);
  });
});

// ============================================================
// TC-11: Invariante 11.5 — HIGH + traços + acceptsCrossContamination=true → WARNING
// ============================================================
describe('TC-11: Invariante 11.5 — HIGH + traços + aceita contaminação cruzada', () => {
  it('deve retornar WARNING quando a severidade é HIGH mas o consumidor aceita contaminação cruzada', () => {
    const profile = FoodProfile.create({
      userId: 'user-test',
      restrictions: [makeRestriction(AllergenType.NUTS, SeverityLevel.HIGH)],
      acceptsCrossContamination: true,
    }).getValue();

    const product = makeProduct({
      hasGluten: false,
      ingredients: 'chocolate, açúcar, cacau',
      crossContamination: 'Pode conter traços de nozes.',
    });

    const report = AllergenEngine.check(profile, product);

    expect(report.riskLevel).toBe(RiskLevel.WARNING);
    expect(report.isCompatible).toBe(false);
    expect(report.conflicts).toHaveLength(1);
  });
});

// ============================================================
// TC-12: Invariante 11.5 — FATAL + traços + acceptsCrossContamination=true → BLOCKED (Invariante Inviolável)
// ============================================================
describe('TC-12: Invariante 11.5 — FATAL + traços + aceita contaminação cruzada', () => {
  it('deve retornar BLOCKED independente de acceptsCrossContamination quando a severidade é FATAL', () => {
    const profile = FoodProfile.create({
      userId: 'user-test',
      restrictions: [makeRestriction(AllergenType.GLUTEN, SeverityLevel.FATAL)],
      acceptsCrossContamination: true,
    }).getValue();

    const product = makeProduct({
      hasGluten: false,
      ingredients: 'arroz, milho, sal',
      crossContamination: 'Pode conter traços de trigo.',
    });

    const report = AllergenEngine.check(profile, product);

    expect(report.riskLevel).toBe(RiskLevel.BLOCKED);
    expect(report.isCompatible).toBe(false);
  });
});
