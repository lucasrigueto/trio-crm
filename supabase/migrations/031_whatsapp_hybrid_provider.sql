-- ============================================================
-- Migration 031: Suporte híbrido WhatsApp (Meta + Evolution API)
-- Trio CRM — Rigueto
-- Data: 2026-07-05
-- ============================================================
--
-- OBJETIVO:
--   Estende a tabela `whatsapp_config` para suportar dois drivers de
--   conexão WhatsApp:
--     1. 'meta'      — API Oficial Meta Cloud API (padrão do wacrm)
--     2. 'evolution' — Evolution API self-hosted (Baileys/QR Code)
--
-- IDEMPOTENTE: Seguro para re-executar.
-- ============================================================

-- 1. Enum de providers
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'whatsapp_provider_enum') THEN
    CREATE TYPE whatsapp_provider_enum AS ENUM ('meta', 'evolution');
  END IF;
END $$;

-- 2. Adicionar coluna 'provider' (default 'meta' para compatibilidade com dados existentes)
ALTER TABLE whatsapp_config
  ADD COLUMN IF NOT EXISTS provider whatsapp_provider_enum NOT NULL DEFAULT 'meta';

-- 3. Campos específicos da Evolution API (todos opcionais — só usados quando provider='evolution')
ALTER TABLE whatsapp_config
  ADD COLUMN IF NOT EXISTS evolution_api_url        TEXT,
  ADD COLUMN IF NOT EXISTS evolution_api_key        TEXT,     -- Criptografado em AES-256-GCM (igual ao access_token)
  ADD COLUMN IF NOT EXISTS evolution_instance_name  TEXT;

-- 4. Tornar os campos da Meta opcionais (nullable) pois um config do tipo 'evolution'
--    não precisa de phone_number_id, waba_id ou access_token da Meta.
--    NOTA: Se houver NOT NULL constraints existentes, relaxamos para nullable.
DO $$ BEGIN
  -- phone_number_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'whatsapp_config' AND column_name = 'phone_number_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE whatsapp_config ALTER COLUMN phone_number_id DROP NOT NULL;
  END IF;

  -- whatsapp_business_account_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'whatsapp_config' AND column_name = 'whatsapp_business_account_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE whatsapp_config ALTER COLUMN whatsapp_business_account_id DROP NOT NULL;
  END IF;

  -- access_token
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'whatsapp_config' AND column_name = 'access_token'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE whatsapp_config ALTER COLUMN access_token DROP NOT NULL;
  END IF;
END $$;

-- 5. Constraint de validação: garante que os campos obrigatórios por provider estejam presentes
ALTER TABLE whatsapp_config
  DROP CONSTRAINT IF EXISTS chk_whatsapp_config_provider_fields;

ALTER TABLE whatsapp_config
  ADD CONSTRAINT chk_whatsapp_config_provider_fields CHECK (
    (provider = 'meta'      AND phone_number_id IS NOT NULL AND access_token IS NOT NULL) OR
    (provider = 'evolution' AND evolution_api_url IS NOT NULL AND evolution_instance_name IS NOT NULL)
  );

-- 6. Comentários
COMMENT ON COLUMN whatsapp_config.provider IS 'Driver de conexão: ''meta'' para API Oficial, ''evolution'' para Evolution API self-hosted';
COMMENT ON COLUMN whatsapp_config.evolution_api_url IS 'URL base da Evolution API (ex: https://evolution.meuservidor.com)';
COMMENT ON COLUMN whatsapp_config.evolution_api_key IS 'API Key da Evolution API, criptografada em AES-256-GCM';
COMMENT ON COLUMN whatsapp_config.evolution_instance_name IS 'Nome da instância na Evolution API';
