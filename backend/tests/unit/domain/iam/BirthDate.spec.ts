import { BirthDate } from '../../../../src/domain/iam/value-objects/BirthDate';

describe('BirthDate Value Object (LGPD & Domínio)', () => {
  const refDate = new Date(2026, 7, 21); // 21 de Agosto de 2026

  it('deve aceitar undefined, null ou string vazia (campo opcional)', () => {
    expect(BirthDate.create(undefined, refDate).getValue()).toBeUndefined();
    expect(BirthDate.create(null, refDate).getValue()).toBeUndefined();
    expect(BirthDate.create('', refDate).getValue()).toBeUndefined();
    expect(BirthDate.create('   ', refDate).getValue()).toBeUndefined();
  });

  it('deve aceitar uma data válida para um usuário com mais de 13 anos', () => {
    // 20 anos de idade: 2006-08-21
    const res = BirthDate.create('2006-08-21', refDate);
    expect(res.isSuccess).toBe(true);
    expect(res.getValue()?.value.getFullYear()).toBe(2006);
  });

  it('deve aceitar exatamente no dia em que o usuário completa 13 anos', () => {
    // 13 anos exatos: 2013-08-21
    const res = BirthDate.create('2013-08-21', refDate);
    expect(res.isSuccess).toBe(true);
    expect(res.getValue()?.value.getFullYear()).toBe(2013);
  });

  it('deve rejeitar se faltar 1 dia para completar 13 anos', () => {
    // 12 anos e 364 dias: 2013-08-22
    const res = BirthDate.create('2013-08-22', refDate);
    expect(res.isFailure).toBe(true);
    expect(res.getError()).toBe('O usuário deve ter pelo menos 13 anos de idade (LGPD).');
  });

  it('deve rejeitar data de hoje', () => {
    const res = BirthDate.create('2026-08-21', refDate);
    expect(res.isFailure).toBe(true);
    expect(res.getError()).toBe('A data de nascimento não pode ser o dia de hoje.');
  });

  it('deve rejeitar data no futuro', () => {
    const res = BirthDate.create('2026-08-22', refDate);
    expect(res.isFailure).toBe(true);
    expect(res.getError()).toBe('A data de nascimento não pode ser no futuro.');
  });

  it('deve rejeitar data com menos de 13 anos (ex: bebê ou criança pequena)', () => {
    const res = BirthDate.create('2020-01-01', refDate);
    expect(res.isFailure).toBe(true);
    expect(res.getError()).toBe('O usuário deve ter pelo menos 13 anos de idade (LGPD).');
  });

  it('deve rejeitar data anterior a 1900 ou mais de 120 anos atrás', () => {
    const resOld = BirthDate.create('1899-12-31', refDate);
    expect(resOld.isFailure).toBe(true);
    expect(resOld.getError()).toBe('Data de nascimento fora do limite permitido.');

    const res150Years = BirthDate.create('1850-01-01', refDate);
    expect(res150Years.isFailure).toBe(true);
    expect(res150Years.getError()).toBe('Data de nascimento fora do limite permitido.');
  });

  it('deve rejeitar strings de data malformadas', () => {
    const res = BirthDate.create('invalid-date', refDate);
    expect(res.isFailure).toBe(true);
    expect(res.getError()).toBe('Data de nascimento inválida.');

    const res2 = BirthDate.create('2000-02-31', refDate);
    expect(res2.isFailure).toBe(true);
    expect(res2.getError()).toBe('Data de nascimento inválida.');
  });

  it('deve aceitar objeto Date válido', () => {
    const validDate = new Date(1995, 4, 10);
    const res = BirthDate.create(validDate, refDate);
    expect(res.isSuccess).toBe(true);
    expect(res.getValue()?.value.getFullYear()).toBe(1995);
  });
});
