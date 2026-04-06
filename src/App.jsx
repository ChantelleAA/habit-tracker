import { useState, useEffect } from "react";
import { Sunrise, LayoutGrid, Flame, BarChart2, PenLine, Settings, AlertTriangle, CheckCheck } from 'lucide-react';
import { supabase } from './supabase';
import { ThemeProvider } from './ThemeContext';
import { useHabitTracker } from './hooks/useHabitTracker';
import { useIsMobile } from './hooks/useIsMobile';
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
      background:"#fff", border:"1px solid var(--t-border)", borderRadius:12,
      padding:"12px 20px", boxShadow:"0 4px 24px rgba(var(--t-accent-rgb),0.18)",
      zIndex:300, display:"flex", alignItems:"center", gap:10, whiteSpace:"nowrap",
    }}>
      {isMilestone && <span style={{ fontSize:22 }}>{toast.emoji}</span>}
      {isError  && <AlertTriangle size={18} style={{ color:"var(--t-strong)", flexShrink:0 }} />}
      {!isError && !isMilestone && <CheckCheck size={17} style={{ color:"var(--t-accent)", flexShrink:0 }} />}
      <span style={{ fontFamily:"sans-serif", fontSize:14, color:"var(--t-heading)", fontWeight:600 }}>{toast.msg}</span>
    </div>
  );
}

