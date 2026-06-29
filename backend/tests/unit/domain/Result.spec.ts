// tests/unit/domain/Result.spec.ts
import { Result } from '../../../src/domain/Result';

describe('Result<T>', () => {
  describe('ok()', () => {
    it('deve criar um Result de sucesso com valor', () => {
      const result = Result.ok<string>('valor');
      expect(result.isSuccess).toBe(true);
      expect(result.isFailure).toBe(false);
      expect(result.getValue()).toBe('valor');
    });

    it('getError() deve lançar erro em um Result de sucesso', () => {
      const result = Result.ok<number>(42);
      expect(() => result.getError()).toThrow();
    });
  });

  describe('fail()', () => {
    it('deve criar um Result de falha com mensagem de erro', () => {
      const result = Result.fail<string>('Algo deu errado.');
      expect(result.isSuccess).toBe(false);
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe('Algo deu errado.');
    });

    it('getValue() deve lançar erro em um Result de falha', () => {
      const result = Result.fail<string>('erro');
      expect(() => result.getValue()).toThrow();
    });
  });
});
