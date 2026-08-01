// tests/unit/domain/iam/WhatsappPhone.spec.ts
import { WhatsappPhone } from '../../../../src/domain/iam/value-objects/WhatsappPhone';

describe('WhatsappPhone Value Object', () => {
  describe('create() — casos válidos', () => {
    it('deve criar um WhatsappPhone com número móvel válido (9 dígitos)', () => {
      const result = WhatsappPhone.create('+5511987654321');
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe('+5511987654321');
    });

    it('deve criar um WhatsappPhone com número fixo válido (8 dígitos)', () => {
      const result = WhatsappPhone.create('+551133334444');
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe('+551133334444');
    });

    it('deve remover espaços, parênteses e hífens antes de validar', () => {
      const result = WhatsappPhone.create('+55 (11) 98765-4321');
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe('+5511987654321');
    });
  });

  describe('create() — casos inválidos', () => {
    it('deve falhar para número vazio', () => {
      const result = WhatsappPhone.create('');
      expect(result.isSuccess).toBe(false);
      expect(result.getError()).toBe('Número de WhatsApp inválido.');
    });

    it('deve falhar sem o DDI +55', () => {
      const result = WhatsappPhone.create('11987654321');
      expect(result.isSuccess).toBe(false);
    });

    it('deve falhar com DDI de outro país', () => {
      const result = WhatsappPhone.create('+15551234567');
      expect(result.isSuccess).toBe(false);
    });

    it('deve falhar com poucos dígitos após o DDI', () => {
      const result = WhatsappPhone.create('+5511987');
      expect(result.isSuccess).toBe(false);
    });

    it('deve falhar com dígitos além do máximo esperado', () => {
      const result = WhatsappPhone.create('+551198765432199');
      expect(result.isSuccess).toBe(false);
    });
  });
});
