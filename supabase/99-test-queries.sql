-- ============================================
-- TEST SUBTASKS FEATURE
-- ============================================
-- Use these queries to test and verify the subtasks feature
-- ============================================

-- 1. Check if subtasks table exists
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'subtasks'
ORDER BY ordinal_position;

-- 2. Check if triggers are set up correctly
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'subtasks';

-- 3. View your goals with enhanced fields
SELECT 
  id,
  goal_code,
  title,
  progress,
  current_value,
  target_value,
  unit,
  created_at
FROM public.goals
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- 4. View all subtasks for your goals
SELECT 
  s.id,
  s.title,
  s.is_completed,
  s.completed_at,
  g.goal_code,
  g.title as goal_title
FROM public.subtasks s
JOIN public.goals g ON s.goal_id = g.id
WHERE s.user_id = auth.uid()
ORDER BY g.goal_code, s.created_at;

-- 5. View goal progress summary (using the view)
SELECT 
  goal_code,
  title,
  progress,
  total_subtasks,
  completed_subtasks,
  calculated_progress
FROM public.goal_details
WHERE user_id = auth.uid()
ORDER BY goal_code;

-- 6. Test: Add a sample subtask (replace YOUR_GOAL_ID with actual goal ID)
-- Uncomment and modify the line below:
/*
INSERT INTO public.subtasks (user_id, goal_id, title, is_completed)
VALUES (
  auth.uid(),
  'YOUR_GOAL_ID',  -- Replace with actual goal UUID
  'Test Subtask 1',
  false
);
*/

-- 7. Test: Mark a subtask as completed (replace YOUR_SUBTASK_ID)
-- Uncomment and modify the line below:
/*
UPDATE public.subtasks
SET is_completed = true, completed_at = NOW()
WHERE id = 'YOUR_SUBTASK_ID' AND user_id = auth.uid();
*/

-- 8. Check if progress updated automatically after marking subtask complete
SELECT 
  g.goal_code,
  g.title,
  g.progress,
  g.current_value,
  g.target_value,
  COUNT(s.id) as total_subtasks,
  COUNT(s.id) FILTER (WHERE s.is_completed = true) as completed_subtasks
FROM public.goals g
LEFT JOIN public.subtasks s ON g.id = s.goal_id
WHERE g.user_id = auth.uid()
GROUP BY g.id, g.goal_code, g.title, g.progress, g.current_value, g.target_value
ORDER BY g.goal_code;

-- 9. Verify RLS policies are working
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'subtasks';

-- 10. Clean up test data (if needed)
-- Uncomment to delete all your subtasks:
/*
DELETE FROM public.subtasks WHERE user_id = auth.uid();
*/

-- ============================================
-- POINTS SYSTEM VERIFICATION QUERIES
-- ============================================

-- 11. Check your current points and breakdown
SELECT * FROM public.user_points_breakdown
WHERE user_id = auth.uid();

-- 12. View all completed tasks with points
SELECT 
  id,
  title,
  goal_id,
  status,
  points_awarded,
  completed_at,
  created_at
FROM public.tasks
WHERE user_id = auth.uid() AND status = 'completed'
ORDER BY completed_at DESC;

-- 13. View all completed subtasks with points
SELECT 
  s.id,
  s.title,
  s.is_completed,
  s.points_awarded,
  s.completed_at,
  g.goal_code,
  g.title as goal_title
FROM public.subtasks s
JOIN public.goals g ON s.goal_id = g.id
WHERE s.user_id = auth.uid() AND s.is_completed = true
ORDER BY s.completed_at DESC;

-- 14. View your profile with total points
SELECT 
  id,
  username,
  full_name,
  points,
  rank,
  created_at
FROM public.profiles
WHERE id = auth.uid();

-- 15. View leaderboard (top 10 users by points)
SELECT 
  p.username,
  p.full_name,
  p.points,
  upb.completed_tasks,
  upb.completed_subtasks,
  upb.points_from_tasks,
  upb.points_from_subtasks
FROM public.profiles p
LEFT JOIN public.user_points_breakdown upb ON p.id = upb.user_id
WHERE p.points > 0
ORDER BY p.points DESC
LIMIT 10;

-- 16. Calculate expected vs actual points (verification)
SELECT 
  auth.uid() as user_id,
  (SELECT COUNT(*) * 10 FROM public.tasks WHERE user_id = auth.uid() AND status = 'completed') as expected_task_points,
  (SELECT COUNT(*) * 5 FROM public.subtasks WHERE user_id = auth.uid() AND is_completed = true) as expected_subtask_points,
  (SELECT COUNT(*) * 10 FROM public.tasks WHERE user_id = auth.uid() AND status = 'completed') + 
  (SELECT COUNT(*) * 5 FROM public.subtasks WHERE user_id = auth.uid() AND is_completed = true) as expected_total_points,
  (SELECT points FROM public.profiles WHERE id = auth.uid()) as actual_points,
  CASE 
    WHEN (SELECT points FROM public.profiles WHERE id = auth.uid()) = 
         ((SELECT COUNT(*) * 10 FROM public.tasks WHERE user_id = auth.uid() AND status = 'completed') + 
          (SELECT COUNT(*) * 5 FROM public.subtasks WHERE user_id = auth.uid() AND is_completed = true))
    THEN '✅ Points Match!'
    ELSE '❌ Points Mismatch - Run recalculation'
  END as verification_status;

-- ============================================
-- EXPECTED RESULTS
-- ============================================
-- After adding subtasks:
-- - Query 3 should show goals with updated current_value and target_value
-- - Query 4 should list all your subtasks
-- - Query 5 should show calculated progress matching the progress field
-- - Query 8 should show progress automatically updated when subtasks change
-- 
-- After completing tasks/subtasks:
-- - Query 11 should show your points breakdown (tasks + subtasks)
-- - Query 12 should list all completed tasks with 10 points each
-- - Query 13 should list all completed subtasks with 5 points each
-- - Query 14 should show your total points in your profile
-- - Query 15 should show the leaderboard with all users ranked by points
-- - Query 16 should show ✅ Points Match! if everything is working correctly
-- ============================================
