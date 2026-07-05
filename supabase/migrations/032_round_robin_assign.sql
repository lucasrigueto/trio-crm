-- ============================================================
-- Migration 032: Round-Robin de Agentes
-- Trio CRM — Rigueto
-- Data: 2026-07-05
-- ============================================================
--
-- OBJETIVO:
--   Adiciona uma função RPC SECURITY DEFINER que seleciona o próximo
--   agente em rodízio (round-robin) para atribuição de conversas.
--
--   Critérios de seleção (em ordem de prioridade):
--     1. Menor número de conversas abertas atribuídas no momento
--     2. Mais tempo sem receber uma atribuição nova (tie-breaker)
--
-- IDEMPOTENTE: Seguro para re-executar.
-- ============================================================

CREATE OR REPLACE FUNCTION get_next_round_robin_agent(p_account_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_agent_id UUID;
BEGIN
  -- Valida que o account_id existe
  IF NOT EXISTS (SELECT 1 FROM accounts WHERE id = p_account_id) THEN
    RAISE EXCEPTION 'account_not_found: % não existe', p_account_id
      USING ERRCODE = '22023';
  END IF;

  -- Seleciona o agente ativo da conta com:
  --   (a) menor número de conversas abertas atribuídas a ele agora
  --   (b) menor timestamp de updated_at como tie-breaker (há mais tempo sem atribuição)
  SELECT p.user_id
  INTO v_next_agent_id
  FROM profiles p
  WHERE p.account_id = p_account_id
    AND p.role IN ('agent', 'admin', 'owner')
  ORDER BY
    -- Contagem de conversas abertas atribuídas (subquery correlacionada)
    (
      SELECT count(*)
      FROM conversations c
      WHERE c.assigned_agent_id = p.user_id
        AND c.account_id = p_account_id
        AND c.status = 'open'
    ) ASC,
    -- Tie-breaker: quem faz mais tempo sem receber lead
    p.updated_at ASC
  LIMIT 1;

  RETURN v_next_agent_id;
END;
$$;

-- Permissão: apenas authenticated users (o service_role já tem acesso total)
GRANT EXECUTE ON FUNCTION get_next_round_robin_agent(UUID) TO authenticated;

COMMENT ON FUNCTION get_next_round_robin_agent IS
  'Retorna o UUID do próximo agente elegível na fila round-robin para o account_id fornecido. '
  'Prioriza agentes com menos conversas abertas; usa updated_at como tie-breaker.';
