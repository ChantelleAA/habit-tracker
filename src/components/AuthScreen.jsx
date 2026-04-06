import { btn } from '../styles';

export default function AuthScreen({
  authMode, setAuthMode,
  authEmail, setAuthEmail,
  authPassword, setAuthPassword,
  authError, authMessage, authLoading,
  onSubmit,
}) {
  return (
    <div style={{ minHeight:'100vh', display:'grid', placeItems:'center', background:`linear-gradient(135deg,var(--t-bg),#fff)`, padding:20, fontFamily:"'Georgia',serif" }}>
      <div style={{ width:'min(100%, 440px)', background:'#fff', border:'1px solid var(--t-border)', borderRadius:20, boxShadow:'0 10px 30px rgba(var(--t-accent-rgb),0.12)', padding:24 }}>

        <div style={{ textAlign:'center', marginBottom:18 }}>
          <div style={{ fontSize:40, marginBottom:6 }}>🌹</div>
          <h1 style={{ margin:'0 0 4px', fontSize:28, color:'var(--t-heading)', fontWeight:'normal' }}>Habit Tracker</h1>
          <p style={{ margin:0, fontSize:13, color:'var(--t-label)', fontFamily:'sans-serif' }}>
            Sign in or create an account to keep your habits private and synced.
          </p>
        </div>

        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          <button onClick={() => setAuthMode('login')}
            style={{ ...btn(authMode==='login' ? 'var(--t-accent)' : 'transparent', authMode==='login' ? '#fff' : 'var(--t-strong)'), flex:1 }}>
            Log In
          </button>
          <button onClick={() => setAuthMode('signup')}
            style={{ ...btn(authMode==='signup' ? 'var(--t-accent)' : 'transparent', authMode==='signup' ? '#fff' : 'var(--t-strong)'), flex:1 }}>
            Sign Up
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <label style={{ display:'flex', flexDirection:'column', gap:6, fontFamily:'sans-serif', fontSize:12, color:'var(--t-body)' }}>
            Email
            <input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="you@example.com"
              style={{ border:'1px solid var(--t-border)', borderRadius:9, padding:'11px 12px', fontSize:14, fontFamily:'sans-serif', outline:'none' }} />
          </label>
          <label style={{ display:'flex', flexDirection:'column', gap:6, fontFamily:'sans-serif', fontSize:12, color:'var(--t-body)' }}>
            Password
            <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="Your password"
              style={{ border:'1px solid var(--t-border)', borderRadius:9, padding:'11px 12px', fontSize:14, fontFamily:'sans-serif', outline:'none' }} />
          </label>

          {authError && (
            <div style={{ background:'rgba(var(--t-accent-rgb),0.06)', border:'1px solid var(--t-border)', color:'var(--t-strong)', borderRadius:10, padding:'10px 12px', fontFamily:'sans-serif', fontSize:12 }}>
              {authError}
            </div>
          )}
          {authMessage && (
            <div style={{ background:'#f3fff6', border:'1px solid #cdebd6', color:'#2f6a41', borderRadius:10, padding:'10px 12px', fontFamily:'sans-serif', fontSize:12 }}>
              {authMessage}
            </div>
          )}

          <button type="submit" disabled={authLoading} style={{ ...btn(), width:'100%', opacity: authLoading ? 0.7 : 1 }}>
            {authLoading ? 'Please wait…' : authMode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>

        <p style={{ margin:'14px 0 0', fontSize:12, color:'var(--t-muted)', fontFamily:'sans-serif', lineHeight:1.5 }}>
          Reminder emails are stored in your profile and used by the n8n workflow.
        </p>
      </div>
    </div>
  );
}
