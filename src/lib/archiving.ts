// Issue #45: Data Archiving System
// Provides utilities for archiving old completed tasks and logs

import { supabase } from './supabase';

/**
 * Archive completed tasks older than specified days
 */
export async function archiveOldTasks(
  userId: string,
  daysOld: number = 90
): Promise<{ archived: number; error: Error | null }> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // Get tasks to archive
    const { data: tasksToArchive, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .lt('completed_at', cutoffDate.toISOString());

    if (fetchError) throw fetchError;
    if (!tasksToArchive || tasksToArchive.length === 0) {
      return { archived: 0, error: null };
    }

    // Soft delete by updating status to 'archived'
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ status: 'archived' })
      .eq('user_id', userId)
      .eq('status', 'completed')
      .lt('completed_at', cutoffDate.toISOString());

    if (updateError) throw updateError;

    return { archived: tasksToArchive.length, error: null };
  } catch (error) {
    return { archived: 0, error: error as Error };
  }
}

/**
 * Archive old daily logs
 */
export async function archiveOldLogs(
  userId: string,
  daysOld: number = 180
): Promise<{ archived: number; error: Error | null }> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await supabase
      .from('daily_logs')
      .delete()
      .eq('user_id', userId)
      .lt('created_at', cutoffDate.toISOString())
      .select();

    if (error) throw error;

    return { archived: data?.length || 0, error: null };
  } catch (error) {
    return { archived: 0, error: error as Error };
  }
}

/**
 * Get archiving statistics
 */
export async function getArchivingStats(userId: string): Promise<{
  tasksEligible: number;
  logsEligible: number;
  error: Error | null;
}> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const [tasksResult, logsResult] = await Promise.all([
      supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed')
        .lt('completed_at', cutoffDate.toISOString()),
      supabase
        .from('daily_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .lt('created_at', cutoffDate.toISOString()),
    ]);

    return {
      tasksEligible: tasksResult.count || 0,
      logsEligible: logsResult.count || 0,
      error: null,
    };
  } catch (error) {
    return { tasksEligible: 0, logsEligible: 0, error: error as Error };
  }
}