function AppShell() {
  const [session,      setSession]      = useState(null);
  const [authLoading,  setAuthLoading]  = useState(true);
  const [authEmail,    setAuthEmail]    = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode,     setAuthMode]     = useState('login');
  const [authError,    setAuthError]    = useState('');
  const [authMessage,  setAuthMessage]  = useState('');
  const [view,         setView]         = useState("today");

  const isMobile  = useIsMobile();
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s || null);
      setAuthLoading(false);
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const tracker = useHabitTracker(userId, userEmail);

  const handleAuthAction = async (e) => {
    e.preventDefault();
    setAuthError(''); setAuthMessage(''); setAuthLoading(true);
    const email = authEmail.trim(), password = authPassword;
    if (!email || !password) { setAuthError('Enter an email and password.'); setAuthLoading(false); return; }
    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        setAuthMessage('Check your email to confirm your account, then sign in.');
        setAuthPassword('');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setAuthEmail(''); setAuthPassword('');
      }
    } catch (err) {
      setAuthError(err.message || 'Authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = () => supabase.auth.signOut();

  if (authLoading) return (
    <div style={{ minHeight:'100vh', display:'grid', placeItems:'center', background:'linear-gradient(135deg,var(--t-bg),#fff)', fontFamily:"'Georgia',serif" }}>
      <div style={{ textAlign:'center', padding:'28px 24px', background:'#fff', border:'1px solid var(--t-border)', borderRadius:18, boxShadow:'0 10px 30px rgba(var(--t-accent-rgb),0.12)' }}>
        <div style={{ fontSize:34, marginBottom:8 }}>🌹</div>
        <div style={{ fontSize:18, fontWeight:700, marginBottom:4, color:'var(--t-heading)' }}>Loading your account</div>
        <div style={{ fontSize:13, color:'var(--t-label)', fontFamily:'sans-serif' }}>Connecting…</div>
      </div>
    </div>
  );

  if (!session) return (
    <AuthScreen
      authMode={authMode} setAuthMode={setAuthMode}
      authEmail={authEmail} setAuthEmail={setAuthEmail}
      authPassword={authPassword} setAuthPassword={setAuthPassword}
      authError={authError} authMessage={authMessage} authLoading={authLoading}
      onSubmit={handleAuthAction}
    />
  );

  if (!tracker.loaded) return (
    <div style={{ minHeight:'100vh', display:'grid', placeItems:'center', background:'linear-gradient(135deg,var(--t-bg),#fff)', fontFamily:"'Georgia',serif" }}>
      <div style={{ textAlign:'center', padding:'28px 24px', background:'#fff', border:'1px solid var(--t-border)', borderRadius:18, boxShadow:'0 10px 30px rgba(var(--t-accent-rgb),0.12)' }}>
        <div style={{ fontSize:34, marginBottom:8 }}>🌱</div>
        <div style={{ fontSize:18, fontWeight:700, marginBottom:4, color:'var(--t-heading)' }}>Loading your habits</div>
        <div style={{ fontSize:13, color:'var(--t-label)', fontFamily:'sans-serif' }}>Fetching your data…</div>
      </div>
    </div>
  );

  const { level, xp, xpPct, nextLvl, toast, todayIdx } = tracker;

  return (
    <div style={{ fontFamily:"'Georgia',serif", background:"var(--t-bg)", minHeight:"100vh" }}>
      <Toast toast={toast} />

      {/* ── Header ── */}
      <div style={{ background:`linear-gradient(135deg,var(--t-header-from),var(--t-header-to))`, padding: isMobile ? "12px 16px 0" : "16px 20px 0" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: isMobile ? 8 : 12 }}>
          <div>
            <p style={{ margin:0, fontSize:10, letterSpacing:4, color:"var(--t-label)", textTransform:"uppercase", fontFamily:"sans-serif" }}>30-Day Reset</p>
            <h1 style={{ margin:"2px 0 0", fontSize: isMobile ? 18 : 22, color:"var(--t-heading)", fontWeight:"normal" }}>Habit Tracker</h1>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap: isMobile ? 8 : 12, flexWrap:'wrap', justifyContent:'flex-end' }}>
            {!isMobile && (
              <div style={{ textAlign:"right", minWidth:90 }}>
                <div style={{ fontSize:12, color:"var(--t-body)", fontFamily:"sans-serif", fontWeight:700 }}>{level.name}</div>
                <div style={{ fontSize:10, color:"var(--t-label)", fontFamily:"sans-serif", marginBottom:3 }}>{xp} XP</div>
                <div style={{ width:84, height:6, background:"rgba(255,255,255,0.35)", borderRadius:3, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${nextLvl ? xpPct : 100}%`, background:"var(--t-strong)", borderRadius:3, transition:"width 0.5s" }} />
                </div>
              </div>
            )}
            {isMobile && (
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:11, color:"var(--t-body)", fontFamily:"sans-serif", fontWeight:700 }}>Day {todayIdx + 1}/30</div>
                <div style={{ fontSize:10, color:"var(--t-label)", fontFamily:"sans-serif" }}>{level.name} · {xp} XP</div>
              </div>
            )}
            <div style={{ textAlign:'right' }}>
              {!isMobile && <div style={{ fontSize:11, color:'var(--t-body)', fontFamily:'sans-serif', fontWeight:700 }}>{userEmail}</div>}
              <button onClick={handleSignOut} style={{ ...btn('transparent','var(--t-body)'), marginTop: isMobile ? 0 : 6, padding:'7px 11px' }}>
                Sign out
              </button>
            </div>
          </div>
        </div>

        {/* Desktop tab bar */}
        {!isMobile && (
          <div style={{ display:"flex", gap:2, overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
            {TABS.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setView(id)} style={{
                flexShrink:0, padding:"8px 12px", border:"none", cursor:"pointer",
                fontFamily:"sans-serif", fontSize:11, fontWeight:600, whiteSpace:"nowrap",
                background: view===id ? "#fff" : "transparent",
                color: view===id ? "var(--t-strong)" : "var(--t-body)",
                borderRadius:"7px 7px 0 0", transition:"all 0.2s",
                display:"flex", alignItems:"center", gap:5,
              }}>
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{
        padding: isMobile ? "12px 12px" : "16px",
        maxWidth: 1020,
        margin: "0 auto",
        paddingBottom: isMobile ? "calc(72px + env(safe-area-inset-bottom, 0px))" : "16px",
      }}>
        {view === "today" && (
          <TodayView
            habits={tracker.habits} checked={tracker.checked} startDate={tracker.startDate}
            intentions={tracker.intentions} todayIdx={tracker.todayIdx}
            cStreak={tracker.cStreak} oPct={tracker.oPct} todayDone={tracker.todayDone}
            toggleCheck={tracker.toggleCheck} handleSetIntention={tracker.handleSetIntention}
            markAllToday={tracker.markAllToday} resetDay={tracker.resetDay}
            streakFor={tracker.streakFor} isMobile={isMobile}
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
            hPct={tracker.hPct} streakFor={tracker.streakFor} isMobile={isMobile}
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
            dragIdx={tracker.dragIdx} showToast={tracker.showToast} isMobile={isMobile}
          />
        )}
      </div>

      {/* Mobile bottom nav */}
      {isMobile && (
        <nav style={{
          position:"fixed", bottom:0, left:0, right:0,
          background:"#fff",
          borderTop:"1px solid var(--t-border)",
          display:"flex",
          paddingBottom:"env(safe-area-inset-bottom, 0px)",
          zIndex:200,
          boxShadow:"0 -2px 12px rgba(var(--t-accent-rgb),0.08)",
        }}>
          {TABS.map(({ id, label, Icon }) => {
            const active = view === id;
            return (
              <button key={id} onClick={() => setView(id)} style={{
                flex:1, padding:"8px 0 6px", border:"none", cursor:"pointer",
                background:"transparent",
                color: active ? "var(--t-accent)" : "#999",
                display:"flex", flexDirection:"column", alignItems:"center", gap:3,
                transition:"color 0.15s",
              }}>
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                <span style={{ fontSize:9, fontFamily:"sans-serif", fontWeight: active ? 700 : 500, letterSpacing:0.3 }}>
                  {label}
                </span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
