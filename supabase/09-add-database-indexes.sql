-- supabase/09-add-database-indexes.sql
-- Issue #76: Add database indexes for better query performance

-- ============================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_points ON profiles(points DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department);

-- Tasks table indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_goal_id ON tasks(goal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_goal ON tasks(user_id, goal_id);

-- Goals table indexes
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_goal_code ON goals(goal_code);
CREATE INDEX IF NOT EXISTS idx_goals_created_at ON goals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_goals_user_code ON goals(user_id, goal_code);

-- Subtasks table indexes
CREATE INDEX IF NOT EXISTS idx_subtasks_user_id ON subtasks(user_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_goal_id ON subtasks(goal_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_is_completed ON subtasks(is_completed);
CREATE INDEX IF NOT EXISTS idx_subtasks_created_at ON subtasks(created_at);
CREATE INDEX IF NOT EXISTS idx_subtasks_user_goal ON subtasks(user_id, goal_id);

-- Daily logs table indexes
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_id ON daily_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_goal_id ON daily_logs(goal_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_status ON daily_logs(status);
CREATE INDEX IF NOT EXISTS idx_daily_logs_created_at ON daily_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, created_at DESC);

-- Attributes table indexes
CREATE INDEX IF NOT EXISTS idx_attributes_user_id ON attributes(user_id);
CREATE INDEX IF NOT EXISTS idx_attributes_category ON attributes(category);
CREATE INDEX IF NOT EXISTS idx_attributes_rating ON attributes(rating);
CREATE INDEX IF NOT EXISTS idx_attributes_created_at ON attributes(created_at DESC);

-- Weekly summaries table indexes
CREATE INDEX IF NOT EXISTS idx_weekly_summaries_user_id ON weekly_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_summaries_week_start ON weekly_summaries(week_start DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_summaries_user_week ON weekly_summaries(user_id, week_start DESC);

-- Community posts table indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_likes_count ON community_posts(likes_count DESC);

-- Post likes table indexes
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_user ON post_likes(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_created_at ON post_likes(created_at DESC);

-- Post comments table indexes
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON post_comments(created_at);

-- ============================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ============================================

-- For leaderboard queries (user ranking by points)
CREATE INDEX IF NOT EXISTS idx_profiles_points_username ON profiles(points DESC, username);

-- For task filtering and sorting
CREATE INDEX IF NOT EXISTS idx_tasks_user_status_priority ON tasks(user_id, status, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_user_due_date ON tasks(user_id, due_date) WHERE due_date IS NOT NULL;

-- For goal progress tracking
CREATE INDEX IF NOT EXISTS idx_goals_user_progress ON goals(user_id, progress);

-- For community feed
CREATE INDEX IF NOT EXISTS idx_community_posts_created_likes ON community_posts(created_at DESC, likes_count DESC);

-- ============================================
-- PARTIAL INDEXES FOR SPECIFIC QUERIES
-- ============================================

-- Index only incomplete tasks
CREATE INDEX IF NOT EXISTS idx_tasks_incomplete ON tasks(user_id, created_at DESC) 
WHERE status != 'completed';

-- Index only completed subtasks
CREATE INDEX IF NOT EXISTS idx_subtasks_completed ON subtasks(goal_id, completed_at DESC) 
WHERE is_completed = true;

-- ============================================
-- TEXT SEARCH INDEXES (if using full-text search)
-- ============================================

-- Full-text search on tasks
CREATE INDEX IF NOT EXISTS idx_tasks_title_search ON tasks USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_tasks_description_search ON tasks USING gin(to_tsvector('english', description));

-- Full-text search on community posts
CREATE INDEX IF NOT EXISTS idx_posts_content_search ON community_posts USING gin(to_tsvector('english', content));

-- Full-text search on profiles
CREATE INDEX IF NOT EXISTS idx_profiles_name_search ON profiles USING gin(to_tsvector('english', full_name));

-- ============================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ============================================

ANALYZE profiles;
ANALYZE tasks;
ANALYZE goals;
ANALYZE subtasks;
ANALYZE daily_logs;
ANALYZE attributes;
ANALYZE weekly_summaries;
ANALYZE community_posts;
ANALYZE post_likes;
ANALYZE post_comments;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check all indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check index usage statistics
SELECT 
    schemaname,
    relname as tablename,
    indexrelname as indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
