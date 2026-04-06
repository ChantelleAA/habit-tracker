import { useState, useEffect, useRef } from 'react';
import {
  getProfile, saveProfile,
  getStartDate, saveStartDate,
  getHabits, saveHabit, deleteHabit, reorderHabits,
  getCheckins, clearCheckins, toggleCheckin,
  getIntentions, saveIntention,
  getReflections, saveReflection,
} from '../db';
import {
  DEFAULTS, FREQS, LEVELS, MILESTONES,
  defaultReminderSettings, eRow, getDayIdx,
} from '../constants';

export function useHabitTracker(userId, userEmail) {
  const [habits,      setHabits]      = useState(DEFAULTS);
  const [checked,     setChecked]     = useState({});
  const [startDate,   setStartDate]   = useState(new Date().toISOString().slice(0, 10));
  const [intentions,  setIntentions]  = useState(Array(30).fill(''));
  const [reflections, setReflections] = useState(Array(4).fill(''));
  const [profile,     setProfile]     = useState(defaultReminderSettings());
  const [toast,       setToast]       = useState(null);
  const [dragIdx,     setDragIdx]     = useState(null);
  const [loaded,      setLoaded]      = useState(false);

  const debounceRefs = useRef({});
  const todayIdx = getDayIdx(startDate);

  const debounce = (key, fn, delay = 500) => {
    clearTimeout(debounceRefs.current[key]);
    debounceRefs.current[key] = setTimeout(fn, delay);
  };

  // ── Load data ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!userId) {
        setHabits(DEFAULTS);
        setChecked({});
        setStartDate(new Date().toISOString().slice(0, 10));
        setIntentions(Array(30).fill(''));
        setReflections(Array(4).fill(''));
        setProfile(defaultReminderSettings());
        setLoaded(true);
        return;
      }

      setLoaded(false);
      try {
        const currentStartDate = await getStartDate(userId);
        const [h, c, i, r, userProfile] = await Promise.all([
          getHabits(userId),
          getCheckins(currentStartDate, userId),
          getIntentions(currentStartDate, userId),
          getReflections(currentStartDate, userId),
          getProfile(userId),
        ]);

        if (cancelled) return;
        setHabits(h.length > 0 ? h : []);
        setChecked(c);
        setStartDate(currentStartDate);
        setIntentions(i);
        setReflections(r);
        setProfile({ ...defaultReminderSettings(userEmail), auth_email: userEmail, ...userProfile });
      } catch (error) {
        console.error(error);
        if (!cancelled) showToast(error.message || 'Failed to load data', 'error');
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [userId, userEmail]);

  // ── Toast ──────────────────────────────────────────────────────
  // type: 'default' | 'error' | 'milestone' (milestone passes emoji in msg separately)
  const showToast = (msg, type = 'default', emoji = null) => {
    setToast({ msg, type, emoji });
    setTimeout(() => setToast(null), 2800);
  };

  const persist = async (operation, successMessage) => {
    try {
      await operation;
      if (successMessage) showToast(successMessage);
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Save failed', 'error');
    }
  };

  // ── Habit CRUD ─────────────────────────────────────────────────
  const addHabit = () => {
    const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 8);
    const newHabit = { id, name: "", cat: "health", freq: "daily", core: false };
    setHabits(p => {
      const updated = [...p, newHabit];
      void persist(saveHabit(newHabit, updated.length - 1, userId));
      return updated;
    });
    setChecked(p => ({ ...p, [id]: eRow() }));
  };

  const removeHabit = (id) => {
    if (!window.confirm(`Remove "${habits.find(h => h.id === id)?.name || "habit"}"?`)) return;
    setHabits(p => p.filter(h => h.id !== id));
    setChecked(p => { const n = { ...p }; delete n[id]; return n; });
    void persist(deleteHabit(id, userId));
  };

  const updHabit = (id, field, val) => {
    setHabits(p => {
      const updated = p.map(h => h.id === id ? { ...h, [field]: val } : h);
      const habit = updated.find(h => h.id === id);
      const pos = updated.findIndex(h => h.id === id);
      if (habit) {
        const save = () => void persist(saveHabit(habit, pos, userId));
        field === 'name' ? debounce(`habit-name-${id}`, save, 500) : save();
      }
      return updated;
    });
  };

  const handleSetStartDate = (date) => {
    setStartDate(date);
    void persist(saveStartDate(date, userId));
  };

  const handleSetIntention = (dayIndex, text) => {
    setIntentions(p => { const n = [...p]; n[dayIndex] = text; return n; });
    debounce(`intention-${dayIndex}`, () => void persist(saveIntention(dayIndex, text, startDate, userId)), 500);
  };

  const handleSetReflection = (weekIndex, text) => {
    setReflections(p => { const n = [...p]; n[weekIndex] = text; return n; });
    debounce(`reflection-${weekIndex}`, () => void persist(saveReflection(weekIndex, text, startDate, userId)), 500);
  };

  const toggleCheck = (id, di) => {
    const row = checked[id] || eRow();
    const going = !row[di];
    setChecked(p => { const n = { ...p, [id]: [...(p[id] || eRow())] }; n[id][di] = going; return n; });
    void persist(toggleCheckin(id, di, going, startDate, userId));
    if (going) {
      const newRow = [...row]; newRow[di] = true;
      let streak = 0;
      for (let d = di; d >= 0; d--) { if (newRow[d]) streak++; else break; }
      const ms = MILESTONES.find(m => m.days === streak);
      if (ms) showToast(`${ms.label} streak!`, 'milestone', ms.emoji);
    }
  };

  const markAllToday = () => {
    setChecked(p => {
      const n = { ...p };
      habits.forEach(h => { n[h.id] = [...(p[h.id] || eRow())]; n[h.id][todayIdx] = true; });
      return n;
    });
    void persist(
      Promise.all(habits.map(h => toggleCheckin(h.id, todayIdx, true, startDate, userId))),
      "All habits checked for today!"
    );
  };

  const resetDay = () => {
    setChecked(p => {
      const n = { ...p };
      habits.forEach(h => { n[h.id] = [...(p[h.id] || eRow())]; n[h.id][todayIdx] = false; });
      return n;
    });
    void persist(Promise.all(habits.map(h => toggleCheckin(h.id, todayIdx, false, startDate, userId))));
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    await persist(saveProfile({ ...profile, auth_email: userEmail }, userId), 'Reminder settings saved');
  };

  const handleResetCheckins = () => {
    if (!window.confirm("Reset all check-ins? Names and settings will be kept.")) return;
    setChecked(Object.fromEntries(habits.map(h => [h.id, eRow()])));
    void persist(clearCheckins(userId));
  };

  // ── Drag to reorder ────────────────────────────────────────────
  const onDragStart = i => setDragIdx(i);
  const onDragOver = (e, i) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) return;
    setHabits(p => { const n = [...p]; const [m] = n.splice(dragIdx, 1); n.splice(i, 0, m); return n; });
    setDragIdx(i);
  };
  const onDragEnd = () => {
    setDragIdx(null);
    void persist(reorderHabits(habits, userId));
  };

  // ── Calculations ───────────────────────────────────────────────
  const hDone   = id => (checked[id] || []).filter(Boolean).length;
  const hTarget = h  => FREQS[h.freq]?.target || 30;
  const hPct    = h  => Math.min(100, Math.round(hDone(h.id) / hTarget(h) * 100));

  const dayCount  = di => habits.filter(h => (checked[h.id] || [])[di]).length;
  const dayPct    = di => habits.length > 0 ? Math.round(dayCount(di) / habits.length * 100) : 0;
  const dailyPcts = Array.from({ length: 30 }, (_, d) => dayPct(d));

  const streakFor = (id, upTo = todayIdx) => {
    const row = checked[id] || [];
    let s = 0;
    for (let d = upTo; d >= 0; d--) { if (row[d]) s++; else break; }
    return s;
  };

  const cStreak = (() => { let s = 0; for (let d = todayIdx; d >= 0; d--) { if (dayCount(d) > 0) s++; else break; } return s; })();
  const lStreak = (() => { let max = 0, cur = 0; for (let d = 0; d <= todayIdx; d++) { if (dayCount(d) > 0) { cur++; max = Math.max(max, cur); } else cur = 0; } return max; })();

  const oPct = (() => {
    if (!habits.length) return 0;
    const weighted = habits.reduce((s, h) => s + hPct(h) * (h.core ? 1.5 : 1), 0);
    const maxW     = habits.reduce((s, h) => s + (h.core ? 150 : 100), 0);
    return Math.round(weighted / maxW * 100);
  })();

  const xp = (() => {
    let total = habits.reduce((s, h) => s + hDone(h.id) * (h.core ? 15 : 10), 0);
    habits.forEach(h => {
      const st = streakFor(h.id);
      if (st >= 30) total += 500;
      else if (st >= 21) total += 250;
      else if (st >= 14) total += 150;
      else if (st >= 7)  total += 75;
      else if (st >= 3)  total += 25;
    });
    return total;
  })();

  const consist   = dailyPcts.filter(p => p > 0).length;
  const level     = LEVELS.slice().reverse().find(l => xp >= l.min) || LEVELS[0];
  const nextLvl   = LEVELS[LEVELS.indexOf(level) + 1];
  const xpPct     = nextLvl ? Math.round((xp - level.min) / (nextLvl.min - level.min) * 100) : 100;
  const todayDone = habits.filter(h => (checked[h.id] || [])[todayIdx]).length;
  const status    = oPct >= 80 ? "Peak Discipline" : oPct >= 60 ? "Strong Momentum" : oPct >= 40 ? "Building Up 🌱" : "Just Getting Started 🪴";

  return {
    // state
    habits, checked, startDate, intentions, reflections,
    profile, setProfile, toast, dragIdx, loaded,
    // derived
    todayIdx, oPct, cStreak, lStreak, consist, xp, level, nextLvl, xpPct, todayDone, status, dailyPcts,
    // calculation helpers
    hDone, hTarget, hPct, streakFor,
    // actions
    addHabit, removeHabit, updHabit,
    handleSetStartDate, handleSetIntention, handleSetReflection,
    toggleCheck, markAllToday, resetDay,
    handleSaveProfile, handleResetCheckins,
    onDragStart, onDragOver, onDragEnd,
    showToast,
  };
}
