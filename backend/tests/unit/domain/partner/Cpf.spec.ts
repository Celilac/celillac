// backend/tests/unit/domain/partner/Cpf.spec.ts
import { Cpf } from '../../../../src/domain/partner/value-objects/Cpf';

describe('Cpf Value Object', () => {
  it('should accept null, undefined or empty string as optional undefined', () => {
    const resNull = Cpf.create(null);
    expect(resNull.isSuccess).toBe(true);
    expect(resNull.getValue()).toBeUndefined();

    const resUndef = Cpf.create(undefined);
    expect(resUndef.isSuccess).toBe(true);
    expect(resUndef.getValue()).toBeUndefined();

    const resEmpty = Cpf.create('');
    expect(resEmpty.isSuccess).toBe(true);
    expect(resEmpty.getValue()).toBeUndefined();

    const resSpaces = Cpf.create('   ');
    expect(resSpaces.isSuccess).toBe(true);
    expect(resSpaces.getValue()).toBeUndefined();
  });

  it('should successfully validate and format a valid CPF with punctuation', () => {
    // 529.982.247-25 é matematicamente válido
    const result = Cpf.create('529.982.247-25');
    expect(result.isSuccess).toBe(true);
    const cpf = result.getValue()!;
    expect(cpf.digits).toBe('52998224725');
    expect(cpf.formatted).toBe('529.982.247-25');
  });

  it('should successfully validate a valid unformatted CPF (only digits)', () => {
    // 52998224725 é matematicamente válido
    const result = Cpf.create('52998224725');
    expect(result.isSuccess).toBe(true);
    const cpf = result.getValue()!;
    expect(cpf.digits).toBe('52998224725');
    expect(cpf.formatted).toBe('529.982.247-25');
  });

  it('should validate CPFs where check digits result in 0 (rem < 2)', () => {
    // 100.000.037-00 possui rem1 = 0 e rem2 = 0, gerando ambos os dígitos verificadores 0
    const res = Cpf.create('100.000.037-00');
    expect(res.isSuccess).toBe(true);
    expect(res.getValue()!.digits).toBe('10000003700');
    expect(res.getValue()!.formatted).toBe('100.000.037-00');
  });

  it('should reject CPF with less or more than 11 digits', () => {
    const resShort = Cpf.create('529.982.247-2');
    expect(resShort.isFailure).toBe(true);
    expect(resShort.getError()).toContain('11 dígitos');

    const resLong = Cpf.create('529.982.247-250');
    expect(resLong.isFailure).toBe(true);
    expect(resLong.getError()).toContain('11 dígitos');
  });

  it('should reject CPF with repeated digits', () => {
    const invalidList = [
      '000.000.000-00',
      '111.111.111-11',
      '222.222.222-22',
      '99999999999',
    ];

    for (const raw of invalidList) {
      const res = Cpf.create(raw);
      expect(res.isFailure).toBe(true);
      expect(res.getError()).toContain('repetidos');
    }
  });

  it('should reject CPF with wrong first check digit', () => {
    // 529.982.247-35 (deveria ser 25)
    const result = Cpf.create('529.982.247-35');
    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('primeiro dígito verificador incorreto');
  });

  it('should reject CPF with wrong second check digit', () => {
    // 529.982.247-26 (deveria ser 25)
    const result = Cpf.create('529.982.247-26');
    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('segundo dígito verificador incorreto');
  });
});
