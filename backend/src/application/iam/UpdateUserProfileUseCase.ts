import { IUserRepository } from '../../domain/iam/repositories/IUserRepository';
import { Result } from '../../domain/Result';
import { User } from '../../domain/iam/User';
import { WhatsappPhone } from '../../domain/iam/value-objects/WhatsappPhone';

export interface UpdateUserProfileInput {
  userId: string;
  fullName?: string;
  birthDate?: string | Date;
  gender?: string;
  avatarUrl?: string;
  whatsappPhone?: string;
}

export class UpdateUserProfileUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: UpdateUserProfileInput): Promise<Result<User>> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      return Result.fail<User>('Usuário não encontrado.');
    }

    let parsedBirthDate: Date | undefined = undefined;
    if (input.birthDate) {
      parsedBirthDate = typeof input.birthDate === 'string' ? new Date(input.birthDate) : input.birthDate;
      if (isNaN(parsedBirthDate.getTime())) {
        return Result.fail<User>('Data de nascimento inválida.');
      }
    }

    let phoneVo: WhatsappPhone | undefined = undefined;
    if (input.whatsappPhone !== undefined) {
      const phoneRes = WhatsappPhone.create(input.whatsappPhone);
      if (phoneRes.isFailure) {
        return Result.fail<User>(phoneRes.getError());
      }
      phoneVo = phoneRes.getValue();
    }

    const updateRes = user.updateProfileDetails({
      fullName: input.fullName,
      birthDate: parsedBirthDate,
      gender: input.gender,
      avatarUrl: input.avatarUrl,
      whatsappPhone: phoneVo,
    });

    if (updateRes.isFailure) {
      return Result.fail<User>(updateRes.getError());
    }

    await this.userRepository.save(user);

    return Result.ok<User>(user);
  }
}
