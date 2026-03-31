/**
 * Points System Integration - Issue #58
 * Makes points more visible and integrated throughout the UI
 */

import { supabase } from './supabase';

export const POINTS_CONFIG = {
  TASK_COMPLETED: 10,
  GOAL_COMPLETED: 50,
  DAILY_LOG: 5,
  SUBTASK_COMPLETED: 3,
  COMMUNITY_POST: 15,
  COMMENT: 2,
  LIKE_RECEIVED: 1,
  STREAK_BONUS: 20
};

export interface PointsTransaction {
  id: string;
  user_id: string;
  points: number;
  reason: string;
  entity_type?: string;
  entity_id?: string;
  created_at: string;
}

export async function awardPoints(
  userId: string,
  points: number,
  reason: string,
  entityType?: string,
  entityId?: string
): Promise<boolean> {
  try {
    // Add points transaction
    const { error: transError } = await supabase
      .from('points_transactions')
      .insert([{
        user_id: userId,
        points,
        reason,
        entity_type: entityType,
        entity_id: entityId
      }]);

    if (transError) throw transError;

    // Update user's total points
    const { error: updateError } = await supabase.rpc('increment_user_points', {
      user_id: userId,
      points_to_add: points
    });

    if (updateError) throw updateError;

    return true;
  } catch (error) {
    console.error('Error awarding points:', error);
    return false;
  }
}

export async function getUserPoints(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data?.points || 0;
  } catch (error) {
    console.error('Error fetching user points:', error);
    return 0;
  }
}

export async function getPointsHistory(
  userId: string,
  limit: number = 50
): Promise<PointsTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('points_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching points history:', error);
    return [];
  }
}
