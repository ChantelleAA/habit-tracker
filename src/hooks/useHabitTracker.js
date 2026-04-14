import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getProfile, saveProfile,
  getStartDate, saveStartDate,
  getHabits, saveHabit, deleteHabit, reorderHabits,
  getCheckins, clearCheckins, toggleCheckin,
  getIntentions, saveIntention,
  getReflections, saveReflection,
} from '../db';
import {
  DEFAULTS, FREQS, LEVELS, MILESTONES, isCycleOver,
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
  const [savedKeys,   setSavedKeys]   = useState({});   // tracks which fields just saved

  const debounceRefs = useRef({});
  const toastTimer   = useRef(null);
  const todayIdx = getDayIdx(startDate);
  const cycleOver = isCycleOver(startDate);

  // Clean up all debounce timers and toast timer on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceRefs.current).forEach(clearTimeout);
      clearTimeout(toastTimer.current);
    };
  }, []);

  const debounce = (key, fn, delay = 500) => {
    clearTimeout(debounceRefs.current[key]);
    debounceRefs.current[key] = setTimeout(fn, delay);
  };

  // Flash a "saved" indicator for a field key for 2 seconds
  const markSaved = useCallback((key) => {
    setSavedKeys(p => ({ ...p, [key]: true }));
    setTimeout(() => setSavedKeys(p => { const n = { ...p }; delete n[key]; return n; }), 2000);
  }, []);

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
  const showToast = useCallback((msg, type = 'default', emoji = null, onUndo = null) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type, emoji, onUndo });
    const delay = onUndo ? 5000 : 2800;
    toastTimer.current = setTimeout(() => {
      setToast(null);
      if (onUndo && type === 'undo') {
        // auto-commit: the caller's setTimeout handles the actual DB write
      }
    }, delay);
  }, []);

  const dismissToast = useCallback(() => {
    clearTimeout(toastTimer.current);
    setToast(null);
  }, []);

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
    const habit = habits.find(h => h.id === id);
    if (!habit) return;
    const habitPos     = habits.findIndex(h => h.id === id);
    const habitChecked = checked[id];

    // Optimistically remove
    setHabits(p => p.filter(h => h.id !== id));
    setChecked(p => { const n = { ...p }; delete n[id]; return n; });

    let undone = false;
    const undo = () => {
      undone = true;
      setHabits(p => { const n = [...p]; n.splice(habitPos, 0, habit); return n; });
      setChecked(p => ({ ...p, [id]: habitChecked || eRow() }));
      dismissToast();
    };

    showToast(`"${habit.name || 'Habit'}" removed`, 'undo', null, undo);

    setTimeout(() => {
      if (!undone) void persist(deleteHabit(id, userId));
    }, 5000);
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
    if (text.length > 280) return;
    setIntentions(p => { const n = [...p]; n[dayIndex] = text; return n; });
    debounce(`intention-${dayIndex}`, () => {
      saveIntention(dayIndex, text, startDate, userId)
        .then(() => markSaved(`intention-${dayIndex}`))
        .catch(err => { console.error(err); showToast(err.message || 'Save failed', 'error'); });
    }, 500);
  };

  const handleSetReflection = (weekIndex, text) => {
    if (text.length > 1000) return;
    setReflections(p => { const n = [...p]; n[weekIndex] = text; return n; });
    debounce(`reflection-${weekIndex}`, () => {
      saveReflection(weekIndex, text, startDate, userId)
        .then(() => markSaved(`reflection-${weekIndex}`))
        .catch(err => { console.error(err); showToast(err.message || 'Save failed', 'error'); });
    }, 500);
  };

  // Optimistic toggleCheck with rollback on failure
  const toggleCheck = (id, di) => {
    const row  = checked[id] || eRow();
    const going = !row[di];

    // Optimistic update
    setChecked(p => { const n = { ...p, [id]: [...(p[id] || eRow())] }; n[id][di] = going; return n; });

    toggleCheckin(id, di, going, startDate, userId).catch(err => {
      // Roll back on failure
      setChecked(p => { const n = { ...p, [id]: [...(p[id] || eRow())] }; n[id][di] = !going; return n; });
      showToast(err.message || 'Save failed', 'error');
    });

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
    const savedChecked = { ...checked };
    setChecked(p => {
      const n = { ...p };
      habits.forEach(h => { n[h.id] = [...(p[h.id] || eRow())]; n[h.id][todayIdx] = false; });
      return n;
    });

    let undone = false;
    const undo = () => {
      undone = true;
      setChecked(savedChecked);
      dismissToast();
    };

    showToast("Today's check-ins reset", 'undo', null, undo);

    setTimeout(() => {
      if (!undone) void persist(Promise.all(habits.map(h => toggleCheckin(h.id, todayIdx, false, startDate, userId))));
    }, 5000);
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    await persist(saveProfile({ ...profile, auth_email: userEmail }, userId), 'Settings saved');
  };

  const handleResetCheckins = () => {
    const savedChecked = { ...checked };

    setChecked(Object.fromEntries(habits.map(h => [h.id, eRow()])));

    let undone = false;
    const undo = () => {
      undone = true;
      setChecked(savedChecked);
      dismissToast();
    };

    showToast('All check-ins reset', 'undo', null, undo);

    setTimeout(() => {
      if (!undone) void persist(clearCheckins(userId));
    }, 5000);
  };

  // Called when user completes onboarding
  const handleOnboardingComplete = async ({ habits: selectedHabits, startDate: chosenStart }) => {
    setStartDate(chosenStart);
    setHabits(selectedHabits);
    setChecked(Object.fromEntries(selectedHabits.map(h => [h.id, eRow()])));
    localStorage.setItem('habit-tracker-onboarded', '1');

    if (userId) {
      await saveStartDate(chosenStart, userId);
      await Promise.all(selectedHabits.map((h, i) => saveHabit(h, i, userId)));
    }
  };

  // Called when user starts a new cycle after completing one
  const handleStartNewCycle = () => {
    const today = new Date().toISOString().slice(0, 10);

    // Save the completed cycle to localStorage history
    try {
      const history = JSON.parse(localStorage.getItem('habit-tracker-cycle-history') || '[]');
      history.push({ start: startDate, end: today, oPct });
      localStorage.setItem('habit-tracker-cycle-history', JSON.stringify(history));
    } catch (_) {}

    setStartDate(today);
    setChecked(Object.fromEntries(habits.map(h => [h.id, eRow()])));
    setIntentions(Array(30).fill(''));
    setReflections(Array(4).fill(''));

    if (userId) {
      void persist(saveStartDate(today, userId), 'New cycle started! 🌱');
    }
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

  const isOnboarded = userId
    ? habits.length > 0 || localStorage.getItem('habit-tracker-onboarded') === '1'
    : true;

  return {
    // state
    habits, checked, startDate, intentions, reflections,
    profile, setProfile, toast, dragIdx, loaded,
    savedKeys, cycleOver,
    // derived
    todayIdx, oPct, cStreak, lStreak, consist, xp, level, nextLvl, xpPct, todayDone, status, dailyPcts,
    isOnboarded,
    // calculation helpers
    hDone, hTarget, hPct, streakFor,
    // actions
    addHabit, removeHabit, updHabit,
    handleSetStartDate, handleSetIntention, handleSetReflection,
    toggleCheck, markAllToday, resetDay,
    handleSaveProfile, handleResetCheckins,
    handleOnboardingComplete, handleStartNewCycle,
    onDragStart, onDragOver, onDragEnd,
    showToast, dismissToast,
  };
}
