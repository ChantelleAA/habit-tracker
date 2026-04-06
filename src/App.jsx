import { useState, useEffect } from "react";
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid
} from "recharts";

// ─── Constants ────────────────────────────────────────────────
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const CATS = {
  health:       { label:"Health 🩺",      color:"#e879a0", bg:"#fde8f0" },
  mindset:      { label:"Mindset 🧠",      color:"#9b7fd4", bg:"#f0ebff" },
  productivity: { label:"Productivity ⚡", color:"#5b9bd5", bg:"#e8f2ff" },
  fitness:      { label:"Fitness 💪",      color:"#5bbf7a", bg:"#e8f8ee" },
  other:        { label:"Other ✨",        color:"#d4a017", bg:"#fff8e1" },
};

const FREQS = {
  daily: { label:"Daily",   target:30 },
  "5x":  { label:"5×/week", target:21 },
  "3x":  { label:"3×/week", target:13 },
};

const LEVELS = [
  { name:"Seedling 🌱", min:0,    next:500  },
  { name:"Sprout 🌿",   min:500,  next:1500 },
  { name:"Bloom 🌷",    min:1500, next:3000 },
  { name:"Garden 🌹",   min:3000, next:null },
];

const MILESTONES = [
  { days:3,  emoji:"🌿", label:"3-Day Spark"  },
  { days:7,  emoji:"🌱", label:"One Week"      },
  { days:14, emoji:"🌷", label:"Two Weeks"     },
  { days:21, emoji:"🌸", label:"21-Day Habit"  },
  { days:30, emoji:"🌹", label:"Full Bloom"    },
];

const DEFAULTS = [
  { id:"h1", name:"Water Intake 💧",    cat:"health",       freq:"daily", core:true  },
  { id:"h2", name:"30 Mins Reading 📖", cat:"mindset",      freq:"daily", core:false },
  { id:"h3", name:"Meditate 🧘",        cat:"mindset",      freq:"daily", core:true  },
  { id:"h4", name:"10K Steps 🏃",       cat:"fitness",      freq:"5x",    core:false },
  { id:"h5", name:"Training 💪",        cat:"fitness",      freq:"3x",    core:false },
  { id:"h6", name:"Tidy Room 🛏️",      cat:"productivity", freq:"daily", core:false },
  { id:"h7", name:"Sunlight ☀️",       cat:"health",       freq:"daily", core:false },
];

// ─── Helpers ──────────────────────────────────────────────────
const uid    = () => Math.random().toString(36).slice(2, 8);
const eRow   = () => Array(30).fill(false);
const plantFor = p => p>=90?"🌹":p>=70?"🌷":p>=50?"🌱":p>=20?"🌿":"🪴";

const getDayIdx = (startDate) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const start = new Date(startDate); start.setHours(0,0,0,0);
  return Math.max(0, Math.min(29, Math.floor((today - start) / 86400000)));
};

const fmtDate = (startDate, di) => {
  const d = new Date(startDate);
  d.setDate(d.getDate() + di);
  return d.toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"long" });
};

// ─── localStorage helpers ─────────────────────────────────────
const LS_KEYS = {
  habits:      "ht-habits",
  checked:     "ht-checked",
  startDate:   "ht-start",
  intentions:  "ht-intent",
  reflections: "ht-reflect",
};

const lsGet = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
};

const lsSet = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
};

// ─── Shared styles ────────────────────────────────────────────
const card   = { background:"#fff", borderRadius:14, boxShadow:"0 2px 20px rgba(200,80,120,0.09)", padding:"18px 16px" };
const secLbl = { margin:"0 0 12px", fontSize:11, letterSpacing:2, color:"#a03060", textTransform:"uppercase", fontFamily:"sans-serif", fontWeight:700 };
const btn    = (bg="#e879a0", col="#fff") => ({
  background:bg, color:col, border: bg==="transparent"?"1px solid #f0c0d0":"none",
  borderRadius:9, padding:"10px 16px", fontFamily:"sans-serif", fontSize:13, fontWeight:700, cursor:"pointer"
});

