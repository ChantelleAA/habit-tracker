import { Flame, CheckCheck } from 'lucide-react';
import { CATS, FREQS, MILESTONES, fmtDate } from '../constants';
import { card, secLbl, btn } from '../styles';

const MAX_INTENTION = 280;

function CycleCompleteScreen({ oPct, handleStartNewCycle }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14, alignItems:'center', paddingTop:20 }}>
      <div style={{ ...card, textAlign:'center', maxWidth:440, width:'100%', padding:36 }}>
        <div style={{ fontSize:56, marginBottom:12 }}>🌹</div>
        <h2 style={{ margin:'0 0 8px', fontSize:24, color:'var(--t-heading)', fontWeight:'normal' }}>
          Challenge Complete!
        </h2>
        <p style={{ margin:'0 0 20px', fontSize:14, color:'var(--t-body)', fontFamily:'sans-serif', lineHeight:1.7 }}>
          You finished your 30-day cycle with an overall score of{' '}
          <strong style={{ color:'var(--t-strong)' }}>{oPct}%</strong>.
          {oPct >= 80 ? ' Outstanding discipline.' : oPct >= 60 ? ' Strong effort.' : ' Every cycle you improve.'}
        </p>
        <div style={{ display:'flex', justifyContent:'center', gap:16, marginBottom:24 }}>
          {[
            { emoji:'🌹', label:'Full Bloom', earned: oPct >= 90 },
            { emoji:'🌷', label:'Thriving',   earned: oPct >= 70 },
            { emoji:'🌱', label:'Growing',    earned: oPct >= 50 },
          ].map(({ emoji, label, earned }) => (
            <div key={label} style={{ textAlign:'center', opacity:earned ? 1 : 0.25 }}>
              <div style={{ fontSize:32, filter:earned ? 'none' : 'grayscale(1)' }}>{emoji}</div>
              <div style={{ fontSize:10, fontFamily:'sans-serif', color:earned ? 'var(--t-strong)' : '#ccc', marginTop:2 }}>{label}</div>
            </div>
          ))}
        </div>
        <button onClick={handleStartNewCycle} style={{ ...btn(), width:'100%' }}>
          Start New 30-Day Cycle 🌱
        </button>
        <p style={{ margin:'12px 0 0', fontSize:11, color:'var(--t-muted)', fontFamily:'sans-serif' }}>
          Your past check-ins are saved and visible in Grid &amp; Stats views.
        </p>
      </div>
    </div>
  );
}

