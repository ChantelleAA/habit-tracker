import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('App error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight:'100vh', display:'grid', placeItems:'center', background:'linear-gradient(135deg,#fdf0f3,#fff)', padding:20, fontFamily:"'Georgia',serif" }}>
          <div style={{ width:'min(100%,440px)', background:'#fff', border:'1px solid #f0d0dc', borderRadius:20, boxShadow:'0 10px 30px rgba(232,121,160,0.12)', padding:32, textAlign:'center' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🌿</div>
            <h2 style={{ margin:'0 0 8px', fontSize:20, color:'#4a2030', fontWeight:'normal' }}>Something went wrong</h2>
            <p style={{ margin:'0 0 20px', fontSize:13, color:'#9a7080', fontFamily:'sans-serif', lineHeight:1.6 }}>
              An unexpected error occurred. Your data is safe — this is a display issue only.
            </p>
            <button
              onClick={() => { this.setState({ error: null }); window.location.reload(); }}
              style={{ background:'var(--t-accent,#e879a0)', color:'#fff', border:'none', borderRadius:9, padding:'10px 24px', fontFamily:'sans-serif', fontSize:13, fontWeight:700, cursor:'pointer' }}>
              Reload App
            </button>
            <details style={{ marginTop:16, textAlign:'left' }}>
              <summary style={{ fontSize:11, color:'#bbb', fontFamily:'sans-serif', cursor:'pointer' }}>Error details</summary>
              <pre style={{ fontSize:10, color:'#999', fontFamily:'monospace', marginTop:8, overflow:'auto', maxHeight:120, whiteSpace:'pre-wrap', wordBreak:'break-all' }}>
                {this.state.error.message}
              </pre>
            </details>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
