// backend/tests/unit/domain/iam/UserAdminApproval.spec.ts
import { User } from '../../../../src/domain/iam/User';
import { Email } from '../../../../src/domain/iam/value-objects/Email';
import { PasswordHash } from '../../../../src/domain/iam/value-objects/PasswordHash';
import { UserRole } from '../../../../src/domain/iam/value-objects/UserRole';
import { FakeEmailService } from '../../../../src/infrastructure/services/FakeEmailService';

describe('User Extended Profile & Admin Approval', () => {
  const makeEmail = (emailStr = 'admin@celilac.dev') => Email.create(emailStr).getValue();
  const makePasswordHash = () => PasswordHash.fromHash('hashed_pwd').getValue();

  it('deve criar conta de ADMIN no status PENDING_APPROVAL por padrão', () => {
    const user = User.create({
      email: makeEmail(),
      passwordHash: makePasswordHash(),
      role: UserRole.ADMIN,
    }).getValue();

    expect(user.accountStatus).toBe('PENDING_APPROVAL');
    expect(user.isPendingAdminApproval()).toBe(true);
  });

  it('deve aprovar conta de ADMIN e alterar status para ACTIVE', () => {
    const user = User.create({
      email: makeEmail(),
      passwordHash: makePasswordHash(),
      role: UserRole.ADMIN,
    }).getValue();

    user.approveAdminAccount();
    expect(user.accountStatus).toBe('ACTIVE');
    expect(user.isPendingAdminApproval()).toBe(false);
  });

  it('deve validar foto de perfil acima de 10MB', () => {
    const user = User.create({
      email: makeEmail(),
      passwordHash: makePasswordHash(),
      role: UserRole.CELIACO,
    }).getValue();

    const hugeAvatar = 'data:image/png;base64,' + 'A'.repeat(15 * 1024 * 1024);
    const res = user.updateProfileDetails({ avatarUrl: hugeAvatar });

    expect(res.isFailure).toBe(true);
    expect(res.getError()).toContain('10MB');
  });

  it('deve disparar e-mail de notificação de aprovação de admin', async () => {
    const emailService = new FakeEmailService();
    await emailService.sendAdminApprovalNotification('admin.novo@celilac.dev', 'Carlos Admin');

    expect(emailService.sentEmails).toHaveLength(1);
    expect(emailService.sentEmails[0].to).toBe('admin.novo@celilac.dev');
    expect(emailService.sentEmails[0].subject).toContain('aprovada');
  });
});
