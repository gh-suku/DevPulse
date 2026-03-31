import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Plus,
  CheckCircle2,
  Target,
  RefreshCw,
  AlertTriangle,
  Trash2,
  Edit2,
  Save
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { cn } from '../lib/utils';
import { Card } from './shared/Card';
import { ConfirmDialog } from './shared/ConfirmDialog';
import { Toast, useToast } from './shared/Toast';
import { EmptyState } from './shared/EmptyState';
import { errorHandler, handleAsync } from '../lib/errorHandler';

interface DailyTrackerScreenProps {
  isAIAnalyzing: boolean;
  setIsAIAnalyzing: (v: boolean) => void;
  tasks: any[];
  setTasks: (t: any[]) => void;
}

export default function DailyTrackerScreen({ isAIAnalyzing, setIsAIAnalyzing, tasks, setTasks }: DailyTrackerScreenProps) {
  const { user } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  
  // Daily Log State
  const [draftEntries, setDraftEntries] = useState<any[]>([]);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [selectedGoalForLog, setSelectedGoalForLog] = useState('G1');
  
  // Goals State
  const [goals, setGoals] = useState<any[]>([]);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalCode, setNewGoalCode] = useState('');
  const [newGoalColor, setNewGoalColor] = useState('#10b981');
  const [editingGoalData, setEditingGoalData] = useState<any>(null);
  
  // Subtasks State
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [addingSubtaskForGoal, setAddingSubtaskForGoal] = useState<string | null>(null);
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  
  // Tasks State
  const [dbTasks, setDbTasks] = useState<any[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState('G1');
  const [selectedPriority, setSelectedPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [selectedDueDate, setSelectedDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskText, setEditingTaskText] = useState('');
  
  // Editing State
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchGoals();
      fetchTasks();
      fetchDailyLogs();
      fetchSubtasks();
    }
  }, [user]);

  useEffect(() => {
    if (isAIAnalyzing) {
      const timer = setTimeout(() => setIsAIAnalyzing(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isAIAnalyzing]);

  // Fetch Goals
  const fetchGoals = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  // Fetch Subtasks
  const fetchSubtasks = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSubtasks(data || []);
    } catch (error) {
      console.error('Error fetching subtasks:', error);
    }
  };

  // Add Subtask
  const addSubtask = async (goalId: string) => {
    if (!newSubtaskText.trim() || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('subtasks')
        .insert([{
          user_id: user.id,
          goal_id: goalId,
          title: newSubtaskText,
          is_completed: false
        }])
        .select();

      if (error) throw error;
      
      await fetchSubtasks();
      await fetchGoals();
      setNewSubtaskText('');
      setAddingSubtaskForGoal(null);
      showToast('Subtask added successfully', 'success');
    } catch (error: any) {
      errorHandler.log(error, 'medium', { action: 'addSubtask' });
      showToast('Failed to add subtask', 'error');
    }
  };

  // Toggle Subtask
  const toggleSubtask = async (subtaskId: string, isCompleted: boolean) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('subtasks')
        .update({ 
          is_completed: !isCompleted,
          completed_at: !isCompleted ? new Date().toISOString() : null
        })
        .eq('id', subtaskId)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchSubtasks();
      await fetchGoals(); // Refresh to get updated progress
    } catch (error) {
      console.error('Error updating subtask:', error);
    }
  };

  // Delete Subtask
  const deleteSubtask = async (subtaskId: string) => {
    if (!user) return;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Subtask',
      message: 'Are you sure you want to delete this subtask? This action cannot be undone.',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('subtasks')
            .delete()
            .eq('id', subtaskId)
            .eq('user_id', user.id);

          if (error) throw error;
          await fetchSubtasks();
          await fetchGoals();
          showToast('Subtask deleted successfully', 'success');
        } catch (error) {
          errorHandler.log(error, 'medium', { action: 'deleteSubtask' });
          showToast('Failed to delete subtask', 'error');
        }
      }
    });
  };

  // Update Subtask
  const updateSubtask = async (id: string, updates: any) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('subtasks')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchSubtasks();
      await fetchGoals();
      setEditingSubtaskId(null);
      showToast('Subtask updated successfully', 'success');
    } catch (error) {
      errorHandler.log(error, 'medium', { action: 'updateSubtask' });
      showToast('Failed to update subtask', 'error');
    }
  };

  // Fetch Tasks
  const fetchTasks = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200); // Issue #34: Add pagination limit

      if (error) throw error;
      setDbTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  // Fetch Daily Logs
  const fetchDailyLogs = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100); // Issue #34: Add pagination limit

      if (error) throw error;
      setDraftEntries(data || []);
    } catch (error) {
      console.error('Error fetching daily logs:', error);
    }
  };

  // Add Manual Log Entry
  const handleAddManualEntry = async () => {
    if (!manualTitle.trim() || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('daily_logs')
        .insert([{
          user_id: user.id,
          title: manualTitle,
          description: manualDesc,
          goal_id: selectedGoalForLog,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          status: 'pending'
        }])
        .select();

      if (error) throw error;
      
      await fetchDailyLogs();
      setManualTitle('');
      setManualDesc('');
      setIsManualEntryOpen(false);
      showToast('Log entry added successfully', 'success');
    } catch (error: any) {
      errorHandler.log(error, 'medium', { action: 'addManualEntry' });
      showToast('Failed to add log entry', 'error');
    }
  };

  // Update Log Entry
  const updateLogEntry = async (id: string, updates: any) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('daily_logs')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchDailyLogs();
      setEditingLogId(null);
    } catch (error) {
      console.error('Error updating log:', error);
    }
  };

  // Delete Log Entry
  const deleteLogEntry = async (id: string) => {
    if (!user) return;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Log Entry',
      message: 'Are you sure you want to delete this log entry? This action cannot be undone.',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('daily_logs')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) throw error;
          await fetchDailyLogs();
          showToast('Log entry deleted successfully', 'success');
        } catch (error) {
          errorHandler.log(error, 'medium', { action: 'deleteLogEntry' });
          showToast('Failed to delete log entry', 'error');
        }
      }
    });
  };

  // Add Goal
  const handleAddGoal = async () => {
    if (!newGoalTitle.trim() || !newGoalCode.trim() || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('goals')
        .insert([{
          user_id: user.id,
          goal_code: newGoalCode,
          title: newGoalTitle,
          color: newGoalColor,
          progress: 0
        }])
        .select();

      if (error) throw error;
      
      await fetchGoals();
      setNewGoalTitle('');
      setNewGoalCode('');
      setNewGoalColor('#10b981');
      setIsAddingGoal(false);
      showToast('Goal added successfully', 'success');
    } catch (error: any) {
      errorHandler.log(error, 'medium', { action: 'addGoal' });
      showToast('Failed to add goal', 'error');
    }
  };

  // Update Goal
  const updateGoal = async (id: string, updates: any) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchGoals();
      setEditingGoalId(null);
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  // Delete Goal
  const deleteGoal = async (id: string) => {
    if (!user) return;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Goal',
      message: 'Are you sure you want to delete this goal? All associated tasks and subtasks will remain but will need to be reassigned.',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('goals')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) throw error;
          await fetchGoals();
          showToast('Goal deleted successfully', 'success');
        } catch (error) {
          errorHandler.log(error, 'medium', { action: 'deleteGoal' });
          showToast('Failed to delete goal', 'error');
        }
      }
    });
  };

  // Add Task - Issue #17 & #18: Add priority and due date support
  const addTask = async () => {
    if (!newTaskText.trim() || !user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          user_id: user.id,
          title: newTaskText,
          description: '',
          goal_id: selectedGoalId,
          status: 'pending',
          priority: selectedPriority,
          due_date: selectedDueDate || null
        }])
        .select();

      if (error) throw error;
      
      await fetchTasks();
      setNewTaskText('');
      setSelectedPriority('medium');
      setSelectedDueDate('');
      showToast('Task added successfully', 'success');
    } catch (error: any) {
      errorHandler.log(error, 'medium', { action: 'addTask' });
      showToast('Failed to add task', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Toggle Task
  const toggleTask = async (id: string) => {
    const task = dbTasks.find(t => t.id === id);
    if (!task || !user) return;
    
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchTasks();
      showToast(
        newStatus === 'completed' ? 'Task completed!' : 'Task marked as pending',
        'success'
      );
    } catch (error) {
      errorHandler.log(error, 'medium', { action: 'toggleTask' });
      showToast('Failed to update task', 'error');
    }
  };

  // Delete Task
  const deleteTask = async (id: string) => {
    if (!user) return;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task? This action cannot be undone.',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) throw error;
          await fetchTasks();
          showToast('Task deleted successfully', 'success');
        } catch (error) {
          errorHandler.log(error, 'medium', { action: 'deleteTask' });
          showToast('Failed to delete task', 'error');
        }
      }
    });
  };

  // Update Task
  const updateTask = async (id: string, updates: any) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchTasks();
      setEditingTaskId(null);
      showToast('Task updated successfully', 'success');
    } catch (error) {
      errorHandler.log(error, 'medium', { action: 'updateTask' });
      showToast('Failed to update task', 'error');
    }
  };

  // Calculate goal breakdown from actual tasks
  const goalBreakdown = React.useMemo(() => {
    const breakdown = dbTasks.reduce((acc, task) => {
      const goal = goals.find(g => g.goal_code === task.goal_id);
      if (goal) {
        const existing = acc.find(item => item.name === goal.title);
        if (existing) {
          existing.value += 1;
        } else {
          acc.push({ name: goal.title, value: 1, color: goal.color });
        }
      }
      return acc;
    }, [] as { name: string; value: number; color: string }[]);
    return breakdown.length > 0 ? breakdown : [{ name: 'No Data', value: 1, color: '#e5e7eb' }];
  }, [dbTasks, goals]);

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
      
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant="danger"
      />
      
      <div className="space-y-6 md:space-y-8 min-w-0">
      {/* Goals Section */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h2 className="text-xl font-bold text-gray-900">My Goals</h2>
          <button
            onClick={() => setIsAddingGoal(!isAddingGoal)}
            className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            Add Goal
          </button>
        </div>

        {isAddingGoal && (
          <Card className="mb-4 border-2 border-emerald-200">
            <div className="space-y-4">
              <h4 className="font-bold text-gray-900">New Goal</h4>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Goal Code (e.g., G1)"
                  value={newGoalCode}
                  onChange={(e) => setNewGoalCode(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Goal Title"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Color:</label>
                <input
                  type="color"
                  value={newGoalColor}
                  onChange={(e) => setNewGoalColor(e.target.value)}
                  className="w-12 h-10 rounded cursor-pointer"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddGoal}
                  className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-600 transition-colors"
                >
                  Save Goal
                </button>
                <button
                  onClick={() => setIsAddingGoal(false)}
                  className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 min-w-0">
          {goals.map(goal => (
            <Card key={goal.id} className="flex flex-col gap-4 relative group isolation-isolate min-w-0 overflow-hidden">
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                <button
                  onClick={() => setEditingGoalId(editingGoalId === goal.id ? null : goal.id)}
                  className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 flex-shrink-0"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="p-1 bg-rose-100 text-rose-600 rounded hover:bg-rose-200 flex-shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{goal.goal_code}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${goal.color}20`, color: goal.color }}>
                  <Target className="w-4 h-4" />
                </div>
              </div>
              
              {editingGoalId === goal.id ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600">Goal Code</label>
                    <input
                      type="text"
                      defaultValue={goal.goal_code}
                      onBlur={(e) => updateGoal(goal.id, { goal_code: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600">Goal Title</label>
                    <input
                      type="text"
                      defaultValue={goal.title}
                      onBlur={(e) => updateGoal(goal.id, { title: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600">Color</label>
                    <input
                      type="color"
                      defaultValue={goal.color}
                      onBlur={(e) => updateGoal(goal.id, { color: e.target.value })}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-600">Target Value</label>
                      <input
                        type="number"
                        defaultValue={goal.target_value || 0}
                        onBlur={(e) => updateGoal(goal.id, { target_value: parseInt(e.target.value) || 0 })}
                        className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-600">Unit</label>
                      <input
                        type="text"
                        defaultValue={goal.unit || 'subtasks'}
                        onBlur={(e) => updateGoal(goal.id, { unit: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingGoalId(null)}
                    className="w-full bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              ) : (
                <div>
                  <h4 className="font-bold text-gray-900">{goal.title}</h4>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-gray-400">Progress</span>
                      <span style={{ color: goal.color }}>
                        {goal.current_value || 0}/{goal.target_value || 0} {goal.unit || 'subtasks'}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full transition-all duration-500" style={{ width: `${goal.progress}%`, backgroundColor: goal.color }}></div>
                    </div>
                    <div className="text-xs text-gray-500 text-right">{goal.progress}%</div>
                  </div>
                  
                  {/* Subtasks Section */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setExpandedGoalId(expandedGoalId === goal.id ? null : goal.id)}
                      className="text-xs font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1"
                    >
                      {expandedGoalId === goal.id ? '▼' : '▶'} Subtasks ({subtasks.filter(s => s.goal_id === goal.id).length})
                    </button>
                    
                    {expandedGoalId === goal.id && (
                      <div className="mt-3 space-y-2 min-w-0">
                        {subtasks.filter(s => s.goal_id === goal.id).map(subtask => (
                          <div key={subtask.id} className="flex items-center gap-2 group min-w-0">
                            <button
                              onClick={() => toggleSubtask(subtask.id, subtask.is_completed)}
                              className={cn(
                                "w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0",
                                subtask.is_completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-300 bg-white"
                              )}
                            >
                              {subtask.is_completed && <CheckCircle2 className="w-3 h-3" />}
                            </button>
                            
                            {editingSubtaskId === subtask.id ? (
                              <input
                                type="text"
                                defaultValue={subtask.title}
                                autoFocus
                                onBlur={(e) => {
                                  if (e.target.value.trim() && e.target.value !== subtask.title) {
                                    updateSubtask(subtask.id, { title: e.target.value });
                                  } else {
                                    setEditingSubtaskId(null);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.currentTarget.blur();
                                  } else if (e.key === 'Escape') {
                                    setEditingSubtaskId(null);
                                  }
                                }}
                                className="flex-1 min-w-0 text-xs bg-white border border-emerald-300 rounded px-2 py-1 focus:ring-1 focus:ring-emerald-500 outline-none"
                              />
                            ) : (
                              <span className={cn("flex-1 min-w-0 text-xs break-words", subtask.is_completed ? "text-gray-400 line-through" : "text-gray-700")}>
                                {subtask.title}
                              </span>
                            )}
                            
                            <div className="opacity-0 group-hover:opacity-100 flex gap-1 flex-shrink-0">
                              <button
                                onClick={() => setEditingSubtaskId(subtask.id)}
                                className="p-0.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                              >
                                <Edit2 className="w-2.5 h-2.5" />
                              </button>
                              <button
                                onClick={() => deleteSubtask(subtask.id)}
                                className="p-0.5 bg-rose-100 text-rose-600 rounded hover:bg-rose-200"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                        
                        {addingSubtaskForGoal === goal.id ? (
                          <div className="flex flex-wrap gap-1 mt-2 min-w-0">
                            <input
                              type="text"
                              value={newSubtaskText}
                              onChange={(e) => setNewSubtaskText(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && addSubtask(goal.id)}
                              placeholder="Subtask name..."
                              className="flex-1 min-w-[100px] bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => addSubtask(goal.id)}
                              className="bg-emerald-500 text-white px-2 py-1 rounded text-xs hover:bg-emerald-600 whitespace-nowrap flex-shrink-0"
                            >
                              Add
                            </button>
                            <button
                              onClick={() => {
                                setAddingSubtaskForGoal(null);
                                setNewSubtaskText('');
                              }}
                              className="bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs hover:bg-gray-300 flex-shrink-0"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAddingSubtaskForGoal(goal.id)}
                            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 mt-2"
                          >
                            <Plus className="w-3 h-3" />
                            Add Subtask
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Daily Log & Tasks Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 min-w-0">
        {/* Daily Log */}
        <div className="lg:col-span-2 space-y-4 min-w-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">Daily Log</h2>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-4">
            <div className="p-2 bg-emerald-500 text-white rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-emerald-900">AI Draft Ready</h4>
              <p className="text-sm text-emerald-700">Review and edit your daily logs below. All changes are saved automatically.</p>
            </div>
          </div>

          <Card className="border-dashed border-2 border-emerald-200 bg-emerald-50/30">
            {!isManualEntryOpen ? (
              <button
                onClick={() => setIsManualEntryOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-2 text-emerald-600 font-bold hover:text-emerald-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Manual Entry
              </button>
            ) : (
              <div className="space-y-4">
                <h4 className="font-bold text-gray-900">New Log Entry</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Title (e.g., Fixed UI bugs)"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <textarea
                    placeholder="Description (optional details)"
                    value={manualDesc}
                    onChange={(e) => setManualDesc(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                    rows={2}
                  />
                  <select
                    value={selectedGoalForLog}
                    onChange={(e) => setSelectedGoalForLog(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {goals.map(g => (
                      <option key={g.id} value={g.goal_code}>{g.goal_code}: {g.title}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddManualEntry}
                    className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-600 transition-colors"
                  >
                    Add to Log
                  </button>
                  <button
                    onClick={() => setIsManualEntryOpen(false)}
                    className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </Card>

          {isAIAnalyzing ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 animate-pulse space-y-3">
                  <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {draftEntries.map(entry => (
                <Card key={entry.id} className="relative group isolation-isolate min-w-0 overflow-hidden">
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                    <button
                      onClick={() => setEditingLogId(editingLogId === entry.id ? null : entry.id)}
                      className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 flex-shrink-0"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => deleteLogEntry(entry.id)}
                      className="p-1 bg-rose-100 text-rose-600 rounded hover:bg-rose-200 flex-shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <div className="flex gap-4">
                    <button
                      onClick={() => updateLogEntry(entry.id, { 
                        status: entry.status === 'completed' ? 'pending' : 'completed' 
                      })}
                      className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 mt-1",
                        entry.status === 'completed' 
                          ? "bg-emerald-500 border-emerald-500 text-white" 
                          : "border-gray-300 bg-white hover:border-emerald-400"
                      )}
                    >
                      {entry.status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                    <div className="flex-1 space-y-4">
                      {editingLogId === entry.id ? (
                        <>
                          <input
                            type="text"
                            defaultValue={entry.title}
                            onBlur={(e) => updateLogEntry(entry.id, { title: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                          <textarea
                            defaultValue={entry.description}
                            onBlur={(e) => updateLogEntry(entry.id, { description: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                            rows={2}
                          />
                        </>
                      ) : (
                        <>
                          <p className={cn(
                            "text-sm font-medium",
                            entry.status === 'completed' ? "text-gray-400 line-through" : "text-gray-900"
                          )}>{entry.title}</p>
                          {entry.description && (
                            <p className={cn(
                              "text-xs",
                              entry.status === 'completed' ? "text-gray-400 line-through" : "text-gray-500"
                            )}>{entry.description}</p>
                          )}
                        </>
                      )}
                      <div className="flex items-center gap-4">
                        <select
                          value={entry.goal_id}
                          onChange={(e) => updateLogEntry(entry.id, { goal_id: e.target.value })}
                          className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          {goals.map(g => (
                            <option key={g.id} value={g.goal_code}>{g.goal_code}: {g.title}</option>
                          ))}
                        </select>
                        <span className={cn(
                          "text-[10px] font-bold uppercase px-2 py-0.5 rounded whitespace-nowrap",
                          entry.status === 'completed' 
                            ? "bg-emerald-100 text-emerald-700" 
                            : "bg-amber-100 text-amber-700"
                        )}>
                          {entry.status}
                        </span>
                        <span className="text-[10px] text-gray-400">{entry.time}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Tasks Section */}
        <div className="space-y-4 min-w-0">
          <h2 className="text-xl font-bold text-gray-900">Active Tasks</h2>
          
          <Card>
            <div className="space-y-4 min-w-0">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !loading && addTask()}
                placeholder="Add a new task..."
                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                disabled={loading}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 min-w-0">
                <select
                  value={selectedGoalId}
                  onChange={(e) => setSelectedGoalId(e.target.value)}
                  className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  disabled={loading}
                >
                  {goals.map(g => (
                    <option key={g.id} value={g.goal_code}>{g.goal_code}</option>
                  ))}
                </select>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value as any)}
                  className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  disabled={loading}
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>
                <input
                  type="date"
                  value={selectedDueDate}
                  onChange={(e) => setSelectedDueDate(e.target.value)}
                  className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  disabled={loading}
                  placeholder="Due date"
                />
                <button
                  onClick={addTask}
                  disabled={loading || !newTaskText.trim()}
                  className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /><span>Add Task</span></>}
                </button>
              </div>

              <div className="space-y-2 min-w-0">
                {dbTasks.map(task => (
                  <div
                    key={task.id}
                    className="flex flex-wrap items-center gap-2 sm:gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group min-w-0"
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={cn(
                        "w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0",
                        task.status === 'completed' ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-300 bg-white"
                      )}
                    >
                      {task.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                    </button>
                    
                    {editingTaskId === task.id ? (
                      <input
                        type="text"
                        defaultValue={task.title}
                        autoFocus
                        onBlur={(e) => {
                          if (e.target.value.trim() && e.target.value !== task.title) {
                            updateTask(task.id, { title: e.target.value });
                          } else {
                            setEditingTaskId(null);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          } else if (e.key === 'Escape') {
                            setEditingTaskId(null);
                          }
                        }}
                        className="flex-1 min-w-0 text-sm font-medium bg-white border border-emerald-300 rounded px-2 py-1 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    ) : (
                      <span className={cn("flex-1 min-w-0 text-sm font-medium break-words", task.status === 'completed' ? "text-gray-400 line-through" : "text-gray-700")}>
                        {task.title}
                      </span>
                    )}
                    
                    <span className={cn(
                      "text-[10px] font-bold uppercase px-2 py-0.5 rounded whitespace-nowrap flex-shrink-0",
                      task.priority === 'urgent' ? 'bg-rose-100 text-rose-700' :
                      task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      task.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    )}>
                      {task.priority}
                    </span>
                    
                    {task.due_date && (
                      <span className={cn(
                        "text-[10px] font-medium px-2 py-0.5 rounded whitespace-nowrap flex-shrink-0",
                        new Date(task.due_date) < new Date() && task.status !== 'completed'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-gray-100 text-gray-600'
                      )}>
                        {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                    
                    <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded whitespace-nowrap flex-shrink-0">
                      {task.goal_id}
                    </span>
                    
                    <div className="opacity-0 group-hover:opacity-100 flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => {
                          setEditingTaskId(task.id);
                          setEditingTaskText(task.title);
                        }}
                        className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1 bg-rose-100 text-rose-600 rounded hover:bg-rose-200"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}

                {dbTasks.length === 0 && (
                  <EmptyState
                    icon={Target}
                    title="No tasks yet"
                    description="Start by adding your first task to track your progress"
                    actionLabel="Add Task"
                    onAction={() => document.querySelector<HTMLInputElement>('input[placeholder="Add a new task..."]')?.focus()}
                  />
                )}
              </div>
            </div>
          </Card>

          <Card title="Goal Breakdown">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={goalBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {goalBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {goalBreakdown.map(item => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs text-gray-500 font-medium truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
    </>
  );
}
