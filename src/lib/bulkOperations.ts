/**
 * Bulk Operations - Issue #13: No Bulk Operations
 * 
 * Provides utilities for bulk selection and operations on tasks, goals, and other entities.
 */

import { supabase } from './supabase';

export interface BulkOperationResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  errors: string[];
}

/**
 * Bulk delete tasks
 */
export async function bulkDeleteTasks(
  taskIds: string[],
  userId: string
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = {
    success: true,
    successCount: 0,
    failureCount: 0,
    errors: []
  };

  for (const taskId of taskIds) {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', userId);

      if (error) throw error;
      result.successCount++;
    } catch (error: any) {
      result.failureCount++;
      result.errors.push(`Failed to delete task ${taskId}: ${error.message}`);
    }
  }

  result.success = result.failureCount === 0;
  return result;
}

/**
 * Bulk update task status
 */
export async function bulkUpdateTaskStatus(
  taskIds: string[],
  status: 'pending' | 'completed' | 'in_progress',
  userId: string
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = {
    success: true,
    successCount: 0,
    failureCount: 0,
    errors: []
  };

  for (const taskId of taskIds) {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status,
          completed_at: status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', taskId)
        .eq('user_id', userId);

      if (error) throw error;
      result.successCount++;
    } catch (error: any) {
      result.failureCount++;
      result.errors.push(`Failed to update task ${taskId}: ${error.message}`);
    }
  }

  result.success = result.failureCount === 0;
  return result;
}

/**
 * Bulk update task priority
 */
export async function bulkUpdateTaskPriority(
  taskIds: string[],
  priority: 'low' | 'medium' | 'high' | 'urgent',
  userId: string
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = {
    success: true,
    successCount: 0,
    failureCount: 0,
    errors: []
  };

  for (const taskId of taskIds) {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ priority })
        .eq('id', taskId)
        .eq('user_id', userId);

      if (error) throw error;
      result.successCount++;
    } catch (error: any) {
      result.failureCount++;
      result.errors.push(`Failed to update priority for task ${taskId}: ${error.message}`);
    }
  }

  result.success = result.failureCount === 0;
  return result;
}

/**
 * Bulk assign tasks to a goal
 */
export async function bulkAssignTasksToGoal(
  taskIds: string[],
  goalId: string,
  userId: string
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = {
    success: true,
    successCount: 0,
    failureCount: 0,
    errors: []
  };

  for (const taskId of taskIds) {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ goal_id: goalId })
        .eq('id', taskId)
        .eq('user_id', userId);

      if (error) throw error;
      result.successCount++;
    } catch (error: any) {
      result.failureCount++;
      result.errors.push(`Failed to assign task ${taskId}: ${error.message}`);
    }
  }

  result.success = result.failureCount === 0;
  return result;
}

/**
 * Bulk delete subtasks
 */
export async function bulkDeleteSubtasks(
  subtaskIds: string[],
  userId: string
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = {
    success: true,
    successCount: 0,
    failureCount: 0,
    errors: []
  };

  for (const subtaskId of subtaskIds) {
    try {
      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', subtaskId)
        .eq('user_id', userId);

      if (error) throw error;
      result.successCount++;
    } catch (error: any) {
      result.failureCount++;
      result.errors.push(`Failed to delete subtask ${subtaskId}: ${error.message}`);
    }
  }

  result.success = result.failureCount === 0;
  return result;
}

/**
 * Bulk toggle subtask completion
 */
export async function bulkToggleSubtasks(
  subtaskIds: string[],
  isCompleted: boolean,
  userId: string
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = {
    success: true,
    successCount: 0,
    failureCount: 0,
    errors: []
  };

  for (const subtaskId of subtaskIds) {
    try {
      const { error } = await supabase
        .from('subtasks')
        .update({ 
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null
        })
        .eq('id', subtaskId)
        .eq('user_id', userId);

      if (error) throw error;
      result.successCount++;
    } catch (error: any) {
      result.failureCount++;
      result.errors.push(`Failed to toggle subtask ${subtaskId}: ${error.message}`);
    }
  }

  result.success = result.failureCount === 0;
  return result;
}

/**
 * React hook for bulk selection management
 */
export function useBulkSelection<T extends { id: string }>() {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = (items: T[]) => {
    setSelectedIds(new Set(items.map(item => item.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const isSelected = (id: string) => selectedIds.has(id);

  const getSelectedCount = () => selectedIds.size;

  const getSelectedIds = () => Array.from(selectedIds);

  return {
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    getSelectedCount,
    getSelectedIds
  };
}

// Add React import for the hook
import React from 'react';
