import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import { Flame, CalendarDays, Zap, Gem, Share2 } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { CATS, MILESTONES } from '../constants';
import { card, secLbl } from '../styles';

export default function DashboardView({
  habits, todayIdx, oPct, cStreak, lStreak, consist, xp, level, nextLvl, xpPct, status, dailyPcts, hPct, streakFor, isMobile,
}) {
  const { theme } = useTheme();

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* Level card */}
      <div style={{ ...card, background:`linear-gradient(135deg,var(--t-header-from),var(--t-header-to))`, padding:"20px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:10, letterSpacing:3, color:"var(--t-body)", textTransform:"uppercase", fontFamily:"sans-serif", marginBottom:4 }}>Your Level</div>
            <div style={{ fontSize:26, color:"var(--t-heading)", fontWeight:"bold" }}>{level.name}</div>
            <div style={{ fontSize:12, color:"var(--t-label)", fontFamily:"sans-serif", marginTop:2 }}>{xp.toLocaleString()} XP · Core habits earn 1.5×</div>
          </div>
          <div style={{ fontSize:52 }}>🌸</div>
        </div>
        {nextLvl && (
          <div style={{ marginTop:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"var(--t-label)", fontFamily:"sans-serif", marginBottom:4 }}>
              <span>{level.name}</span><span>{nextLvl.name}</span>
            </div>
            <div style={{ height:8, background:"rgba(255,255,255,0.4)", borderRadius:4, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${xpPct}%`, background:"var(--t-strong)", borderRadius:4, transition:"width 0.6s" }} />
            </div>
            <div style={{ fontSize:10, color:"var(--t-label)", fontFamily:"sans-serif", marginTop:4 }}>
              {(nextLvl.min - xp).toLocaleString()} XP to next level
            </div>
          </div>
        )}
      </div>

      {/* Milestones */}
      <div style={card}>
        <p style={secLbl}>Milestone Badges</p>
        <div style={{ display:"flex", gap:16, flexWrap:"wrap", justifyContent:"space-around" }}>
          {MILESTONES.map(m => {
            const earned = habits.some(h => streakFor(h.id) >= m.days);
            return (
              <div key={m.days} style={{ textAlign:"center", opacity:earned?1:0.25, transition:"all 0.4s" }}>
                <div style={{ fontSize:38, filter:earned?"none":"grayscale(1)" }}>{m.emoji}</div>
                <div style={{ fontSize:11, fontFamily:"sans-serif", color:earned?"var(--t-strong)":"#ccc", fontWeight:700, marginTop:4 }}>{m.label}</div>
                <div style={{ fontSize:9, fontFamily:"sans-serif", color:earned?"var(--t-label)":"#ddd" }}>{earned?"Earned":"Locked"}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Donut + stats — stack on mobile */}
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:16 }}>
        <div style={{ ...card, textAlign:"center" }}>
          <p style={secLbl}>Overall</p>
          <div style={{ position:"relative", height:144 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[{v:oPct},{v:100-oPct}]} dataKey="v" cx="50%" cy="50%" innerRadius={44} outerRadius={60} startAngle={90} endAngle={-270} stroke="none">
                  <Cell fill={theme.accent}/><Cell fill={theme.light}/>
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", textAlign:"center" }}>
              <div style={{ fontSize:24, fontWeight:800, color:"var(--t-strong)", lineHeight:1 }}>{oPct}%</div>
            </div>
          </div>
          <p style={{ margin:"4px 0 0", fontSize:12, color:"var(--t-label)", fontFamily:"sans-serif" }}>{status}</p>
        </div>

        <div style={card}>
          <p style={secLbl}>Stats</p>
          {[
            { icon:<Flame size={13} />,       label:"Longest Streak", value:`${lStreak} days`     },
            { icon:<CalendarDays size={13} />, label:"Active Days",    value:`${consist}/30`        },
            { icon:<Zap size={13} />,          label:"Current Streak", value:`${cStreak} days`     },
            { icon:<Gem size={13} />,          label:"Total XP",       value:xp.toLocaleString()   },
          ].map(s => (
            <div key={s.label} style={{ background:"var(--t-light)", borderRadius:9, padding:"8px 12px", marginBottom:6 }}>
              <div style={{ fontSize:10, color:"var(--t-label)", fontFamily:"sans-serif", marginBottom:1, display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ color:"var(--t-strong)" }}>{s.icon}</span> {s.label}
              </div>
              <div style={{ fontSize:16, fontWeight:800, color:"var(--t-strong)", fontFamily:"sans-serif" }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Habit performance */}
      {habits.filter(h => h.name.trim()).length > 0 && (
        <div style={card}>
          <p style={secLbl}>Habit Performance</p>
          <ResponsiveContainer width="100%" height={Math.max(160, habits.filter(h => h.name.trim()).length * 40)}>
            <BarChart
              data={habits.filter(h => h.name.trim()).map(h => ({
                name: h.name.replace(/[\u{1F300}-\u{1FFFF}]/gu, "").trim().slice(0, 16),
                pct: hPct(h),
              }))}
              layout="vertical" margin={{ left:0, right:28, top:0, bottom:0 }}>
              <XAxis type="number" domain={[0,100]} tick={{ fontSize:10, fill:"var(--t-muted)", fontFamily:"sans-serif" }} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize:11, fill:"var(--t-heading)", fontFamily:"sans-serif" }} width={114} />
              <Tooltip formatter={v => [`${v}%`, "Completion"]} contentStyle={{ fontFamily:"sans-serif", fontSize:12 }} />
              <Bar dataKey="pct" radius={[0,6,6,0]}>
                {habits.filter(h => h.name.trim()).map((h, i) => <Cell key={i} fill={CATS[h.cat].color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 30-day line */}
      <div style={card}>
        <p style={secLbl}>30-Day Progress</p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={dailyPcts.map((pct, i) => ({ day: i+1, pct }))} margin={{ left:0, right:16, top:4, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.light} />
            <XAxis dataKey="day" tick={{ fontSize:10, fill:"var(--t-muted)", fontFamily:"sans-serif" }} interval={4} />
            <YAxis domain={[0,100]} tick={{ fontSize:10, fill:"var(--t-muted)", fontFamily:"sans-serif" }} tickFormatter={v => `${v}%`} width={34} />
            <Tooltip formatter={v => [`${v}%`, "Daily %"]} contentStyle={{ fontFamily:"sans-serif", fontSize:12 }} />
            <Line type="monotone" dataKey="pct" stroke={theme.accent} strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Share card */}
      <div style={{ ...card, background:`linear-gradient(135deg,var(--t-header-from),var(--t-light))`, textAlign:"center", padding:"24px" }}>
        <p style={{ ...secLbl, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
          Progress Card <Share2 size={12} style={{ opacity:0.7 }} /> Screenshot to Share
        </p>
        <div style={{ fontSize:40, marginBottom:8 }}>🌹</div>
        <div style={{ fontSize:20, color:"var(--t-heading)", fontWeight:"bold", marginBottom:4 }}>Day {todayIdx+1} of 30</div>
        <div style={{ fontSize:13, color:"var(--t-label)", fontFamily:"sans-serif", marginBottom:12 }}>
          {oPct}% discipline · {cStreak}-day streak · {level.name}
        </div>
        <div style={{ display:"flex", justifyContent:"center", gap:3, flexWrap:"wrap", maxWidth:320, margin:"0 auto 14px" }}>
          {dailyPcts.slice(0, todayIdx+1).map((pct, d) => (
            <div key={d} style={{ width:9, height:9, borderRadius:2, background:`rgba(${theme.accentRgb},${0.15 + pct / 100 * 0.85})` }} />
          ))}
        </div>
        <div style={{ fontSize:11, color:"var(--t-muted)", fontFamily:"sans-serif", fontStyle:"italic" }}>
          30-Day Habit Reset · Stay consistent and watch your rose fully bloom
        </div>
      </div>

    </div>
  );
}
