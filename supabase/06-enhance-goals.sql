-- ============================================
-- FIX GOAL DISPLAY - ADD USER DATA TO GOALS
-- ============================================
-- Run this in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste & Run
-- ============================================

-- ============================================
-- Add Additional Fields to Goals Table
-- ============================================
-- These fields will help display more user data in the goal meter
ALTER TABLE public.goals 
  ADD COLUMN IF NOT EXISTS target_value INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS current_value INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'tasks',
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ DEFAULT NOW();

-- ============================================
-- Update Existing Goals to Have Default Values
-- ============================================
-- This ensures existing goals show proper data instead of zero
UPDATE public.goals
SET 
  target_value = 100,
  current_value = progress,
  unit = 'percent',
  start_date = created_at
WHERE target_value IS NULL OR target_value = 0;

-- ============================================
-- Function to Calculate Current Value from Subtasks
-- ============================================
CREATE OR REPLACE FUNCTION public.calculate_goal_current_value(goal_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  completed_count INTEGER;
BEGIN
  -- Count completed subtasks for this goal
  SELECT COUNT(*) FILTER (WHERE is_completed = true)
  INTO completed_count
  FROM public.subtasks
  WHERE goal_id = goal_uuid;
  
  RETURN COALESCE(completed_count, 0);
END;
$$;

-- ============================================
-- Function to Calculate Target Value from Subtasks
-- ============================================
CREATE OR REPLACE FUNCTION public.calculate_goal_target_value(goal_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  total_count INTEGER;
BEGIN
  -- Count total subtasks for this goal
  SELECT COUNT(*)
  INTO total_count
  FROM public.subtasks
  WHERE goal_id = goal_uuid;
  
  -- Return at least 1 to avoid division by zero
  RETURN GREATEST(total_count, 1);
END;
$$;

-- ============================================
-- Enhanced Function to Update Goal Progress and Values
-- ============================================
CREATE OR REPLACE FUNCTION public.update_goal_progress_and_values()
RETURNS TRIGGER
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
  WHERE goal_id = NEW.goal_id;
  
  -- Calculate percentage
  IF total_subtasks = 0 THEN
    progress_percent := 0;
  ELSE
    progress_percent := (completed_subtasks * 100) / total_subtasks;
  END IF;
  
  -- Update goal with progress, current_value, and target_value
  UPDATE public.goals
  SET 
    progress = progress_percent,
    current_value = completed_subtasks,
    target_value = GREATEST(total_subtasks, 1),
    unit = 'subtasks'
  WHERE id = NEW.goal_id;
  
  RETURN NEW;
END;
$$;

-- ============================================
-- Enhanced Function for Subtask Deletion
-- ============================================
CREATE OR REPLACE FUNCTION public.update_goal_on_subtask_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  total_subtasks INTEGER;
  completed_subtasks INTEGER;
  progress_percent INTEGER;
BEGIN
  -- Count total and completed subtasks for this goal after deletion
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE is_completed = true)
  INTO total_subtasks, completed_subtasks
  FROM public.subtasks
  WHERE goal_id = OLD.goal_id;
  
  -- Calculate percentage
  IF total_subtasks = 0 THEN
    progress_percent := 0;
  ELSE
    progress_percent := (completed_subtasks * 100) / total_subtasks;
  END IF;
  
  -- Update goal with progress, current_value, and target_value
  UPDATE public.goals
  SET 
    progress = progress_percent,
    current_value = completed_subtasks,
    target_value = GREATEST(total_subtasks, 1),
    unit = 'subtasks'
  WHERE id = OLD.goal_id;
  
  RETURN OLD;
END;
$$;

-- ============================================
-- Replace Existing Triggers with Enhanced Versions
-- ============================================
DROP TRIGGER IF EXISTS on_subtask_changed_update_goal ON public.subtasks;
CREATE TRIGGER on_subtask_changed_update_goal
  AFTER INSERT OR UPDATE ON public.subtasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_goal_progress_and_values();

DROP TRIGGER IF EXISTS on_subtask_deleted_update_goal ON public.subtasks;
CREATE TRIGGER on_subtask_deleted_update_goal
  AFTER DELETE ON public.subtasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_goal_on_subtask_delete();

-- ============================================
-- View to Get Goal Details with User Data
-- ============================================
CREATE OR REPLACE VIEW public.goal_details AS
SELECT 
  g.id,
  g.user_id,
  g.goal_code,
  g.title,
  g.description,
  g.progress,
  g.color,
  g.current_value,
  g.target_value,
  g.unit,
  g.start_date,
  g.target_date,
  g.created_at,
  g.updated_at,
  COUNT(s.id) as total_subtasks,
  COUNT(s.id) FILTER (WHERE s.is_completed = true) as completed_subtasks,
  CASE 
    WHEN COUNT(s.id) = 0 THEN 0
    ELSE (COUNT(s.id) FILTER (WHERE s.is_completed = true) * 100) / COUNT(s.id)
  END as calculated_progress
FROM public.goals g
LEFT JOIN public.subtasks s ON g.id = s.goal_id
GROUP BY g.id;

-- ============================================
-- Verify Setup
-- ============================================
SELECT 
  'Columns Added' as status,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'goals'
  AND column_name IN ('target_value', 'current_value', 'unit', 'start_date')
UNION ALL
SELECT 
  'Functions Updated' as status,
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'calculate_goal_current_value',
    'calculate_goal_target_value',
    'update_goal_progress_and_values',
    'update_goal_on_subtask_delete'
  );

-- ============================================
-- SETUP COMPLETE! ✅
-- ============================================
-- You now have:
-- 1. Enhanced goals table with target_value, current_value, unit, and start_date
-- 2. Goals now show "X of Y subtasks" instead of just percentage
-- 3. Progress is automatically calculated from subtasks
-- 4. View (goal_details) to easily query goal information with subtask counts
-- 5. No more zero progress issues - shows actual subtask completion
-- ============================================
