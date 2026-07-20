// tests/unit/domain/food-profile/SeverityLevel.spec.ts
import { SeverityLevel, SEVERITY_ORDER } from '../../../../src/domain/food-profile/value-objects/SeverityLevel';

describe('SeverityLevel', () => {
  it('deve conter os níveis definidos no DOMAIN_MODEL.md incluindo LIFESTYLE', () => {
    expect(SeverityLevel.LIFESTYLE).toBe('LIFESTYLE');
    expect(SeverityLevel.LOW).toBe('LOW');
    expect(SeverityLevel.MEDIUM).toBe('MEDIUM');
    expect(SeverityLevel.HIGH).toBe('HIGH');
    expect(SeverityLevel.FATAL).toBe('FATAL');
  });

  describe('SEVERITY_ORDER — ordenação crescente de risco', () => {
    it('FATAL deve ter a maior prioridade e LIFESTYLE a menor', () => {
      expect(SEVERITY_ORDER[SeverityLevel.FATAL]).toBeGreaterThan(SEVERITY_ORDER[SeverityLevel.HIGH]);
      expect(SEVERITY_ORDER[SeverityLevel.HIGH]).toBeGreaterThan(SEVERITY_ORDER[SeverityLevel.MEDIUM]);
      expect(SEVERITY_ORDER[SeverityLevel.MEDIUM]).toBeGreaterThan(SEVERITY_ORDER[SeverityLevel.LOW]);
      expect(SEVERITY_ORDER[SeverityLevel.LOW]).toBeGreaterThan(SEVERITY_ORDER[SeverityLevel.LIFESTYLE]);
    });

    it('LIFESTYLE deve ter menor prioridade (0)', () => {
      expect(SEVERITY_ORDER[SeverityLevel.LIFESTYLE]).toBe(0);
    });

    it('LOW deve ter valor 1', () => {
      expect(SEVERITY_ORDER[SeverityLevel.LOW]).toBe(1);
    });

    it('FATAL deve ter valor máximo', () => {
      expect(SEVERITY_ORDER[SeverityLevel.FATAL]).toBe(4);
    });
  });
});
