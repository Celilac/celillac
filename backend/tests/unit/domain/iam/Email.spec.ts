// tests/unit/domain/iam/Email.spec.ts
import { Email } from '../../../../src/domain/iam/value-objects/Email';

describe('Email Value Object', () => {
  describe('create() — casos válidos', () => {
    it('deve criar um Email com endereço válido', () => {
      const result = Email.create('usuario@celilac.com');
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe('usuario@celilac.com');
    });

    it('deve normalizar o email para letras minúsculas', () => {
      const result = Email.create('Usuario@CeLiLac.COM');
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe('usuario@celilac.com');
    });

    it('deve aceitar emails com subdomínio', () => {
      const result = Email.create('user@mail.celilac.com.br');
      expect(result.isSuccess).toBe(true);
    });
  });

  describe('create() — casos inválidos', () => {
    it('deve falhar para email sem @', () => {
      const result = Email.create('usuariosemdominio.com');
      expect(result.isSuccess).toBe(false);
      expect(result.getError()).toBe('Email inválido.');
    });

    it('deve falhar para email sem domínio', () => {
      const result = Email.create('usuario@');
      expect(result.isSuccess).toBe(false);
    });

    it('deve falhar para email vazio', () => {
      const result = Email.create('');
      expect(result.isSuccess).toBe(false);
    });

    it('deve falhar para email com espaços', () => {
      const result = Email.create('user @celilac.com');
      expect(result.isSuccess).toBe(false);
    });
  });
});
