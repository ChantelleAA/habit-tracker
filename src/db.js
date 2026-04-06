import { supabase } from './supabase'
const USER_ID = 'default' // single-user app

// ─── SETTINGS ───────────────────────────────────────────────
export async function getStartDate() {
  const { data } = await supabase
    .from('settings')
    .select('start_date')
    .eq('user_id', USER_ID)
    .maybeSingle()

  return data?.start_date || new Date().toISOString().slice(0, 10)
}

export async function saveStartDate(date) {
  await supabase
    .from('settings')
    .upsert(
      { user_id: USER_ID, start_date: date, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
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
    .upsert(
      { ...habit, user_id: USER_ID, position },
      { onConflict: 'id' }
    )
}

export async function deleteHabit(id) {
  await supabase.from('habits').delete().eq('id', id)
}

export async function reorderHabits(habits) {
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
    .upsert(
      { habit_id: habitId, user_id: USER_ID, day_index: dayIndex, checked },
      { onConflict: 'user_id,habit_id,day_index' }
    )
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
    .upsert(
      { user_id: USER_ID, day_index: dayIndex, text },
      { onConflict: 'user_id,day_index' }
    )
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
    .upsert(
      { user_id: USER_ID, week_index: weekIndex, text },
      { onConflict: 'user_id,week_index' }
    )
}