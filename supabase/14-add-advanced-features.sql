-- Advanced Features Migration
-- Issues: #7, #13, #19, #20, #23, #24, #25, #58

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('comment', 'like', 'task_assigned', 'goal_completed', 'mention', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  comment_notifications BOOLEAN DEFAULT TRUE,
  like_notifications BOOLEAN DEFAULT TRUE,
  task_notifications BOOLEAN DEFAULT TRUE,
  goal_notifications BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task assignments
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES auth.users(id);

CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined'))
);

CREATE INDEX idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX idx_task_assignments_assigned_to ON task_assignments(assigned_to);

-- Recurring tasks
CREATE TABLE IF NOT EXISTS recurring_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  goal_id TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  recurrence_config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_generated_at TIMESTAMP WITH TIME ZONE,
  occurrences_count INTEGER DEFAULT 0
);

CREATE INDEX idx_recurring_tasks_user_id ON recurring_tasks(user_id);
CREATE INDEX idx_recurring_tasks_is_active ON recurring_tasks(is_active);

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurring_task_id UUID REFERENCES recurring_tasks(id);

-- Task dependencies
CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type TEXT DEFAULT 'finish_to_start' CHECK (dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, depends_on_task_id)
);

CREATE INDEX idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX idx_task_dependencies_depends_on ON task_dependencies(depends_on_task_id);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('task', 'goal', 'subtask', 'log', 'post')),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  changes JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Points transactions
CREATE TABLE IF NOT EXISTS points_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_points_transactions_user_id ON points_transactions(user_id);
CREATE INDEX idx_points_transactions_created_at ON points_transactions(created_at DESC);

-- Function to increment user points
CREATE OR REPLACE FUNCTION increment_user_points(user_id UUID, points_to_add INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET points = COALESCE(points, 0) + points_to_add
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Notification preferences policies
CREATE POLICY "Users can manage their notification preferences"
  ON notification_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Task assignments policies
CREATE POLICY "Users can view assignments they're involved in"
  ON task_assignments FOR SELECT
  USING (auth.uid() = assigned_to OR auth.uid() = assigned_by);

CREATE POLICY "Users can create task assignments"
  ON task_assignments FOR INSERT
  WITH CHECK (auth.uid() = assigned_by);

CREATE POLICY "Users can update their assignments"
  ON task_assignments FOR UPDATE
  USING (auth.uid() = assigned_to OR auth.uid() = assigned_by);

-- Recurring tasks policies
CREATE POLICY "Users can manage their recurring tasks"
  ON recurring_tasks FOR ALL
  USING (auth.uid() = user_id);

-- Task dependencies policies
CREATE POLICY "Users can view dependencies for their tasks"
  ON task_dependencies FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM tasks WHERE id = task_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM tasks WHERE id = depends_on_task_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can manage dependencies for their tasks"
  ON task_dependencies FOR ALL
  USING (EXISTS (SELECT 1 FROM tasks WHERE id = task_id AND user_id = auth.uid()));

-- Audit logs policies
CREATE POLICY "Users can view their audit logs"
  ON audit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- Points transactions policies
CREATE POLICY "Users can view their points transactions"
  ON points_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert points transactions"
  ON points_transactions FOR INSERT
  WITH CHECK (true);
