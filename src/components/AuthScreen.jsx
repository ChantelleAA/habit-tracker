import { useState } from 'react';
import { btn } from '../styles';

export default function AuthScreen({
  authMode, setAuthMode,
  authEmail, setAuthEmail,
  authPassword, setAuthPassword,
  authError, authMessage, authLoading,
  onSubmit, onForgotPassword,
}) {
  const [forgotMode, setForgotMode]       = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg]         = useState('');
  const [forgotErr, setForgotErr]         = useState('');

  const handleForgot = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMsg(''); setForgotErr('');
    const result = await onForgotPassword(authEmail);
    setForgotLoading(false);
    if (result.error) setForgotErr(result.error);
    else setForgotMsg(result.message);
  };

  const inputStyle = {
    border:'1px solid var(--t-border)', borderRadius:9, padding:'11px 12px',
    fontSize:14, fontFamily:'sans-serif', outline:'none', width:'100%', boxSizing:'border-box',
  };

  if (forgotMode) {
    return (
      <div style={{ minHeight:'100vh', display:'grid', placeItems:'center', background:`linear-gradient(135deg,var(--t-bg),#fff)`, padding:20, fontFamily:"'Georgia',serif" }}>
        <div style={{ width:'min(100%, 440px)', background:'#fff', border:'1px solid var(--t-border)', borderRadius:20, boxShadow:'0 10px 30px rgba(var(--t-accent-rgb),0.12)', padding:24 }}>

          <div style={{ textAlign:'center', marginBottom:18 }}>
            <div style={{ fontSize:40, marginBottom:6 }}>🔑</div>
            <h1 style={{ margin:'0 0 4px', fontSize:24, color:'var(--t-heading)', fontWeight:'normal' }}>Reset Password</h1>
            <p style={{ margin:0, fontSize:13, color:'var(--t-label)', fontFamily:'sans-serif' }}>
              Enter your email and we'll send a reset link.
            </p>
          </div>

          <form onSubmit={handleForgot} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <label style={{ display:'flex', flexDirection:'column', gap:6, fontFamily:'sans-serif', fontSize:12, color:'var(--t-body)' }}>
              Email
              <input
                type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)}
                placeholder="you@example.com" required autoFocus
                style={inputStyle}
              />
            </label>

            {forgotErr && (
              <div role="alert" style={{ background:'rgba(var(--t-accent-rgb),0.06)', border:'1px solid var(--t-border)', color:'var(--t-strong)', borderRadius:10, padding:'10px 12px', fontFamily:'sans-serif', fontSize:12 }}>
                {forgotErr}
              </div>
            )}
            {forgotMsg && (
              <div role="status" style={{ background:'#f3fff6', border:'1px solid #cdebd6', color:'#2f6a41', borderRadius:10, padding:'10px 12px', fontFamily:'sans-serif', fontSize:12 }}>
                {forgotMsg}
              </div>
            )}

            <button type="submit" disabled={forgotLoading} style={{ ...btn(), width:'100%', opacity:forgotLoading ? 0.7 : 1 }}>
              {forgotLoading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>

          <button
            onClick={() => { setForgotMode(false); setForgotMsg(''); setForgotErr(''); }}
            style={{ display:'block', margin:'14px auto 0', background:'none', border:'none', fontSize:12, color:'var(--t-label)', fontFamily:'sans-serif', cursor:'pointer', textDecoration:'underline' }}>
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh', display:'grid', placeItems:'center', background:`linear-gradient(135deg,var(--t-bg),#fff)`, padding:20, fontFamily:"'Georgia',serif" }}>
      <div style={{ width:'min(100%, 440px)', background:'#fff', border:'1px solid var(--t-border)', borderRadius:20, boxShadow:'0 10px 30px rgba(var(--t-accent-rgb),0.12)', padding:24 }}>

        <div style={{ textAlign:'center', marginBottom:18 }}>
          <div style={{ fontSize:40, marginBottom:6 }}>🌹</div>
          <h1 style={{ margin:'0 0 4px', fontSize:28, color:'var(--t-heading)', fontWeight:'normal' }}>Habit Tracker</h1>
          <p style={{ margin:0, fontSize:13, color:'var(--t-label)', fontFamily:'sans-serif' }}>
            Sign in or create an account to keep your habits synced across devices.
          </p>
        </div>

        <div role="tablist" style={{ display:'flex', gap:8, marginBottom:16 }}>
          <button
            role="tab" aria-selected={authMode === 'login'}
            onClick={() => setAuthMode('login')}
            style={{ ...btn(authMode==='login' ? 'var(--t-accent)' : 'transparent', authMode==='login' ? '#fff' : 'var(--t-strong)'), flex:1 }}>
            Log In
          </button>
          <button
            role="tab" aria-selected={authMode === 'signup'}
            onClick={() => setAuthMode('signup')}
            style={{ ...btn(authMode==='signup' ? 'var(--t-accent)' : 'transparent', authMode==='signup' ? '#fff' : 'var(--t-strong)'), flex:1 }}>
            Sign Up
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <label style={{ display:'flex', flexDirection:'column', gap:6, fontFamily:'sans-serif', fontSize:12, color:'var(--t-body)' }}>
            Email
            <input
              type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)}
              placeholder="you@example.com" autoComplete="email"
              style={inputStyle}
            />
          </label>
          <label style={{ display:'flex', flexDirection:'column', gap:6, fontFamily:'sans-serif', fontSize:12, color:'var(--t-body)' }}>
            Password
            {authMode === 'signup' && (
              <span style={{ fontSize:10, color:'var(--t-muted)', fontFamily:'sans-serif', fontWeight:400 }}>
                At least 6 characters
              </span>
            )}
            <input
              type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)}
              placeholder={authMode === 'signup' ? 'Choose a password (min 6 chars)' : 'Your password'}
              autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
              style={inputStyle}
            />
          </label>

          {authError && (
            <div role="alert" style={{ background:'rgba(var(--t-accent-rgb),0.06)', border:'1px solid var(--t-border)', color:'var(--t-strong)', borderRadius:10, padding:'10px 12px', fontFamily:'sans-serif', fontSize:12 }}>
              {authError}
            </div>
          )}
          {authMessage && (
            <div role="status" style={{ background:'#f3fff6', border:'1px solid #cdebd6', color:'#2f6a41', borderRadius:10, padding:'10px 12px', fontFamily:'sans-serif', fontSize:12 }}>
              {authMessage}
            </div>
          )}

          <button type="submit" disabled={authLoading} style={{ ...btn(), width:'100%', opacity: authLoading ? 0.7 : 1 }}>
            {authLoading ? 'Please wait…' : authMode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>

        {authMode === 'login' && (
          <button
            onClick={() => setForgotMode(true)}
            style={{ display:'block', margin:'12px auto 0', background:'none', border:'none', fontSize:12, color:'var(--t-label)', fontFamily:'sans-serif', cursor:'pointer', textDecoration:'underline' }}>
            Forgot your password?
          </button>
        )}
      </div>
    </div>
  );
}
