import { GripVertical, Plus, X, Star } from 'lucide-react';
import { CATS, FREQS } from '../constants';
import { card, secLbl, btn } from '../styles';

export default function SettingsView({
  habits, profile, setProfile, startDate, todayIdx,
  addHabit, removeHabit, updHabit,
  handleSetStartDate, handleSaveProfile, handleResetCheckins,
  onDragStart, onDragOver, onDragEnd, dragIdx,
  showToast,
}) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

      {/* Reminder settings */}
      <div style={card}>
        <p style={secLbl}>Reminder Settings</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <label style={{ display:'flex', flexDirection:'column', gap:6, fontFamily:'sans-serif', fontSize:12, color:'#7a2040' }}>
            Reminder Email
            <input
              value={profile.reminder_email}
              onChange={e => setProfile(p => ({ ...p, reminder_email: e.target.value }))}
              placeholder="where reminders should be sent"
              style={{ border:'1px solid #f0c0d0', borderRadius:9, padding:'10px 12px', fontSize:13, fontFamily:'sans-serif', outline:'none' }}
            />
          </label>
          <label style={{ display:'flex', flexDirection:'column', gap:6, fontFamily:'sans-serif', fontSize:12, color:'#7a2040' }}>
            Reminder Time
            <input
              type="time"
              value={profile.reminder_time}
              onChange={e => setProfile(p => ({ ...p, reminder_time: e.target.value }))}
              style={{ border:'1px solid #f0c0d0', borderRadius:9, padding:'10px 12px', fontSize:13, fontFamily:'sans-serif', outline:'none' }}
            />
          </label>
          <label style={{ display:'flex', flexDirection:'column', gap:6, fontFamily:'sans-serif', fontSize:12, color:'#7a2040' }}>
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
              style={{ border:'1px solid #f0c0d0', borderRadius:9, padding:'10px 12px', fontSize:13, fontFamily:'sans-serif', outline:'none' }}
            />
          </label>
          <label style={{ display:'flex', alignItems:'center', gap:8, fontFamily:'sans-serif', fontSize:12, color:'#7a2040', paddingTop:26 }}>
            <input
              type="checkbox"
              checked={profile.reminders_enabled}
              onChange={e => setProfile(p => ({ ...p, reminders_enabled: e.target.checked }))}
            />
            Enable reminders
          </label>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, marginTop:12, flexWrap:'wrap' }}>
          <div style={{ fontSize:11, color:'#b07090', fontFamily:'sans-serif' }}>n8n reads these preferences to send reminders.</div>
          <button onClick={handleSaveProfile} style={btn()}>Save Reminder Settings</button>
        </div>
      </div>

      {/* Start date */}
      <div style={card}>
        <p style={secLbl}>Challenge Start Date</p>
        <p style={{ margin:"0 0 10px", fontSize:12, color:"#a03060", fontFamily:"sans-serif" }}>
          Today shows as Day {todayIdx + 1} of 30. Change this to shift your whole calendar.
        </p>
        <input
          type="date" value={startDate} onChange={e => handleSetStartDate(e.target.value)}
          style={{ border:"1px solid #f0c0d0", borderRadius:8, padding:"9px 12px", fontSize:13, fontFamily:"sans-serif", color:"#5a1a30", outline:"none" }}
        />
      </div>

      {/* Category key */}
      <div style={card}>
        <p style={secLbl}>Category Key</p>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {Object.entries(CATS).map(([k, v]) => (
            <div key={k} style={{ display:"flex", alignItems:"center", gap:5, background:v.bg, borderRadius:7, padding:"5px 10px" }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:v.color, display:"inline-block" }} />
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
            <Plus size={14} /> Add Habit
          </button>
        </div>
        <p style={{ margin:"0 0 12px", fontSize:11, color:"#b07090", fontFamily:"sans-serif", display:"flex", alignItems:"center", gap:5 }}>
          <GripVertical size={13} style={{ opacity:0.5 }} /> Drag to reorder · Toggle Core for 1.5× XP weight
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {habits.map((h, i) => {
            const cat = CATS[h.cat];
            return (
              <div
                key={h.id}
                draggable
                onDragStart={() => onDragStart(i)}
                onDragOver={e => onDragOver(e, i)}
                onDragEnd={onDragEnd}
                style={{
                  background: dragIdx === i ? "#fde8f0" : "#fafafa",
                  border: `1px solid ${dragIdx === i ? cat.color : "#f0d0dc"}`,
                  borderRadius: 10, padding:"10px 12px", cursor:"grab", transition:"all 0.15s",
                }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <GripVertical size={16} style={{ color:"#d0b0bc", flexShrink:0 }} />
                  <input
                    value={h.name}
                    onChange={e => updHabit(h.id, "name", e.target.value)}
                    placeholder="Habit name…"
                    style={{ flex:1, border:"1px solid #f0c0d0", borderRadius:7, padding:"7px 10px", fontSize:13, fontFamily:"sans-serif", color:"#5a1a30", outline:"none", background:"#fff" }}
                  />
                  <button
                    onClick={() => removeHabit(h.id)}
                    style={{ background:"none", border:"1px solid #f0c0d0", borderRadius:6, width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#d06080", padding:0 }}>
                    <X size={14} />
                  </button>
                </div>
                <div style={{ display:"flex", gap:7, flexWrap:"wrap", alignItems:"center" }}>
                  <select
                    value={h.cat}
                    onChange={e => updHabit(h.id, "cat", e.target.value)}
                    style={{ border:`1px solid ${cat.color}`, borderRadius:6, padding:"4px 8px", fontSize:11, fontFamily:"sans-serif", color:cat.color, background:cat.bg, outline:"none", cursor:"pointer" }}>
                    {Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <select
                    value={h.freq}
                    onChange={e => updHabit(h.id, "freq", e.target.value)}
                    style={{ border:"1px solid #f0c0d0", borderRadius:6, padding:"4px 8px", fontSize:11, fontFamily:"sans-serif", color:"#c04070", background:"#fde8f0", outline:"none", cursor:"pointer" }}>
                    {Object.entries(FREQS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <button
                    onClick={() => updHabit(h.id, "core", !h.core)}
                    style={{
                      border: `1px solid ${h.core ? "#c04070" : "#f0c0d0"}`,
                      borderRadius: 6, padding:"4px 11px", fontSize:11, fontFamily:"sans-serif",
                      color: h.core ? "#fff" : "#c06080",
                      background: h.core ? "#e879a0" : "transparent",
                      cursor:"pointer", fontWeight: h.core ? 700 : 400,
                      display:"flex", alignItems:"center", gap:4,
                    }}>
                    <Star size={11} fill={h.core ? "#fff" : "none"} /> Core
                  </button>
                  <span style={{ fontSize:10, color:"#b09090", fontFamily:"sans-serif" }}>Target: {FREQS[h.freq]?.target} days</span>
                </div>
              </div>
            );
          })}
        </div>
        {habits.length === 0 && (
          <p style={{ textAlign:"center", color:"#d0a0b0", fontFamily:"sans-serif", fontSize:13, margin:"10px 0 0" }}>
            No habits yet — click Add Habit 🌱
          </p>
        )}
      </div>

      {/* Danger zone */}
      <button onClick={handleResetCheckins} style={{ ...btn("transparent","#c06080"), width:"100%" }}>
        Reset All Check-ins
      </button>

    </div>
  );
}
