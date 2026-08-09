import { WhatsappPhone } from '../../../../src/domain/iam/value-objects/WhatsappPhone';

describe('WhatsappPhone Value Object', () => {
  it('deve aceitar número de WhatsApp válido no formato E.164 com DDI +55', () => {
    const res = WhatsappPhone.create('+5511987654321');
    expect(res.isSuccess).toBe(true);
    expect(res.getValue()?.value).toBe('+5511987654321');
  });

  it('deve aceitar números internacionais com outros DDIs (ex: Portugal +351, EUA +1)', () => {
    const resPt = WhatsappPhone.create('+351912345678');
    expect(resPt.isSuccess).toBe(true);
    expect(resPt.getValue()?.value).toBe('+351912345678');

    const resUs = WhatsappPhone.create('+14155552671');
    expect(resUs.isSuccess).toBe(true);
    expect(resUs.getValue()?.value).toBe('+14155552671');
  });

  it('deve retornar undefined se o número for vazio ou nulo', () => {
    const resEmpty = WhatsappPhone.create('');
    expect(resEmpty.isSuccess).toBe(true);
    expect(resEmpty.getValue()).toBeUndefined();

    const resNull = WhatsappPhone.create(null);
    expect(resNull.isSuccess).toBe(true);
    expect(resNull.getValue()).toBeUndefined();
  });

  it('deve rejeitar números sem sinal de + ou DDI', () => {
    const res = WhatsappPhone.create('11987654321');
    expect(res.isFailure).toBe(true);
    expect(res.getError()).toBe('Número de WhatsApp inválido (ex: +5511987654321).');
  });

  it('deve rejeitar texto com letras ou caracteres especiais inválidos', () => {
    const res = WhatsappPhone.create('+551198765ABCD');
    expect(res.isFailure).toBe(true);
    expect(res.getError()).toBe('Número de WhatsApp inválido (ex: +5511987654321).');
  });
});