export default function TodayView({
  habits, checked, startDate, intentions, todayIdx,
  cStreak, oPct, todayDone,
  toggleCheck, handleSetIntention, markAllToday, resetDay, streakFor,
  isMobile, cycleOver, handleStartNewCycle, savedKeys,
}) {
  if (cycleOver) {
    return <CycleCompleteScreen oPct={oPct} handleStartNewCycle={handleStartNewCycle} />;
  }

  const intentionVal = intentions[todayIdx] || '';
  const intentionSaved = savedKeys[`intention-${todayIdx}`];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

      {/* Day header */}
      <div style={{ ...card, background:`linear-gradient(135deg,#fff,var(--t-bg))`, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div>
          <div style={{ fontSize: isMobile ? 17 : 20, color:"var(--t-heading)", marginBottom:2 }}>
            {`Day ${todayIdx + 1} of 30 🌹`}
          </div>
          <div style={{ fontSize:13, color:"var(--t-label)", fontFamily:"sans-serif" }}>{fmtDate(startDate, todayIdx)}</div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {[
            { val:`${todayDone}/${habits.length}`, lbl:"Done today" },
            { val:`${cStreak}`,                    lbl:"Streak"     },
            { val:`${oPct}%`,                      lbl:"Overall"    },
          ].map(s => (
            <div key={s.lbl} style={{ textAlign:"center", background:"var(--t-light)", borderRadius:10, padding: isMobile ? "6px 10px" : "8px 12px" }}>
              <div style={{ fontSize: isMobile ? 15 : 18, fontWeight:800, color:"var(--t-strong)", fontFamily:"sans-serif" }}>{s.val}</div>
              <div style={{ fontSize:10, color:"var(--t-label)", fontFamily:"sans-serif" }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Intention */}
      <div style={card}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
          <p style={{ ...secLbl, margin:0 }}>Today's Intention</p>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {intentionSaved && (
              <span style={{ fontSize:11, color:'var(--t-label)', fontFamily:'sans-serif', opacity:0.8 }}>Saved ✓</span>
            )}
            <span style={{ fontSize:11, color: intentionVal.length > 250 ? 'var(--t-strong)' : 'var(--t-muted)', fontFamily:'sans-serif' }}>
              {intentionVal.length}/{MAX_INTENTION}
            </span>
          </div>
        </div>
        <input
          aria-label="Today's intention"
          value={intentionVal}
          onChange={e => handleSetIntention(todayIdx, e.target.value)}
          placeholder="Set an intention for today…"
          maxLength={MAX_INTENTION}
          style={{ width:"100%", border:"1px solid var(--t-border)", borderRadius:9, padding:"11px 14px", fontSize:14, fontFamily:"Georgia,serif", color:"var(--t-heading)", outline:"none", boxSizing:"border-box", background:"#fffafb" }}
        />
      </div>

      {/* Actions */}
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={markAllToday} style={{ ...btn(), flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
          <CheckCheck size={15} aria-hidden="true" /> Mark All Done
        </button>
        <button onClick={resetDay} style={{ ...btn("transparent","var(--t-strong)"), flex:"0 0 auto" }}>Reset Day</button>
      </div>

      {/* Habits by category */}
      {Object.entries(CATS).map(([catKey, cat]) => {
        const catHabits = habits.filter(h => h.cat === catKey && h.name.trim());
        if (!catHabits.length) return null;
        return (
          <div key={catKey}>
            <div style={{ fontSize:11, color:cat.color, letterSpacing:2, textTransform:"uppercase", fontFamily:"sans-serif", marginBottom:8, fontWeight:700 }}>
              {cat.label}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }} role="group" aria-label={`${cat.label} habits`}>
              {catHabits.map(h => {
                const done   = !!(checked[h.id] || [])[todayIdx];
                const streak = streakFor(h.id);
                return (
                  <div
                    key={h.id}
                    role="checkbox"
                    aria-checked={done}
                    aria-label={`${h.name}${done ? ', completed' : ''}`}
                    tabIndex={0}
                    onClick={() => toggleCheck(h.id, todayIdx)}
                    onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && toggleCheck(h.id, todayIdx)}
                    style={{
                      background: done ? cat.color : "#fff",
                      border: `2px solid ${done ? cat.color : "#f0d0dc"}`,
                      borderRadius: 13, padding: isMobile ? "12px 14px" : "14px 16px",
                      display:"flex", alignItems:"center", justifyContent:"space-between",
                      cursor:"pointer", transition:"all 0.2s",
                      boxShadow: done ? `0 4px 18px ${cat.color}44` : "0 2px 8px rgba(0,0,0,0.04)",
                    }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{
                        width:30, height:30, borderRadius:"50%",
                        background: done ? "rgba(255,255,255,0.25)" : cat.bg,
                        border: done ? "none" : `2px solid ${cat.color}33`,
                        display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                      }} aria-hidden="true">
                        {done && (
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                            <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize:14, color:done?"#fff":"var(--t-heading)", fontWeight:done?"bold":"normal" }}>
                          {h.name}
                          {done && <span aria-hidden="true" style={{ marginLeft:6, fontSize:12 }}>✓</span>}
                          {h.core && (
                            <span style={{ fontSize:9, background:done?"rgba(255,255,255,0.25)":"var(--t-light)", color:done?"#fff":"var(--t-strong)", borderRadius:4, padding:"1px 5px", fontFamily:"sans-serif", marginLeft:6, verticalAlign:"middle" }}>
                              CORE
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize:11, color:done?"rgba(255,255,255,0.75)":"var(--t-muted)", fontFamily:"sans-serif", marginTop:1, display:"flex", alignItems:"center", gap:4 }}>
                          {FREQS[h.freq]?.label}
                          {streak > 0 && (
                            <><span style={{ opacity:0.5 }}>·</span><Flame size={11} aria-hidden="true" style={{ color:done?"rgba(255,255,255,0.75)":"var(--t-accent)" }}/><span>{streak}-day streak</span></>
                          )}
                          {streak === 0 && <><span style={{ opacity:0.5 }}>·</span> Start your streak today</>}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      width:28, height:28, borderRadius:"50%",
                      background: done ? "rgba(255,255,255,0.3)" : "var(--t-light)",
                      border: done ? "none" : "2px solid var(--t-border)",
                      display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                    }} aria-hidden="true">
                      {done && (
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                          <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Milestones */}
      <div style={card}>
        <p style={secLbl}>Streak Milestones</p>
        <div style={{ display:"flex", gap: isMobile ? 8 : 12, flexWrap:"wrap", justifyContent: isMobile ? "space-between" : "flex-start" }}>
          {MILESTONES.map(m => {
            const earned = habits.some(h => streakFor(h.id) >= m.days);
            return (
              <div key={m.days} style={{ textAlign:"center", opacity:earned?1:0.28, transition:"opacity 0.4s" }} title={earned ? `${m.label} — earned!` : `${m.label} — ${m.days} day streak`}>
                <div style={{ fontSize: isMobile ? 28 : 34, filter:earned?"none":"grayscale(1)" }} aria-hidden="true">{m.emoji}</div>
                <div style={{ fontSize:10, fontFamily:"sans-serif", color:earned?"var(--t-strong)":"#ccc", fontWeight:700, marginTop:2 }}>{m.days}d</div>
                <div style={{ fontSize:9, fontFamily:"sans-serif", color:earned?"var(--t-label)":"#ddd" }} aria-label={earned ? 'Earned' : 'Locked'}>{earned?"✓":"—"}</div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
