import { useState, useEffect } from "react";
import { Sunrise, LayoutGrid, Flame, BarChart2, PenLine, Settings, AlertTriangle, CheckCheck } from 'lucide-react';
import { supabase } from './supabase';
import { useHabitTracker } from './hooks/useHabitTracker';
import AuthScreen from './components/AuthScreen';
import TodayView from './components/TodayView';
import GridView from './components/GridView';
import HeatmapView from './components/HeatmapView';
import DashboardView from './components/DashboardView';
import ReflectView from './components/ReflectView';
import SettingsView from './components/SettingsView';
import { btn } from './styles';

const TABS = [
  { id:"today",     label:"Today",   Icon:Sunrise    },
  { id:"tracker",   label:"Grid",    Icon:LayoutGrid },
  { id:"heatmap",   label:"Heatmap", Icon:Flame      },
  { id:"dashboard", label:"Stats",   Icon:BarChart2  },
  { id:"reflect",   label:"Reflect", Icon:PenLine    },
  { id:"settings",  label:"Setup",   Icon:Settings   },
];

function Toast({ toast }) {
  if (!toast) return null;
  const isError     = toast.type === 'error';
  const isMilestone = toast.type === 'milestone';
  return (
    <div style={{
      position:"fixed", top:16, left:"50%", transform:"translateX(-50%)",
      background:"#fff", border:"1px solid #f0c0d0", borderRadius:12,
      padding:"12px 20px", boxShadow:"0 4px 24px rgba(200,80,120,0.18)",
      zIndex:200, display:"flex", alignItems:"center", gap:10, whiteSpace:"nowrap",
    }}>
      {isMilestone && <span style={{ fontSize:22 }}>{toast.emoji}</span>}
      {isError  && <AlertTriangle size={18} style={{ color:"#c04070", flexShrink:0 }} />}
      {!isError && !isMilestone && <CheckCheck size={17} style={{ color:"#e879a0", flexShrink:0 }} />}
      <span style={{ fontFamily:"sans-serif", fontSize:14, color:"#6a1a38", fontWeight:600 }}>{toast.msg}</span>
    </div>
  );
}

