import { useTheme } from '../ThemeContext';
import { card, secLbl } from '../styles';

const MAX_REFLECTION = 1000;

export default function ReflectView({ intentions, reflections, todayIdx, dailyPcts, handleSetReflection, savedKeys }) {
  const { theme } = useTheme();

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

      <div style={card}>
        <p style={secLbl}>Daily Intentions Log</p>
        <div style={{ display:"flex", flexDirection:"column", gap:6, maxHeight:280, overflowY:"auto", paddingRight:4 }}>
          {Array.from({ length: Math.min(todayIdx + 1, 30) }, (_, d) => (
            <div key={d} style={{ display:"flex", gap:10, alignItems:"center" }}>
              <div style={{ width:46, flexShrink:0, textAlign:"right", fontSize:11, color:"var(--t-strong)", fontFamily:"sans-serif", fontWeight:700 }}>
                Day {d + 1}
              </div>
              <div style={{
                flex:1, fontSize:12, fontFamily:"Georgia,serif",
                color: intentions[d] ? "var(--t-heading)" : "var(--t-muted)",
                fontStyle: intentions[d] ? "normal" : "italic",
                background:"var(--t-bg)", border:"1px solid var(--t-border)", borderRadius:7, padding:"6px 10px",
              }}>
                {intentions[d] || "No intention set"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {[0, 1, 2, 3].map(week => {
        const ws  = week * 7;
        const we  = Math.min(ws + 7, 30);
        const ok  = todayIdx >= ws;
        const wd  = dailyPcts.slice(ws, we).filter(p => p > 0).length;
        const avg = ok ? Math.round(dailyPcts.slice(ws, we).reduce((s, p) => s + p, 0) / (we - ws)) : 0;
        const refVal = reflections[week] || '';
        const isSaved = savedKeys?.[`reflection-${week}`];

        return (
          <div key={week} style={{ ...card, opacity: ok ? 1 : 0.45 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
              <p style={{ ...secLbl, margin:0 }}>Week {week + 1} · Days {ws + 1}–{we}</p>
              {ok && <span style={{ fontSize:11, color:"var(--t-strong)", fontFamily:"sans-serif", fontWeight:700 }}>{wd}/{we - ws} active · avg {avg}%</span>}
            </div>
            {ok && (
              <div style={{ display:"flex", gap:2, marginBottom:12 }} aria-hidden="true">
                {dailyPcts.slice(ws, we).map((pct, i) => (
                  <div key={i} style={{ flex:1, height:6, borderRadius:2, background:`rgba(${theme.accentRgb},${0.12 + pct / 100 * 0.86})` }} />
                ))}
              </div>
            )}
            <textarea
              disabled={!ok}
              aria-label={`Week ${week + 1} reflection`}
              value={refVal}
              onChange={e => handleSetReflection(week, e.target.value)}
              placeholder={ok ? "How did this week go? What worked, what didn't? What will you carry into next week?" : "Unlocks when you reach this week"}
              rows={4}
              maxLength={MAX_REFLECTION}
              style={{ width:"100%", border:"1px solid var(--t-border)", borderRadius:9, padding:"11px 14px", fontSize:13, fontFamily:"Georgia,serif", color:"var(--t-heading)", outline:"none", resize:"vertical", boxSizing:"border-box", background:"#fffafb" }}
            />
            {ok && (
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
                <span style={{ fontSize:11, color:'var(--t-label)', fontFamily:'sans-serif', opacity: isSaved ? 1 : 0, transition:'opacity 0.3s' }}>
                  Saved ✓
                </span>
                <span style={{ fontSize:11, color: refVal.length > 900 ? 'var(--t-strong)' : 'var(--t-muted)', fontFamily:'sans-serif' }}>
                  {refVal.length}/{MAX_REFLECTION}
                </span>
              </div>
            )}
          </div>
        );
      })}

    </div>
  );
}
