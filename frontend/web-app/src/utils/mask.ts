// frontend/web-app/src/utils/mask.ts

/**
 * Aplica máscara de CNPJ dinâmica: 99.999.999/9999-99
 */
export function maskCnpj(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

/**
 * Validação algorítmica rigorosa do CNPJ (Módulo 11 da Receita Federal)
 */
export function validateCnpj(raw: string): { valid: boolean; error?: string } {
  const digits = raw.replace(/\D/g, '');

  if (digits.length === 0) {
    return { valid: true }; // Opcional
  }

  if (digits.length !== 14) {
    return { valid: false, error: 'O CNPJ deve conter 14 dígitos.' };
  }

  // Sequências idênticas inválidas
  if (/^(\d)\1{13}$/.test(digits)) {
    return { valid: false, error: 'CNPJ inválido (números repetidos).' };
  }

  // 1º dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum1 = 0;
  for (let i = 0; i < 12; i++) {
    sum1 += parseInt(digits[i], 10) * weights1[i];
  }
  const rem1 = sum1 % 11;
  const digit1 = rem1 < 2 ? 0 : 11 - rem1;

  if (parseInt(digits[12], 10) !== digit1) {
    return { valid: false, error: 'Primeiro dígito verificador do CNPJ incorreto.' };
  }

  // 2º dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum2 = 0;
  for (let i = 0; i < 13; i++) {
    sum2 += parseInt(digits[i], 10) * weights2[i];
  }
  const rem2 = sum2 % 11;
  const digit2 = rem2 < 2 ? 0 : 11 - rem2;

  if (parseInt(digits[13], 10) !== digit2) {
    return { valid: false, error: 'Segundo dígito verificador do CNPJ incorreto.' };
  }

  return { valid: true };
}

/**
 * Aplica máscara de CEP: 99999-999
 */
export function maskCep(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/**
 * Formata telefone conforme DDI
 * Se Brasil (+55): aplica máscara (99) 99999-9999 ou (99) 9999-9999
 * Outros países: formatação por blocos numéricos agrupados
 */
export function formatLocalPhone(raw: string, ddi = '+55'): string {
  const digits = raw.replace(/\D/g, '');

  if (ddi === '+55') {
    const maxDigits = digits.slice(0, 11);
    if (maxDigits.length === 0) return '';
    if (maxDigits.length <= 2) return `(${maxDigits}`;
    if (maxDigits.length <= 6) return `(${maxDigits.slice(0, 2)}) ${maxDigits.slice(2)}`;
    if (maxDigits.length <= 10) return `(${maxDigits.slice(0, 2)}) ${maxDigits.slice(2, 6)}-${maxDigits.slice(6)}`;
    return `(${maxDigits.slice(0, 2)}) ${maxDigits.slice(2, 7)}-${maxDigits.slice(7, 11)}`;
  }

  if (ddi === '+1') { // EUA / Canadá
    const maxDigits = digits.slice(0, 10);
    if (maxDigits.length === 0) return '';
    if (maxDigits.length <= 3) return `(${maxDigits}`;
    if (maxDigits.length <= 6) return `(${maxDigits.slice(0, 3)}) ${maxDigits.slice(3)}`;
    return `(${maxDigits.slice(0, 3)}) ${maxDigits.slice(3, 6)}-${maxDigits.slice(6)}`;
  }

  // Outros países (E.164: até 14 dígitos locais agrupados de 3 em 3 ou 4 em 4)
  const maxDigits = digits.slice(0, 13);
  if (maxDigits.length <= 3) return maxDigits;
  if (maxDigits.length <= 6) return `${maxDigits.slice(0, 3)} ${maxDigits.slice(3)}`;
  if (maxDigits.length <= 9) return `${maxDigits.slice(0, 3)} ${maxDigits.slice(3, 6)} ${maxDigits.slice(6)}`;
  return `${maxDigits.slice(0, 3)} ${maxDigits.slice(3, 6)} ${maxDigits.slice(6, 9)} ${maxDigits.slice(9)}`;
}

/**
 * Extrai DDI e número local de uma string de telefone salva
 */
export function parsePhoneParts(fullPhone: string): { ddi: string; local: string } {
  if (!fullPhone) return { ddi: '+55', local: '' };
  const trimmed = fullPhone.trim();

  // Lista dos DDIs conhecidos mais comuns para detecção
  const KNOWN_DDIS = ['+55', '+351', '+54', '+56', '+598', '+595', '+591', '+57', '+58', '+51', '+34', '+44', '+33', '+49', '+39', '+1'];

  for (const d of KNOWN_DDIS) {
    if (trimmed.startsWith(d)) {
      const remaining = trimmed.slice(d.length).replace(/\D/g, '');
      return { ddi: d, local: formatLocalPhone(remaining, d) };
    }
  }

  // Regex geral para + seguido de 1 a 3 dígitos
  const match = trimmed.match(/^(\+\d{1,3})(.*)$/);
  if (match) {
    const ddi = match[1];
    const remaining = match[2].replace(/\D/g, '');
    return { ddi, local: formatLocalPhone(remaining, ddi) };
  }

  // Se não tiver +, presume Brasil
  const digits = trimmed.replace(/\D/g, '');
  return { ddi: '+55', local: formatLocalPhone(digits, '+55') };
}

/**
 * Constrói string E.164 padronizada para armazenamento
 */
export function buildE164Phone(ddi: string, local: string): string {
  const cleanDdi = ddi.trim().startsWith('+') ? ddi.trim() : `+${ddi.trim()}`;
  const localDigits = local.replace(/\D/g, '');
  if (!localDigits) return '';
  return `${cleanDdi}${localDigits}`;
}

/**
 * Formata telefone para exibição amigável com DDI
 */
export function formatDisplayPhone(fullPhone?: string): string {
  if (!fullPhone) return 'Não informado';
  const { ddi, local } = parsePhoneParts(fullPhone);
  if (!local) return fullPhone;
  return `${ddi} ${local}`;
}
