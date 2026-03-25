-- ============================================
-- ADD USERNAME FEATURE
-- ============================================
-- Run this in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste & Run
-- ============================================

-- ============================================
-- Step 1: Add username column to profiles table
-- ============================================
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- ============================================
-- Step 2: Create function to extract username from email
-- ============================================
CREATE OR REPLACE FUNCTION public.extract_username_from_email(email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  -- Extract username by removing @tcs.com
  RETURN LOWER(REPLACE(email, '@tcs.com', ''));
END;
$$;

-- ============================================
-- Step 3: Update existing users with usernames
-- ============================================
UPDATE public.profiles
SET username = public.extract_username_from_email(
  (SELECT email FROM auth.users WHERE id = profiles.id)
)
WHERE username IS NULL;

-- ============================================
-- Step 4: Update handle_new_user function to include username
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Automatically create a profile when a new user signs up
  INSERT INTO public.profiles (id, full_name, username, avatar_url, bio, phone, department)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    public.extract_username_from_email(NEW.email),
    NULL,
    '',
    '',
    ''
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- ============================================
-- Step 5: Create index for username lookups
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- ============================================
-- Step 6: Add RLS policy for public profile viewing by username
-- ============================================
CREATE POLICY "Anyone can view profiles by username"
  ON public.profiles
  FOR SELECT
  USING (true);

-- ============================================
-- Verify Setup
-- ============================================
SELECT 
  id,
  full_name,
  username,
  department,
  created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- SETUP COMPLETE! ✅
-- ============================================
-- You now have:
-- 1. username column in profiles table
-- 2. Automatic username extraction from email (@tcs.com removed)
-- 3. All existing users have usernames
-- 4. New users will automatically get usernames
-- 5. Public profile viewing enabled
-- ============================================
