-- ============================================
-- ADD SUBTASKS FEATURE FOR GOALS
-- ============================================
-- Run this in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste & Run
-- ============================================

-- ============================================
-- Create Subtasks Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.subtasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Create Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_subtasks_user_id ON public.subtasks(user_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_goal_id ON public.subtasks(goal_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_is_completed ON public.subtasks(is_completed);

-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

-- Users can view their own subtasks
CREATE POLICY "Users can view own subtasks"
  ON public.subtasks FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own subtasks
CREATE POLICY "Users can insert own subtasks"
  ON public.subtasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own subtasks
CREATE POLICY "Users can update own subtasks"
  ON public.subtasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own subtasks
CREATE POLICY "Users can delete own subtasks"
  ON public.subtasks FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Create Auto-Update Timestamp Trigger
-- ============================================
CREATE TRIGGER on_subtask_updated
  BEFORE UPDATE ON public.subtasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- Function to Calculate Goal Progress Based on Subtasks
-- ============================================
CREATE OR REPLACE FUNCTION public.calculate_goal_progress_from_subtasks(goal_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  total_subtasks INTEGER;
  completed_subtasks INTEGER;
  progress_percent INTEGER;
BEGIN
  -- Count total and completed subtasks for this goal
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE is_completed = true)
  INTO total_subtasks, completed_subtasks
  FROM public.subtasks
  WHERE goal_id = goal_uuid;
  
  -- Calculate percentage
  IF total_subtasks = 0 THEN
    RETURN 0;
  ELSE
    progress_percent := (completed_subtasks * 100) / total_subtasks;
    RETURN progress_percent;
  END IF;
END;
$$;

-- ============================================
-- Function to Auto-Update Goal Progress When Subtask Changes
-- ============================================
CREATE OR REPLACE FUNCTION public.update_goal_progress_from_subtasks()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update progress for the related goal
  UPDATE public.goals
  SET progress = public.calculate_goal_progress_from_subtasks(NEW.goal_id)
  WHERE id = NEW.goal_id;
  
  RETURN NEW;
END;
$$;

-- ============================================
-- Trigger to Auto-Update Goal Progress on Subtask Changes
-- ============================================
CREATE TRIGGER on_subtask_changed_update_goal
  AFTER INSERT OR UPDATE OR DELETE ON public.subtasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_goal_progress_from_subtasks();

-- ============================================
-- Function to Handle Subtask Deletion (for DELETE trigger)
-- ============================================
CREATE OR REPLACE FUNCTION public.update_goal_progress_on_subtask_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update progress for the related goal after deletion
  UPDATE public.goals
  SET progress = public.calculate_goal_progress_from_subtasks(OLD.goal_id)
  WHERE id = OLD.goal_id;
  
  RETURN OLD;
END;
$$;

-- ============================================
-- Separate Trigger for DELETE Operations
-- ============================================
CREATE TRIGGER on_subtask_deleted_update_goal
  AFTER DELETE ON public.subtasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_goal_progress_on_subtask_delete();

-- ============================================
-- Verify Setup
-- ============================================
SELECT 
  'Tables Created' as status,
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'subtasks'
UNION ALL
SELECT 
  'Functions Created' as status,
  routine_name
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'calculate_goal_progress_from_subtasks', 
    'update_goal_progress_from_subtasks',
    'update_goal_progress_on_subtask_delete'
  );

-- ============================================
-- SETUP COMPLETE! ✅
-- ============================================
-- You now have:
-- 1. subtasks table linked to goals
-- 2. Auto-updating goal progress based on subtask completion
-- 3. When you mark subtasks as completed, goal progress updates automatically
-- 4. Progress is calculated as: (completed_subtasks / total_subtasks) * 100
-- 5. If no subtasks exist, progress shows 0%
-- ============================================
