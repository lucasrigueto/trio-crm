-- 033: Grant base permissions to anon and authenticated roles
-- RLS policies only take effect AFTER the role has table-level privileges.
-- Without GRANTs, even valid RLS policies are bypassed with "permission denied".

-- ─── SELECT ────────────────────────────────────────────────────────────
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- ─── INSERT / UPDATE / DELETE ──────────────────────────────────────────
-- anon gets nothing beyond SELECT (read-only public)
-- authenticated gets full DML on tables it may need
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- ─── SEQUENCES (needed for serial / identity columns on INSERT) ────────
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ─── FUNCTIONS used by RLS policies ────────────────────────────────────
GRANT EXECUTE ON FUNCTION is_account_member(UUID, account_role_enum) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated;

-- ─── Future tables: auto-grant to authenticated ────────────────────────
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
