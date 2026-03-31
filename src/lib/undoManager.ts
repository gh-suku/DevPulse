/**
 * Undo Manager - Issue #7: No Undo Functionality
 * 
 * Provides undo/redo functionality for delete operations with soft deletes
 * and toast notifications for recovery.
 */

import { supabase } from './supabase';

export interface UndoAction {
  id: string;
  type: 'task' | 'goal' | 'subtask' | 'log' | 'post';
  data: any;
  timestamp: number;
}

class UndoManager {
  private undoStack: UndoAction[] = [];
  private readonly MAX_UNDO_STACK = 10;
  private readonly UNDO_TIMEOUT = 30000; // 30 seconds

  /**
   * Add an action to the undo stack
   */
  addAction(action: Omit<UndoAction, 'timestamp'>): void {
    const undoAction: UndoAction = {
      ...action,
      timestamp: Date.now()
    };

    this.undoStack.push(undoAction);

    // Keep stack size limited
    if (this.undoStack.length > this.MAX_UNDO_STACK) {
      this.undoStack.shift();
    }

    // Clean up old actions
    this.cleanupExpiredActions();
  }

  /**
   * Undo the last action
   */
  async undo(userId: string): Promise<{ success: boolean; message: string; data?: any }> {
    const action = this.undoStack.pop();
    
    if (!action) {
      return { success: false, message: 'Nothing to undo' };
    }

    // Check if action has expired
    if (Date.now() - action.timestamp > this.UNDO_TIMEOUT) {
      return { success: false, message: 'Undo timeout expired' };
    }

    try {
      // Restore the deleted item
      const { data, error } = await supabase
        .from(this.getTableName(action.type))
        .insert([{ ...action.data, user_id: userId }])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        message: `${this.getTypeName(action.type)} restored successfully`,
        data
      };
    } catch (error: any) {
      console.error('Undo error:', error);
      return {
        success: false,
        message: `Failed to undo: ${error.message}`
      };
    }
  }

  /**
   * Check if there are actions to undo
   */
  canUndo(): boolean {
    this.cleanupExpiredActions();
    return this.undoStack.length > 0;
  }

  /**
   * Get the last action without removing it
   */
  peekLastAction(): UndoAction | null {
    this.cleanupExpiredActions();
    return this.undoStack.length > 0 ? this.undoStack[this.undoStack.length - 1] : null;
  }

  /**
   * Clear all undo actions
   */
  clear(): void {
    this.undoStack = [];
  }

  /**
   * Remove expired actions from the stack
   */
  private cleanupExpiredActions(): void {
    const now = Date.now();
    this.undoStack = this.undoStack.filter(
      action => now - action.timestamp <= this.UNDO_TIMEOUT
    );
  }

  /**
   * Get table name for action type
   */
  private getTableName(type: UndoAction['type']): string {
    const tableMap: Record<UndoAction['type'], string> = {
      task: 'tasks',
      goal: 'goals',
      subtask: 'subtasks',
      log: 'daily_logs',
      post: 'community_posts'
    };
    return tableMap[type];
  }

  /**
   * Get human-readable type name
   */
  private getTypeName(type: UndoAction['type']): string {
    const nameMap: Record<UndoAction['type'], string> = {
      task: 'Task',
      goal: 'Goal',
      subtask: 'Subtask',
      log: 'Log entry',
      post: 'Post'
    };
    return nameMap[type];
  }
}

// Export singleton instance
export const undoManager = new UndoManager();

/**
 * Hook for using undo functionality in React components
 */
export function useUndo() {
  return {
    addUndoAction: (action: Omit<UndoAction, 'timestamp'>) => undoManager.addAction(action),
    undo: (userId: string) => undoManager.undo(userId),
    canUndo: () => undoManager.canUndo(),
    peekLastAction: () => undoManager.peekLastAction(),
    clearUndo: () => undoManager.clear()
  };
}
