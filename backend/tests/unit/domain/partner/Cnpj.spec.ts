// backend/tests/unit/domain/partner/Cnpj.spec.ts
import { Cnpj } from '../../../../src/domain/partner/value-objects/Cnpj';

describe('Cnpj Value Object', () => {
  it('should accept null, undefined or empty string as optional undefined', () => {
    const resNull = Cnpj.create(null);
    expect(resNull.isSuccess).toBe(true);
    expect(resNull.getValue()).toBeUndefined();

    const resUndef = Cnpj.create(undefined);
    expect(resUndef.isSuccess).toBe(true);
    expect(resUndef.getValue()).toBeUndefined();

    const resEmpty = Cnpj.create('');
    expect(resEmpty.isSuccess).toBe(true);
    expect(resEmpty.getValue()).toBeUndefined();

    const resSpaces = Cnpj.create('   ');
    expect(resSpaces.isSuccess).toBe(true);
    expect(resSpaces.getValue()).toBeUndefined();
  });

  it('should successfully validate and format a valid CNPJ with punctuation', () => {
    // 12.345.678/0001-95 é matematicamente válido
    const result = Cnpj.create('12.345.678/0001-95');
    expect(result.isSuccess).toBe(true);
    const cnpj = result.getValue()!;
    expect(cnpj.digits).toBe('12345678000195');
    expect(cnpj.formatted).toBe('12.345.678/0001-95');
  });

  it('should successfully validate a valid unformatted CNPJ (only digits)', () => {
    // 11222333000181 é matematicamente válido
    const result = Cnpj.create('11222333000181');
    expect(result.isSuccess).toBe(true);
    const cnpj = result.getValue()!;
    expect(cnpj.digits).toBe('11222333000181');
    expect(cnpj.formatted).toBe('11.222.333/0001-81');
  });

  it('should validate CNPJs where check digits result in 0 (rem < 2)', () => {
    // 60.701.190/0001-04 (1º dígito é 0 porque rem1 < 2)
    const res1 = Cnpj.create('60.701.190/0001-04');
    expect(res1.isSuccess).toBe(true);
    expect(res1.getValue()!.digits).toBe('60701190000104');

    // 04.252.011/0001-10 (2º dígito é 0 porque rem2 < 2)
    const res2 = Cnpj.create('04.252.011/0001-10');
    expect(res2.isSuccess).toBe(true);
    expect(res2.getValue()!.digits).toBe('04252011000110');
  });

  it('should reject CNPJ with less or more than 14 digits', () => {
    const resShort = Cnpj.create('12.345.678/0001-9');
    expect(resShort.isFailure).toBe(true);
    expect(resShort.getError()).toContain('14 dígitos');

    const resLong = Cnpj.create('12.345.678/0001-950');
    expect(resLong.isFailure).toBe(true);
    expect(resLong.getError()).toContain('14 dígitos');
  });

  it('should reject CNPJ with repeated digits', () => {
    const invalidList = [
      '00.000.000/0000-00',
      '11.111.111/1111-11',
      '22.222.222/2222-22',
      '99999999999999',
    ];

    for (const raw of invalidList) {
      const res = Cnpj.create(raw);
      expect(res.isFailure).toBe(true);
      expect(res.getError()).toContain('repetidos');
    }
  });

  it('should reject CNPJ with wrong first check digit', () => {
    // 12.345.678/0001-85 (deveria ser 95)
    const result = Cnpj.create('12.345.678/0001-85');
    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('primeiro dígito verificador incorreto');
  });

  it('should reject CNPJ with wrong second check digit', () => {
    // 12.345.678/0001-90 (deveria ser 95)
    const result = Cnpj.create('12.345.678/0001-90');
    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('segundo dígito verificador incorreto');
  });
});
