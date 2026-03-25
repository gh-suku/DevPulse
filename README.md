# DevPulse AI

A productivity tracking application with goals, tasks, leaderboard, and insights features.

## Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Setup Database
Run the SQL files in the `supabase/` folder in sequence:

1. `01-initial-setup.sql` - Core tables and authentication
2. `02-add-tasks-leaderboard.sql` - Tasks and leaderboard
3. `03-add-core-features.sql` - Goals, logs, and insights
4. `04-add-username.sql` - Username functionality
5. `05-add-subtasks.sql` - Subtasks for goals
6. `06-enhance-goals.sql` - Enhanced goal tracking
7. `07-add-points-system.sql` - Points and leaderboard system

See `supabase/README.md` for detailed instructions.

### 4. Run Development Server
```bash
npm run dev
```

## Points System 🎯

This application now includes a comprehensive points system that rewards users for completing tasks and subtasks!

### Quick Start
1. **Start here**: Read `POINTS-SYSTEM-INDEX.md` for complete navigation guide
2. **Understand**: Read `WHAT-WAS-FIXED.md` to see what was implemented
3. **Deploy**: Follow `DEPLOYMENT-CHECKLIST.md` step-by-step
4. **Run**: Execute `supabase/07-add-points-system.sql` in Supabase SQL Editor

### How It Works
- **Complete a task**: +10 points (automatic)
- **Complete a subtask**: +5 points (automatic)
- **Points are saved**: Instantly to database
- **Leaderboard**: Shows real-time rankings

### Documentation Files
- 📋 **Navigation Guide**: `POINTS-SYSTEM-INDEX.md` ⭐ START HERE
- 🔧 **What Was Fixed**: `WHAT-WAS-FIXED.md`
- 📚 **Quick Setup**: `SETUP-POINTS.md`
- ✅ **Deployment Guide**: `DEPLOYMENT-CHECKLIST.md`
- 📊 **System Diagram**: `POINTS-FLOW-DIAGRAM.md`
- 📖 **Quick Reference**: `POINTS-QUICK-REFERENCE.md`
- 📝 **Full Documentation**: `supabase/POINTS-SYSTEM.md`
- 📄 **Summary**: `POINTS-SYSTEM-SUMMARY.md`

### Database Files
- 🗃️ **Migration**: `supabase/07-add-points-system.sql` (Run this!)
- 🧪 **Test Queries**: `supabase/99-test-queries.sql` (Queries 11-16)

## Features

- User authentication with email verification
- Profile management with avatars
- Goal tracking with subtasks
- Daily task logging
- Leaderboard with points system
- Weekly insights and analytics
- User profiles and social features

## Tech Stack

- React + TypeScript
- Vite
- Supabase (Database + Auth + Storage)
- TailwindCSS
- React Router

## Project Structure

```
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── contexts/       # React contexts (Auth)
│   └── lib/            # Utilities and configs
├── supabase/           # Database migration files
├── api/                # API endpoints
└── emails/             # Email templates
```

## Development

Start the development server:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

## Database

All database migrations are in the `supabase/` folder. Run them in numerical order in your Supabase SQL Editor.
