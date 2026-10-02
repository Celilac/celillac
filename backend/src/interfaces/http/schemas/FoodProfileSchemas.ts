// backend/src/interfaces/http/schemas/FoodProfileSchemas.ts
import { z } from 'zod';

export const RestrictionSchema = z.object({
  allergen: z.string().trim().min(1, 'O nome do alérgeno é obrigatório.'),
  severity: z.enum(['LIFESTYLE', 'LOW', 'MEDIUM', 'HIGH', 'FATAL']),
  type: z.enum(['ALLERGY', 'INTOLERANCE', 'MEDICAL_RESTRICTION', 'DIETARY_PREFERENCE', 'LIFESTYLE']).default('ALLERGY'),
  notes: z.string().trim().max(500).optional(),
});

export const CreateFoodProfileSchema = z.object({
  userId: z.string().uuid('ID do usuário deve ser um UUID válido.').optional(),
  restrictions: z.array(RestrictionSchema).min(1, 'Pelo menos uma restrição alimentar deve ser informada.'),
  acceptsCrossContamination: z.boolean().optional(),
});

export const UpdateFoodProfileSchema = z.object({
  restrictions: z.array(RestrictionSchema).min(1, 'Pelo menos uma restrição alimentar deve ser informada.'),
  acceptsCrossContamination: z.boolean().optional(),
});
