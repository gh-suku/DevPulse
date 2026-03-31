-- Issue #52: Server-side Email Domain Validation
-- Adds database-level validation for @tcs.com email domain

-- ============================================
-- ADD EMAIL DOMAIN CONSTRAINT
-- ============================================

-- Add constraint to auth.users table (requires superuser access)
-- Note: This may need to be run by Supabase support or via dashboard

-- Alternative: Add trigger-based validation
CREATE OR REPLACE FUNCTION public.validate_email_domain()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if email ends with @tcs.com
  IF NEW.email NOT LIKE '%@tcs.com' THEN
    RAISE EXCEPTION 'Email must be from @tcs.com domain'
      USING HINT = 'Please use your TCS corporate email address';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply trigger to auth.users table
DROP TRIGGER IF EXISTS validate_email_domain_trigger ON auth.users;
CREATE TRIGGER validate_email_domain_trigger
  BEFORE INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_email_domain();

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 
  'Email Domain Validation' as status,
  'Trigger created successfully' as message;
