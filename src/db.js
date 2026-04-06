import { supabase } from './supabase'
const USER_ID = 'default' // legacy fallback for unauthenticated calls

const resolveUserId = (userId = USER_ID) => userId

const assertDbError = (error) => {
  if (error) throw error
}

const parseDateOnly = (value) => {
  if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate())
  const [year, month, day] = String(value).split('-').map(Number)
  return new Date(year, month - 1, day)
}

const toISODate = (value) => {
  const date = parseDateOnly(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const addDays = (dateString, offset) => {
  const date = parseDateOnly(dateString)
  date.setDate(date.getDate() + offset)
  return toISODate(date)
}

const diffDays = (startDate, targetDate) => {
  const start = parseDateOnly(startDate)
  const target = parseDateOnly(targetDate)
  start.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.floor((target - start) / 86400000)
}

const defaultProfile = (userId = USER_ID, reminderEmail = '') => ({
  user_id: userId,
  reminder_email: reminderEmail,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  reminder_time: '08:00',
  reminders_enabled: true,
})

// ─── PROFILE ────────────────────────────────────────────────
export async function getProfile(userId = USER_ID) {
  const resolvedUserId = resolveUserId(userId)
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', resolvedUserId)
    .maybeSingle()

  assertDbError(error)

  return data || defaultProfile(resolvedUserId)
}

export async function saveProfile(profile, userId = USER_ID) {
  const resolvedUserId = resolveUserId(userId)
  const fallback = defaultProfile(resolvedUserId, profile?.reminder_email || '')

  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        user_id: resolvedUserId,
        auth_email: profile?.auth_email || '',
        reminder_email: profile?.reminder_email || '',
        timezone: profile?.timezone || fallback.timezone,
        reminder_time: profile?.reminder_time || fallback.reminder_time,
        reminders_enabled: profile?.reminders_enabled ?? fallback.reminders_enabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

  assertDbError(error)
}

// ─── SETTINGS ───────────────────────────────────────────────
export async function getStartDate(userId = USER_ID) {
  const resolvedUserId = resolveUserId(userId)
  const { data, error } = await supabase
    .from('settings')
    .select('start_date')
    .eq('user_id', resolvedUserId)
    .maybeSingle()

  assertDbError(error)

  return data?.start_date || toISODate(new Date())
}

export async function saveStartDate(date, userId = USER_ID) {
  const resolvedUserId = resolveUserId(userId)
  const { error } = await supabase
    .from('settings')
    .upsert(
      { user_id: resolvedUserId, start_date: toISODate(date), updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )

  assertDbError(error)
}

// ─── HABITS ─────────────────────────────────────────────────
export async function getHabits(userId = USER_ID) {
  const resolvedUserId = resolveUserId(userId)
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', resolvedUserId)
    .order('position')

  assertDbError(error)

  return data || []
}

export async function saveHabit(habit, position, userId = USER_ID) {
  const resolvedUserId = resolveUserId(userId)
  const { error } = await supabase
    .from('habits')
    .upsert(
      { ...habit, user_id: resolvedUserId, position, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    )

  assertDbError(error)
}

export async function deleteHabit(id, userId = USER_ID) {
  const resolvedUserId = resolveUserId(userId)
  const { error } = await supabase.from('habits').delete().eq('id', id).eq('user_id', resolvedUserId)
  assertDbError(error)
}

export async function reorderHabits(habits, userId = USER_ID) {
  const resolvedUserId = resolveUserId(userId)
  const payload = habits.map((habit, index) => ({
    ...habit,
    user_id: resolvedUserId,
    position: index,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from('habits')
    .upsert(payload, { onConflict: 'id' })

  assertDbError(error)
}

// ─── CHECKINS ───────────────────────────────────────────────
export async function getCheckins(startDate, userId = USER_ID) {
  const resolvedUserId = resolveUserId(userId)
  const cycleStart = toISODate(startDate)
  const cycleEnd = addDays(cycleStart, 29)
  const { data, error } = await supabase
    .from('checkins')
    .select('*')
    .eq('user_id', resolvedUserId)
    .gte('check_date', cycleStart)
    .lte('check_date', cycleEnd)

  assertDbError(error)

  const result = {}
  for (const row of data || []) {
    if (!result[row.habit_id]) result[row.habit_id] = Array(30).fill(false)
    const index = diffDays(cycleStart, row.check_date)
    if (index >= 0 && index < 30) {
      result[row.habit_id][index] = row.checked
    }
  }

  return result
}

export async function clearCheckins(userId = USER_ID) {
  const resolvedUserId = resolveUserId(userId)
  const { error } = await supabase.from('checkins').delete().eq('user_id', resolvedUserId)
  assertDbError(error)
}

export async function toggleCheckin(habitId, dayIndex, checked, startDate, userId = USER_ID) {
  const resolvedUserId = resolveUserId(userId)
  const checkDate = addDays(startDate, dayIndex)
  const { error } = await supabase
    .from('checkins')
    .upsert(
      { habit_id: habitId, user_id: resolvedUserId, check_date: checkDate, day_index: dayIndex, checked, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,habit_id,check_date' }
    )

  assertDbError(error)
}

// ─── INTENTIONS ─────────────────────────────────────────────
export async function getIntentions(startDate, userId = USER_ID) {
  const resolvedUserId = resolveUserId(userId)
  const cycleStart = toISODate(startDate)
  const cycleEnd = addDays(cycleStart, 29)
  const { data, error } = await supabase
    .from('intentions')
    .select('*')
    .eq('user_id', resolvedUserId)
    .gte('entry_date', cycleStart)
    .lte('entry_date', cycleEnd)

  assertDbError(error)

  const result = Array(30).fill('')
  for (const row of data || []) {
    const index = diffDays(cycleStart, row.entry_date)
    if (index >= 0 && index < 30) result[index] = row.text
  }
  return result
}

export async function saveIntention(dayIndex, text, startDate, userId = USER_ID) {
  const resolvedUserId = resolveUserId(userId)
  const entryDate = addDays(startDate, dayIndex)
  const { error } = await supabase
    .from('intentions')
    .upsert(
      { user_id: resolvedUserId, entry_date: entryDate, day_index: dayIndex, text, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,entry_date' }
    )

  assertDbError(error)
}

// ─── REFLECTIONS ────────────────────────────────────────────
export async function getReflections(startDate, userId = USER_ID) {
  const resolvedUserId = resolveUserId(userId)
  const cycleStart = toISODate(startDate)
  const weekStarts = Array.from({ length: 4 }, (_, weekIndex) => addDays(cycleStart, weekIndex * 7))
  const cycleEnd = addDays(cycleStart, 27)
  const { data, error } = await supabase
    .from('reflections')
    .select('*')
    .eq('user_id', resolvedUserId)
    .gte('week_start_date', cycleStart)
    .lte('week_start_date', cycleEnd)

  assertDbError(error)

  const result = Array(4).fill('')
  for (const row of data || []) {
    const index = weekStarts.indexOf(row.week_start_date)
    if (index >= 0 && index < 4) result[index] = row.text
  }
  return result
}

export async function saveReflection(weekIndex, text, startDate, userId = USER_ID) {
  const resolvedUserId = resolveUserId(userId)
  const weekStartDate = addDays(startDate, weekIndex * 7)
  const { error } = await supabase
    .from('reflections')
    .upsert(
      { user_id: resolvedUserId, week_start_date: weekStartDate, week_index: weekIndex, text, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,week_start_date' }
    )

  assertDbError(error)
}