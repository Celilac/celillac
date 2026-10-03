// backend/src/interfaces/http/schemas/AuthSchemas.ts
import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().trim().email('E-mail em formato inválido.').max(255),
  password: z.string().min(1, 'A senha é obrigatória.').max(100),
});

export const RegisterSchema = z.object({
  name: z.string().trim().min(2, 'O nome deve ter no mínimo 2 caracteres.').max(100),
  email: z.string().trim().email('E-mail em formato inválido.').max(255),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres.').max(100),
  role: z.enum(['CONSUMER', 'PARTNER', 'ADMIN']).optional(),
  cpf: z.string().trim().optional(),
  birthDate: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  gender: z.string().trim().optional(),
  avatarUrl: z.string().trim().optional(),
});

export const RequestPasswordResetSchema = z.object({
  email: z.string().trim().email('E-mail em formato inválido.').max(255),
});

export const ConfirmPasswordResetSchema = z.object({
  email: z.string().trim().email('E-mail em formato inválido.').max(255),
  code: z.string().trim().regex(/^\d{6}$/, 'O código de recuperação deve ter exatamente 6 dígitos numéricos.'),
  newPassword: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres.').max(100),
});

export const VerifyEmailCodeSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, 'O código de verificação deve ter exatamente 6 dígitos numéricos.'),
});
