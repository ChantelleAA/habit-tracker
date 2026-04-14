import { useState } from 'react';
import { DEFAULTS, CATS, FREQS } from '../constants';
import { btn, card, secLbl } from '../styles';

const PRESET_HABITS = DEFAULTS.map(d => ({ ...d, selected: true }));

export default function OnboardingView({ onComplete }) {
  const [step, setStep]     = useState(0);
  const [presets, setPresets] = useState(PRESET_HABITS);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  const togglePreset = (id) => {
    setPresets(p => p.map(h => h.id === id ? { ...h, selected: !h.selected } : h));
  };

  const handleFinish = () => {
    const selectedHabits = presets.filter(h => h.selected).map(({ selected, ...h }) => h);
    onComplete({ habits: selectedHabits, startDate });
  };

  return (
    <div style={{ minHeight:'100vh', display:'grid', placeItems:'center', background:`linear-gradient(135deg,var(--t-bg),#fff)`, padding:20, fontFamily:"'Georgia',serif" }}>
      <div style={{ width:'min(100%,500px)', display:'flex', flexDirection:'column', gap:16 }}>

        {/* Progress dots */}
        <div style={{ display:'flex', justifyContent:'center', gap:8 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width:8, height:8, borderRadius:'50%', background: i <= step ? 'var(--t-accent)' : 'var(--t-border)', transition:'background 0.3s' }} />
          ))}
        </div>

        {step === 0 && (
          <div style={{ ...card, textAlign:'center', padding:32 }}>
            <div style={{ fontSize:52, marginBottom:12 }}>🌱</div>
            <h1 style={{ margin:'0 0 8px', fontSize:26, color:'var(--t-heading)', fontWeight:'normal' }}>
              Welcome to your 30-Day Challenge
            </h1>
            <p style={{ margin:'0 0 24px', fontSize:14, color:'var(--t-body)', fontFamily:'sans-serif', lineHeight:1.7 }}>
              Track daily habits across 30 days. Check in each day, build streaks, earn XP, and see yourself grow from a seedling into a full garden.
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
              {[
                { icon:'📅', text:'30 days. One cycle. Reset and go again.' },
                { icon:'🔥', text:'Build streaks — miss a day, keep going.' },
                { icon:'🌹', text:'Core habits count 1.5× toward your score.' },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display:'flex', alignItems:'center', gap:12, background:'var(--t-bg)', borderRadius:10, padding:'10px 14px' }}>
                  <span style={{ fontSize:20, flexShrink:0 }}>{icon}</span>
                  <span style={{ fontSize:13, color:'var(--t-body)', fontFamily:'sans-serif', textAlign:'left' }}>{text}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setStep(1)} style={{ ...btn(), width:'100%' }}>
              Choose My Habits →
            </button>
          </div>
        )}

        {step === 1 && (
          <div style={card}>
            <p style={secLbl}>Pick your habits</p>
            <p style={{ margin:'0 0 14px', fontSize:12, color:'var(--t-label)', fontFamily:'sans-serif' }}>
              Select any that fit — you can always add or remove habits later in Setup.
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
              {presets.map(h => {
                const cat = CATS[h.cat];
                return (
                  <button
                    key={h.id}
                    onClick={() => togglePreset(h.id)}
                    aria-pressed={h.selected}
                    style={{
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      border:`2px solid ${h.selected ? 'var(--t-accent)' : 'var(--t-border)'}`,
                      borderRadius:10, padding:'10px 14px', cursor:'pointer',
                      background: h.selected ? 'var(--t-light)' : '#fff',
                      transition:'all 0.15s', textAlign:'left',
                    }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:cat.color, flexShrink:0 }} />
                      <div>
                        <div style={{ fontSize:13, color:'var(--t-heading)', fontFamily:'sans-serif', fontWeight:600 }}>{h.name}</div>
                        <div style={{ fontSize:10, color:'var(--t-label)', fontFamily:'sans-serif', marginTop:1 }}>
                          {cat.label} · {FREQS[h.freq]?.label}
                          {h.core && <span style={{ marginLeft:5, color:'var(--t-strong)', fontWeight:700 }}>· CORE</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      width:22, height:22, borderRadius:'50%', flexShrink:0,
                      background: h.selected ? 'var(--t-accent)' : 'var(--t-light)',
                      border: h.selected ? 'none' : '2px solid var(--t-border)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      {h.selected && (
                        <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                          <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setStep(0)} style={{ ...btn('transparent','var(--t-strong)'), flex:'0 0 auto' }}>← Back</button>
              <button
                onClick={() => setStep(2)}
                disabled={presets.filter(h => h.selected).length === 0}
                style={{ ...btn(), flex:1, opacity: presets.filter(h => h.selected).length === 0 ? 0.5 : 1 }}>
                Set Start Date →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={card}>
            <p style={secLbl}>When does your challenge start?</p>
            <p style={{ margin:'0 0 14px', fontSize:12, color:'var(--t-label)', fontFamily:'sans-serif', lineHeight:1.6 }}>
              This sets Day 1 of your 30-day cycle. Start today to begin tracking immediately, or pick a past date if you've already been going.
            </p>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              style={{ border:'1px solid var(--t-border)', borderRadius:9, padding:'11px 14px', fontSize:14, fontFamily:'sans-serif', color:'var(--t-heading)', outline:'none', width:'100%', boxSizing:'border-box', marginBottom:16 }}
            />
            <div style={{ background:'var(--t-bg)', borderRadius:10, padding:'12px 14px', marginBottom:16 }}>
              <div style={{ fontSize:12, color:'var(--t-label)', fontFamily:'sans-serif', marginBottom:6 }}>
                Your challenge at a glance:
              </div>
              <div style={{ fontSize:13, color:'var(--t-heading)', fontFamily:'sans-serif' }}>
                <strong>{presets.filter(h => h.selected).length}</strong> habits selected
              </div>
              <div style={{ fontSize:11, color:'var(--t-muted)', fontFamily:'sans-serif', marginTop:2 }}>
                You can add or change habits anytime in Setup.
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setStep(1)} style={{ ...btn('transparent','var(--t-strong)'), flex:'0 0 auto' }}>← Back</button>
              <button onClick={handleFinish} style={{ ...btn(), flex:1 }}>
                Start My Challenge 🌱
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
