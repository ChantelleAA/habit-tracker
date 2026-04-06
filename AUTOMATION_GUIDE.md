# 🌹 Habit Tracker — Full Automation & Sync Guide

> **What this guide covers:**
> 1. Set up Supabase (your database — replaces localStorage)
> 2. Update the React app to use Supabase
> 3. n8n Workflow 1 — Daily WhatsApp/email check-in reminder
> 4. n8n Workflow 2 — Weekly summary email
> 5. Deploy everything to Vercel

**Time to complete:** ~2–3 hours  
**Difficulty:** Beginner friendly — every step is explained  
**Tools you'll need:** Supabase (free), n8n Cloud (free tier), your Vercel app, Gmail or WhatsApp Business

---

## Part 0 — Big Picture (Read This First)

Right now, your app saves data to `localStorage` — that's just your browser's memory. If you open the app on your phone, it sees nothing. If you clear your browser, it's all gone.

Here's the new architecture:

```
Your phone / laptop / tablet
        ↓ reads & writes
    Supabase (online database)
        ↑
    n8n (automation)
        ↓ sends
    WhatsApp / Email
```

Everything talks to Supabase. Your app reads from Supabase. n8n reads from Supabase to send you summaries. Changes you make on your phone instantly appear on your laptop.

---

## Part 1 — Set Up Supabase

Supabase is a free online database. Think of it as Google Sheets, but for your app.

### Step 1.1 — Create your account

