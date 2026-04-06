# 🌹 30-Day Habit Tracker

A beautiful, fully-featured habit tracker built with React + Vite. Track up to unlimited habits across 30 days, with streaks, XP, milestones, heatmaps, and reflections.

## Features

- **Today view** — big tappable habit cards, daily intention setting, mark all done
- **Grid view** — full 30-day checkbox grid with today highlighted, rose garden progress row
- **Heatmap** — GitHub-style calendar + per-habit streak bars
- **Dashboard** — XP level system, milestone badges, charts, shareable progress card
- **Reflect** — daily intentions log, weekly reflection notes
- **Setup** — unlimited habits, drag-to-reorder, categories, frequency targets, core habit weighting

## Getting Started

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Or connect your GitHub repo in the [Vercel dashboard](https://vercel.com) for automatic deploys on every push.

## Tech Stack

- React 18
- Vite 5
- Recharts (charts)
- localStorage (data persistence — no backend needed)

## Data

All data is saved to `localStorage` in the browser. It persists across sessions on the same device/browser. To sync across devices, swap localStorage for Supabase.
