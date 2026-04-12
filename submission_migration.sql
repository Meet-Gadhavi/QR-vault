-- =============================================================================
-- DATA RECEIVING VAULTS MIGRATION
-- Run this in your Supabase SQL Editor
-- =============================================================================

-- 1. Update vaults table
ALTER TABLE public.vaults 
  ADD COLUMN IF NOT EXISTS vault_type text DEFAULT 'SENDING',
  ADD COLUMN IF NOT EXISTS receiving_config jsonb;

-- 2. Create submissions table
CREATE TABLE IF NOT EXISTS public.submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  vault_id uuid REFERENCES public.vaults(id) ON DELETE CASCADE NOT NULL,
  sender_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Update files table to link to submissions
ALTER TABLE public.files 
  ADD COLUMN IF NOT EXISTS submission_id uuid REFERENCES public.submissions(id) ON DELETE CASCADE;

-- 4. Enable RLS on submissions
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- 5. Open access policy (development)
CREATE POLICY "Public submissions access" ON public.submissions FOR ALL USING (true) WITH CHECK (true);

-- 6. Grant permissions
GRANT ALL ON TABLE public.submissions TO anon, authenticated, service_role;
