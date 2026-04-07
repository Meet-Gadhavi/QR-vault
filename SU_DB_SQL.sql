-- =============================================================================
-- QR VAULT — SUPABASE DATABASE UPDATES (SU_DB_SQL)
-- Use this file to track all manual SQL updates required for the project.
-- =============================================================================

-- DATE: 2026-04-07
-- DESCRIPTION: Added File Manifest for precise recovery & Multi-File Reporting support.
-- -----------------------------------------------------------------------------

-- 1. Update Deleted Vault Logs to support Precise Recovery
-- Stores the snapshot of files at deletion to ensure only original files are restored.
ALTER TABLE public.deleted_vault_logs 
  ADD COLUMN IF NOT EXISTS file_manifest jsonb DEFAULT '[]'::jsonb;

-- 2. Update Reports to support Multiple File Selection
-- Transition from single file_id to an array of file_ids for better moderation.
ALTER TABLE public.reports 
  ADD COLUMN IF NOT EXISTS file_ids uuid[] DEFAULT '{}'::uuid[];

-- 3. Migrate existing single report data to the new array format
UPDATE public.reports 
SET file_ids = ARRAY[file_id] 
WHERE file_id IS NOT NULL AND (file_ids IS NULL OR cardinality(file_ids) = 0);

-- 4. Enable RLS on modified tables (if matched by schema)
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deleted_vault_logs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- [END OF UPDATE 2026-04-07]
-- =============================================================================
