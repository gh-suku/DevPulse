/**
 * Task Assignment - Issue #19: No Task Assignment
 * 
 * Provides functionality for assigning tasks to team members and managing assignments.
 */

import { supabase } from './supabase';

export interface TaskAssignment {
  id: string;
  task_id: string;
  assigned_to: string;
  assigned_by: string;
  assigned_at: string;
  due_date?: string;
  status: 'pending' | 'accepted' | 'declined';
}

/**
 * Assign a task to a user
 */
export async function assignTask(
  taskId: string,
  assignedTo: string,
  assignedBy: string,
  dueDate?: string
): Promise<TaskAssignment | null> {
  try {
    const { data, error } = await supabase
      .from('task_assignments')
      .insert([{
        task_id: taskId,
        assigned_to: assignedTo,
        assigned_by: assignedBy,
        due_date: dueDate,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;

    // Update task with assignee
    await supabase
      .from('tasks')
      .update({ assigned_to: assignedTo })
      .eq('id', taskId);

    return data;
  } catch (error) {
    console.error('Error assigning task:', error);
    return null;
  }
}

/**
 * Get tasks assigned to a user
 */
export async function getAssignedTasks(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assigned_by_profile:profiles!tasks_assigned_by_fkey(full_name, avatar_url)
      `)
      .eq('assigned_to', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching assigned tasks:', error);
    return [];
  }
}

/**
 * Get tasks assigned by a user
 */
export async function getTasksAssignedByUser(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name, avatar_url)
      `)
      .eq('assigned_by', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching tasks assigned by user:', error);
    return [];
  }
}

/**
 * Accept a task assignment
 */
export async function acceptTaskAssignment(assignmentId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('task_assignments')
      .update({ status: 'accepted' })
      .eq('id', assignmentId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error accepting task assignment:', error);
    return false;
  }
}

/**
 * Decline a task assignment
 */
export async function declineTaskAssignment(assignmentId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('task_assignments')
      .update({ status: 'declined' })
      .eq('id', assignmentId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error declining task assignment:', error);
    return false;
  }
}

/**
 * Reassign a task to a different user
 */
export async function reassignTask(
  taskId: string,
  newAssignee: string,
  assignedBy: string
): Promise<boolean> {
  try {
    // Update task
    const { error: taskError } = await supabase
      .from('tasks')
      .update({ assigned_to: newAssignee })
      .eq('id', taskId);

    if (taskError) throw taskError;

    // Create new assignment record
    await assignTask(taskId, newAssignee, assignedBy);

    return true;
  } catch (error) {
    console.error('Error reassigning task:', error);
    return false;
  }
}

/**
 * Unassign a task
 */
export async function unassignTask(taskId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('tasks')
      .update({ assigned_to: null, assigned_by: null })
      .eq('id', taskId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error unassigning task:', error);
    return false;
  }
}

/**
 * Get team members for task assignment
 */
export async function getTeamMembers(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, department')
      .order('full_name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching team members:', error);
    return [];
  }
}
