# 🌹 30-Day Habit Tracker

A beautiful, fully-featured habit tracker built with React + Vite + Supabase. Track unlimited habits across 30 days, with streaks, XP, milestones, heatmaps, reflections, and multi-user accounts.

## Features

- **Today view** — big tappable habit cards, daily intention setting, mark all done
- **Grid view** — full 30-day checkbox grid with today highlighted, rose garden progress row
- **Heatmap** — GitHub-style calendar + per-habit streak bars
- **Dashboard** — XP level system, milestone badges, charts, shareable progress card
- **Reflect** — daily intentions log, weekly reflection notes
- **Setup** — unlimited habits, drag-to-reorder, categories, frequency targets, core habit weighting
- **Auth** — sign up, log in, log out, and profile-based reminder settings

## Getting Started

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`

### Supabase Setup

1. Create a Supabase project.
2. Run the SQL in [`supabase-schema.sql`](supabase-schema.sql) to create the tables and RLS policies.
3. Add your project URL and anon key to `.env`:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

4. Sign up or log in from the app.
5. Set your reminder email, timezone, and reminder time in Setup. n8n can read those fields to send reminders.

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Or connect your GitHub repo in the [Vercel dashboard](https://vercel.com) for automatic deploys on every push.

## Tech Stack

- React 18
- Vite 5
- Supabase Auth + Postgres
- Recharts (charts)
- n8n for reminders

## Data

All habit data and reminder preferences are saved in Supabase and scoped per signed-in user. Records are stored by real date, not a shifting 30-day index, so changing a cycle start date does not rewrite history. Reminder delivery itself is handled by n8n, which reads the saved profile settings.

## Schema Notes

- `settings.start_date` uses the `date` type.
- Habit ids use UUIDs.
- Check-ins, intentions, and reflections are keyed by actual dates.
- RLS is enabled on every user-owned table.
