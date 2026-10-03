// backend/tests/unit/domain/iam/UserChangePassword.spec.ts
import { User } from '../../../../src/domain/iam/User';
import { Email } from '../../../../src/domain/iam/value-objects/Email';
import { PasswordHash } from '../../../../src/domain/iam/value-objects/PasswordHash';
import { UserRole } from '../../../../src/domain/iam/value-objects/UserRole';

describe('User Domain Entity - changePassword', () => {
  it('deve atualizar o passwordHash do usuário corretamente', () => {
    const initialHash = PasswordHash.fromHash('hash_inicial_123').getValue();
    const user = User.create({
      email: Email.create('user@celilac.dev').getValue(),
      passwordHash: initialHash,
      role: UserRole.CELIACO,
    }).getValue();

    expect(user.passwordHash.value).toBe('hash_inicial_123');

    const newHash = PasswordHash.fromHash('novo_hash_seguro_456').getValue();
    user.changePassword(newHash);

    expect(user.passwordHash.value).toBe('novo_hash_seguro_456');
  });
});
