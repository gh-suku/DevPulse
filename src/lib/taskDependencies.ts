/**
 * Task Dependencies - Issue #25: No Task Dependencies
 * 
 * Provides functionality for creating and managing task dependencies.
 */

import { supabase } from './supabase';

export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  dependency_type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish';
  created_at: string;
}

export interface TaskWithDependencies {
  id: string;
  title: string;
  status: string;
  dependencies: TaskDependency[];
  dependents: TaskDependency[];
  blockedBy: string[];
  blocking: string[];
}

/**
 * Add a dependency between two tasks
 */
export async function addTaskDependency(
  taskId: string,
  dependsOnTaskId: string,
  dependencyType: TaskDependency['dependency_type'] = 'finish_to_start'
): Promise<TaskDependency | null> {
  try {
    // Check for circular dependencies
    const hasCircular = await checkCircularDependency(taskId, dependsOnTaskId);
    if (hasCircular) {
      throw new Error('Circular dependency detected');
    }

    const { data, error } = await supabase
      .from('task_dependencies')
      .insert([{
        task_id: taskId,
        depends_on_task_id: dependsOnTaskId,
        dependency_type: dependencyType
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding task dependency:', error);
    return null;
  }
}

/**
 * Remove a task dependency
 */
export async function removeTaskDependency(dependencyId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('task_dependencies')
      .delete()
      .eq('id', dependencyId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing task dependency:', error);
    return false;
  }
}

/**
 * Get all dependencies for a task
 */
export async function getTaskDependencies(taskId: string): Promise<TaskDependency[]> {
  try {
    const { data, error } = await supabase
      .from('task_dependencies')
      .select('*')
      .eq('task_id', taskId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching task dependencies:', error);
    return [];
  }
}

/**
 * Get all tasks that depend on this task
 */
export async function getTaskDependents(taskId: string): Promise<TaskDependency[]> {
  try {
    const { data, error } = await supabase
      .from('task_dependencies')
      .select('*')
      .eq('depends_on_task_id', taskId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching task dependents:', error);
    return [];
  }
}

/**
 * Check if a task can be started based on dependencies
 */
export async function canStartTask(taskId: string): Promise<{
  canStart: boolean;
  blockedBy: string[];
}> {
  try {
    const dependencies = await getTaskDependencies(taskId);
    
    if (dependencies.length === 0) {
      return { canStart: true, blockedBy: [] };
    }

    const blockedBy: string[] = [];

    for (const dep of dependencies) {
      const { data: dependentTask, error } = await supabase
        .from('tasks')
        .select('id, title, status')
        .eq('id', dep.depends_on_task_id)
        .single();

      if (error) continue;

      // Check dependency type
      if (dep.dependency_type === 'finish_to_start' && 
          dependentTask.status !== 'completed') {
        blockedBy.push(dependentTask.title);
      }
    }

    return {
      canStart: blockedBy.length === 0,
      blockedBy
    };
  } catch (error) {
    console.error('Error checking if task can start:', error);
    return { canStart: true, blockedBy: [] };
  }
}

/**
 * Check for circular dependencies
 */
async function checkCircularDependency(
  taskId: string,
  dependsOnTaskId: string
): Promise<boolean> {
  try {
    // Get all dependencies of the task we want to depend on
    const visited = new Set<string>();
    const queue = [dependsOnTaskId];

    while (queue.length > 0) {
      const currentTaskId = queue.shift()!;
      
      if (currentTaskId === taskId) {
        return true; // Circular dependency found
      }

      if (visited.has(currentTaskId)) {
        continue;
      }

      visited.add(currentTaskId);

      // Get dependencies of current task
      const { data, error } = await supabase
        .from('task_dependencies')
        .select('depends_on_task_id')
        .eq('task_id', currentTaskId);

      if (error) throw error;

      data?.forEach(dep => {
        if (!visited.has(dep.depends_on_task_id)) {
          queue.push(dep.depends_on_task_id);
        }
      });
    }

    return false;
  } catch (error) {
    console.error('Error checking circular dependency:', error);
    return false;
  }
}

/**
 * Get task with all its dependencies and dependents
 */
export async function getTaskWithDependencies(
  taskId: string
): Promise<TaskWithDependencies | null> {
  try {
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, title, status')
      .eq('id', taskId)
      .single();

    if (taskError) throw taskError;

    const dependencies = await getTaskDependencies(taskId);
    const dependents = await getTaskDependents(taskId);

    // Get blocked by tasks
    const blockedByPromises = dependencies.map(async (dep) => {
      const { data } = await supabase
        .from('tasks')
        .select('title, status')
        .eq('id', dep.depends_on_task_id)
        .single();
      
      return data?.status !== 'completed' ? data?.title : null;
    });

    const blockedByResults = await Promise.all(blockedByPromises);
    const blockedBy = blockedByResults.filter(Boolean) as string[];

    // Get blocking tasks
    const blockingPromises = dependents.map(async (dep) => {
      const { data } = await supabase
        .from('tasks')
        .select('title')
        .eq('id', dep.task_id)
        .single();
      
      return data?.title;
    });

    const blockingResults = await Promise.all(blockingPromises);
    const blocking = blockingResults.filter(Boolean) as string[];

    return {
      ...task,
      dependencies,
      dependents,
      blockedBy,
      blocking
    };
  } catch (error) {
    console.error('Error fetching task with dependencies:', error);
    return null;
  }
}

/**
 * Get dependency graph for visualization
 */
export async function getDependencyGraph(userId: string): Promise<{
  nodes: { id: string; title: string; status: string }[];
  edges: { from: string; to: string; type: string }[];
}> {
  try {
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, status')
      .eq('user_id', userId);

    if (tasksError) throw tasksError;

    const { data: dependencies, error: depsError } = await supabase
      .from('task_dependencies')
      .select('*')
      .in('task_id', tasks?.map(t => t.id) || []);

    if (depsError) throw depsError;

    return {
      nodes: tasks || [],
      edges: (dependencies || []).map(dep => ({
        from: dep.depends_on_task_id,
        to: dep.task_id,
        type: dep.dependency_type
      }))
    };
  } catch (error) {
    console.error('Error fetching dependency graph:', error);
    return { nodes: [], edges: [] };
  }
}
