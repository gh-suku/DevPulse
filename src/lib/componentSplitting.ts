/**
 * Component Splitting Utilities
 * 
 * Guidelines for breaking down large components (Issue #29)
 * 
 * PRINCIPLES:
 * 1. Single Responsibility - Each component should do one thing well
 * 2. Composition over Inheritance - Build complex UIs from simple components
 * 3. Extract Reusable Logic - Custom hooks for shared behavior
 * 4. Separate Concerns - UI, business logic, and data fetching
 * 
 * WHEN TO SPLIT:
 * - Component exceeds 300 lines
 * - Multiple responsibilities (data fetching + rendering + business logic)
 * - Repeated JSX patterns
 * - Complex conditional rendering
 * - Multiple useState/useEffect hooks
 * 
 * HOW TO SPLIT:
 * 1. Extract presentational components (pure UI)
 * 2. Extract container components (data + logic)
 * 3. Extract custom hooks (reusable logic)
 * 4. Extract utility functions (pure functions)
 * 
 * EXAMPLE STRUCTURE:
 * 
 * Before (Large Component):
 * ```tsx
 * function DashboardScreen() {
 *   // 500+ lines of mixed concerns
 *   const [data, setData] = useState()
 *   const [loading, setLoading] = useState()
 *   // Complex data fetching
 *   // Complex business logic
 *   // Complex rendering
 * }
 * ```
 * 
 * After (Split Components):
 * ```tsx
 * // Custom hook for data
 * function useDashboardData() {
 *   const [data, setData] = useState()
 *   const [loading, setLoading] = useState()
 *   // Data fetching logic
 *   return { data, loading, refetch }
 * }
 * 
 * // Presentational components
 * function DashboardHeader({ title, actions }) { }
 * function DashboardStats({ stats }) { }
 * function DashboardChart({ data }) { }
 * 
 * // Container component
 * function DashboardScreen() {
 *   const { data, loading } = useDashboardData()
 *   return (
 *     <>
 *       <DashboardHeader />
 *       <DashboardStats stats={data.stats} />
 *       <DashboardChart data={data.chart} />
 *     </>
 *   )
 * }
 * ```
 */

export const componentSplittingGuidelines = {
  maxLines: 300,
  maxHooks: 10,
  maxJSXDepth: 5,
  
  recommendations: {
    'App.tsx': [
      'Extract DashboardScreen to separate file',
      'Extract KPICard to shared components',
      'Extract Badge to shared components',
      'Create useDashboard hook for data fetching',
      'Split into: DashboardHeader, DashboardStats, DashboardActivity'
    ],
    'DailyTrackerScreen.tsx': [
      'Extract GoalCard component',
      'Extract TaskList component',
      'Extract LogEntry component',
      'Create useGoals hook',
      'Create useTasks hook',
      'Create useLogs hook',
      'Split into: GoalsSection, TasksSection, LogsSection'
    ],
    'InsightsScreen.tsx': [
      'Extract WeeklySummary component',
      'Extract ProgressChart component',
      'Extract AttributesList component',
      'Create useInsights hook',
      'Create useWeeklySummary hook'
    ]
  }
};

/**
 * Component Size Analyzer
 * Use this to identify components that need splitting
 */
export function analyzeComponentSize(componentPath: string, lineCount: number, hookCount: number) {
  const issues: string[] = [];
  
  if (lineCount > 500) {
    issues.push(`CRITICAL: ${lineCount} lines (recommended: <300)`);
  } else if (lineCount > 300) {
    issues.push(`WARNING: ${lineCount} lines (recommended: <300)`);
  }
  
  if (hookCount > 15) {
    issues.push(`CRITICAL: ${hookCount} hooks (recommended: <10)`);
  } else if (hookCount > 10) {
    issues.push(`WARNING: ${hookCount} hooks (recommended: <10)`);
  }
  
  return {
    path: componentPath,
    lineCount,
    hookCount,
    issues,
    needsSplitting: issues.length > 0
  };
}

export default componentSplittingGuidelines;
