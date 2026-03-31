// Issue #28: Comprehensive TypeScript Type Definitions
// Centralized type definitions for the entire application

/**
 * Database table types
 */

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string;
  phone: string;
  department: string;
  username?: string;
  points?: number;
  updated_at: string;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  goal_code: string;
  title: string;
  color: string;
  progress: number;
  target_value: number | null;
  current_value: number | null;
  unit: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string;
  goal_id: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Subtask {
  id: string;
  user_id: string;
  goal_id: string;
  title: string;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyLog {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  goal_id: string;
  time: string;
  status: LogStatus;
  created_at: string;
  updated_at: string;
}

export type LogStatus = 'pending' | 'completed' | 'in_progress';

export interface Attribute {
  id: string;
  user_id: string;
  name: string;
  rating: number;
  notes: string;
  category: AttributeCategory;
  created_at: string;
  updated_at: string;
}

export type AttributeCategory = 'general' | 'technical' | 'leadership' | 'communication' | 'other';

export interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  // Joined data
  profiles?: Profile;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  // Joined data
  profiles?: Profile;
}

export interface WeeklySummary {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  summary_text: string;
  insights: Insight[] | null;
  created_at: string;
}

export interface Insight {
  type: 'positive' | 'warning' | 'info';
  title: string;
  description: string;
}

/**
 * Component prop types
 */

export interface CardProps {
  title?: string;
  className?: string;
  children: React.ReactNode;
}

export interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  variant?: 'danger' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
}

/**
 * API response types
 */

export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Form types
 */

export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  email: string;
  password: string;
  fullName: string;
}

export interface ProfileFormData {
  full_name: string;
  bio: string;
  phone: string;
  department: string;
}

/**
 * Utility types
 */

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;