export default function App() {
  const [session,     setSession]     = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authEmail,   setAuthEmail]   = useState('');
  const [authPassword,setAuthPassword]= useState('');
  const [authMode,    setAuthMode]    = useState('login');
  const [authError,   setAuthError]   = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [view,        setView]        = useState("today");

  const user      = session?.user || null;
  const userId    = user?.id || null;
  const userEmail = user?.email || '';

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session || null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
      setAuthLoading(false);
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const tracker = useHabitTracker(userId, userEmail);

  const handleAuthAction = async (event) => {
    event.preventDefault();
    setAuthError('');
    setAuthMessage('');
    setAuthLoading(true);
    const email    = authEmail.trim();
    const password = authPassword;
    if (!email || !password) {
      setAuthError('Enter an email and password.');
      setAuthLoading(false);
      return;
    }
    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        setAuthMessage('Check your email to confirm your account, then sign in.');
        setAuthPassword('');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setAuthEmail('');
        setAuthPassword('');
      }
    } catch (error) {
      setAuthError(error.message || 'Authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = () => supabase.auth.signOut();

  if (authLoading) {
    return (
      <div style={{ minHeight:'100vh', display:'grid', placeItems:'center', background:'linear-gradient(135deg,#fdf0f3,#fff)', fontFamily:"'Georgia',serif" }}>
        <div style={{ textAlign:'center', padding:'28px 24px', background:'#fff', border:'1px solid #f0c0d0', borderRadius:18, boxShadow:'0 10px 30px rgba(200,80,120,0.12)' }}>
          <div style={{ fontSize:34, marginBottom:8 }}>🌹</div>
          <div style={{ fontSize:18, fontWeight:700, marginBottom:4, color:'#6a1a38' }}>Loading your account</div>
          <div style={{ fontSize:13, color:'#a03060', fontFamily:'sans-serif' }}>Connecting to Supabase…</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <AuthScreen
        authMode={authMode} setAuthMode={setAuthMode}
        authEmail={authEmail} setAuthEmail={setAuthEmail}
        authPassword={authPassword} setAuthPassword={setAuthPassword}
        authError={authError} authMessage={authMessage} authLoading={authLoading}
        onSubmit={handleAuthAction}
      />
    );
  }

  if (!tracker.loaded) {
    return (
      <div style={{ minHeight:'100vh', display:'grid', placeItems:'center', background:'linear-gradient(135deg,#fdf0f3,#fff)', fontFamily:"'Georgia',serif" }}>
        <div style={{ textAlign:'center', padding:'28px 24px', background:'#fff', border:'1px solid #f0c0d0', borderRadius:18, boxShadow:'0 10px 30px rgba(200,80,120,0.12)' }}>
          <div style={{ fontSize:34, marginBottom:8 }}>🌱</div>
          <div style={{ fontSize:18, fontWeight:700, marginBottom:4, color:'#6a1a38' }}>Loading your habits</div>
          <div style={{ fontSize:13, color:'#a03060', fontFamily:'sans-serif' }}>Fetching your data…</div>
        </div>
      </div>
    );
  }

  const { level, xp, xpPct, nextLvl, toast } = tracker;

  return (
    <div style={{ fontFamily:"'Georgia',serif", background:"#fdf0f3", minHeight:"100vh" }}>

      <Toast toast={toast} />

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#f8c4d8,#f0a0c4)", padding:"16px 20px 0" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <div>
            <p style={{ margin:0, fontSize:10, letterSpacing:4, color:"#a03060", textTransform:"uppercase", fontFamily:"sans-serif" }}>30-Day Reset</p>
            <h1 style={{ margin:"2px 0 0", fontSize:22, color:"#6a1a38", fontWeight:"normal" }}>Habit Tracker</h1>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', justifyContent:'flex-end' }}>
            <div style={{ textAlign:"right", minWidth:90 }}>
              <div style={{ fontSize:12, color:"#7a2040", fontFamily:"sans-serif", fontWeight:700 }}>{level.name}</div>
              <div style={{ fontSize:10, color:"#a03060", fontFamily:"sans-serif", marginBottom:3 }}>{xp} XP</div>
              <div style={{ width:84, height:6, background:"rgba(255,255,255,0.35)", borderRadius:3, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${nextLvl ? xpPct : 100}%`, background:"#c04070", borderRadius:3, transition:"width 0.5s" }} />
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:11, color:'#7a2040', fontFamily:'sans-serif', fontWeight:700 }}>{userEmail}</div>
              <button onClick={handleSignOut} style={{ ...btn('transparent','#7a2040'), marginTop:6, padding:'7px 11px' }}>Sign out</button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:2, overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setView(id)} style={{
              flexShrink:0, padding:"8px 12px", border:"none", cursor:"pointer",
              fontFamily:"sans-serif", fontSize:11, fontWeight:600, whiteSpace:"nowrap",
              background: view === id ? "#fff" : "transparent",
              color: view === id ? "#c04070" : "#7a2040",
              borderRadius:"7px 7px 0 0", transition:"all 0.2s",
              display:"flex", alignItems:"center", gap:5,
            }}>
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* View */}
      <div style={{ padding:"16px", maxWidth:1020, margin:"0 auto" }}>
        {view === "today" && (
          <TodayView
            habits={tracker.habits} checked={tracker.checked} startDate={tracker.startDate}
            intentions={tracker.intentions} todayIdx={tracker.todayIdx}
            cStreak={tracker.cStreak} oPct={tracker.oPct} todayDone={tracker.todayDone}
            toggleCheck={tracker.toggleCheck} handleSetIntention={tracker.handleSetIntention}
            markAllToday={tracker.markAllToday} resetDay={tracker.resetDay}
            streakFor={tracker.streakFor}
          />
        )}
        {view === "tracker" && (
          <GridView
            habits={tracker.habits} checked={tracker.checked} startDate={tracker.startDate}
            todayIdx={tracker.todayIdx} oPct={tracker.oPct} dailyPcts={tracker.dailyPcts}
            toggleCheck={tracker.toggleCheck}
            hDone={tracker.hDone} hTarget={tracker.hTarget} hPct={tracker.hPct}
          />
        )}
        {view === "heatmap" && (
          <HeatmapView
            habits={tracker.habits} checked={tracker.checked} startDate={tracker.startDate}
            todayIdx={tracker.todayIdx} dailyPcts={tracker.dailyPcts}
            hPct={tracker.hPct} streakFor={tracker.streakFor}
          />
        )}
        {view === "dashboard" && (
          <DashboardView
            habits={tracker.habits} todayIdx={tracker.todayIdx}
            oPct={tracker.oPct} cStreak={tracker.cStreak} lStreak={tracker.lStreak}
            consist={tracker.consist} xp={tracker.xp} level={tracker.level}
            nextLvl={tracker.nextLvl} xpPct={tracker.xpPct}
            status={tracker.status} dailyPcts={tracker.dailyPcts}
            hPct={tracker.hPct} streakFor={tracker.streakFor}
          />
        )}
        {view === "reflect" && (
          <ReflectView
            intentions={tracker.intentions} reflections={tracker.reflections}
            todayIdx={tracker.todayIdx} dailyPcts={tracker.dailyPcts}
            handleSetReflection={tracker.handleSetReflection}
          />
        )}
        {view === "settings" && (
          <SettingsView
            habits={tracker.habits} profile={tracker.profile} setProfile={tracker.setProfile}
            startDate={tracker.startDate} todayIdx={tracker.todayIdx}
            addHabit={tracker.addHabit} removeHabit={tracker.removeHabit} updHabit={tracker.updHabit}
            handleSetStartDate={tracker.handleSetStartDate}
            handleSaveProfile={tracker.handleSaveProfile}
            handleResetCheckins={tracker.handleResetCheckins}
            onDragStart={tracker.onDragStart} onDragOver={tracker.onDragOver} onDragEnd={tracker.onDragEnd}
            dragIdx={tracker.dragIdx}
            showToast={tracker.showToast}
          />
        )}
      </div>

    </div>
  );
}
