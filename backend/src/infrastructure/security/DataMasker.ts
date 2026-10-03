// backend/src/infrastructure/security/DataMasker.ts

/**
 * DataMasker (OWASP & PCI-DSS Compliance)
 *
 * Utilitário para higienização e mascaramento de PII (Personally Identifiable Information)
 * e dados sensíveis de pagamento (PCI-DSS) antes de persistência em auditoria ou emissão de logs.
 */
export class DataMasker {
  /**
   * Mascara endereço de e-mail (ex: jo***@dominio.com)
   */
  static maskEmail(email?: string): string {
    if (!email || typeof email !== 'string') return '***';
    const parts = email.split('@');
    if (parts.length !== 2) return '***';
    const [user, domain] = parts;
    const maskedUser = user.length > 2 ? `${user.substring(0, 2)}***` : '***';
    return `${maskedUser}@${domain}`;
  }

  /**
   * Mascara CPF (ex: 123.***.***-45 ou 123******45)
   */
  static maskCpf(cpf?: string): string {
    if (!cpf || typeof cpf !== 'string') return '***';
    const clean = cpf.replace(/\D/g, '');
    if (clean.length === 11) {
      if (cpf.includes('.') || cpf.includes('-')) {
        return `${clean.substring(0, 3)}.***.***-${clean.substring(9)}`;
      }
      return `${clean.substring(0, 3)}******${clean.substring(9)}`;
    }
    return '***';
  }

  /**
   * Mascara número de cartão de crédito (ex: 4111********1111)
   */
  static maskCardNumber(cardNumber?: string): string {
    if (!cardNumber || typeof cardNumber !== 'string') return '***';
    const clean = cardNumber.replace(/\D/g, '');
    if (clean.length >= 12 && clean.length <= 19) {
      const first4 = clean.substring(0, 4);
      const last4 = clean.substring(clean.length - 4);
      return `${first4}${'*'.repeat(clean.length - 8)}${last4}`;
    }
    return '***';
  }

  /**
   * Mascara código CVV/CVC
   */
  static maskCvv(_cvv?: string): string {
    return '***';
  }

  /**
   * Mascara chave PIX conforme o formato aproximado
   */
  static maskPixKey(key?: string): string {
    if (!key || typeof key !== 'string') return '***';
    if (key.includes('@')) {
      return this.maskEmail(key);
    }
    const cleanDigits = key.replace(/\D/g, '');
    if (cleanDigits.length === 11) {
      return this.maskCpf(key);
    }
    if (key.length > 6) {
      return `${key.substring(0, 3)}***${key.substring(key.length - 2)}`;
    }
    return '***';
  }

  /**
   * Higieniza e mascara recursivamente qualquer objeto ou array contendo campos sensíveis.
   * Não altera a referência original (cria clone seguro).
   */
  static maskSensitiveData<T = any>(data: T): T {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === 'string') {
      // Detecção de número de cartão puro (13-19 dígitos numéricos)
      const digitsOnly = data.replace(/[\s-]/g, '');
      if (/^\d{13,19}$/.test(digitsOnly)) {
        return this.maskCardNumber(data) as unknown as T;
      }
      // Detecção de CPF formatado
      if (/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(data)) {
        return this.maskCpf(data) as unknown as T;
      }
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.maskSensitiveData(item)) as unknown as T;
    }

    if (typeof data === 'object') {
      const sanitized: Record<string, any> = {};

      for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();

        // 1. Campos estritamente sigilosos (senhas, segredos, tokens, CVVs)
        if (
          lowerKey.includes('password') ||
          lowerKey.includes('secret') ||
          lowerKey.includes('token') ||
          lowerKey === 'cvv' ||
          lowerKey === 'cvc' ||
          lowerKey === 'securitycode' ||
          lowerKey.includes('authorization') ||
          lowerKey.includes('apikey') ||
          lowerKey.includes('privatekey')
        ) {
          sanitized[key] = '***';
          continue;
        }

        // 2. Números de cartão
        if (
          lowerKey.includes('cardnumber') ||
          lowerKey.includes('creditcard') ||
          lowerKey.includes('debitcard') ||
          lowerKey === 'pan'
        ) {
          sanitized[key] = typeof value === 'string' ? this.maskCardNumber(value) : '***';
          continue;
        }

        // 3. CPF
        if (lowerKey === 'cpf' || lowerKey.endsWith('cpf')) {
          sanitized[key] = typeof value === 'string' ? this.maskCpf(value) : '***';
          continue;
        }

        // 4. Chave PIX
        if (lowerKey === 'pixkey' || lowerKey.includes('pix_key')) {
          sanitized[key] = typeof value === 'string' ? this.maskPixKey(value) : '***';
          continue;
        }

        // 5. E-mail
        if (lowerKey === 'email' || lowerKey.endsWith('email')) {
          sanitized[key] = typeof value === 'string' ? this.maskEmail(value) : this.maskSensitiveData(value);
          continue;
        }

        sanitized[key] = this.maskSensitiveData(value);
      }

      return sanitized as T;
    }

    return data;
  }
}
