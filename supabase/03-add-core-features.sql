-- ============================================
-- CONSOLIDATED FEATURES - DATABASE SCHEMA UPDATE
-- ============================================
-- Run this in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste & Run
-- ============================================

-- ============================================
-- Create Daily Logs Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  goal_id TEXT DEFAULT '',
  time TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  confidence_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Create Goals Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  color TEXT DEFAULT '#10b981',
  target_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Update Tasks Table (if exists, add new columns)
-- ============================================
ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS time_spent INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- ============================================
-- Create Attributes Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.attributes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rating INTEGER DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  notes TEXT DEFAULT '',
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Create Weekly Summaries Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.weekly_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  summary_text TEXT DEFAULT '',
  insights JSONB DEFAULT '[]',
  goal_breakdown JSONB DEFAULT '{}',
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  total_logs INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Create Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_id ON public.daily_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_created_at ON public.daily_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_attributes_user_id ON public.attributes(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_summaries_user_id ON public.weekly_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_summaries_week_start ON public.weekly_summaries(week_start);

-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_summaries ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies for Daily Logs
-- ============================================
CREATE POLICY "Users can view own daily logs"
  ON public.daily_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily logs"
  ON public.daily_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily logs"
  ON public.daily_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily logs"
  ON public.daily_logs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- RLS Policies for Goals
-- ============================================
CREATE POLICY "Users can view own goals"
  ON public.goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON public.goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON public.goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON public.goals FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- RLS Policies for Attributes
-- ============================================
CREATE POLICY "Users can view own attributes"
  ON public.attributes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attributes"
  ON public.attributes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attributes"
  ON public.attributes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own attributes"
  ON public.attributes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- RLS Policies for Weekly Summaries
-- ============================================
CREATE POLICY "Users can view own weekly summaries"
  ON public.weekly_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly summaries"
  ON public.weekly_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly summaries"
  ON public.weekly_summaries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weekly summaries"
  ON public.weekly_summaries FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Create Auto-Update Timestamp Triggers
-- ============================================
CREATE TRIGGER on_daily_log_updated
  BEFORE UPDATE ON public.daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_goal_updated
  BEFORE UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_attribute_updated
  BEFORE UPDATE ON public.attributes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_weekly_summary_updated
  BEFORE UPDATE ON public.weekly_summaries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- Function to Calculate Goal Progress
-- ============================================
CREATE OR REPLACE FUNCTION public.calculate_goal_progress(goal_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  total_tasks INTEGER;
  completed_tasks INTEGER;
  progress_percent INTEGER;
  goal_code_value TEXT;
BEGIN
  -- Get goal_code from goals table
  SELECT goal_code INTO goal_code_value
  FROM public.goals
  WHERE id = goal_uuid;
  
  -- Count total and completed tasks for this goal
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed')
  INTO total_tasks, completed_tasks
  FROM public.tasks
  WHERE goal_id = goal_code_value;
  
  -- Calculate percentage
  IF total_tasks = 0 THEN
    RETURN 0;
  ELSE
    progress_percent := (completed_tasks * 100) / total_tasks;
    RETURN progress_percent;
  END IF;
END;
$$;

-- ============================================
-- Function to Auto-Update Goal Progress
-- ============================================
CREATE OR REPLACE FUNCTION public.update_goal_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update progress for the related goal
  UPDATE public.goals
  SET progress = public.calculate_goal_progress(id)
  WHERE goal_code = NEW.goal_id;
  
  RETURN NEW;
END;
$$;

-- ============================================
-- Trigger to Auto-Update Goal Progress
-- ============================================
DROP TRIGGER IF EXISTS on_task_status_changed_update_goal ON public.tasks;
CREATE TRIGGER on_task_status_changed_update_goal
  AFTER INSERT OR UPDATE OF status ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_goal_progress();

-- ============================================
-- Verify Setup
-- ============================================
SELECT 
  'Tables Created' as status,
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('daily_logs', 'goals', 'attributes', 'weekly_summaries', 'tasks')
UNION ALL
SELECT 
  'Functions Created' as status,
  routine_name
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('calculate_goal_progress', 'update_goal_progress');

-- ============================================
-- SETUP COMPLETE! ✅
-- ============================================
-- You now have:
-- 1. daily_logs table for daily log entries
-- 2. goals table for user goals
-- 3. attributes table for user attributes/ratings
-- 4. weekly_summaries table for weekly insights
-- 5. Auto-updating goal progress based on tasks
-- 6. All tables have RLS enabled
-- ============================================
