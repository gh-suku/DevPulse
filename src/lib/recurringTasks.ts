/**
 * Recurring Tasks - Issue #24: No Recurring Tasks
 * 
 * Provides functionality for creating and managing recurring tasks.
 */

import { supabase } from './supabase';

export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface RecurringTaskConfig {
  pattern: RecurrencePattern;
  interval: number; // e.g., every 2 days, every 3 weeks
  daysOfWeek?: number[]; // 0-6 for Sunday-Saturday (for weekly)
  dayOfMonth?: number; // 1-31 (for monthly)
  endDate?: string;
  maxOccurrences?: number;
}

export interface RecurringTask {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  goal_id?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  recurrence_config: RecurringTaskConfig;
  is_active: boolean;
  created_at: string;
  last_generated_at?: string;
  occurrences_count: number;
}

/**
 * Create a recurring task
 */
export async function createRecurringTask(
  userId: string,
  taskData: Omit<RecurringTask, 'id' | 'created_at' | 'last_generated_at' | 'occurrences_count'>
): Promise<RecurringTask | null> {
  try {
    const { data, error } = await supabase
      .from('recurring_tasks')
      .insert([{
        ...taskData,
        user_id: userId,
        occurrences_count: 0,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;

    // Generate first occurrence
    await generateTaskOccurrence(data);

    return data;
  } catch (error) {
    console.error('Error creating recurring task:', error);
    return null;
  }
}

/**
 * Generate next occurrence of a recurring task
 */
export async function generateTaskOccurrence(recurringTask: RecurringTask): Promise<boolean> {
  try {
    const { recurrence_config } = recurringTask;

    // Check if we've reached max occurrences
    if (recurrence_config.maxOccurrences && 
        recurringTask.occurrences_count >= recurrence_config.maxOccurrences) {
      await deactivateRecurringTask(recurringTask.id);
      return false;
    }

    // Check if we've passed end date
    if (recurrence_config.endDate && 
        new Date() > new Date(recurrence_config.endDate)) {
      await deactivateRecurringTask(recurringTask.id);
      return false;
    }

    // Calculate next due date
    const nextDueDate = calculateNextDueDate(
      recurringTask.last_generated_at || recurringTask.created_at,
      recurrence_config
    );

    // Create task instance
    const { error } = await supabase
      .from('tasks')
      .insert([{
        user_id: recurringTask.user_id,
        title: recurringTask.title,
        description: recurringTask.description,
        goal_id: recurringTask.goal_id,
        priority: recurringTask.priority,
        status: 'pending',
        due_date: nextDueDate.toISOString(),
        recurring_task_id: recurringTask.id
      }]);

    if (error) throw error;

    // Update recurring task
    await supabase
      .from('recurring_tasks')
      .update({
        last_generated_at: new Date().toISOString(),
        occurrences_count: recurringTask.occurrences_count + 1
      })
      .eq('id', recurringTask.id);

    return true;
  } catch (error) {
    console.error('Error generating task occurrence:', error);
    return false;
  }
}

/**
 * Calculate next due date based on recurrence pattern
 */
function calculateNextDueDate(
  lastDate: string,
  config: RecurringTaskConfig
): Date {
  const date = new Date(lastDate);

  switch (config.pattern) {
    case 'daily':
      date.setDate(date.getDate() + config.interval);
      break;

    case 'weekly':
      date.setDate(date.getDate() + (7 * config.interval));
      // Adjust to specific day of week if specified
      if (config.daysOfWeek && config.daysOfWeek.length > 0) {
        const targetDay = config.daysOfWeek[0];
        const currentDay = date.getDay();
        const daysToAdd = (targetDay - currentDay + 7) % 7;
        date.setDate(date.getDate() + daysToAdd);
      }
      break;

    case 'monthly':
      date.setMonth(date.getMonth() + config.interval);
      // Adjust to specific day of month if specified
      if (config.dayOfMonth) {
        date.setDate(Math.min(config.dayOfMonth, getLastDayOfMonth(date)));
      }
      break;

    default:
      date.setDate(date.getDate() + 1);
  }

  return date;
}

/**
 * Get last day of month
 */
function getLastDayOfMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/**
 * Get all active recurring tasks for a user
 */
export async function getActiveRecurringTasks(userId: string): Promise<RecurringTask[]> {
  try {
    const { data, error } = await supabase
      .from('recurring_tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching recurring tasks:', error);
    return [];
  }
}

/**
 * Update recurring task
 */
export async function updateRecurringTask(
  taskId: string,
  updates: Partial<RecurringTask>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('recurring_tasks')
      .update(updates)
      .eq('id', taskId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating recurring task:', error);
    return false;
  }
}

/**
 * Deactivate recurring task
 */
export async function deactivateRecurringTask(taskId: string): Promise<boolean> {
  return updateRecurringTask(taskId, { is_active: false });
}

/**
 * Delete recurring task
 */
export async function deleteRecurringTask(taskId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('recurring_tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting recurring task:', error);
    return false;
  }
}

/**
 * Process all recurring tasks (to be called by a cron job)
 */
export async function processRecurringTasks(userId: string): Promise<void> {
  const recurringTasks = await getActiveRecurringTasks(userId);

  for (const task of recurringTasks) {
    // Check if it's time to generate next occurrence
    const lastGenerated = task.last_generated_at || task.created_at;
    const nextDueDate = calculateNextDueDate(lastGenerated, task.recurrence_config);

    if (nextDueDate <= new Date()) {
      await generateTaskOccurrence(task);
    }
  }
}
