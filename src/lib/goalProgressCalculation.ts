// Issue #44: Consolidated Goal Progress Calculation
// Single source of truth for goal progress calculations

import { supabase } from './supabase';

/**
 * Calculate goal progress based on subtasks
 * This is the single source of truth for progress calculation
 */
export async function calculateGoalProgress(
  goalId: string,
  userId: string
): Promise<{ progress: number; currentValue: number; error: Error | null }> {
  try {
    // Fetch all subtasks for this goal
    const { data: subtasks, error } = await supabase
      .from('subtasks')
      .select('is_completed')
      .eq('goal_id', goalId)
      .eq('user_id', userId);

    if (error) throw error;

    if (!subtasks || subtasks.length === 0) {
      return { progress: 0, currentValue: 0, error: null };
    }

    const completedCount = subtasks.filter(s => s.is_completed).length;
    const totalCount = subtasks.length;
    const progress = Math.round((completedCount / totalCount) * 100);

    return { progress, currentValue: completedCount, error: null };
  } catch (error) {
    return { progress: 0, currentValue: 0, error: error as Error };
  }
}

/**
 * Update goal progress in database
 */
export async function updateGoalProgress(
  goalId: string,
  userId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { progress, currentValue, error } = await calculateGoalProgress(goalId, userId);
    
    if (error) throw error;

    const { error: updateError } = await supabase
      .from('goals')
      .update({ 
        progress, 
        current_value: currentValue,
        updated_at: new Date().toISOString()
      })
      .eq('id', goalId)
      .eq('user_id', userId);

    if (updateError) throw updateError;

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

/**
 * Batch update progress for multiple goals
 */
export async function batchUpdateGoalProgress(
  goalIds: string[],
  userId: string
): Promise<{ updated: number; errors: Error[] }> {
  const errors: Error[] = [];
  let updated = 0;

  await Promise.all(
    goalIds.map(async goalId => {
      const { success, error } = await updateGoalProgress(goalId, userId);
      if (success) {
        updated++;
      } else if (error) {
        errors.push(error);
      }
    })
  );

  return { updated, errors };
}
