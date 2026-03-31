-- supabase/10-add-task-due-dates.sql
-- Issue #18: Add due dates to tasks

-- Add due_date column to tasks table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'due_date'
    ) THEN
        ALTER TABLE tasks ADD COLUMN due_date DATE;
        
        -- Add index for due date queries
        CREATE INDEX idx_tasks_due_date ON tasks(due_date);
        
        -- Add index for overdue tasks
        CREATE INDEX idx_tasks_overdue ON tasks(user_id, due_date) 
        WHERE status != 'completed' AND due_date < CURRENT_DATE;
        
        COMMENT ON COLUMN tasks.due_date IS 'Due date for the task';
    END IF;
END $$;

-- Create a view for overdue tasks
CREATE OR REPLACE VIEW overdue_tasks AS
SELECT 
    t.*,
    p.full_name,
    p.username,
    CURRENT_DATE - t.due_date as days_overdue
FROM tasks t
JOIN profiles p ON t.user_id = p.id
WHERE t.status != 'completed' 
  AND t.status != 'cancelled'
  AND t.due_date < CURRENT_DATE
ORDER BY t.due_date ASC;

-- Create a view for upcoming tasks (due in next 7 days)
CREATE OR REPLACE VIEW upcoming_tasks AS
SELECT 
    t.*,
    p.full_name,
    p.username,
    t.due_date - CURRENT_DATE as days_until_due
FROM tasks t
JOIN profiles p ON t.user_id = p.id
WHERE t.status != 'completed' 
  AND t.status != 'cancelled'
  AND t.due_date >= CURRENT_DATE
  AND t.due_date <= CURRENT_DATE + INTERVAL '7 days'
ORDER BY t.due_date ASC;

-- Grant access to views
GRANT SELECT ON overdue_tasks TO authenticated;
GRANT SELECT ON upcoming_tasks TO authenticated;

-- Add RLS policies for views
ALTER VIEW overdue_tasks SET (security_invoker = true);
ALTER VIEW upcoming_tasks SET (security_invoker = true);
