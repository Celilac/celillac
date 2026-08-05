// backend/tests/unit/application/consumer/GetConsumerProfileUseCase.spec.ts
import { GetConsumerProfileUseCase } from '../../../../src/application/consumer/GetConsumerProfileUseCase';
import { CreateConsumerUseCase } from '../../../../src/application/consumer/CreateConsumerUseCase';
import { IConsumerRepository } from '../../../../src/domain/consumer/repositories/IConsumerRepository';
import { IFoodProfileRepository } from '../../../../src/domain/food-profile/repositories/IFoodProfileRepository';
import { Consumer } from '../../../../src/domain/consumer/Consumer';
import { FoodProfile } from '../../../../src/domain/food-profile/FoodProfile';
import { Restriction } from '../../../../src/domain/food-profile/Restriction';
import { AllergenType } from '../../../../src/domain/food-profile/value-objects/AllergenType';
import { SeverityLevel } from '../../../../src/domain/food-profile/value-objects/SeverityLevel';
import { RestrictionType } from '../../../../src/domain/food-profile/value-objects/RestrictionType';

describe('GetConsumerProfileUseCase', () => {
  let consumerRepository: jest.Mocked<IConsumerRepository>;
  let foodProfileRepository: jest.Mocked<IFoodProfileRepository>;
  let createConsumerUseCase: CreateConsumerUseCase;
  let useCase: GetConsumerProfileUseCase;

  beforeEach(() => {
    consumerRepository = {
      save: jest.fn(),
      findByUserId: jest.fn(),
      findById: jest.fn(),
    };
    foodProfileRepository = {
      save: jest.fn(),
      findByUserId: jest.fn(),
      update: jest.fn(),
    };
    createConsumerUseCase = new CreateConsumerUseCase(consumerRepository);
    useCase = new GetConsumerProfileUseCase(consumerRepository, foodProfileRepository, createConsumerUseCase);
  });

  it('deve auto-criar consumidor via CreateConsumerUseCase se ele não existir', async () => {
    consumerRepository.findByUserId.mockResolvedValue(null);
    foodProfileRepository.findByUserId.mockResolvedValue(null);

    const result = await useCase.execute('user-1');

    expect(result.isSuccess).toBe(true);
    expect(consumerRepository.save).toHaveBeenCalled();
    const data = result.getValue();
    expect(data.consumer.userId).toBe('user-1');
    expect(data.foodProfile).toBeNull();
    expect(data.hasIncompleteProfileWarning).toBe(true);
  });

  it('deve retornar perfil de consumidor completo sem avisos se possuir restrições cadastradas', async () => {
    const existingConsumer = Consumer.create({ userId: 'user-1' }).getValue();
    consumerRepository.findByUserId.mockResolvedValue(existingConsumer);

    const restriction = Restriction.create({
      allergen: AllergenType.GLUTEN,
      severity: SeverityLevel.FATAL,
      type: RestrictionType.ALLERGY,
    }).getValue();

    const mockFoodProfile = FoodProfile.create({
      userId: 'user-1',
      restrictions: [restriction],
      acceptsCrossContamination: false,
    }).getValue();

    foodProfileRepository.findByUserId.mockResolvedValue(mockFoodProfile);

    const result = await useCase.execute('user-1');

    expect(result.isSuccess).toBe(true);
    const data = result.getValue();
    expect(data.hasIncompleteProfileWarning).toBe(false);
    expect(data.foodProfile).toBe(mockFoodProfile);
    expect(consumerRepository.save).toHaveBeenCalled();
  });
});
