import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getDayIdx, isCycleOver, FREQS, MILESTONES } from '../constants';

// ─── Pure calculation helpers (extracted for testability) ────────────────────

const eRow = () => Array(30).fill(false);

const hDone = (checked, id) => (checked[id] || []).filter(Boolean).length;

const hTarget = (h) => FREQS[h.freq]?.target || 30;

const hPct = (checked, h) => Math.min(100, Math.round(hDone(checked, h.id) / hTarget(h) * 100));

const streakFor = (checked, id, upTo) => {
  const row = checked[id] || [];
  let s = 0;
  for (let d = upTo; d >= 0; d--) { if (row[d]) s++; else break; }
  return s;
};

const oPct = (habits, checked) => {
  if (!habits.length) return 0;
  const weighted = habits.reduce((s, h) => s + hPct(checked, h) * (h.core ? 1.5 : 1), 0);
  const maxW     = habits.reduce((s, h) => s + (h.core ? 150 : 100), 0);
  return Math.round(weighted / maxW * 100);
};

const calcXp = (habits, checked, todayIdx) => {
  let total = habits.reduce((s, h) => s + hDone(checked, h.id) * (h.core ? 15 : 10), 0);
  habits.forEach(h => {
    const st = streakFor(checked, h.id, todayIdx);
    if (st >= 30) total += 500;
    else if (st >= 21) total += 250;
    else if (st >= 14) total += 150;
    else if (st >= 7)  total += 75;
    else if (st >= 3)  total += 25;
  });
  return total;
};

// ─── getDayIdx ───────────────────────────────────────────────────────────────

describe('getDayIdx', () => {
  it('returns 0 on the start date', () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(getDayIdx(today)).toBe(0);
  });

  it('clamps to 0 for past start dates', () => {
    // Start date in the future → should be 0, not negative
    const future = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
    expect(getDayIdx(future)).toBe(0);
  });

  it('clamps to 29 after 30+ days', () => {
    const longAgo = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);
    expect(getDayIdx(longAgo)).toBe(29);
  });

  it('returns correct index mid-cycle', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10);
    expect(getDayIdx(tenDaysAgo)).toBe(10);
  });
});

// ─── isCycleOver ─────────────────────────────────────────────────────────────

describe('isCycleOver', () => {
  it('returns false on the start date', () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(isCycleOver(today)).toBe(false);
  });

  it('returns false on day 29', () => {
    const day29 = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
    expect(isCycleOver(day29)).toBe(false);
  });

  it('returns true on day 30', () => {
    // Use calendar-day arithmetic to avoid DST edge cases
    const now = new Date();
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - 30 * 86400000);
    const day30 = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
    expect(isCycleOver(day30)).toBe(true);
  });

  it('returns false for null/undefined startDate', () => {
    expect(isCycleOver(null)).toBe(false);
    expect(isCycleOver(undefined)).toBe(false);
  });
});

// ─── streakFor ───────────────────────────────────────────────────────────────

describe('streakFor', () => {
  it('returns 0 with no check-ins', () => {
    expect(streakFor({}, 'h1', 5)).toBe(0);
  });

  it('counts a consecutive streak', () => {
    const row = eRow();
    row[3] = true; row[4] = true; row[5] = true;
    expect(streakFor({ h1: row }, 'h1', 5)).toBe(3);
  });

  it('breaks streak on a missed day', () => {
    const row = eRow();
    row[2] = true; // gap at 3
    row[4] = true; row[5] = true;
    expect(streakFor({ h1: row }, 'h1', 5)).toBe(2);
  });

  it('counts from upTo backwards, not from day 0', () => {
    const row = eRow();
    row[0] = true; row[1] = true; // old streak
    row[5] = true; row[6] = true; // recent streak
    expect(streakFor({ h1: row }, 'h1', 6)).toBe(2);
  });

  it('handles a full 30-day streak', () => {
    const row = Array(30).fill(true);
    expect(streakFor({ h1: row }, 'h1', 29)).toBe(30);
  });

  it('handles upTo = 0', () => {
    const row = eRow();
    row[0] = true;
    expect(streakFor({ h1: row }, 'h1', 0)).toBe(1);
  });
});

// ─── hTarget ─────────────────────────────────────────────────────────────────

describe('hTarget', () => {
  it('daily habit targets 30', () => {
    expect(hTarget({ freq: 'daily' })).toBe(30);
  });

  it('5x habit targets 21', () => {
    expect(hTarget({ freq: '5x' })).toBe(21);
  });

  it('3x habit targets 13', () => {
    expect(hTarget({ freq: '3x' })).toBe(13);
  });

  it('unknown freq falls back to 30', () => {
    expect(hTarget({ freq: 'unknown' })).toBe(30);
  });
});