1. Go to [supabase.com](https://supabase.com)
2. Click **Start your project** → sign up with GitHub (easiest)
3. Click **New Project**
4. Fill in:
   - **Name:** `habit-tracker`
   - **Database Password:** make a strong one and **save it somewhere**
   - **Region:** pick the closest to you (Europe West for Dublin)
5. Click **Create new project** — takes about 2 minutes to set up

### Step 1.2 — Create the database tables

Once your project is ready, click **SQL Editor** in the left sidebar. You'll see a text box. Paste this entire block and click **Run**:

```sql
-- Table 1: stores your habits (name, category, frequency etc.)
CREATE TABLE habits (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL DEFAULT 'default',
  name        TEXT NOT NULL DEFAULT '',
  cat         TEXT NOT NULL DEFAULT 'health',
  freq        TEXT NOT NULL DEFAULT 'daily',
  core        BOOLEAN NOT NULL DEFAULT false,
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: stores which days you checked each habit
CREATE TABLE checkins (
  id          SERIAL PRIMARY KEY,
  habit_id    TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL DEFAULT 'default',
  day_index   INTEGER NOT NULL,  -- 0 to 29
  checked     BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(habit_id, day_index)
);

-- Table 3: stores your daily intentions (one per day)
CREATE TABLE intentions (
  id          SERIAL PRIMARY KEY,
  user_id     TEXT NOT NULL DEFAULT 'default',
  day_index   INTEGER NOT NULL,
  text        TEXT DEFAULT '',
  UNIQUE(user_id, day_index)
);

-- Table 4: stores your weekly reflections (one per week)
CREATE TABLE reflections (
  id          SERIAL PRIMARY KEY,
  user_id     TEXT NOT NULL DEFAULT 'default',
  week_index  INTEGER NOT NULL,  -- 0 to 3
  text        TEXT DEFAULT '',
  UNIQUE(user_id, week_index)
);

-- Table 5: stores app settings (like your start date)
CREATE TABLE settings (
  user_id     TEXT PRIMARY KEY DEFAULT 'default',
  start_date  TEXT DEFAULT '',
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

You should see **"Success. No rows returned"** — that's correct.

### Step 1.3 — Get your API keys

1. In the left sidebar, click **Project Settings** (the cog icon at the bottom)
2. Click **API**
3. You'll see two things you need — copy them both somewhere safe:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **anon public key** — a long string starting with `eyJ...`

> ⚠️ The `anon` key is safe to use in your frontend. Never use the `service_role` key in your app.

### Step 1.4 — Turn off Row Level Security (for now)

By default Supabase locks down your tables. For a personal app you own, you can disable this for simplicity.

In SQL Editor, run:

```sql
ALTER TABLE habits     DISABLE ROW LEVEL SECURITY;
ALTER TABLE checkins   DISABLE ROW LEVEL SECURITY;
ALTER TABLE intentions DISABLE ROW LEVEL SECURITY;
ALTER TABLE reflections DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings   DISABLE ROW LEVEL SECURITY;
```

> Note: If you ever make this app public or multi-user, re-enable RLS and add policies. For now (personal use only) this is fine.

---

## Part 2 — Update Your React App to Use Supabase

### Step 2.1 — Install Supabase

In your project folder, run:

```bash
npm install @supabase/supabase-js
```

### Step 2.2 — Add your environment variables

Create a file called `.env` in the root of your project (same level as `package.json`):

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace the values with what you copied in Step 1.3.

> ⚠️ `.env` is already in your `.gitignore` so it won't be pushed to GitHub. Good — never commit API keys.

### Step 2.3 — Create the Supabase client file

Create a new file: `src/supabase.js`

```js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
```

### Step 2.4 — Create a data layer file

Create a new file: `src/db.js`

This file contains all the functions your app needs to read and write data. You only need to write this once — your App.jsx will import from it.

```js
import { supabase } from './supabase'

const USER_ID = 'default' // single-user app

// ─── SETTINGS ───────────────────────────────────────────────

export async function getStartDate() {
  const { data } = await supabase
    .from('settings')
    .select('start_date')
    .eq('user_id', USER_ID)
    .single()
  return data?.start_date || new Date().toISOString().slice(0, 10)
}

export async function saveStartDate(date) {
  await supabase
    .from('settings')
    .upsert({ user_id: USER_ID, start_date: date, updated_at: new Date().toISOString() })
}

// ─── HABITS ─────────────────────────────────────────────────

export async function getHabits() {
  const { data } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', USER_ID)
    .order('position')
  return data || []
}

export async function saveHabit(habit, position) {
  await supabase
    .from('habits')
    .upsert({ ...habit, user_id: USER_ID, position })
}

export async function deleteHabit(id) {
  await supabase.from('habits').delete().eq('id', id)
}

export async function reorderHabits(habits) {
  // Save each habit's new position
  const updates = habits.map((h, i) =>
    supabase.from('habits').update({ position: i }).eq('id', h.id)
  )
  await Promise.all(updates)
}

// ─── CHECKINS ───────────────────────────────────────────────

export async function getCheckins() {
  const { data } = await supabase
    .from('checkins')
    .select('*')
    .eq('user_id', USER_ID)
  // Return as { habitId: boolean[30] } object (same shape as localStorage version)
  const result = {}
  for (const row of data || []) {
    if (!result[row.habit_id]) result[row.habit_id] = Array(30).fill(false)
    result[row.habit_id][row.day_index] = row.checked
  }
  return result
}

export async function toggleCheckin(habitId, dayIndex, checked) {
  await supabase
    .from('checkins')
    .upsert({
      habit_id:  habitId,
      user_id:   USER_ID,
      day_index: dayIndex,
      checked,
    })
}

// ─── INTENTIONS ─────────────────────────────────────────────

export async function getIntentions() {
  const { data } = await supabase
    .from('intentions')
    .select('*')
    .eq('user_id', USER_ID)
  const result = Array(30).fill('')
  for (const row of data || []) result[row.day_index] = row.text
  return result
}

export async function saveIntention(dayIndex, text) {
  await supabase
    .from('intentions')
    .upsert({ user_id: USER_ID, day_index: dayIndex, text })
}

// ─── REFLECTIONS ────────────────────────────────────────────

export async function getReflections() {
  const { data } = await supabase
    .from('reflections')
    .select('*')
    .eq('user_id', USER_ID)
  const result = Array(4).fill('')
  for (const row of data || []) result[row.week_index] = row.text
  return result
}

export async function saveReflection(weekIndex, text) {
  await supabase
    .from('reflections')
    .upsert({ user_id: USER_ID, week_index: weekIndex, text })
}
```

### Step 2.5 — Update App.jsx to use Supabase

Replace the top of `App.jsx`. Find this section (around line 1–15):

```js
// OLD — remove this
const LS_KEYS = { ... }
const lsGet = ...
const lsSet = ...
```

Replace with:

```js
import {
  getStartDate, saveStartDate,
  getHabits, saveHabit, deleteHabit, reorderHabits,
  getCheckins, toggleCheckin,
  getIntentions, saveIntention,
  getReflections, saveReflection,
} from './db'
```

Then replace the `useState` initialisers and `useEffect` save hooks.

**Find and replace the state initialisation block:**

```js
// OLD
const [habits,      setHabits]      = useState(() => lsGet(LS_KEYS.habits,      DEFAULTS));
const [checked,     setChecked]     = useState(() => lsGet(LS_KEYS.checked,     ...));
const [startDate,   setStartDate]   = useState(() => lsGet(LS_KEYS.startDate,   ...));
const [intentions,  setIntentions]  = useState(() => lsGet(LS_KEYS.intentions,  ...));
const [reflections, setReflections] = useState(() => lsGet(LS_KEYS.reflections, ...));
```

```js
// NEW
const [habits,      setHabits]      = useState(DEFAULTS);
const [checked,     setChecked]     = useState({});
const [startDate,   setStartDate]   = useState(new Date().toISOString().slice(0,10));
const [intentions,  setIntentions]  = useState(Array(30).fill(''));
const [reflections, setReflections] = useState(Array(4).fill(''));
const [loaded,      setLoaded]      = useState(false);
```

**Replace the load useEffect (the one that reads from storage):**

```js
// NEW — load everything from Supabase on mount
useEffect(() => {
  async function load() {
    const [h, c, s, i, r] = await Promise.all([
      getHabits(),
      getCheckins(),
      getStartDate(),
      getIntentions(),
      getReflections(),
    ])
    if (h.length > 0) setHabits(h)
    setChecked(c)
    if (s) setStartDate(s)
    setIntentions(i)
    setReflections(r)
    setLoaded(true)
  }
  load()
}, [])
```

**Remove all the individual save useEffects** (the ones with `lsSet`) and instead update each action function to also write to Supabase:

```js
// Updated toggleCheck — writes to Supabase immediately
const toggleCheck = (id, di) => {
  const row   = checked[id] || eRow()
  const going = !row[di]
  setChecked(p => { const n={...p,[id]:[...(p[id]||eRow())]};n[id][di]=going;return n; })
  toggleCheckin(id, di, going)  // ← add this line
  // ... rest of your milestone check code stays the same
}

// Updated addHabit
const addHabit = () => {
  const id = uid()
  const newHabit = { id, name:'', cat:'health', freq:'daily', core:false }
  setHabits(p => { const updated = [...p, newHabit]; saveHabit(newHabit, updated.length-1); return updated; })
  setChecked(p => ({...p, [id]:eRow()}))
}

// Updated removeHabit
const removeHabit = (id) => {
  if (!window.confirm('Remove this habit?')) return
  setHabits(p => p.filter(h=>h.id!==id))
  setChecked(p => { const n={...p}; delete n[id]; return n; })
  deleteHabit(id)  // ← add this line
}

// Updated updHabit
const updHabit = (id, field, val) => {
  setHabits(p => {
    const updated = p.map(h => h.id===id ? {...h,[field]:val} : h)
    const habit   = updated.find(h => h.id===id)
    const pos     = updated.indexOf(habit)
    saveHabit(habit, pos)  // ← add this line
    return updated
  })
}

// Updated setStartDate calls — wrap in a handler:
const handleSetStartDate = (date) => {
  setStartDate(date)
  saveStartDate(date)  // ← add this line
}
// Then replace setStartDate with handleSetStartDate in your JSX

// Updated setIntentions calls:
const handleSetIntention = (dayIndex, text) => {
  setIntentions(p => { const n=[...p]; n[dayIndex]=text; return n; })
  saveIntention(dayIndex, text)  // ← add this line
}

// Updated setReflections calls:
const handleSetReflection = (weekIndex, text) => {
  setReflections(p => { const n=[...p]; n[weekIndex]=text; return n; })
  saveReflection(weekIndex, text)  // ← add this line
}
```

### Step 2.6 — Add your environment variables to Vercel

When you deploy to Vercel, it won't have access to your local `.env` file. You need to add the variables in the Vercel dashboard:

1. Go to your project on [vercel.com](https://vercel.com)
2. Click **Settings** → **Environment Variables**
3. Add two variables:
   - `VITE_SUPABASE_URL` → your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → your anon key
4. Click **Save**, then redeploy

Your app now syncs across all devices. Open it on your phone — same data.

---

## Part 3 — n8n Setup

n8n is a visual automation tool. You create "workflows" by connecting blocks together — no complex coding needed.

### Step 3.1 — Create your n8n account

1. Go to [n8n.io](https://n8n.io) → click **Get started for free**
2. Sign up — the cloud free tier gives you 5 active workflows and 2,500 executions/month (more than enough)
3. You'll land in the n8n editor — this is where you'll build your workflows

### Step 3.2 — How n8n works (quick orientation)

Every workflow has:
- **A trigger** — what starts it (a schedule, a webhook, an incoming message)
- **Nodes** — steps that do things (query a database, format text, send a message)
- **Connections** — arrows linking the steps together

You click **+** to add a node, search for what you want, configure it, connect it to the next node.

---

## Part 4 — Workflow 1: Daily Check-in Reminder

This workflow runs every morning and checks whether you've done any habits today. If not, it sends you a reminder via WhatsApp or email.

### Step 4.1 — Create a new workflow

1. In n8n, click **+ New Workflow**
2. Name it `Daily Habit Reminder`

### Step 4.2 — Add a Schedule Trigger

1. Click **Add first step**
2. Search for **Schedule Trigger** and select it
3. Configure:
   - **Trigger Times:** At a specific time
   - **Hour:** 8 (for 8am)
   - **Minute:** 0
   - **Timezone:** Europe/Dublin
4. Click **Done**

### Step 4.3 — Connect to Supabase to check today's progress

1. Click the **+** after the schedule trigger
2. Search for **HTTP Request** — this lets you call any API, including Supabase
3. Configure it:
   - **Method:** GET
   - **URL:** `https://YOUR-PROJECT-ID.supabase.co/rest/v1/checkins?user_id=eq.default`
   - **Add Header:**
     - `apikey` → your Supabase anon key
     - `Authorization` → `Bearer YOUR-SUPABASE-ANON-KEY`
4. Click **Test step** — you should see your checkin data returned as JSON
5. Name this node `Get Today's Checkins`

### Step 4.4 — Calculate today's day index

1. Add a **Code** node after the HTTP Request
2. Paste this:

```js
// Calculate which day of the 30-day challenge today is
const startDate = new Date('2026-04-01') // change to your actual start date
const today     = new Date()
today.setHours(0, 0, 0, 0)
startDate.setHours(0, 0, 0, 0)

const dayIndex = Math.floor((today - startDate) / 86400000)

// Count how many checkins exist for today
const checkins    = $input.all()[0].json
const todayChecks = checkins.filter(c => c.day_index === dayIndex && c.checked === true)

return [{
  json: {
    dayIndex,
    todayCount:  todayChecks.length,
    needsReminder: todayChecks.length === 0,
    dateLabel: today.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' }),
  }
}]
```

3. Name this node `Check Today Progress`

### Step 4.5 — Add an IF node (only send reminder if not done)

1. Add an **IF** node after the Code node
2. Configure:
   - **Value 1:** click the expression icon `{}` and select `needsReminder` from the previous node
   - **Operation:** is equal to
   - **Value 2:** `true`
3. The IF node has two outputs — **True** (send reminder) and **False** (skip)

### Step 4.6 — Send the reminder (choose email OR WhatsApp)

**Option A — Email via Gmail:**

1. On the **True** branch, add a **Gmail** node
2. Click **Connect Gmail** → sign in with your Google account
3. Configure:
   - **To:** your email address
   - **Subject:** `🌹 Day {{ $json.dayIndex + 1 }}: Time to check in!`
   - **Message (HTML on):**

```html
<div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;background:#fdf0f3;padding:24px;border-radius:16px">
  <h2 style="color:#6a1a38;font-weight:normal">🌹 Habit Tracker Reminder</h2>
  <p style="color:#a03060">It's <strong>{{ $json.dateLabel }}</strong> — Day {{ $json.dayIndex + 1 }} of 30.</p>
  <p style="color:#5a1a30">You haven't checked in yet today. Your streak is counting on you! 🌱</p>
  <a href="https://your-app.vercel.app" 
     style="display:inline-block;background:#e879a0;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-family:sans-serif;font-weight:bold;margin-top:8px">
    Check In Now →
  </a>
  <p style="color:#c06080;font-size:12px;margin-top:16px;font-style:italic">Stay consistent and watch your rose fully bloom 🌹</p>
</div>
```

**Option B — WhatsApp via Twilio:**

> WhatsApp requires a Twilio account with WhatsApp Business API enabled. The free trial gives you enough credits to test.

1. Go to [twilio.com](https://twilio.com) → sign up
2. In Twilio Console, activate the WhatsApp Sandbox — follow their instructions to link your number (you text a code to a Twilio number)
3. In n8n, add an **HTTP Request** node on the True branch:
   - **Method:** POST
   - **URL:** `https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages.json`
   - **Authentication:** Basic Auth
     - **Username:** your Twilio Account SID
     - **Password:** your Twilio Auth Token
   - **Body:** Form Data
     - `From` → `whatsapp:+14155238886` (Twilio sandbox number)
     - `To` → `whatsapp:+353YOUR_NUMBER` (your number with country code)
     - `Body` → `🌹 Day {{ $json.dayIndex + 1 }} check-in reminder! You haven't logged your habits yet today. Open your tracker: https://your-app.vercel.app`

### Step 4.7 — Activate the workflow

1. Click **Save** in the top right
2. Toggle the workflow to **Active**

It will now run at 8am every day automatically.

---

## Part 5 — Workflow 2: Weekly Summary Email

This workflow runs every Sunday evening and sends you a summary of the week — which habits you nailed, which slipped, and your overall discipline score.

### Step 5.1 — Create a new workflow

Click **+ New Workflow**, name it `Weekly Habit Summary`

### Step 5.2 — Schedule trigger (Sunday 7pm)

1. Add a **Schedule Trigger**
2. Configure:
   - **Mode:** Custom (Cron)
   - **Cron Expression:** `0 19 * * 0`
   - (This means: minute 0, hour 19, any day of month, any month, day-of-week 0 = Sunday)
   - **Timezone:** Europe/Dublin

### Step 5.3 — Fetch all habits

1. Add **HTTP Request** node
2. Configure:
   - **Method:** GET
   - **URL:** `https://YOUR-PROJECT-ID.supabase.co/rest/v1/habits?user_id=eq.default&order=position`
   - **Headers:** same as before (`apikey` and `Authorization`)
3. Name it `Get Habits`

### Step 5.4 — Fetch all checkins

1. Add another **HTTP Request** node
2. Configure:
   - **URL:** `https://YOUR-PROJECT-ID.supabase.co/rest/v1/checkins?user_id=eq.default`
   - Same headers
3. Name it `Get Checkins`

### Step 5.5 — Calculate the weekly summary

1. Add a **Code** node that takes both inputs (drag both HTTP Request nodes into it)
2. Paste:

```js
const startDate = new Date('2026-04-01') // your actual start date
const today     = new Date()
today.setHours(0, 0, 0, 0)
startDate.setHours(0, 0, 0, 0)

const todayIdx  = Math.floor((today - startDate) / 86400000)
const weekStart = Math.max(0, todayIdx - 6)  // last 7 days

const habits   = $('Get Habits').all()[0].json
const checkins = $('Get Checkins').all()[0].json

// Build a lookup: { habitId: boolean[30] }
const checkMap = {}
for (const c of checkins) {
  if (!checkMap[c.habit_id]) checkMap[c.habit_id] = Array(30).fill(false)
  checkMap[c.habit_id][c.day_index] = c.checked
}

// Calculate per-habit weekly stats
const habitStats = habits.map(h => {
  const row         = checkMap[h.id] || Array(30).fill(false)
  const weekDays    = row.slice(weekStart, todayIdx + 1)
  const done        = weekDays.filter(Boolean).length
  const total       = weekDays.length
  const pct         = Math.round(done / total * 100)
  const streak      = (() => {
    let s = 0
    for (let d = todayIdx; d >= 0; d--) { if (row[d]) s++; else break }
    return s
  })()
  return { name: h.name, done, total, pct, streak, core: h.core }
})

// Overall weekly score
const overallPct = Math.round(habitStats.reduce((s,h)=>s+h.pct*(h.core?1.5:1),0) /
  habitStats.reduce((s,h)=>s+(h.core?150:100),0) * 100)

const weekNumber = Math.ceil((todayIdx + 1) / 7)

// Build HTML rows for the table
const rows = habitStats.map(h => {
  const color = h.pct >= 80 ? '#5bbf7a' : h.pct >= 50 ? '#e879a0' : '#d4a017'
  return `<tr>
    <td style="padding:8px 12px;color:#5a1a30;font-family:sans-serif;font-size:13px">${h.name}${h.core?' <span style="font-size:9px;background:#fde8f0;color:#c04070;border-radius:3px;padding:1px 4px">CORE</span>':''}</td>
    <td style="padding:8px 12px;text-align:center;font-family:sans-serif;font-size:13px;font-weight:700;color:${color}">${h.pct}%</td>
    <td style="padding:8px 12px;text-align:center;font-family:sans-serif;font-size:13px;color:#a03060">${h.done}/${h.total}</td>
    <td style="padding:8px 12px;text-align:center;font-family:sans-serif;font-size:13px">🔥 ${h.streak}</td>
  </tr>`
}).join('')

return [{
  json: {
    weekNumber,
    overallPct,
    habitStats,
    rows,
    todayIdx,
    weekStart,
  }
}]
```

### Step 5.6 — Send the summary email

Add a **Gmail** node and configure:

- **To:** your email
- **Subject:** `🌹 Week {{ $json.weekNumber }} Habit Summary — {{ $json.overallPct }}% discipline`
- **Message (HTML on):**

```html
<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#fdf0f3;padding:0;border-radius:16px;overflow:hidden">
  
  <!-- Header -->
  <div style="background:linear-gradient(135deg,#f8c4d8,#f0a0c4);padding:28px 28px 20px;text-align:center">
    <div style="font-size:10px;letter-spacing:4px;color:#a03060;font-family:sans-serif;text-transform:uppercase;margin-bottom:4px">Weekly Wrap-Up</div>
    <h1 style="font-size:26px;color:#6a1a38;font-weight:normal;margin:0 0 6px">Week {{ $json.weekNumber }} · Habit Summary</h1>
    <div style="font-size:42px;font-weight:800;color:#c04070">{{ $json.overallPct }}%</div>
    <div style="font-size:13px;color:#a03060;font-family:sans-serif;margin-top:4px">Overall Discipline</div>
  </div>

  <!-- Table -->
  <div style="padding:20px 24px">
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="border-bottom:2px solid #fde8f0">
          <th style="padding:8px 12px;text-align:left;font-size:10px;color:#a03060;letter-spacing:2px;text-transform:uppercase;font-family:sans-serif">Habit</th>
          <th style="padding:8px 12px;text-align:center;font-size:10px;color:#a03060;letter-spacing:2px;text-transform:uppercase;font-family:sans-serif">%</th>
          <th style="padding:8px 12px;text-align:center;font-size:10px;color:#a03060;letter-spacing:2px;text-transform:uppercase;font-family:sans-serif">Done</th>
          <th style="padding:8px 12px;text-align:center;font-size:10px;color:#a03060;letter-spacing:2px;text-transform:uppercase;font-family:sans-serif">Streak</th>
        </tr>
      </thead>
      <tbody>{{ $json.rows }}</tbody>
    </table>
  </div>

  <!-- CTA -->
  <div style="padding:16px 24px 28px;text-align:center">
    <a href="https://your-app.vercel.app"
       style="display:inline-block;background:#e879a0;color:#fff;padding:12px 28px;border-radius:9px;text-decoration:none;font-family:sans-serif;font-weight:700;font-size:14px">
      Open Tracker 🌹
    </a>
    <p style="color:#c06080;font-size:12px;margin-top:16px;font-style:italic">Stay consistent and watch your rose fully bloom.</p>
  </div>
</div>
```

### Step 5.7 — Activate the workflow

Click **Save** → toggle **Active**. Every Sunday at 7pm you'll get a beautiful summary email.

---

## Part 6 — Final Deployment Checklist

Go through this in order before you consider it done:

```
□ Supabase project created and tables set up
□ .env file created locally with SUPABASE_URL and SUPABASE_ANON_KEY
□ npm install @supabase/supabase-js done
□ src/supabase.js created
□ src/db.js created
□ App.jsx updated to use Supabase (load + save functions)
□ App tested locally with npm run dev — data appears in Supabase tables
□ .env variables added to Vercel dashboard
□ Pushed to GitHub → Vercel auto-deployed
□ App opened on phone — same data as laptop ✓
□ n8n account created
□ Workflow 1 (Daily Reminder) built and set to Active
□ Workflow 2 (Weekly Summary) built and set to Active
□ Test email received ✓
```

---

## Common Issues & Fixes

**"Cannot read properties of undefined" when loading**  
→ Your Supabase URL or key is wrong in `.env`. Double-check for extra spaces or typos.

**Data isn't showing after deploy to Vercel**  
→ You forgot to add the env variables in the Vercel dashboard. Add them there (not just in `.env`) and redeploy.

**n8n says "Credentials not found"**  
→ You need to connect your Gmail account inside n8n. Go to **Credentials** in the sidebar → New → Gmail OAuth2.

**WhatsApp messages not sending**  
→ You need to have messaged the Twilio sandbox number first to activate your number. Check the Twilio Console sandbox instructions.

**Workflow runs but sends reminder even when habits are done**  
→ Your `startDate` in the Code node doesn't match the date in your app. Make sure they're the same.

---

## What's Next (Optional Upgrades)

Once this is all running, here's what you could add:

- **Telegram bot** instead of WhatsApp — easier to set up (no Twilio needed), n8n has a native Telegram node
- **Multi-user support** — enable Supabase Auth, each person gets their own data
- **Monthly report** — a third n8n workflow on the 1st of each month
- **Missed habit alert** — if a specific core habit hasn't been checked by 9pm, send a targeted nudge just for that habit

---

*Built with React + Vite + Supabase + n8n · Deployed on Vercel*
