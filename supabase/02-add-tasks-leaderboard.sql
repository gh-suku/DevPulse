-- ============================================
-- LEADERBOARD FEATURE - ADD TASKS TABLE
-- ============================================
-- Run this in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste & Run
-- ============================================

-- ============================================
-- Create Tasks Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  goal_id TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  completed_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Create Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON public.tasks(completed_at);

-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Users can view all tasks (for leaderboard)
CREATE POLICY "Users can view all tasks"
  ON public.tasks
  FOR SELECT
  USING (true);

-- Users can insert their own tasks
CREATE POLICY "Users can insert own tasks"
  ON public.tasks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tasks
CREATE POLICY "Users can update own tasks"
  ON public.tasks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own tasks
CREATE POLICY "Users can delete own tasks"
  ON public.tasks
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Create Auto-Update Timestamp Function for Tasks
-- ============================================
CREATE TRIGGER on_task_updated
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- Update Profiles Table for Leaderboard
-- ============================================
-- Add points and rank columns if they don't exist
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rank INTEGER DEFAULT 0;

-- ============================================
-- Create Function to Calculate User Points
-- ============================================
CREATE OR REPLACE FUNCTION public.calculate_user_points(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  total_points INTEGER;
BEGIN
  SELECT COUNT(*) * 10 INTO total_points
  FROM public.tasks
  WHERE user_id = user_uuid AND status = 'completed';
  
  RETURN COALESCE(total_points, 0);
END;
$$;

-- ============================================
-- Create Function to Update User Points
-- ============================================
CREATE OR REPLACE FUNCTION public.update_user_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update points for the user
  UPDATE public.profiles
  SET points = public.calculate_user_points(NEW.user_id)
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- ============================================
-- Create Trigger to Auto-Update Points
-- ============================================
CREATE TRIGGER on_task_status_changed
  AFTER INSERT OR UPDATE OF status ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_points();

-- ============================================
-- Insert Sample Tasks (Optional - for testing)
-- ============================================
-- Uncomment below to add sample data for testing
-- Replace 'YOUR_USER_ID' with actual user IDs from auth.users

/*
INSERT INTO public.tasks (user_id, title, description, goal_id, status, priority, completed_at) VALUES
  ('YOUR_USER_ID', 'Built AI demo for product launch', 'Created interactive demo showcasing AI capabilities', 'G1', 'completed', 'high', NOW() - INTERVAL '2 hours'),
  ('YOUR_USER_ID', 'Tested LangChain integration', 'Integrated and tested LangChain with vector databases', 'G2', 'completed', 'medium', NOW() - INTERVAL '4 hours'),
  ('YOUR_USER_ID', 'Code review for PR #123', 'Reviewed and approved pull request', 'G1', 'completed', 'medium', NOW() - INTERVAL '1 day'),
  ('YOUR_USER_ID', 'Fixed critical UI bugs', 'Resolved layout issues on mobile devices', 'G1', 'completed', 'urgent', NOW() - INTERVAL '3 hours'),
  ('YOUR_USER_ID', 'Mentored junior developer', 'Pair programming session on React hooks', 'G3', 'completed', 'low', NOW() - INTERVAL '5 hours');
*/

-- ============================================
-- Verify Setup
-- ============================================
SELECT 
  'Tables Created' as status,
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('tasks', 'profiles')
UNION ALL
SELECT 
  'Functions Created' as status,
  routine_name
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('calculate_user_points', 'update_user_points');

-- ============================================
-- SETUP COMPLETE! ✅
-- ============================================
-- You can now:
-- 1. Use the leaderboard feature in your app
-- 2. Users can create and complete tasks
-- 3. Points are automatically calculated
-- 4. Leaderboard shows all users ranked by points
-- ============================================