// ─── hPct ────────────────────────────────────────────────────────────────────

describe('hPct', () => {
  it('returns 0 with no check-ins', () => {
    const h = { id: 'h1', freq: 'daily' };
    expect(hPct({}, h)).toBe(0);
  });

  it('returns 100 when target met exactly', () => {
    const h = { id: 'h1', freq: 'daily' };
    const row = Array(30).fill(true);
    expect(hPct({ h1: row }, h)).toBe(100);
  });

  it('clamps to 100 even if over target', () => {
    const h = { id: 'h1', freq: '3x' }; // target 13
    const row = Array(30).fill(true);    // 30 done
    expect(hPct({ h1: row }, h)).toBe(100);
  });

  it('calculates percentage correctly at 50%', () => {
    const h = { id: 'h1', freq: 'daily' }; // target 30
    const row = eRow();
    for (let i = 0; i < 15; i++) row[i] = true;
    expect(hPct({ h1: row }, h)).toBe(50);
  });
});

// ─── oPct (weighted overall) ─────────────────────────────────────────────────

describe('oPct', () => {
  it('returns 0 with no habits', () => {
    expect(oPct([], {})).toBe(0);
  });

  it('100% when all daily habits fully done', () => {
    const habits = [
      { id: 'h1', freq: 'daily', core: false },
      { id: 'h2', freq: 'daily', core: false },
    ];
    const checked = {
      h1: Array(30).fill(true),
      h2: Array(30).fill(true),
    };
    expect(oPct(habits, checked)).toBe(100);
  });

  it('core habits have 1.5× weight', () => {
    // One core habit at 100%, one non-core at 0%
    // weighted = 100*1.5 + 0*1 = 150; maxW = 150 + 100 = 250
    // oPct = round(150/250*100) = 60
    const habits = [
      { id: 'core', freq: 'daily', core: true  },
      { id: 'reg',  freq: 'daily', core: false },
    ];
    const checked = {
      core: Array(30).fill(true),
      reg:  Array(30).fill(false),
    };
    expect(oPct(habits, checked)).toBe(60);
  });

  it('both core habits weight symmetrically at 50% each', () => {
    const habits = [{ id: 'h1', freq: 'daily', core: true }];
    const row = eRow();
    for (let i = 0; i < 15; i++) row[i] = true;
    expect(oPct(habits, { h1: row })).toBe(50);
  });
});

// ─── XP calculation ──────────────────────────────────────────────────────────

describe('calcXp', () => {
  it('awards 10 XP per check-in for non-core habits', () => {
    const habits = [{ id: 'h1', freq: 'daily', core: false }];
    const row = eRow(); row[0] = true; row[1] = true; // 2 check-ins
    expect(calcXp(habits, { h1: row }, 1)).toBe(20);
  });

  it('awards 15 XP per check-in for core habits', () => {
    const habits = [{ id: 'h1', freq: 'daily', core: true }];
    const row = eRow(); row[0] = true; row[1] = true; // 2 check-ins
    expect(calcXp(habits, { h1: row }, 1)).toBe(30);
  });

  it('awards 25 bonus XP for a 3-day streak', () => {
    const habits = [{ id: 'h1', freq: 'daily', core: false }];
    const row = eRow();
    row[0] = true; row[1] = true; row[2] = true;
    // 3 check-ins = 30 XP + 25 streak bonus = 55
    expect(calcXp(habits, { h1: row }, 2)).toBe(55);
  });

  it('awards 75 bonus XP for a 7-day streak', () => {
    const habits = [{ id: 'h1', freq: 'daily', core: false }];
    const row = eRow();
    for (let i = 0; i < 7; i++) row[i] = true;
    // 7 check-ins = 70 XP + 75 streak bonus = 145
    expect(calcXp(habits, { h1: row }, 6)).toBe(145);
  });
});

// ─── MILESTONES ──────────────────────────────────────────────────────────────

describe('MILESTONES', () => {
  it('has milestones at 3, 7, 14, 21, 30 days', () => {
    const days = MILESTONES.map(m => m.days);
    expect(days).toEqual([3, 7, 14, 21, 30]);
  });

  it('each milestone has emoji and label', () => {
    MILESTONES.forEach(m => {
      expect(m.emoji).toBeTruthy();
      expect(m.label).toBeTruthy();
    });
  });
});
