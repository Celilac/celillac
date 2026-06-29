// tests/unit/domain/iam/PasswordHash.spec.ts
import { PasswordHash } from '../../../../src/domain/iam/value-objects/PasswordHash';

describe('PasswordHash Value Object', () => {
  describe('fromHash() — reconstrução a partir do banco', () => {
    it('deve criar a partir de um hash existente', () => {
      const hashExemplo = '$2a$10$exemplodehashbcrypt';
      const result = PasswordHash.fromHash(hashExemplo);
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(hashExemplo);
    });

    it('deve falhar para hash vazio', () => {
      const result = PasswordHash.fromHash('');
      expect(result.isSuccess).toBe(false);
      expect(result.getError()).toBe('Hash de senha não pode ser vazio.');
    });
  });

  describe('imutabilidade', () => {
    it('o valor do hash não deve poder ser alterado após criação', () => {
      const hash = '$2a$10$exemplodehashbcrypt';
      const passwordHash = PasswordHash.fromHash(hash).getValue();
      // O value object é somente leitura — apenas leitura permitida
      expect(passwordHash.value).toBe(hash);
      expect(typeof passwordHash.value).toBe('string');
    });
  });
});
