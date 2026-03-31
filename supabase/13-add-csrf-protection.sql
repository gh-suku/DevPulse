-- Issue #50: CSRF Protection Setup
-- Adds database-level session tracking for CSRF protection

-- ============================================
-- CREATE CSRF TOKENS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.csrf_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX idx_csrf_tokens_user_id ON public.csrf_tokens(user_id);
CREATE INDEX idx_csrf_tokens_token ON public.csrf_tokens(token);
CREATE INDEX idx_csrf_tokens_expires_at ON public.csrf_tokens(expires_at);

-- Enable RLS
ALTER TABLE public.csrf_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only access their own tokens
CREATE POLICY "Users can manage own CSRF tokens"
  ON public.csrf_tokens
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- CLEANUP EXPIRED TOKENS FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_csrf_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.csrf_tokens
  WHERE expires_at < NOW();
END;
$$;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 
  'CSRF Protection' as status,
  'Table and policies created' as message;
