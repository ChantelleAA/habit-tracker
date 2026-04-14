import { GripVertical, Plus, X, Star, Download } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { THEMES } from '../themes';
import { CATS, FREQS } from '../constants';
import { card, secLbl, btn } from '../styles';

const MAX_HABIT_NAME = 60;

function downloadCSV(habits, checked, startDate, intentions, reflections) {
  const rows = [];

  // Checkins sheet
  rows.push(['=== CHECK-INS ===']);
  rows.push(['Habit', 'Category', 'Frequency', 'Core', ...Array.from({length:30}, (_,i) => `Day ${i+1}`)]);
  habits.filter(h => h.name.trim()).forEach(h => {
    const row = checked[h.id] || Array(30).fill(false);
    rows.push([h.name, h.cat, h.freq, h.core ? 'Yes' : 'No', ...row.map(v => v ? '1' : '0')]);
  });

  rows.push([]);
  rows.push(['=== INTENTIONS ===']);
  rows.push(['Day', 'Date', 'Intention']);
  intentions.forEach((text, i) => {
    if (!text) return;
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    rows.push([`Day ${i+1}`, d.toLocaleDateString('en-GB'), text]);
  });

  rows.push([]);
  rows.push(['=== REFLECTIONS ===']);
  rows.push(['Week', 'Reflection']);
  reflections.forEach((text, i) => {
    if (!text) return;
    rows.push([`Week ${i+1}`, text]);
  });

  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `habit-tracker-${startDate}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SettingsView({
  habits, profile, setProfile, startDate, todayIdx,
  addHabit, removeHabit, updHabit,
  handleSetStartDate, handleSaveProfile, handleResetCheckins,
  onDragStart, onDragOver, onDragEnd, dragIdx,
  showToast, isMobile,
  checked, intentions, reflections,
}) {
  const { themeName, setThemeName } = useTheme();

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

      {/* Theme picker */}
      <div style={card}>
        <p style={secLbl}>Appearance</p>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          {Object.entries(THEMES).map(([key, t]) => {
            const active = themeName === key;
            return (
              <button key={key} onClick={() => setThemeName(key)} aria-pressed={active} style={{
                display:"flex", alignItems:"center", gap:8,
                border: active ? `2px solid ${t.accent}` : "2px solid transparent",
                borderRadius:10, padding:"8px 14px",
                background: active ? `${t.light}` : "#f5f5f5",
                cursor:"pointer", fontFamily:"sans-serif", fontSize:12,
                fontWeight: active ? 700 : 500,
                color: active ? t.strong : "#555",
                transition:"all 0.15s",
              }}>
                <span style={{ width:14, height:14, borderRadius:"50%", background:t.accent, display:"inline-block", flexShrink:0 }} aria-hidden="true" />
                {t.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reminder settings */}
      <div style={card}>
        <p style={secLbl}>Reminder Settings</p>
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:12 }}>
          <label style={{ display:'flex', flexDirection:'column', gap:6, fontFamily:'sans-serif', fontSize:12, color:'var(--t-body)' }}>
            Reminder Email
            <input
              type="email"
              value={profile.reminder_email}
              onChange={e => setProfile(p => ({ ...p, reminder_email: e.target.value }))}
              placeholder="where reminders should be sent"
              style={{ border:'1px solid var(--t-border)', borderRadius:9, padding:'10px 12px', fontSize:13, fontFamily:'sans-serif', outline:'none' }}
            />
          </label>
          <label style={{ display:'flex', flexDirection:'column', gap:6, fontFamily:'sans-serif', fontSize:12, color:'var(--t-body)' }}>
            Reminder Time
            <input
              type="time"
              value={profile.reminder_time}
              onChange={e => setProfile(p => ({ ...p, reminder_time: e.target.value }))}
              style={{ border:'1px solid var(--t-border)', borderRadius:9, padding:'10px 12px', fontSize:13, fontFamily:'sans-serif', outline:'none' }}
            />
          </label>
          <label style={{ display:'flex', flexDirection:'column', gap:6, fontFamily:'sans-serif', fontSize:12, color:'var(--t-body)' }}>
            Timezone
            <input
              value={profile.timezone}
              onChange={e => setProfile(p => ({ ...p, timezone: e.target.value }))}
              onBlur={e => {
                const tz = e.target.value.trim();
                const valid = !tz || (typeof Intl !== 'undefined' && Intl.supportedValuesOf?.('timeZone')?.includes(tz));
                if (!valid) showToast(`"${tz}" is not a valid timezone`, 'error');
              }}
              placeholder="Europe/Dublin"
              style={{ border:'1px solid var(--t-border)', borderRadius:9, padding:'10px 12px', fontSize:13, fontFamily:'sans-serif', outline:'none' }}
            />
          </label>
          <label style={{ display:'flex', alignItems:'center', gap:8, fontFamily:'sans-serif', fontSize:12, color:'var(--t-body)', paddingTop: isMobile ? 0 : 26 }}>
            <input
              type="checkbox"
              checked={profile.reminders_enabled}
              onChange={e => setProfile(p => ({ ...p, reminders_enabled: e.target.checked }))}
            />
            Enable reminders
          </label>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:12 }}>
          <button onClick={handleSaveProfile} style={btn()}>Save Settings</button>
        </div>
      </div>

      {/* Start date */}
      <div style={card}>
        <p style={secLbl}>Challenge Start Date</p>
        <p style={{ margin:"0 0 10px", fontSize:12, color:"var(--t-label)", fontFamily:"sans-serif" }}>
          Today shows as Day {todayIdx + 1} of 30. Change this to shift your whole calendar.
        </p>
        <input
          type="date" value={startDate} onChange={e => handleSetStartDate(e.target.value)}
          aria-label="Challenge start date"
          style={{ border:"1px solid var(--t-border)", borderRadius:8, padding:"9px 12px", fontSize:13, fontFamily:"sans-serif", color:"var(--t-heading)", outline:"none" }}
        />
      </div>

      {/* Category key */}
      <div style={card}>
        <p style={secLbl}>Category Key</p>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {Object.entries(CATS).map(([k, v]) => (
            <div key={k} style={{ display:"flex", alignItems:"center", gap:5, background:v.bg, borderRadius:7, padding:"5px 10px" }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:v.color, display:"inline-block" }} aria-hidden="true" />
              <span style={{ fontSize:11, fontFamily:"sans-serif", color:v.color, fontWeight:600 }}>{v.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Habits list */}
      <div style={card}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <p style={{ ...secLbl, margin:0 }}>Habits <span style={{ opacity:0.55, fontWeight:400 }}>({habits.length})</span></p>
          <button onClick={addHabit} style={{ ...btn(), display:"flex", alignItems:"center", gap:6, padding:"8px 14px" }}>
            <Plus size={14} aria-hidden="true" /> Add Habit
          </button>
        </div>
        <p style={{ margin:"0 0 12px", fontSize:11, color:"var(--t-muted)", fontFamily:"sans-serif", display:"flex", alignItems:"center", gap:5 }}>
          <GripVertical size={13} style={{ opacity:0.5 }} aria-hidden="true" /> Drag to reorder · Toggle Core for 1.5× XP weight
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {habits.map((h, i) => {
            const cat = CATS[h.cat];
            const nameLen = (h.name || '').length;
            return (
              <div
                key={h.id}
                draggable
                onDragStart={() => onDragStart(i)}
                onDragOver={e => onDragOver(e, i)}
                onDragEnd={onDragEnd}
                style={{
                  background: dragIdx === i ? "var(--t-light)" : "#fafafa",
                  border: `1px solid ${dragIdx === i ? "var(--t-accent)" : "var(--t-border)"}`,
                  borderRadius:10, padding:"10px 12px", cursor:"grab", transition:"all 0.15s",
                }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <GripVertical size={16} style={{ color:"var(--t-muted)", flexShrink:0 }} aria-hidden="true" />
                  <div style={{ flex:1, position:'relative' }}>
                    <input
                      value={h.name}
                      onChange={e => {
                        if (e.target.value.length <= MAX_HABIT_NAME) updHabit(h.id, "name", e.target.value);
                      }}
                      placeholder="Habit name…"
                      aria-label="Habit name"
                      maxLength={MAX_HABIT_NAME}
                      style={{ width:'100%', border:"1px solid var(--t-border)", borderRadius:7, padding:"7px 10px", fontSize:13, fontFamily:"sans-serif", color:"var(--t-heading)", outline:"none", background:"#fff", boxSizing:'border-box' }}
                    />
                    {nameLen > 45 && (
                      <span style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', fontSize:10, color: nameLen >= MAX_HABIT_NAME ? 'var(--t-strong)' : 'var(--t-muted)', fontFamily:'sans-serif', pointerEvents:'none' }}>
                        {nameLen}/{MAX_HABIT_NAME}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeHabit(h.id)}
                    aria-label={`Remove ${h.name || 'habit'}`}
                    style={{ background:"none", border:"1px solid var(--t-border)", borderRadius:6, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"var(--t-strong)", padding:0, flexShrink:0 }}>
                    <X size={14} aria-hidden="true" />
                  </button>
                </div>
                <div style={{ display:"flex", gap:7, flexWrap:"wrap", alignItems:"center" }}>
                  <select
                    value={h.cat}
                    onChange={e => updHabit(h.id, "cat", e.target.value)}
                    aria-label="Category"
                    style={{ border:`1px solid ${cat.color}`, borderRadius:6, padding:"4px 8px", fontSize:11, fontFamily:"sans-serif", color:cat.color, background:cat.bg, outline:"none", cursor:"pointer" }}>
                    {Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <select
                    value={h.freq}
                    onChange={e => updHabit(h.id, "freq", e.target.value)}
                    aria-label="Frequency"
                    style={{ border:"1px solid var(--t-border)", borderRadius:6, padding:"4px 8px", fontSize:11, fontFamily:"sans-serif", color:"var(--t-strong)", background:"var(--t-light)", outline:"none", cursor:"pointer" }}>
                    {Object.entries(FREQS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <button
                    onClick={() => updHabit(h.id, "core", !h.core)}
                    aria-pressed={h.core}
                    aria-label={`${h.core ? 'Remove' : 'Mark as'} core habit`}
                    style={{
                      border: `1px solid ${h.core ? "var(--t-strong)" : "var(--t-border)"}`,
                      borderRadius:6, padding:"4px 11px", fontSize:11, fontFamily:"sans-serif",
                      color: h.core ? "#fff" : "var(--t-strong)",
                      background: h.core ? "var(--t-accent)" : "transparent",
                      cursor:"pointer", fontWeight: h.core ? 700 : 400,
                      display:"flex", alignItems:"center", gap:4,
                    }}>
                    <Star size={11} fill={h.core ? "#fff" : "none"} aria-hidden="true" /> Core
                  </button>
                  <span style={{ fontSize:10, color:"var(--t-muted)", fontFamily:"sans-serif" }}>Target: {FREQS[h.freq]?.target}d</span>
                </div>
              </div>
            );
          })}
        </div>
        {habits.length === 0 && (
          <p style={{ textAlign:"center", color:"var(--t-muted)", fontFamily:"sans-serif", fontSize:13, margin:"10px 0 0" }}>
            No habits yet — click Add Habit 🌱
          </p>
        )}
      </div>

      {/* Data & Danger zone */}
      <div style={card}>
        <p style={secLbl}>Data</p>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <button
            onClick={() => downloadCSV(habits, checked, startDate, intentions, reflections)}
            style={{ ...btn('transparent','var(--t-strong)'), display:'flex', alignItems:'center', gap:6 }}>
            <Download size={14} aria-hidden="true" /> Export CSV
          </button>
          <button onClick={handleResetCheckins} style={{ ...btn("transparent","var(--t-strong)") }}>
            Reset All Check-ins
          </button>
        </div>
        <p style={{ margin:'10px 0 0', fontSize:11, color:'var(--t-muted)', fontFamily:'sans-serif' }}>
          Reset removes all check-in history for this cycle. You have 5 seconds to undo.
        </p>
      </div>

    </div>
  );
}
