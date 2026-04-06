import { CATS, DAY_NAMES, plantFor } from '../constants';
import { card } from '../styles';

export default function GridView({ habits, checked, startDate, todayIdx, oPct, dailyPcts, toggleCheck, hDone, hTarget, hPct }) {
  const namedHabits = habits.filter(h => h.name.trim());

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

      {namedHabits.length > 0 ? (
        <div style={{ ...card, padding:0, overflow:"hidden" }}>
          <div style={{ overflowX:"auto" }}>
            <table style={{ borderCollapse:"collapse", width:"100%", minWidth:880 }}>
              <thead>
                <tr style={{ background:"#fdf0f3" }}>
                  <th style={{ width:170, padding:"10px 14px", textAlign:"left", fontSize:11, color:"#a03060", letterSpacing:1, textTransform:"uppercase", fontFamily:"sans-serif", position:"sticky", left:0, background:"#fdf0f3", zIndex:2, borderBottom:"1px solid #fde0ea" }}>
                    Habit
                  </th>
                  {Array.from({ length:30 }, (_, d) => {
                    const isToday = d === todayIdx;
                    const dow = new Date(new Date(startDate).getTime() + d * 86400000).getDay();
                    return (
                      <th key={d} style={{ padding:"4px 1px", textAlign:"center", minWidth:27, borderBottom:"1px solid #fde0ea", background:isToday?"#fde0ec":"#fdf0f3" }}>
                        <div style={{ fontSize:8, color:isToday?"#c04070":"#c06080", fontFamily:"sans-serif" }}>{DAY_NAMES[dow]}</div>
                        <div style={{ fontSize:11, fontFamily:"sans-serif", fontWeight:700, background:isToday?"#e879a0":"transparent", color:isToday?"#fff":"#7a2040", borderRadius:3, padding:isToday?"1px 3px":"0", display:"inline-block", minWidth:16, textAlign:"center" }}>
                          {d + 1}
                        </div>
                      </th>
                    );
                  })}
                  <th style={{ padding:"8px 10px", fontSize:10, color:"#a03060", fontFamily:"sans-serif", textTransform:"uppercase", letterSpacing:1, background:"#fdf0f3", borderBottom:"1px solid #fde0ea", whiteSpace:"nowrap" }}>Done</th>
                  <th style={{ padding:"8px 10px", fontSize:10, color:"#a03060", fontFamily:"sans-serif", textTransform:"uppercase", letterSpacing:1, background:"#fdf0f3", borderBottom:"1px solid #fde0ea", minWidth:72 }}>%</th>
                </tr>
              </thead>
              <tbody>
                {namedHabits.map((h, ri) => {
                  const done   = hDone(h.id);
                  const pct    = hPct(h);
                  const cat    = CATS[h.cat];
                  const rowBg  = ri % 2 === 0 ? "#fff" : "#fffafb";
                  return (
                    <tr key={h.id} style={{ borderTop:"1px solid #fde8f0" }}>
                      <td style={{ padding:"7px 14px", position:"sticky", left:0, background:rowBg, zIndex:1, maxWidth:170, whiteSpace:"nowrap", overflow:"hidden" }}>
                        <span style={{ display:"inline-block", width:7, height:7, borderRadius:"50%", background:cat.color, marginRight:6, verticalAlign:"middle" }} />
                        <span style={{ fontSize:12, color:"#5a1a30", fontFamily:"sans-serif" }}>{h.name}</span>
                        {h.core && <span style={{ fontSize:8, background:"#fde8f0", color:"#c04070", borderRadius:3, padding:"1px 4px", fontFamily:"sans-serif", marginLeft:4 }}>CORE</span>}
                      </td>
                      {Array.from({ length:30 }, (_, d) => {
                        const isToday = d === todayIdx;
                        const cv = !!(checked[h.id] || [])[d];
                        return (
                          <td key={d} style={{ textAlign:"center", padding:"3px 2px", background:isToday?`${cat.color}18`:rowBg }}>
                            <div onClick={() => toggleCheck(h.id, d)} style={{
                              width:19, height:19, margin:"0 auto", borderRadius:4, cursor:"pointer",
                              border:`2px solid ${cv ? cat.color : "#f0c0d0"}`,
                              background: cv ? cat.color : "transparent",
                              display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s",
                            }}>
                              {cv && (
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                  <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </div>
                          </td>
                        );
                      })}
                      <td style={{ textAlign:"center", fontSize:13, color:"#5a1a30", fontFamily:"sans-serif", fontWeight:700, padding:"0 10px", background:rowBg }}>
                        {done}<span style={{ fontSize:9, color:"#b09090", fontWeight:400 }}>/{hTarget(h)}</span>
                      </td>
                      <td style={{ padding:"0 10px", background:rowBg }}>
                        <div style={{ fontSize:11, color:cat.color, fontFamily:"sans-serif", fontWeight:700, marginBottom:2 }}>{pct}%</div>
                        <div style={{ height:5, background:"#fde8f0", borderRadius:3, overflow:"hidden", minWidth:44 }}>
                          <div style={{ height:"100%", width:`${pct}%`, background:cat.color, borderRadius:3, transition:"width 0.3s" }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Rose garden row */}
          <div style={{ borderTop:"2px solid #fde8f0", padding:"12px 14px 16px", overflowX:"auto" }}>
            <div style={{ display:"flex", alignItems:"flex-end", minWidth:880 }}>
              <div style={{ width:178, flexShrink:0, fontSize:10, color:"#a03060", letterSpacing:1, textTransform:"uppercase", fontFamily:"sans-serif" }}>
                🌱 Rose Garden
              </div>
              {dailyPcts.map((pct, d) => (
                <div key={d} style={{ width:27, flexShrink:0, textAlign:"center", opacity:d > todayIdx ? 0.3 : 1 }}>
                  <div style={{ fontSize:15, lineHeight:1 }}>{plantFor(pct)}</div>
                  <div style={{ fontSize:8, color:"#c06080", fontFamily:"sans-serif", marginTop:1 }}>{pct}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ ...card, textAlign:"center", padding:"40px 20px" }}>
          <div style={{ fontSize:36, marginBottom:8 }}>🪴</div>
          <div style={{ fontFamily:"sans-serif", color:"#c06080", fontSize:14 }}>No habits yet — go to Setup to add some!</div>
        </div>
      )}

      {/* Weighted total */}
      <div style={{ ...card, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontFamily:"sans-serif", fontSize:11, color:"#a03060", fontWeight:700, letterSpacing:1, textTransform:"uppercase" }}>Weighted Total</div>
          <div style={{ fontFamily:"sans-serif", fontSize:10, color:"#b07090", marginTop:2 }}>Core habits count 1.5×</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ height:8, width:140, background:"#fde8f0", borderRadius:4, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${oPct}%`, background:"linear-gradient(90deg,#f0a0c0,#e860a0)", borderRadius:4, transition:"width 0.4s" }} />
          </div>
          <span style={{ fontFamily:"sans-serif", fontSize:22, color:"#c04070", fontWeight:800 }}>{oPct}%</span>
        </div>
      </div>

    </div>
  );
}
