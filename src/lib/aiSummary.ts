/**
 * AI Summary Generation - Issue #22 & #54: Weekly Summary Generation
 * 
 * Generates AI-powered weekly summaries and insights from user activity data.
 */

import { supabase } from './supabase';

export interface WeeklySummaryData {
  weekStart: string;
  weekEnd: string;
  totalLogs: number;
  totalTasks: number;
  completedTasks: number;
  goalProgress: Record<string, number>;
  topGoals: string[];
  insights: Insight[];
}

export interface Insight {
  type: 'positive' | 'warning' | 'info';
  title: string;
  description: string;
}

/**
 * Generate weekly summary from user data
 */
export async function generateWeeklySummary(
  userId: string,
  weekStart?: Date
): Promise<WeeklySummaryData | null> {
  try {
    const start = weekStart || getWeekStart(new Date());
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    // Fetch logs for the week
    const { data: logs, error: logsError } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString());

    if (logsError) throw logsError;

    // Fetch tasks for the week
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString());

    if (tasksError) throw tasksError;

    // Fetch goals
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId);

    if (goalsError) throw goalsError;

    // Calculate metrics
    const totalLogs = logs?.length || 0;
    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;

    // Calculate goal progress
    const goalProgress: Record<string, number> = {};
    goals?.forEach(goal => {
      goalProgress[goal.title] = goal.progress || 0;
    });

    // Identify top goals (by task count)
    const goalTaskCounts: Record<string, number> = {};
    tasks?.forEach(task => {
      const goal = goals?.find(g => g.goal_code === task.goal_id);
      if (goal) {
        goalTaskCounts[goal.title] = (goalTaskCounts[goal.title] || 0) + 1;
      }
    });

    const topGoals = Object.entries(goalTaskCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([goal]) => goal);

    // Generate insights
    const insights = generateInsights({
      totalLogs,
      totalTasks,
      completedTasks,
      goalProgress,
      topGoals
    });

    return {
      weekStart: start.toISOString(),
      weekEnd: end.toISOString(),
      totalLogs,
      totalTasks,
      completedTasks,
      goalProgress,
      topGoals,
      insights
    };
  } catch (error) {
    console.error('Error generating weekly summary:', error);
    return null;
  }
}

/**
 * Generate insights from summary data
 */
function generateInsights(data: {
  totalLogs: number;
  totalTasks: number;
  completedTasks: number;
  goalProgress: Record<string, number>;
  topGoals: string[];
}): Insight[] {
  const insights: Insight[] = [];

  // Task completion rate insight
  const completionRate = data.totalTasks > 0 
    ? (data.completedTasks / data.totalTasks) * 100 
    : 0;

  if (completionRate >= 80) {
    insights.push({
      type: 'positive',
      title: 'Excellent Task Completion',
      description: `You completed ${completionRate.toFixed(0)}% of your tasks this week. Keep up the great work!`
    });
  } else if (completionRate < 50) {
    insights.push({
      type: 'warning',
      title: 'Low Task Completion',
      description: `Only ${completionRate.toFixed(0)}% of tasks were completed. Consider breaking down tasks into smaller, manageable pieces.`
    });
  }

  // Logging consistency insight
  if (data.totalLogs >= 20) {
    insights.push({
      type: 'positive',
      title: 'Consistent Logging',
      description: `You logged ${data.totalLogs} activities this week. Your consistency is impressive!`
    });
  } else if (data.totalLogs < 10) {
    insights.push({
      type: 'warning',
      title: 'Increase Logging Frequency',
      description: `Only ${data.totalLogs} logs this week. Try to log activities more frequently for better tracking.`
    });
  }

  // Goal progress insight
  const avgProgress = Object.values(data.goalProgress).reduce((a, b) => a + b, 0) / 
    Math.max(Object.values(data.goalProgress).length, 1);

  if (avgProgress >= 75) {
    insights.push({
      type: 'positive',
      title: 'Strong Goal Progress',
      description: `Your goals are ${avgProgress.toFixed(0)}% complete on average. You're making excellent progress!`
    });
  } else if (avgProgress < 30) {
    insights.push({
      type: 'info',
      title: 'Focus on Goal Alignment',
      description: `Goal progress is at ${avgProgress.toFixed(0)}%. Consider aligning more tasks with your goals.`
    });
  }

  // Top goals insight
  if (data.topGoals.length > 0) {
    insights.push({
      type: 'info',
      title: 'Top Focus Areas',
      description: `Your main focus this week: ${data.topGoals.join(', ')}`
    });
  }

  return insights;
}

/**
 * Save weekly summary to database
 */
export async function saveWeeklySummary(
  userId: string,
  summaryData: WeeklySummaryData
): Promise<boolean> {
  try {
    const summaryText = generateSummaryText(summaryData);

    const { error } = await supabase
      .from('weekly_summaries')
      .upsert({
        user_id: userId,
        week_start: summaryData.weekStart,
        week_end: summaryData.weekEnd,
        summary_text: summaryText,
        insights: summaryData.insights,
        metrics: {
          totalLogs: summaryData.totalLogs,
          totalTasks: summaryData.totalTasks,
          completedTasks: summaryData.completedTasks,
          goalProgress: summaryData.goalProgress
        }
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving weekly summary:', error);
    return false;
  }
}

/**
 * Generate human-readable summary text
 */
function generateSummaryText(data: WeeklySummaryData): string {
  const completionRate = data.totalTasks > 0 
    ? ((data.completedTasks / data.totalTasks) * 100).toFixed(0)
    : '0';

  return `This week, you logged ${data.totalLogs} activities and created ${data.totalTasks} tasks, completing ${data.completedTasks} of them (${completionRate}% completion rate). ${
    data.topGoals.length > 0 
      ? `Your primary focus areas were ${data.topGoals.join(', ')}.` 
      : 'Consider setting clear goals to improve focus.'
  } ${
    data.insights.filter(i => i.type === 'positive').length > 0
      ? 'You showed strong performance in several areas this week.'
      : 'There are opportunities to improve your productivity and goal alignment.'
  }`;
}

/**
 * Get the start of the week (Monday)
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Auto-generate and save weekly summary (can be called by a cron job)
 */
export async function autoGenerateWeeklySummary(userId: string): Promise<boolean> {
  const summaryData = await generateWeeklySummary(userId);
  if (!summaryData) return false;
  
  return await saveWeeklySummary(userId, summaryData);
}
