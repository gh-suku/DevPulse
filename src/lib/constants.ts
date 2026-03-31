// Application constants

// Points system
export const POINTS = {
  TASK_COMPLETED: 10,
  SUBTASK_COMPLETED: 5,
  DAILY_LOG_CREATED: 3,
  GOAL_CREATED: 15,
  COMMUNITY_POST: 8,
  COMMENT_CREATED: 2,
  LIKE_RECEIVED: 1,
} as const;

// Logging targets
export const LOGGING_TARGETS = {
  DAILY_LOGS: 5,
  MIN_LOGGING_TIME: 15, // seconds
  MAX_LOGGING_TIME: 30, // seconds
  GOAL_ALIGNMENT: 90, // percentage
} as const;

// Colors
export const GOAL_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
] as const;

// Pagination
export const PAGINATION = {
  TASKS_PER_PAGE: 20,
  LOGS_PER_PAGE: 20,
  POSTS_PER_PAGE: 10,
  LEADERBOARD_PER_PAGE: 50,
} as const;

// Validation
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_BIO_LENGTH: 500,
  MAX_POST_LENGTH: 2000,
  MAX_COMMENT_LENGTH: 500,
  MAX_TASK_TITLE_LENGTH: 200,
  MAX_GOAL_TITLE_LENGTH: 100,
} as const;
