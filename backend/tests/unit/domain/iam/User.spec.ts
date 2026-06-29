// tests/unit/domain/iam/User.spec.ts
import { User } from '../../../../src/domain/iam/User';
import { Email } from '../../../../src/domain/iam/value-objects/Email';
import { PasswordHash } from '../../../../src/domain/iam/value-objects/PasswordHash';
import { UserRole } from '../../../../src/domain/iam/value-objects/UserRole';

describe('User Entity', () => {
  const makeValidEmail = () => Email.create('teste@celilac.com').getValue();
  const makeValidHash  = () => PasswordHash.fromHash('$2a$10$hashdemo').getValue();

  describe('create() — casos válidos', () => {
    it('deve criar um User com role CELIACO', () => {
      const result = User.create({
        email:        makeValidEmail(),
        passwordHash: makeValidHash(),
        role:         UserRole.CELIACO,
      });
      expect(result.isSuccess).toBe(true);
      const user = result.getValue();
      expect(user.email.value).toBe('teste@celilac.com');
      expect(user.role).toBe(UserRole.CELIACO);
    });

    it('deve criar um User com role PARCEIRO', () => {
      const result = User.create({
        email:        makeValidEmail(),
        passwordHash: makeValidHash(),
        role:         UserRole.PARCEIRO,
      });
      expect(result.isSuccess).toBe(true);
    });

    it('deve criar um User com role ADMIN', () => {
      const result = User.create({
        email:        makeValidEmail(),
        passwordHash: makeValidHash(),
        role:         UserRole.ADMIN,
      });
      expect(result.isSuccess).toBe(true);
    });

    it('deve gerar um id UUID ao criar sem id fornecido', () => {
      const result = User.create({
        email:        makeValidEmail(),
        passwordHash: makeValidHash(),
        role:         UserRole.CELIACO,
      });
      expect(result.isSuccess).toBe(true);
      // UUID v4 tem 36 caracteres com hífens
      expect(result.getValue().id).toHaveLength(36);
    });

    it('deve usar o id fornecido quando passado', () => {
      const idEspecifico = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const result = User.create(
        {
          email:        makeValidEmail(),
          passwordHash: makeValidHash(),
          role:         UserRole.CELIACO,
        },
        idEspecifico,
      );
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().id).toBe(idEspecifico);
    });
  });

  describe('exposição de dados', () => {
    it('a entidade nunca deve expor a senha em plaintext', () => {
      const user = User.create({
        email:        makeValidEmail(),
        passwordHash: makeValidHash(),
        role:         UserRole.CELIACO,
      }).getValue();

      expect((user as any).password).toBeUndefined();
      expect((user as any).senha).toBeUndefined();
    });

    it('deve expor o passwordHash via getter', () => {
      const hash = makeValidHash();
      const user = User.create({
        email:        makeValidEmail(),
        passwordHash: hash,
        role:         UserRole.CELIACO,
      }).getValue();
      expect(user.passwordHash.value).toBe('$2a$10$hashdemo');
    });
  });

  describe('create() — casos inválidos', () => {
    it('deve falhar para role inválida', () => {
      const result = User.create({
        email:        makeValidEmail(),
        passwordHash: makeValidHash(),
        role:         'ROLE_INEXISTENTE' as UserRole,
      });
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe('Role de usuário inválida.');
    });
  });
});
