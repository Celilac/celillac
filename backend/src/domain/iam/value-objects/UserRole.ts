// backend/src/domain/iam/value-objects/UserRole.ts

/**
 * UserRole — Enum de papéis do sistema CeLiLac.
 * Definido no DATABASE.md: CELIACO | PARCEIRO | ADMIN
 * Zero dependências externas — pure domain.
 */
export enum UserRole {
  CELIACO  = 'CELIACO',
  PARCEIRO = 'PARCEIRO',
  ADMIN    = 'ADMIN',
}
