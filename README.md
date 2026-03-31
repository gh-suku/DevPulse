# DevPulse AI

A productivity tracking application with goals, tasks, leaderboard, and insights features.

## 🎉 Latest Update - Version 1.1.0

**20 critical issues fixed!** This update includes major improvements to security, performance, features, and documentation.

### What's New
- ✅ Task priorities and due dates
- ✅ Search and filter functionality
- ✅ Keyboard shortcuts
- ✅ PWA support (install as app)
- ✅ Database performance optimization (40+ indexes)
- ✅ Rate limiting and file validation
- ✅ Comprehensive documentation

**📚 See [README-UPDATES.md](README-UPDATES.md) for complete details**

## 📖 Documentation

### Quick Start
- **[QUICK-REFERENCE.md](QUICK-REFERENCE.md)** - Quick start guide and common tasks
- **[DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md)** - Step-by-step deployment checklist

### Detailed Guides
- **[FIXES-SUMMARY.md](FIXES-SUMMARY.md)** - Complete list of all 20 fixes
- **[API-DOCUMENTATION.md](API-DOCUMENTATION.md)** - Database schema and API reference
- **[TESTING-GUIDE.md](TESTING-GUIDE.md)** - Testing strategy and examples
- **[DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md)** - Comprehensive deployment guide

### Reference
- **[issues.md](issues.md)** - Complete issue tracker with status

## ⚠️ SECURITY WARNING

**CRITICAL**: If you have previously committed `.env` files with API keys to version control:
1. **Immediately rotate all exposed keys** in Supabase, Gemini, and Resend dashboards
2. Remove sensitive files from git history: `git filter-branch --force --index-filter "git rm --cached --ignore-unmatch .env" --prune-empty --tag-name-filter cat -- --all`
3. Force push: `git push origin --force --all`
4. Never commit `.env` files again - use `.env.example` as a template

## Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

Then edit `.env` with your actual Supabase, Gemini, and Resend credentials.

**Never commit `.env` to version control!**

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
