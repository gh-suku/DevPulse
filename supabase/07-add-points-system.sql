-- ============================================
-- COMPREHENSIVE POINTS SYSTEM FOR TASKS & SUBTASKS
-- ============================================
-- Run this in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste & Run
-- ============================================

-- ============================================
-- Add Points Columns to Tasks and Subtasks
-- ============================================
ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS points_awarded INTEGER DEFAULT 10;

ALTER TABLE public.subtasks 
  ADD COLUMN IF NOT EXISTS points_awarded INTEGER DEFAULT 5;

-- ============================================
-- Enhanced Function to Calculate User Points
-- ============================================
-- This calculates points from BOTH tasks and subtasks
CREATE OR REPLACE FUNCTION public.calculate_user_points(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  task_points INTEGER;
  subtask_points INTEGER;
  total_points INTEGER;
BEGIN
  -- Calculate points from completed tasks
  SELECT COALESCE(SUM(points_awarded), 0) INTO task_points
  FROM public.tasks
  WHERE user_id = user_uuid AND status = 'completed';
  
  -- Calculate points from completed subtasks
  SELECT COALESCE(SUM(points_awarded), 0) INTO subtask_points
  FROM public.subtasks
  WHERE user_id = user_uuid AND is_completed = true;
  
  -- Total points
  total_points := COALESCE(task_points, 0) + COALESCE(subtask_points, 0);
  
  RETURN total_points;
END;
$$;

-- ============================================
-- Function to Update User Points (for Tasks)
-- ============================================
CREATE OR REPLACE FUNCTION public.update_user_points_from_task()
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
-- Function to Update User Points (for Subtasks)
-- ============================================
CREATE OR REPLACE FUNCTION public.update_user_points_from_subtask()
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
-- Function to Update User Points on Deletion (Tasks)
-- ============================================
CREATE OR REPLACE FUNCTION public.update_user_points_on_task_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update points for the user after task deletion
  UPDATE public.profiles
  SET points = public.calculate_user_points(OLD.user_id)
  WHERE id = OLD.user_id;
  
  RETURN OLD;
END;
$$;

-- ============================================
-- Function to Update User Points on Deletion (Subtasks)
-- ============================================
CREATE OR REPLACE FUNCTION public.update_user_points_on_subtask_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update points for the user after subtask deletion
  UPDATE public.profiles
  SET points = public.calculate_user_points(OLD.user_id)
  WHERE id = OLD.user_id;
  
  RETURN OLD;
END;
$$;

-- ============================================
-- Replace Existing Task Triggers
-- ============================================
DROP TRIGGER IF EXISTS on_task_status_changed ON public.tasks;
CREATE TRIGGER on_task_status_changed
  AFTER INSERT OR UPDATE OF status ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_points_from_task();

DROP TRIGGER IF EXISTS on_task_deleted_update_points ON public.tasks;
CREATE TRIGGER on_task_deleted_update_points
  AFTER DELETE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_points_on_task_delete();

-- ============================================
-- Create New Subtask Triggers for Points
-- ============================================
DROP TRIGGER IF EXISTS on_subtask_completed_update_points ON public.subtasks;
CREATE TRIGGER on_subtask_completed_update_points
  AFTER INSERT OR UPDATE OF is_completed ON public.subtasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_points_from_subtask();

DROP TRIGGER IF EXISTS on_subtask_deleted_update_points ON public.subtasks;
CREATE TRIGGER on_subtask_deleted_update_points
  AFTER DELETE ON public.subtasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_points_on_subtask_delete();

-- ============================================
-- Recalculate All User Points (One-Time Update)
-- ============================================
-- This ensures all existing users have correct points
UPDATE public.profiles
SET points = public.calculate_user_points(id)
WHERE id IN (SELECT DISTINCT user_id FROM public.tasks UNION SELECT DISTINCT user_id FROM public.subtasks);

-- ============================================
-- Create View for User Points Breakdown
-- ============================================
CREATE OR REPLACE VIEW public.user_points_breakdown AS
SELECT 
  p.id as user_id,
  p.username,
  p.full_name,
  p.points as total_points,
  COALESCE(task_stats.task_points, 0) as points_from_tasks,
  COALESCE(task_stats.completed_tasks, 0) as completed_tasks,
  COALESCE(subtask_stats.subtask_points, 0) as points_from_subtasks,
  COALESCE(subtask_stats.completed_subtasks, 0) as completed_subtasks
FROM public.profiles p
LEFT JOIN (
  SELECT 
    user_id,
    SUM(points_awarded) as task_points,
    COUNT(*) as completed_tasks
  FROM public.tasks
  WHERE status = 'completed'
  GROUP BY user_id
) task_stats ON p.id = task_stats.user_id
LEFT JOIN (
  SELECT 
    user_id,
    SUM(points_awarded) as subtask_points,
    COUNT(*) as completed_subtasks
  FROM public.subtasks
  WHERE is_completed = true
  GROUP BY user_id
) subtask_stats ON p.id = subtask_stats.user_id;

-- ============================================
-- Verify Setup
-- ============================================
SELECT 
  'Columns Added' as status,
  table_name,
  column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('tasks', 'subtasks')
  AND column_name = 'points_awarded'
UNION ALL
SELECT 
  'Functions Created' as status,
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'calculate_user_points',
    'update_user_points_from_task',
    'update_user_points_from_subtask',
    'update_user_points_on_task_delete',
    'update_user_points_on_subtask_delete'
  )
UNION ALL
SELECT 
  'Triggers Created' as status,
  trigger_name,
  event_object_table
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND trigger_name IN (
    'on_task_status_changed',
    'on_task_deleted_update_points',
    'on_subtask_completed_update_points',
    'on_subtask_deleted_update_points'
  );

-- ============================================
-- Test Query: View Your Points Breakdown
-- ============================================
SELECT * FROM public.user_points_breakdown
WHERE user_id = auth.uid();

-- ============================================
-- SETUP COMPLETE! ✅
-- ============================================
-- You now have:
-- 1. Tasks award 10 points each when completed
-- 2. Subtasks award 5 points each when completed
-- 3. Points are automatically calculated and stored in profiles.points
-- 4. Points update when tasks/subtasks are completed, uncompleted, or deleted
-- 5. View (user_points_breakdown) shows detailed points breakdown
-- 6. All existing user points have been recalculated
-- 
-- Points System:
-- - Complete a task: +10 points
-- - Complete a subtask: +5 points
-- - Uncomplete a task: -10 points
-- - Uncomplete a subtask: -5 points
-- - Delete completed task: -10 points
-- - Delete completed subtask: -5 points
-- ============================================
