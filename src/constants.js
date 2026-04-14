export const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export const CATS = {
  health:       { label:"Health 🩺",       color:"var(--cat-health)", bg:"var(--cat-health-bg)" },
  mindset:      { label:"Mindset 🧠",      color:"var(--cat-mind)", bg:"var(--cat-mind-bg)" },
  productivity: { label:"Productivity ⚡", color:"var(--cat-prod)", bg:"var(--cat-prod-bg)" },
  fitness:      { label:"Fitness 💪",      color:"var(--cat-fit)", bg:"var(--cat-fit-bg)" },
  other:        { label:"Other ✨",        color:"var(--cat-other)", bg:"var(--cat-other-bg)" },
};

export const FREQS = {
  daily: { label:"Daily",   target:30 },
  "5x":  { label:"5×/week", target:21 },
  "3x":  { label:"3×/week", target:13 },
};

export const LEVELS = [
  { name:"Seedling 🌱", min:0,    next:500  },
  { name:"Sprout 🌿",   min:500,  next:1500 },
  { name:"Bloom 🌷",    min:1500, next:3000 },
  { name:"Garden 🌹",   min:3000, next:null },
];

export const MILESTONES = [
  { days:3,  emoji:"🌿", label:"3-Day Spark"  },
  { days:7,  emoji:"🌱", label:"One Week"      },
  { days:14, emoji:"🌷", label:"Two Weeks"     },
  { days:21, emoji:"🌸", label:"21-Day Habit"  },
  { days:30, emoji:"🌹", label:"Full Bloom"    },
];

export const DEFAULTS = [
  { id:"00000000-0000-0000-0000-000000000001", name:"Water Intake",    cat:"health",       freq:"daily", core:true  },
  { id:"00000000-0000-0000-0000-000000000002", name:"30 Mins Reading", cat:"mindset",      freq:"daily", core:false },
  { id:"00000000-0000-0000-0000-000000000003", name:"Meditate",        cat:"mindset",      freq:"daily", core:true  },
  { id:"00000000-0000-0000-0000-000000000004", name:"10K Steps",       cat:"fitness",      freq:"5x",    core:false },
  { id:"00000000-0000-0000-0000-000000000005", name:"Training",        cat:"fitness",      freq:"3x",    core:false },
  { id:"00000000-0000-0000-0000-000000000006", name:"Tidy Room",       cat:"productivity", freq:"daily", core:false },
  { id:"00000000-0000-0000-0000-000000000007", name:"Sunlight",        cat:"health",       freq:"daily", core:false },
];

export const defaultReminderSettings = (reminderEmail = '') => ({
  reminder_email: reminderEmail,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  reminder_time: '08:00',
  reminders_enabled: true,
});

export const eRow = () => Array(30).fill(false);

export const plantFor = p => p>=90?"🌹":p>=70?"🌷":p>=50?"🌱":p>=20?"🌿":"🪴";

export const getDayIdx = (startDate) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const start = new Date(startDate); start.setHours(0,0,0,0);
  return Math.max(0, Math.min(29, Math.floor((today - start) / 86400000)));
};

export const isCycleOver = (startDate) => {
  if (!startDate) return false;
  // Use UTC midnight arithmetic to avoid DST clock-change errors
  const [y, m, d] = String(startDate).split('-').map(Number);
  const startMs = Date.UTC(y, m - 1, d);
  const now = new Date();
  const todayMs = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((todayMs - startMs) / 86400000) >= 30;
};

export const fmtDate = (startDate, di) => {
  const d = new Date(startDate);
  d.setDate(d.getDate() + di);
  return d.toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"long" });
};
