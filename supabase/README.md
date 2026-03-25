# Supabase Database Setup

This folder contains all SQL migration files for the DevPulse AI application. Run these files in sequence in your Supabase SQL Editor.

## Execution Order

Run these files in the following order:

1. **01-initial-setup.sql**
   - Creates profiles table
   - Sets up authentication triggers
   - Configures storage bucket for avatars
   - Enables Row Level Security (RLS)

2. **02-add-tasks-leaderboard.sql**
   - Creates tasks table
   - Adds leaderboard functionality
   - Sets up points calculation system
   - Adds rank tracking

3. **03-add-core-features.sql**
   - Creates daily_logs table
   - Creates goals table
   - Creates attributes table
   - Creates weekly_summaries table
   - Sets up goal progress tracking

4. **04-add-username.sql**
   - Adds username column to profiles
   - Extracts usernames from email addresses
   - Updates existing users with usernames

5. **05-add-subtasks.sql**
   - Creates subtasks table
   - Links subtasks to goals
   - Auto-updates goal progress based on subtask completion

6. **06-enhance-goals.sql**
   - Adds target_value, current_value, unit fields to goals
   - Enhances progress calculation
   - Creates goal_details view

7. **07-add-points-system.sql**
   - Implements comprehensive points system
   - Adds points tracking for tasks, logs, and goals
   - Creates leaderboard functionality

8. **99-test-queries.sql**
   - Testing and verification queries
   - Not required for setup, use for debugging

## How to Run

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the content of each file in order
5. Execute each query
6. Verify the results before moving to the next file

## Important Notes

- Always run files in the specified order
- Do not skip any files as they have dependencies
- After running 01-initial-setup.sql, disable "Confirm email" in Authentication settings
- File 99-test-queries.sql is optional and only for testing
