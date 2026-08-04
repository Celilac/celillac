-- ============================================================
-- Migration 016: RN-CONSUMER-05 — Fix ALLERGY + LOW/LIFESTYLE Severity Floor
-- Issue #34 — Aprovado em 2026-08-01
-- ============================================================
--
-- CONTEXTO:
--   O campo `food_profiles.restrictions` é um array JSONB com objetos do tipo:
--   { allergen, severity, type, notes }
--
--   O default histórico de `Restriction.create()` era type = 'ALLERGY' quando
--   o campo type não era informado. Isso significa que registros antigos podem
--   conter restrições com type = 'ALLERGY' e severity = 'LOW' ou 'LIFESTYLE',
--   combinação agora inválida pela RN-CONSUMER-05 (Issue #34).
--
-- POLÍTICA ADOTADA (aprovada junto com a implementação):
--   - ALLERGY + LOW   → severidade elevada para MEDIUM  (piso mínimo da regra)
--   - ALLERGY + LIFESTYLE → type alterado para INTOLERANCE (combinação mais coerente:
--     se uma pessoa registrou algo como alergia de estilo de vida, provavelmente é
--     uma intolerância)
--
-- EXECUÇÃO:
--   ⚠️ NÃO executar em produção sem validação humana.
--   ⚠️ Executar PRIMEIRO em ambiente de staging com backup completo.
--   Aplica-se apenas ao banco LOCAL de desenvolvimento neste momento.
--
-- ============================================================

BEGIN;

-- ============================================================
-- PASSO 1 — Diagnóstico (contagem de registros afetados)
-- Execute este SELECT antes do UPDATE para confirmar o escopo.
-- ============================================================
-- SELECT
--   id AS food_profile_id,
--   user_id,
--   jsonb_array_elements(restrictions) AS restriction
-- FROM food_profiles
-- WHERE EXISTS (
--   SELECT 1
--   FROM jsonb_array_elements(restrictions) AS r
--   WHERE
--     (r->>'type' = 'ALLERGY' OR r->>'type' IS NULL)
--     AND r->>'severity' IN ('LOW', 'LIFESTYLE')
-- );

-- ============================================================
-- PASSO 2 — ALLERGY + LOW → severity elevada para MEDIUM
-- ============================================================
UPDATE food_profiles
SET restrictions = (
  SELECT jsonb_agg(
    CASE
      WHEN
        (elem->>'type' = 'ALLERGY' OR elem->>'type' IS NULL)
        AND elem->>'severity' = 'LOW'
      THEN
        elem || jsonb_build_object(
          'severity', 'MEDIUM',
          'type', 'ALLERGY',
          '_migrated_rn_consumer_05', true,
          '_original_severity', 'LOW'
        )
      ELSE elem
    END
  )
  FROM jsonb_array_elements(restrictions) AS elem
),
updated_at = NOW()
WHERE EXISTS (
  SELECT 1
  FROM jsonb_array_elements(restrictions) AS r
  WHERE
    (r->>'type' = 'ALLERGY' OR r->>'type' IS NULL)
    AND r->>'severity' = 'LOW'
);

-- ============================================================
-- PASSO 3 — ALLERGY + LIFESTYLE → type alterado para INTOLERANCE
-- Justificativa: "alergia de estilo de vida" é uma contradição clínica.
-- A combinação mais coerente para LIFESTYLE é INTOLERANCE ou DIETARY_PREFERENCE.
-- ============================================================
UPDATE food_profiles
SET restrictions = (
  SELECT jsonb_agg(
    CASE
      WHEN
        (elem->>'type' = 'ALLERGY' OR elem->>'type' IS NULL)
        AND elem->>'severity' = 'LIFESTYLE'
      THEN
        elem || jsonb_build_object(
          'type', 'INTOLERANCE',
          '_migrated_rn_consumer_05', true,
          '_original_type', 'ALLERGY'
        )
      ELSE elem
    END
  )
  FROM jsonb_array_elements(restrictions) AS elem
),
updated_at = NOW()
WHERE EXISTS (
  SELECT 1
  FROM jsonb_array_elements(restrictions) AS r
  WHERE
    (r->>'type' = 'ALLERGY' OR r->>'type' IS NULL)
    AND r->>'severity' = 'LIFESTYLE'
);

-- ============================================================
-- PASSO 4 — Verificação pós-migração
-- Execute este SELECT após o UPDATE para confirmar que não restam registros inválidos.
-- O resultado deve ser vazio (0 linhas) após a migração bem-sucedida.
-- ============================================================
-- SELECT COUNT(*) AS registros_invalidos_restantes
-- FROM food_profiles,
--      jsonb_array_elements(restrictions) AS r
-- WHERE
--   (r->>'type' = 'ALLERGY' OR r->>'type' IS NULL)
--   AND r->>'severity' IN ('LOW', 'LIFESTYLE');

COMMIT;

-- ============================================================
-- NOTA SOBRE BACKWARD COMPATIBILITY (Grace Period):
-- Se a API receber payloads legados com type=ALLERGY e severity=LOW,
-- o endpoint de criação/atualização de perfil deverá retornar HTTP 422
-- com a mensagem de erro do domain: "Uma restrição do tipo Alergia (ALLERGY)
-- não pode ter severidade LOW. Severidade mínima para alergias: MEDIUM."
-- O cliente deve ser atualizado para usar severity=MEDIUM ou type=INTOLERANCE.
-- ============================================================