// ─── App ──────────────────────────────────────────────────────
export default function App() {
  const [habits,      setHabits]      = useState(() => lsGet(LS_KEYS.habits,      DEFAULTS));
  const [checked,     setChecked]     = useState(() => lsGet(LS_KEYS.checked,     Object.fromEntries(DEFAULTS.map(h=>[h.id,eRow()]))));
  const [startDate,   setStartDate]   = useState(() => lsGet(LS_KEYS.startDate,   new Date().toISOString().slice(0,10)));
  const [intentions,  setIntentions]  = useState(() => lsGet(LS_KEYS.intentions,  Array(30).fill("")));
  const [reflections, setReflections] = useState(() => lsGet(LS_KEYS.reflections, Array(4).fill("")));
  const [view,        setView]        = useState("today");
  const [toast,       setToast]       = useState(null);
  const [dragIdx,     setDragIdx]     = useState(null);

  const todayIdx = getDayIdx(startDate);

  // ── Persist on every change ──
  useEffect(() => { lsSet(LS_KEYS.habits,      habits);      }, [habits]);
  useEffect(() => { lsSet(LS_KEYS.checked,     checked);     }, [checked]);
  useEffect(() => { lsSet(LS_KEYS.startDate,   startDate);   }, [startDate]);
  useEffect(() => { lsSet(LS_KEYS.intentions,  intentions);  }, [intentions]);
  useEffect(() => { lsSet(LS_KEYS.reflections, reflections); }, [reflections]);

  // ── Toast ──
  const showToast = (msg, emoji="🌹") => {
    setToast({msg,emoji});
    setTimeout(()=>setToast(null), 2800);
  };

  // ── Habit CRUD ──
  const addHabit = () => {
    const id = uid();
    setHabits(p => [...p, {id, name:"", cat:"health", freq:"daily", core:false}]);
    setChecked(p => ({...p, [id]:eRow()}));
  };

  const removeHabit = (id) => {
    if (!window.confirm(`Remove "${habits.find(h=>h.id===id)?.name||"habit"}"?`)) return;
    setHabits(p  => p.filter(h=>h.id!==id));
    setChecked(p => { const n={...p}; delete n[id]; return n; });
  };

  const updHabit = (id,field,val) => setHabits(p=>p.map(h=>h.id===id?{...h,[field]:val}:h));

  const toggleCheck = (id, di) => {
    const row   = checked[id] || eRow();
    const going = !row[di];
    setChecked(p => { const n={...p,[id]:[...(p[id]||eRow())]};n[id][di]=going;return n; });
    if (going) {
      const newRow=[...row]; newRow[di]=true;
      let streak=0; for(let d=di;d>=0;d--){if(newRow[d])streak++;else break;}
      const ms=MILESTONES.find(m=>m.days===streak);
      if(ms) showToast(`${ms.label} streak!`, ms.emoji);
    }
  };

  const markAllToday = () => {
    setChecked(p=>{
      const n={...p};
      habits.forEach(h=>{n[h.id]=[...(p[h.id]||eRow())];n[h.id][todayIdx]=true;});
      return n;
    });
    showToast("All habits checked for today!","✅");
  };

  const resetDay = () => {
    setChecked(p=>{
      const n={...p};
      habits.forEach(h=>{n[h.id]=[...(p[h.id]||eRow())];n[h.id][todayIdx]=false;});
      return n;
    });
  };

  // ── Drag to reorder ──
  const onDragStart = i => setDragIdx(i);
  const onDragOver  = (e,i) => {
    e.preventDefault();
    if(dragIdx===null||dragIdx===i) return;
    setHabits(p=>{const n=[...p];const[m]=n.splice(dragIdx,1);n.splice(i,0,m);return n;});
    setDragIdx(i);
  };
  const onDragEnd = () => setDragIdx(null);

  // ── Calculations ──
  const hDone   = id => (checked[id]||[]).filter(Boolean).length;
  const hTarget = h  => FREQS[h.freq]?.target||30;
  const hPct    = h  => Math.min(100,Math.round(hDone(h.id)/hTarget(h)*100));

  const dayCount  = di => habits.filter(h=>(checked[h.id]||[])[di]).length;
  const dayPct    = di => habits.length>0?Math.round(dayCount(di)/habits.length*100):0;
  const dailyPcts = Array.from({length:30},(_,d)=>dayPct(d));

  const streakFor = (id,upTo=todayIdx)=>{
    const row=checked[id]||[];
    let s=0; for(let d=upTo;d>=0;d--){if(row[d])s++;else break;} return s;
  };

  const overallStreak = ()=>{let s=0;for(let d=todayIdx;d>=0;d--){if(dayCount(d)>0)s++;else break;}return s;};
  const longestStreak = ()=>{let max=0,cur=0;for(let d=0;d<=todayIdx;d++){if(dayCount(d)>0){cur++;max=Math.max(max,cur);}else cur=0;}return max;};

  const overallPct = ()=>{
    if(!habits.length) return 0;
    const weighted = habits.reduce((s,h)=>s+hPct(h)*(h.core?1.5:1),0);
    const maxW     = habits.reduce((s,h)=>s+(h.core?150:100),0);
    return Math.round(weighted/maxW*100);
  };

  const totalXP = ()=>{
    let xp=habits.reduce((s,h)=>s+hDone(h.id)*(h.core?15:10),0);
    habits.forEach(h=>{
      const st=streakFor(h.id);
      if(st>=30)xp+=500;else if(st>=21)xp+=250;else if(st>=14)xp+=150;else if(st>=7)xp+=75;else if(st>=3)xp+=25;
    });
    return xp;
  };

  const getLevel = xp => LEVELS.slice().reverse().find(l=>xp>=l.min)||LEVELS[0];

  const oPct    = overallPct();
  const cStreak = overallStreak();
  const lStreak = longestStreak();
  const consist = dailyPcts.filter(p=>p>0).length;
  const xp      = totalXP();
  const level   = getLevel(xp);
  const nextLvl = LEVELS[LEVELS.indexOf(level)+1];
  const xpPct   = nextLvl?Math.round((xp-level.min)/(nextLvl.min-level.min)*100):100;
  const todayDone = habits.filter(h=>(checked[h.id]||[])[todayIdx]).length;
  const status  = oPct>=80?"Peak Discipline 🔥":oPct>=60?"Strong Momentum 📈":oPct>=40?"Building Up 🌱":"Just Getting Started 🪴";

  const TABS = [
    {id:"today",     label:"🌅 Today"},
    {id:"tracker",   label:"📋 Grid"},
    {id:"heatmap",   label:"🔥 Heatmap"},
    {id:"dashboard", label:"📊 Stats"},
    {id:"reflect",   label:"✍️ Reflect"},
    {id:"settings",  label:"⚙️ Setup"},
  ];

  return (
    <div style={{fontFamily:"'Georgia',serif",background:"#fdf0f3",minHeight:"100vh"}}>

      {/* Toast */}
      {toast&&(
        <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",background:"#fff",border:"1px solid #f0c0d0",borderRadius:12,padding:"12px 20px",boxShadow:"0 4px 24px rgba(200,80,120,0.18)",zIndex:200,display:"flex",alignItems:"center",gap:10,whiteSpace:"nowrap"}}>
          <span style={{fontSize:24}}>{toast.emoji}</span>
          <span style={{fontFamily:"sans-serif",fontSize:14,color:"#6a1a38",fontWeight:600}}>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#f8c4d8,#f0a0c4)",padding:"16px 20px 0"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div>
            <p style={{margin:0,fontSize:10,letterSpacing:4,color:"#a03060",textTransform:"uppercase",fontFamily:"sans-serif"}}>30-Day Reset</p>
            <h1 style={{margin:"2px 0 0",fontSize:22,color:"#6a1a38",fontWeight:"normal"}}>Habit Tracker</h1>
          </div>
          <div style={{textAlign:"right",minWidth:90}}>
            <div style={{fontSize:12,color:"#7a2040",fontFamily:"sans-serif",fontWeight:700}}>{level.name}</div>
            <div style={{fontSize:10,color:"#a03060",fontFamily:"sans-serif",marginBottom:3}}>{xp} XP</div>
            <div style={{width:84,height:6,background:"rgba(255,255,255,0.35)",borderRadius:3,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${xpPct}%`,background:"#c04070",borderRadius:3,transition:"width 0.5s"}}/>
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:2,overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setView(t.id)} style={{
              flexShrink:0,padding:"8px 11px",border:"none",cursor:"pointer",
              fontFamily:"sans-serif",fontSize:11,fontWeight:600,whiteSpace:"nowrap",
              background:view===t.id?"#fff":"transparent",
              color:view===t.id?"#c04070":"#7a2040",
              borderRadius:"7px 7px 0 0",transition:"all 0.2s",
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{padding:"16px",maxWidth:1020,margin:"0 auto"}}>

        {/* ══ TODAY ══ */}
        {view==="today"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{...card,background:"linear-gradient(135deg,#fff,#fdf0f3)",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
              <div>
                <div style={{fontSize:20,color:"#6a1a38",marginBottom:2}}>{todayIdx<=29?`Day ${todayIdx+1} of 30 🌹`:"Challenge Complete! 🎉"}</div>
                <div style={{fontSize:13,color:"#a03060",fontFamily:"sans-serif"}}>{fmtDate(startDate,todayIdx)}</div>
              </div>
              <div style={{display:"flex",gap:8}}>
                {[
                  {val:`${todayDone}/${habits.length}`,lbl:"Done today"},
                  {val:`${cStreak}`,                   lbl:"Day streak"},
                  {val:`${oPct}%`,                     lbl:"Overall"},
                ].map(s=>(
                  <div key={s.lbl} style={{textAlign:"center",background:"#fde8f0",borderRadius:10,padding:"8px 12px"}}>
                    <div style={{fontSize:18,fontWeight:800,color:"#c04070",fontFamily:"sans-serif"}}>{s.val}</div>
                    <div style={{fontSize:10,color:"#a03060",fontFamily:"sans-serif"}}>{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={card}>
              <p style={secLbl}>Today's Intention</p>
              <input
                value={intentions[todayIdx]||""}
                onChange={e=>setIntentions(p=>{const n=[...p];n[todayIdx]=e.target.value;return n;})}
                placeholder={'Set an intention for today - e.g. "I will show up for myself, no matter what"'}
                style={{width:"100%",border:"1px solid #f0c0d0",borderRadius:9,padding:"11px 14px",fontSize:14,fontFamily:"Georgia,serif",color:"#5a1a30",outline:"none",boxSizing:"border-box",background:"#fffafb"}}
              />
            </div>

            <div style={{display:"flex",gap:8}}>
              <button onClick={markAllToday} style={{...btn(),flex:1}}>✓ Mark All Done Today</button>
              <button onClick={resetDay} style={{...btn("transparent","#c06080"),flex:"0 0 auto"}}>Reset Day</button>
            </div>

            {Object.entries(CATS).map(([catKey,cat])=>{
              const catHabits=habits.filter(h=>h.cat===catKey&&h.name.trim());
              if(!catHabits.length) return null;
              return (
                <div key={catKey}>
                  <div style={{fontSize:11,color:cat.color,letterSpacing:2,textTransform:"uppercase",fontFamily:"sans-serif",marginBottom:8,fontWeight:700}}>{cat.label}</div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {catHabits.map(h=>{
                      const done=!!(checked[h.id]||[])[todayIdx];
                      const streak=streakFor(h.id);
                      return (
                        <div key={h.id} onClick={()=>toggleCheck(h.id,todayIdx)} style={{
                          background:done?cat.color:"#fff",border:`2px solid ${done?cat.color:"#f0d0dc"}`,
                          borderRadius:13,padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",
                          cursor:"pointer",transition:"all 0.2s",
                          boxShadow:done?`0 4px 18px ${cat.color}44`:"0 2px 8px rgba(200,80,120,0.06)",
                        }}>
                          <div style={{display:"flex",alignItems:"center",gap:12}}>
                            <div style={{width:30,height:30,borderRadius:"50%",background:done?"rgba(255,255,255,0.25)":cat.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>
                              {done?"✓":""}
                            </div>
                            <div>
                              <div style={{fontSize:14,color:done?"#fff":"#5a1a30",fontWeight:done?"bold":"normal"}}>
                                {h.name}{h.core&&<span style={{fontSize:9,background:done?"rgba(255,255,255,0.25)":"#fde8f0",color:done?"#fff":"#c04070",borderRadius:4,padding:"1px 5px",fontFamily:"sans-serif",marginLeft:6,verticalAlign:"middle"}}>CORE</span>}
                              </div>
                              <div style={{fontSize:11,color:done?"rgba(255,255,255,0.75)":"#b07090",fontFamily:"sans-serif",marginTop:1}}>
                                {FREQS[h.freq]?.label} · {streak>0?`🔥 ${streak}-day streak`:"Start your streak today"}
                              </div>
                            </div>
                          </div>
                          <div style={{fontSize:26}}>{done?"✅":"⬜"}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div style={card}>
              <p style={secLbl}>Streak Milestones</p>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                {MILESTONES.map(m=>{
                  const earned=habits.some(h=>streakFor(h.id)>=m.days);
                  return (
                    <div key={m.days} style={{textAlign:"center",opacity:earned?1:0.28,transition:"opacity 0.4s"}}>
                      <div style={{fontSize:34,filter:earned?"none":"grayscale(1)"}}>{m.emoji}</div>
                      <div style={{fontSize:10,fontFamily:"sans-serif",color:earned?"#c04070":"#ccc",fontWeight:700,marginTop:2}}>{m.days} days</div>
                      <div style={{fontSize:9,fontFamily:"sans-serif",color:earned?"#a03060":"#ddd"}}>{earned?"✓ Earned":"Locked"}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══ GRID ══ */}
        {view==="tracker"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {habits.filter(h=>h.name.trim()).length>0?(
              <div style={{...card,padding:0,overflow:"hidden"}}>
                <div style={{overflowX:"auto"}}>
                  <table style={{borderCollapse:"collapse",width:"100%",minWidth:880}}>
                    <thead>
                      <tr style={{background:"#fdf0f3"}}>
                        <th style={{width:170,padding:"10px 14px",textAlign:"left",fontSize:11,color:"#a03060",letterSpacing:1,textTransform:"uppercase",fontFamily:"sans-serif",position:"sticky",left:0,background:"#fdf0f3",zIndex:2,borderBottom:"1px solid #fde0ea"}}>Habit</th>
                        {Array.from({length:30},(_,d)=>{
                          const isToday=d===todayIdx;
                          const dow=new Date(new Date(startDate).getTime()+d*86400000).getDay();
                          return (
                            <th key={d} style={{padding:"4px 1px",textAlign:"center",minWidth:27,borderBottom:"1px solid #fde0ea",background:isToday?"#fde0ec":"#fdf0f3"}}>
                              <div style={{fontSize:8,color:isToday?"#c04070":"#c06080",fontFamily:"sans-serif"}}>{DAY_NAMES[dow]}</div>
                              <div style={{fontSize:11,fontFamily:"sans-serif",fontWeight:700,background:isToday?"#e879a0":"transparent",color:isToday?"#fff":"#7a2040",borderRadius:3,padding:isToday?"1px 3px":"0",display:"inline-block",minWidth:16,textAlign:"center"}}>{d+1}</div>
                            </th>
                          );
                        })}
                        <th style={{padding:"8px 10px",fontSize:10,color:"#a03060",fontFamily:"sans-serif",textTransform:"uppercase",letterSpacing:1,background:"#fdf0f3",borderBottom:"1px solid #fde0ea",whiteSpace:"nowrap"}}>Done</th>
                        <th style={{padding:"8px 10px",fontSize:10,color:"#a03060",fontFamily:"sans-serif",textTransform:"uppercase",letterSpacing:1,background:"#fdf0f3",borderBottom:"1px solid #fde0ea",minWidth:72}}>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {habits.filter(h=>h.name.trim()).map((h,ri)=>{
                        const done=hDone(h.id);const pct=hPct(h);const cat=CATS[h.cat];const rowBg=ri%2===0?"#fff":"#fffafb";
                        return (
                          <tr key={h.id} style={{borderTop:"1px solid #fde8f0"}}>
                            <td style={{padding:"7px 14px",position:"sticky",left:0,background:rowBg,zIndex:1,maxWidth:170,whiteSpace:"nowrap",overflow:"hidden"}}>
                              <span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:cat.color,marginRight:6,verticalAlign:"middle"}}/>
                              <span style={{fontSize:12,color:"#5a1a30",fontFamily:"sans-serif"}}>{h.name}</span>
                              {h.core&&<span style={{fontSize:8,background:"#fde8f0",color:"#c04070",borderRadius:3,padding:"1px 4px",fontFamily:"sans-serif",marginLeft:4}}>CORE</span>}
                            </td>
                            {Array.from({length:30},(_,d)=>{
                              const isToday=d===todayIdx;const cv=!!(checked[h.id]||[])[d];
                              return (
                                <td key={d} style={{textAlign:"center",padding:"3px 2px",background:isToday?`${cat.color}18`:rowBg}}>
                                  <div onClick={()=>toggleCheck(h.id,d)} style={{width:19,height:19,margin:"0 auto",borderRadius:4,cursor:"pointer",border:`2px solid ${cv?cat.color:"#f0c0d0"}`,background:cv?cat.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>
                                    {cv&&<span style={{color:"#fff",fontSize:10,fontWeight:900}}>✓</span>}
                                  </div>
                                </td>
                              );
                            })}
                            <td style={{textAlign:"center",fontSize:13,color:"#5a1a30",fontFamily:"sans-serif",fontWeight:700,padding:"0 10px",background:rowBg}}>{done}<span style={{fontSize:9,color:"#b09090",fontWeight:400}}>/{hTarget(h)}</span></td>
                            <td style={{padding:"0 10px",background:rowBg}}>
                              <div style={{fontSize:11,color:cat.color,fontFamily:"sans-serif",fontWeight:700,marginBottom:2}}>{pct}%</div>
                              <div style={{height:5,background:"#fde8f0",borderRadius:3,overflow:"hidden",minWidth:44}}>
                                <div style={{height:"100%",width:`${pct}%`,background:cat.color,borderRadius:3,transition:"width 0.3s"}}/>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{borderTop:"2px solid #fde8f0",padding:"12px 14px 16px",overflowX:"auto"}}>
                  <div style={{display:"flex",alignItems:"flex-end",minWidth:880}}>
                    <div style={{width:178,flexShrink:0,fontSize:10,color:"#a03060",letterSpacing:1,textTransform:"uppercase",fontFamily:"sans-serif"}}>🌱 Rose Garden</div>
                    {dailyPcts.map((pct,d)=>(
                      <div key={d} style={{width:27,flexShrink:0,textAlign:"center",opacity:d>todayIdx?0.3:1}}>
                        <div style={{fontSize:15,lineHeight:1}}>{plantFor(pct)}</div>
                        <div style={{fontSize:8,color:"#c06080",fontFamily:"sans-serif",marginTop:1}}>{pct}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ):(
              <div style={{...card,textAlign:"center",padding:"40px 20px"}}>
                <div style={{fontSize:36,marginBottom:8}}>🪴</div>
                <div style={{fontFamily:"sans-serif",color:"#c06080",fontSize:14}}>No habits yet — go to Setup to add some!</div>
              </div>
            )}
            <div style={{...card,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{fontFamily:"sans-serif",fontSize:11,color:"#a03060",fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Weighted Total</div>
                <div style={{fontFamily:"sans-serif",fontSize:10,color:"#b07090",marginTop:2}}>Core habits count 1.5×</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{height:8,width:140,background:"#fde8f0",borderRadius:4,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${oPct}%`,background:"linear-gradient(90deg,#f0a0c0,#e860a0)",borderRadius:4,transition:"width 0.4s"}}/>
                </div>
                <span style={{fontFamily:"sans-serif",fontSize:22,color:"#c04070",fontWeight:800}}>{oPct}%</span>
              </div>
            </div>
          </div>
        )}

        {/* ══ HEATMAP ══ */}
        {view==="heatmap"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={card}>
              <p style={secLbl}>Monthly Overview</p>
              <p style={{margin:"0 0 14px",fontSize:12,color:"#a03060",fontFamily:"sans-serif"}}>Each cell = one day. Darker pink = more habits completed.</p>
              <div style={{display:"flex",gap:4,marginBottom:6}}>
                {DAY_NAMES.map(d=><div key={d} style={{flex:1,textAlign:"center",fontSize:9,color:"#b07090",fontFamily:"sans-serif"}}>{d}</div>)}
              </div>
              {(()=>{
                const startDow=new Date(startDate).getDay();
                const cells=[...Array(startDow).fill({pad:true}),...Array.from({length:30},(_,i)=>({pad:false,idx:i}))];
                const weeks=[];for(let i=0;i<cells.length;i+=7)weeks.push(cells.slice(i,i+7));
                return (
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    {weeks.map((week,wi)=>(
                      <div key={wi} style={{display:"flex",gap:4}}>
                        {Array.from({length:7},(_,ci)=>{
                          const cell=week[ci];
                          if(!cell||cell.pad) return <div key={ci} style={{flex:1,height:38}}/>;
                          const pct=dailyPcts[cell.idx];const isToday=cell.idx===todayIdx;const future=cell.idx>todayIdx;
                          const alpha=future?0:pct===0?0.08:0.15+pct/100*0.82;
                          return (
                            <div key={ci} title={`Day ${cell.idx+1}: ${pct}%`} style={{flex:1,height:38,borderRadius:7,background:`rgba(232,121,160,${alpha})`,border:isToday?"2px solid #e879a0":"2px solid transparent",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",opacity:future?0.3:1}}>
                              <div style={{fontSize:11,fontFamily:"sans-serif",color:pct>50?"#fff":"#c04070",fontWeight:700,lineHeight:1}}>{cell.idx+1}</div>
                              {!future&&<div style={{fontSize:8,fontFamily:"sans-serif",color:pct>50?"rgba(255,255,255,0.8)":"#d090b0",marginTop:1}}>{pct}%</div>}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                );
              })()}
              <div style={{display:"flex",alignItems:"center",gap:5,marginTop:14}}>
                <span style={{fontSize:10,color:"#b07090",fontFamily:"sans-serif"}}>Less</span>
                {[0,25,50,75,100].map(p=><div key={p} style={{width:18,height:18,borderRadius:4,background:`rgba(232,121,160,${0.08+p/100*0.9})`}}/>)}
                <span style={{fontSize:10,color:"#b07090",fontFamily:"sans-serif"}}>More</span>
              </div>
            </div>
            <div style={card}>
              <p style={secLbl}>Per-Habit Streaks</p>
              {habits.filter(h=>h.name.trim()).map(h=>{
                const cat=CATS[h.cat];const streak=streakFor(h.id);const pct=hPct(h);
                return (
                  <div key={h.id} style={{marginBottom:14}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{width:7,height:7,borderRadius:"50%",background:cat.color,display:"inline-block"}}/>
                        <span style={{fontSize:12,color:"#5a1a30",fontFamily:"sans-serif"}}>{h.name}</span>
                      </div>
                      <span style={{fontSize:11,color:cat.color,fontFamily:"sans-serif",fontWeight:700}}>🔥 {streak} day · {pct}%</span>
                    </div>
                    <div style={{display:"flex",gap:2}}>
                      {Array.from({length:30},(_,d)=>(
                        <div key={d} style={{flex:1,height:12,borderRadius:2,background:(checked[h.id]||[])[d]?cat.color:"#fde8f0",opacity:d>todayIdx?0.25:1,transition:"background 0.2s"}}/>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ DASHBOARD ══ */}
        {view==="dashboard"&&(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{...card,background:"linear-gradient(135deg,#f8c4d8,#eda8c8)",padding:"20px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontSize:10,letterSpacing:3,color:"#7a2040",textTransform:"uppercase",fontFamily:"sans-serif",marginBottom:4}}>Your Level</div>
                  <div style={{fontSize:26,color:"#6a1a38",fontWeight:"bold"}}>{level.name}</div>
                  <div style={{fontSize:12,color:"#a03060",fontFamily:"sans-serif",marginTop:2}}>{xp.toLocaleString()} XP · Core habits earn 1.5×</div>
                </div>
                <div style={{fontSize:52}}>🌸</div>
              </div>
              {nextLvl&&(
                <div style={{marginTop:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#a03060",fontFamily:"sans-serif",marginBottom:4}}>
                    <span>{level.name}</span><span>{nextLvl.name}</span>
                  </div>
                  <div style={{height:8,background:"rgba(255,255,255,0.4)",borderRadius:4,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${xpPct}%`,background:"#c04070",borderRadius:4,transition:"width 0.6s"}}/>
                  </div>
                  <div style={{fontSize:10,color:"#a03060",fontFamily:"sans-serif",marginTop:4}}>{(nextLvl.min-xp).toLocaleString()} XP to next level</div>
                </div>
              )}
            </div>
            <div style={card}>
              <p style={secLbl}>Milestone Badges</p>
              <div style={{display:"flex",gap:16,flexWrap:"wrap",justifyContent:"space-around"}}>
                {MILESTONES.map(m=>{
                  const earned=habits.some(h=>streakFor(h.id)>=m.days);
                  return (
                    <div key={m.days} style={{textAlign:"center",opacity:earned?1:0.25,transition:"all 0.4s"}}>
                      <div style={{fontSize:38,filter:earned?"none":"grayscale(1)"}}>{m.emoji}</div>
                      <div style={{fontSize:11,fontFamily:"sans-serif",color:earned?"#c04070":"#ccc",fontWeight:700,marginTop:4}}>{m.label}</div>
                      <div style={{fontSize:9,fontFamily:"sans-serif",color:earned?"#a03060":"#ddd"}}>{earned?"✓ Earned":"Locked"}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <div style={{...card,textAlign:"center"}}>
                <p style={secLbl}>Overall</p>
                <div style={{position:"relative",height:144}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[{v:oPct},{v:100-oPct}]} dataKey="v" cx="50%" cy="50%" innerRadius={44} outerRadius={60} startAngle={90} endAngle={-270} stroke="none">
                        <Cell fill="#e879a0"/><Cell fill="#fde8f0"/>
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
                    <div style={{fontSize:24,fontWeight:800,color:"#c04070",lineHeight:1}}>{oPct}%</div>
                  </div>
                </div>
                <p style={{margin:"4px 0 0",fontSize:12,color:"#a03060",fontFamily:"sans-serif"}}>{status}</p>
              </div>
              <div style={card}>
                <p style={secLbl}>Stats</p>
                {[
                  {label:"🔥 Longest Streak",value:`${lStreak} days`},
                  {label:"📊 Active Days",   value:`${consist}/30`},
                  {label:"⚡ Current Streak",value:`${cStreak} days`},
                  {label:"💎 Total XP",      value:xp.toLocaleString()},
                ].map(s=>(
                  <div key={s.label} style={{background:"#fde8f0",borderRadius:9,padding:"8px 12px",marginBottom:6}}>
                    <div style={{fontSize:10,color:"#a03060",fontFamily:"sans-serif",marginBottom:1}}>{s.label}</div>
                    <div style={{fontSize:16,fontWeight:800,color:"#c04070",fontFamily:"sans-serif"}}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
            {habits.filter(h=>h.name.trim()).length>0&&(
              <div style={card}>
                <p style={secLbl}>Habit Performance</p>
                <ResponsiveContainer width="100%" height={Math.max(160,habits.filter(h=>h.name.trim()).length*40)}>
                  <BarChart data={habits.filter(h=>h.name.trim()).map(h=>({name:h.name.replace(/[\u{1F300}-\u{1FFFF}]/gu,"").trim().slice(0,16),pct:hPct(h)}))} layout="vertical" margin={{left:0,right:28,top:0,bottom:0}}>
                    <XAxis type="number" domain={[0,100]} tick={{fontSize:10,fill:"#c06080",fontFamily:"sans-serif"}} tickFormatter={v=>`${v}%`}/>
                    <YAxis type="category" dataKey="name" tick={{fontSize:11,fill:"#5a1a30",fontFamily:"sans-serif"}} width={114}/>
                    <Tooltip formatter={v=>[`${v}%`,"Completion"]} contentStyle={{fontFamily:"sans-serif",fontSize:12}}/>
                    <Bar dataKey="pct" radius={[0,6,6,0]}>
                      {habits.filter(h=>h.name.trim()).map((h,i)=><Cell key={i} fill={CATS[h.cat].color}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div style={card}>
              <p style={secLbl}>30-Day Progress</p>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={dailyPcts.map((pct,i)=>({day:i+1,pct}))} margin={{left:0,right:16,top:4,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fde8f0"/>
                  <XAxis dataKey="day" tick={{fontSize:10,fill:"#c06080",fontFamily:"sans-serif"}} interval={4}/>
                  <YAxis domain={[0,100]} tick={{fontSize:10,fill:"#c06080",fontFamily:"sans-serif"}} tickFormatter={v=>`${v}%`} width={34}/>
                  <Tooltip formatter={v=>[`${v}%`,"Daily %"]} contentStyle={{fontFamily:"sans-serif",fontSize:12}}/>
                  <Line type="monotone" dataKey="pct" stroke="#e879a0" strokeWidth={2.5} dot={false}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{...card,background:"linear-gradient(135deg,#f8c4d8,#f0dcea)",textAlign:"center",padding:"24px"}}>
              <p style={secLbl}>Progress Card · Screenshot to Share 📸</p>
              <div style={{fontSize:40,marginBottom:8}}>🌹</div>
              <div style={{fontSize:20,color:"#6a1a38",fontWeight:"bold",marginBottom:4}}>Day {todayIdx+1} of 30</div>
              <div style={{fontSize:13,color:"#a03060",fontFamily:"sans-serif",marginBottom:12}}>{oPct}% discipline · {cStreak}-day streak · {level.name}</div>
              <div style={{display:"flex",justifyContent:"center",gap:3,flexWrap:"wrap",maxWidth:320,margin:"0 auto 14px"}}>
                {dailyPcts.slice(0,todayIdx+1).map((pct,d)=>(
                  <div key={d} style={{width:9,height:9,borderRadius:2,background:`rgba(232,121,160,${0.15+pct/100*0.85})`}}/>
                ))}
              </div>
              <div style={{fontSize:11,color:"#c06080",fontFamily:"sans-serif",fontStyle:"italic"}}>30-Day Habit Reset · Stay consistent and watch your rose fully bloom</div>
            </div>
          </div>
        )}

        {/* ══ REFLECT ══ */}
        {view==="reflect"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={card}>
              <p style={secLbl}>Daily Intentions Log</p>
              <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:280,overflowY:"auto",paddingRight:4}}>
                {Array.from({length:Math.min(todayIdx+1,30)},(_,d)=>(
                  <div key={d} style={{display:"flex",gap:10,alignItems:"center"}}>
                    <div style={{width:46,flexShrink:0,textAlign:"right",fontSize:11,color:"#c04070",fontFamily:"sans-serif",fontWeight:700}}>Day {d+1}</div>
                    <div style={{flex:1,fontSize:12,fontFamily:"Georgia,serif",color:intentions[d]?"#5a1a30":"#d0b0c0",fontStyle:intentions[d]?"normal":"italic",background:"#fdf8fa",border:"1px solid #f0e0e8",borderRadius:7,padding:"6px 10px"}}>
                      {intentions[d]||"No intention set"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {[0,1,2,3].map(week=>{
              const ws=week*7;const we=Math.min(ws+7,30);const ok=todayIdx>=ws;
              const wd=dailyPcts.slice(ws,we).filter(p=>p>0).length;
              const avg=ok?Math.round(dailyPcts.slice(ws,we).reduce((s,p)=>s+p,0)/(we-ws)):0;
              return (
                <div key={week} style={{...card,opacity:ok?1:0.45}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                    <p style={{...secLbl,margin:0}}>Week {week+1} · Days {ws+1}–{we}</p>
                    {ok&&<span style={{fontSize:11,color:"#c04070",fontFamily:"sans-serif",fontWeight:700}}>{wd}/{we-ws} active · avg {avg}%</span>}
                  </div>
                  {ok&&<div style={{display:"flex",gap:2,marginBottom:12}}>{dailyPcts.slice(ws,we).map((pct,i)=><div key={i} style={{flex:1,height:6,borderRadius:2,background:`rgba(232,121,160,${0.12+pct/100*0.86})`}}/>)}</div>}
                  <textarea disabled={!ok} value={reflections[week]||""} onChange={e=>setReflections(p=>{const n=[...p];n[week]=e.target.value;return n;})}
                    placeholder={ok?"How did this week go? What worked, what didn't? What will you carry into next week?":"Unlocks when you reach this week"}
                    rows={4} style={{width:"100%",border:"1px solid #f0c0d0",borderRadius:9,padding:"11px 14px",fontSize:13,fontFamily:"Georgia,serif",color:"#5a1a30",outline:"none",resize:"vertical",boxSizing:"border-box",background:"#fffafb"}}/>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ SETTINGS ══ */}
        {view==="settings"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={card}>
              <p style={secLbl}>Challenge Start Date</p>
              <p style={{margin:"0 0 10px",fontSize:12,color:"#a03060",fontFamily:"sans-serif"}}>Today shows as Day {todayIdx+1} of 30. Change this to shift your whole calendar.</p>
              <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}
                style={{border:"1px solid #f0c0d0",borderRadius:8,padding:"9px 12px",fontSize:13,fontFamily:"sans-serif",color:"#5a1a30",outline:"none"}}/>
            </div>
            <div style={card}>
              <p style={secLbl}>Category Key</p>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {Object.entries(CATS).map(([k,v])=>(
                  <div key={k} style={{display:"flex",alignItems:"center",gap:5,background:v.bg,borderRadius:7,padding:"5px 10px"}}>
                    <span style={{width:8,height:8,borderRadius:"50%",background:v.color,display:"inline-block"}}/>
                    <span style={{fontSize:11,fontFamily:"sans-serif",color:v.color,fontWeight:600}}>{v.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={card}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                <p style={{...secLbl,margin:0}}>Habits <span style={{opacity:0.55,fontWeight:400}}>({habits.length})</span></p>
                <button onClick={addHabit} style={btn()}>+ Add Habit</button>
              </div>
              <p style={{margin:"0 0 12px",fontSize:11,color:"#b07090",fontFamily:"sans-serif"}}>⠿ Drag to reorder · Toggle Core for 1.5× XP weight</p>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {habits.map((h,i)=>{
                  const cat=CATS[h.cat];
                  return (
                    <div key={h.id} draggable onDragStart={()=>onDragStart(i)} onDragOver={e=>onDragOver(e,i)} onDragEnd={onDragEnd}
                      style={{background:dragIdx===i?"#fde8f0":"#fafafa",border:`1px solid ${dragIdx===i?cat.color:"#f0d0dc"}`,borderRadius:10,padding:"10px 12px",cursor:"grab",transition:"all 0.15s"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                        <span style={{color:"#d0b0bc",fontSize:16}}>⠿</span>
                        <input value={h.name} onChange={e=>updHabit(h.id,"name",e.target.value)} placeholder="Habit name…"
                          style={{flex:1,border:"1px solid #f0c0d0",borderRadius:7,padding:"7px 10px",fontSize:13,fontFamily:"sans-serif",color:"#5a1a30",outline:"none",background:"#fff"}}/>
                        <button onClick={()=>removeHabit(h.id)} style={{background:"none",border:"1px solid #f0c0d0",borderRadius:6,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#d06080",fontSize:17,padding:0}}>×</button>
                      </div>
                      <div style={{display:"flex",gap:7,flexWrap:"wrap",alignItems:"center"}}>
                        <select value={h.cat} onChange={e=>updHabit(h.id,"cat",e.target.value)}
                          style={{border:`1px solid ${cat.color}`,borderRadius:6,padding:"4px 8px",fontSize:11,fontFamily:"sans-serif",color:cat.color,background:cat.bg,outline:"none",cursor:"pointer"}}>
                          {Object.entries(CATS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                        </select>
                        <select value={h.freq} onChange={e=>updHabit(h.id,"freq",e.target.value)}
                          style={{border:"1px solid #f0c0d0",borderRadius:6,padding:"4px 8px",fontSize:11,fontFamily:"sans-serif",color:"#c04070",background:"#fde8f0",outline:"none",cursor:"pointer"}}>
                          {Object.entries(FREQS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                        </select>
                        <button onClick={()=>updHabit(h.id,"core",!h.core)} style={{border:`1px solid ${h.core?"#c04070":"#f0c0d0"}`,borderRadius:6,padding:"4px 11px",fontSize:11,fontFamily:"sans-serif",color:h.core?"#fff":"#c06080",background:h.core?"#e879a0":"transparent",cursor:"pointer",fontWeight:h.core?700:400}}>
                          {h.core?"★ Core":"☆ Core"}
                        </button>
                        <span style={{fontSize:10,color:"#b09090",fontFamily:"sans-serif"}}>Target: {FREQS[h.freq]?.target} days</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {habits.length===0&&<p style={{textAlign:"center",color:"#d0a0b0",fontFamily:"sans-serif",fontSize:13,margin:"10px 0 0"}}>No habits yet — click "+ Add Habit" 🌱</p>}
            </div>
            <button onClick={()=>{if(window.confirm("Reset all check-ins? Names and settings will be kept.")) setChecked(Object.fromEntries(habits.map(h=>[h.id,eRow()])));}}
              style={{...btn("transparent","#c06080"),width:"100%"}}>
              Reset All Check-ins
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
