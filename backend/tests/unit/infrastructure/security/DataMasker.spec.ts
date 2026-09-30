// backend/tests/unit/infrastructure/security/DataMasker.spec.ts
import { DataMasker } from '../../../../src/infrastructure/security/DataMasker';

describe('DataMasker (PCI-DSS & PII Sanitization)', () => {
  describe('maskEmail', () => {
    it('deve mascarar e-mail mantendo os 2 primeiros caracteres do usuário e o domínio', () => {
      expect(DataMasker.maskEmail('joao.silva@exemplo.com')).toBe('jo***@exemplo.com');
      expect(DataMasker.maskEmail('al@teste.com')).toBe('***@teste.com');
    });

    it('deve retornar *** para e-mails nulos ou inválidos', () => {
      expect(DataMasker.maskEmail(undefined)).toBe('***');
      expect(DataMasker.maskEmail('invalido')).toBe('***');
    });
  });

  describe('maskCpf', () => {
    it('deve mascarar CPF formatado preservando os 3 primeiros e 2 últimos dígitos', () => {
      expect(DataMasker.maskCpf('123.456.789-01')).toBe('123.***.***-01');
    });

    it('deve mascarar CPF numérico puro', () => {
      expect(DataMasker.maskCpf('12345678901')).toBe('123******01');
    });

    it('deve retornar *** para CPFs com tamanho diferente de 11 dígitos', () => {
      expect(DataMasker.maskCpf('123')).toBe('***');
      expect(DataMasker.maskCpf(undefined)).toBe('***');
    });
  });

  describe('maskCardNumber', () => {
    it('deve mascarar cartão de crédito preservando os 4 primeiros e 4 últimos dígitos', () => {
      expect(DataMasker.maskCardNumber('4111222233334444')).toBe('4111********4444');
      expect(DataMasker.maskCardNumber('5555 4444 3333 2222')).toBe('5555********2222');
    });

    it('deve retornar *** para cartões inválidos ou fora do intervalo de 12 a 19 dígitos', () => {
      expect(DataMasker.maskCardNumber('12345')).toBe('***');
      expect(DataMasker.maskCardNumber(undefined)).toBe('***');
    });
  });

  describe('maskCvv', () => {
    it('deve sempre retornar *** para qualquer valor de CVV', () => {
      expect(DataMasker.maskCvv('123')).toBe('***');
      expect(DataMasker.maskCvv('9876')).toBe('***');
      expect(DataMasker.maskCvv(undefined)).toBe('***');
    });
  });

  describe('maskPixKey', () => {
    it('deve mascarar chave PIX do tipo e-mail', () => {
      expect(DataMasker.maskPixKey('financeiro@empresa.com.br')).toBe('fi***@empresa.com.br');
    });

    it('deve mascarar chave PIX do tipo CPF', () => {
      expect(DataMasker.maskPixKey('12345678901')).toBe('123******01');
    });

    it('deve mascarar chave aleatória ou telefone', () => {
      expect(DataMasker.maskPixKey('+5511987654321')).toBe('+55***21');
    });

    it('deve retornar *** para chaves vazias ou curtas', () => {
      expect(DataMasker.maskPixKey('')).toBe('***');
      expect(DataMasker.maskPixKey('123')).toBe('***');
    });
  });

  describe('maskSensitiveData (Deep traversal)', () => {
    it('deve mascarar recursivamente objetos com dados sensíveis de pagamento e autenticação', () => {
      const sensitivePayload = {
        user: {
          name: 'João Seguro',
          email: 'joao.seguro@banco.com',
          password: 'SecretPassword123!',
          cpf: '123.456.789-01',
        },
        payment: {
          cardNumber: '4111222233334444',
          cvv: '123',
          cardToken: 'tok_test_abcdef123456',
          apiKey: 'sec_key_xyz',
        },
        metadata: {
          pixKey: 'pix@empresa.com',
          normalField: 'ok',
        },
      };

      const masked = DataMasker.maskSensitiveData(sensitivePayload);

      expect(masked.user.name).toBe('João Seguro');
      expect(masked.user.email).toBe('jo***@banco.com');
      expect(masked.user.password).toBe('***');
      expect(masked.user.cpf).toBe('123.***.***-01');

      expect(masked.payment.cardNumber).toBe('4111********4444');
      expect(masked.payment.cvv).toBe('***');
      expect(masked.payment.cardToken).toBe('***');
      expect(masked.payment.apiKey).toBe('***');

      expect(masked.metadata.pixKey).toBe('pi***@empresa.com');
      expect(masked.metadata.normalField).toBe('ok');

      // O objeto original não deve ser alterado
      expect(sensitivePayload.user.password).toBe('SecretPassword123!');
    });

    it('deve sanitizar arrays com elementos sensíveis', () => {
      const list = [
        '123.456.789-01',
        { token: 'secret-token', value: 100 },
        '4111222233334444',
      ];

      const maskedList = DataMasker.maskSensitiveData(list);
      expect(maskedList[0]).toBe('123.***.***-01');
      expect((maskedList[1] as any).token).toBe('***');
      expect((maskedList[1] as any).value).toBe(100);
      expect(maskedList[2]).toBe('4111********4444');
    });

    it('deve preservar valores primitivos null, undefined e números', () => {
      expect(DataMasker.maskSensitiveData(null)).toBeNull();
      expect(DataMasker.maskSensitiveData(undefined)).toBeUndefined();
      expect(DataMasker.maskSensitiveData(12345)).toBe(12345);
    });
  });
});
