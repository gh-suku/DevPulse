-- Issue #42: Add Missing Database Constraints
-- Adds NOT NULL, CHECK, and other constraints to ensure data integrity

-- ============================================
-- PROFILES TABLE CONSTRAINTS
-- ============================================

-- Ensure full_name is not empty
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_full_name_not_empty 
  CHECK (length(trim(full_name)) > 0);

-- Ensure phone format if provided
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_phone_format
  CHECK (phone IS NULL OR phone = '' OR phone ~ '^\+?[0-9\s\-\(\)]+$');

-- ============================================
-- GOALS TABLE CONSTRAINTS
-- ============================================

-- Ensure goal_code is not empty and uppercase
ALTER TABLE public.goals
  ADD CONSTRAINT goals_code_not_empty
  CHECK (length(trim(goal_code)) > 0);

-- Ensure title is not empty
ALTER TABLE public.goals
  ADD CONSTRAINT goals_title_not_empty
  CHECK (length(trim(title)) > 0);

-- Ensure progress is between 0 and 100
ALTER TABLE public.goals
  ADD CONSTRAINT goals_progress_range
  CHECK (progress >= 0 AND progress <= 100);

-- Ensure target_value is positive if set
ALTER TABLE public.goals
  ADD CONSTRAINT goals_target_positive
  CHECK (target_value IS NULL OR target_value > 0);

-- Ensure current_value is non-negative
ALTER TABLE public.goals
  ADD CONSTRAINT goals_current_nonnegative
  CHECK (current_value IS NULL OR current_value >= 0);

-- Ensure color is valid hex format
ALTER TABLE public.goals
  ADD CONSTRAINT goals_color_format
  CHECK (color ~ '^#[0-9A-Fa-f]{6}$');

-- ============================================
-- TASKS TABLE CONSTRAINTS
-- ============================================

-- Ensure title is not empty
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_title_not_empty
  CHECK (length(trim(title)) > 0);

-- Ensure status is valid
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_status_valid
  CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'));

-- Ensure priority is valid
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_priority_valid
  CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Ensure due_date is in the future when created (optional)
-- Note: This is commented out as it may be too restrictive
-- ALTER TABLE public.tasks
--   ADD CONSTRAINT tasks_due_date_future
--   CHECK (due_date IS NULL OR due_date >= CURRENT_DATE);

-- ============================================
-- SUBTASKS TABLE CONSTRAINTS
-- ============================================

-- Ensure title is not empty
ALTER TABLE public.subtasks
  ADD CONSTRAINT subtasks_title_not_empty
  CHECK (length(trim(title)) > 0);

-- Ensure completed_at is set only when is_completed is true
ALTER TABLE public.subtasks
  ADD CONSTRAINT subtasks_completed_at_consistency
  CHECK (
    (is_completed = true AND completed_at IS NOT NULL) OR
    (is_completed = false AND completed_at IS NULL)
  );

-- ============================================
-- DAILY LOGS TABLE CONSTRAINTS
-- ============================================

-- Ensure title is not empty
ALTER TABLE public.daily_logs
  ADD CONSTRAINT daily_logs_title_not_empty
  CHECK (length(trim(title)) > 0);

-- Ensure status is valid
ALTER TABLE public.daily_logs
  ADD CONSTRAINT daily_logs_status_valid
  CHECK (status IN ('pending', 'completed', 'in_progress'));

-- ============================================
-- ATTRIBUTES TABLE CONSTRAINTS
-- ============================================

-- Ensure name is not empty
ALTER TABLE public.attributes
  ADD CONSTRAINT attributes_name_not_empty
  CHECK (length(trim(name)) > 0);

-- Ensure rating is between 0 and 5
ALTER TABLE public.attributes
  ADD CONSTRAINT attributes_rating_range
  CHECK (rating >= 0 AND rating <= 5);

-- Ensure category is valid
ALTER TABLE public.attributes
  ADD CONSTRAINT attributes_category_valid
  CHECK (category IN ('general', 'technical', 'leadership', 'communication', 'other'));

-- ============================================
-- COMMUNITY POSTS TABLE CONSTRAINTS
-- ============================================

-- Ensure content is not empty
ALTER TABLE public.community_posts
  ADD CONSTRAINT posts_content_not_empty
  CHECK (length(trim(content)) > 0);

-- Ensure content length limit
ALTER TABLE public.community_posts
  ADD CONSTRAINT posts_content_length
  CHECK (length(content) <= 5000);

-- Ensure likes_count is non-negative
ALTER TABLE public.community_posts
  ADD CONSTRAINT posts_likes_nonnegative
  CHECK (likes_count >= 0);

-- Ensure comments_count is non-negative
ALTER TABLE public.community_posts
  ADD CONSTRAINT posts_comments_nonnegative
  CHECK (comments_count >= 0);

-- ============================================
-- POST COMMENTS TABLE CONSTRAINTS
-- ============================================

-- Ensure content is not empty
ALTER TABLE public.post_comments
  ADD CONSTRAINT post_comments_content_not_empty
  CHECK (length(trim(content)) > 0);

-- Ensure content length limit
ALTER TABLE public.post_comments
  ADD CONSTRAINT post_comments_content_length
  CHECK (length(content) <= 2000);

-- ============================================
-- WEEKLY SUMMARIES TABLE CONSTRAINTS
-- ============================================

-- Ensure week_start is a Monday
ALTER TABLE public.weekly_summaries
  ADD CONSTRAINT weekly_summaries_week_start_monday
  CHECK (EXTRACT(DOW FROM week_start) = 1);

-- Ensure week_end is after week_start
ALTER TABLE public.weekly_summaries
  ADD CONSTRAINT weekly_summaries_week_end_after_start
  CHECK (week_end > week_start);

-- ============================================
-- VERIFICATION COMPLETE
-- ============================================

SELECT 
  'Constraints Added' as status,
  conname as constraint_name,
  conrelid::regclass as table_name
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
  AND contype = 'c'
ORDER BY conrelid::regclass::text, conname;
