# OPENAPI.md - Contratos de API (Referência)

## Endpoint: POST /compatibility/check
- **Objetivo:** Verificar se um produto é seguro para um usuário.
- **Request Body:**
  ```json
  {
    "userId": "uuid",
    "productId": "uuid"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "compatible": boolean,
    "riskLevel": "SAFE | WARNING | DANGER",
    "reason": "string"
  }
  ```
