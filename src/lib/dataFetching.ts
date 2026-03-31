// Issue #37: Efficient Data Fetching with Joins
// Optimized queries using Supabase joins to reduce round trips

import { supabase } from './supabase';

/**
 * Fetch tasks with related goal information in a single query
 */
export async function fetchTasksWithGoals(userId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      goals:goal_id (
        id,
        goal_code,
        title,
        color
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(200);

  return { data, error };
}

/**
 * Fetch goals with subtasks count in a single query
 */
export async function fetchGoalsWithSubtasks(userId: string) {
  const { data, error } = await supabase
    .from('goals')
    .select(`
      *,
      subtasks:subtasks(count)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return { data, error };
}

/**
 * Fetch community posts with user profiles and engagement
 */
export async function fetchPostsWithProfiles(limit: number = 50) {
  const { data, error } = await supabase
    .from('community_posts')
    .select(`
      *,
      profiles:user_id (
        id,
        full_name,
        avatar_url,
        username
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data, error };
}

/**
 * Fetch comments with user profiles
 */
export async function fetchCommentsWithProfiles(postId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      profiles:user_id (
        id,
        full_name,
        avatar_url,
        username
      )
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  return { data, error };
}

/**
 * Fetch daily logs with goal information
 */
export async function fetchLogsWithGoals(userId: string, limit: number = 100) {
  const { data, error } = await supabase
    .from('daily_logs')
    .select(`
      *,
      goals:goal_id (
        goal_code,
        title,
        color
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data, error };
}
