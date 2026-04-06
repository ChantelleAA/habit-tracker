import { Flame } from 'lucide-react';
import { CATS, DAY_NAMES } from '../constants';
import { card, secLbl } from '../styles';

export default function HeatmapView({ habits, checked, startDate, todayIdx, dailyPcts, hPct, streakFor }) {
  const startDow = new Date(startDate).getDay();
  const cells = [
    ...Array(startDow).fill({ pad: true }),
    ...Array.from({ length: 30 }, (_, i) => ({ pad: false, idx: i })),
  ];
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

      {/* Calendar heatmap */}
      <div style={card}>
        <p style={secLbl}>Monthly Overview</p>
        <p style={{ margin:"0 0 14px", fontSize:12, color:"#a03060", fontFamily:"sans-serif" }}>
          Each cell = one day. Darker pink = more habits completed.
        </p>
        <div style={{ display:"flex", gap:4, marginBottom:6 }}>
          {DAY_NAMES.map(d => (
            <div key={d} style={{ flex:1, textAlign:"center", fontSize:9, color:"#b07090", fontFamily:"sans-serif" }}>{d}</div>
          ))}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display:"flex", gap:4 }}>
              {Array.from({ length: 7 }, (_, ci) => {
                const cell = week[ci];
                if (!cell || cell.pad) return <div key={ci} style={{ flex:1, height:38 }} />;
                const pct     = dailyPcts[cell.idx];
                const isToday = cell.idx === todayIdx;
                const future  = cell.idx > todayIdx;
                const alpha   = future ? 0 : pct === 0 ? 0.08 : 0.15 + pct / 100 * 0.82;
                return (
                  <div key={ci} title={`Day ${cell.idx + 1}: ${pct}%`} style={{
                    flex:1, height:38, borderRadius:7,
                    background: `rgba(232,121,160,${alpha})`,
                    border: isToday ? "2px solid #e879a0" : "2px solid transparent",
                    display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                    opacity: future ? 0.3 : 1,
                  }}>
                    <div style={{ fontSize:11, fontFamily:"sans-serif", color:pct>50?"#fff":"#c04070", fontWeight:700, lineHeight:1 }}>{cell.idx + 1}</div>
                    {!future && <div style={{ fontSize:8, fontFamily:"sans-serif", color:pct>50?"rgba(255,255,255,0.8)":"#d090b0", marginTop:1 }}>{pct}%</div>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:14 }}>
          <span style={{ fontSize:10, color:"#b07090", fontFamily:"sans-serif" }}>Less</span>
          {[0, 25, 50, 75, 100].map(p => (
            <div key={p} style={{ width:18, height:18, borderRadius:4, background:`rgba(232,121,160,${0.08 + p / 100 * 0.9})` }} />
          ))}
          <span style={{ fontSize:10, color:"#b07090", fontFamily:"sans-serif" }}>More</span>
        </div>
      </div>

      {/* Per-habit streak bars */}
      <div style={card}>
        <p style={secLbl}>Per-Habit Streaks</p>
        {habits.filter(h => h.name.trim()).map(h => {
          const cat    = CATS[h.cat];
          const streak = streakFor(h.id);
          const pct    = hPct(h);
          return (
            <div key={h.id} style={{ marginBottom:14 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ width:7, height:7, borderRadius:"50%", background:cat.color, display:"inline-block" }} />
                  <span style={{ fontSize:12, color:"#5a1a30", fontFamily:"sans-serif" }}>{h.name}</span>
                </div>
                <span style={{ fontSize:11, color:cat.color, fontFamily:"sans-serif", fontWeight:700, display:"flex", alignItems:"center", gap:4 }}>
                  <Flame size={12} /> {streak} day · {pct}%
                </span>
              </div>
              <div style={{ display:"flex", gap:2 }}>
                {Array.from({ length:30 }, (_, d) => (
                  <div key={d} style={{
                    flex:1, height:12, borderRadius:2,
                    background: (checked[h.id] || [])[d] ? cat.color : "#fde8f0",
                    opacity: d > todayIdx ? 0.25 : 1,
                    transition:"background 0.2s",
                  }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
