// backend/src/domain/Result.ts
/**
 * Padrão Result<T> (Either) para erros de domínio.
 * O domínio nunca lança exceções — retorna Result.
 */
export class Result<T> {
  private readonly _isSuccess: boolean;
  private readonly _error: string | null;
  private readonly _value: T | null;

  private constructor(isSuccess: boolean, error: string | null, value: T | null) {
    this._isSuccess = isSuccess;
    this._error     = error;
    this._value     = value;
  }

  get isSuccess(): boolean {
    return this._isSuccess;
  }

  get isFailure(): boolean {
    return !this._isSuccess;
  }

  getValue(): T {
    if (!this._isSuccess) {
      throw new Error('Não é possível obter o valor de um Result com falha.');
    }
    return this._value as T;
  }

  getError(): string {
    if (this._isSuccess) {
      throw new Error('Não há erro em um Result com sucesso.');
    }
    return this._error as string;
  }

  static ok<U>(value: U): Result<U> {
    return new Result<U>(true, null, value);
  }

  static fail<U>(error: string): Result<U> {
    return new Result<U>(false, error, null);
  }
}
