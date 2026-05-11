import { Link } from 'react-router-dom'
import { SITE } from '../config.js'

const BASE = import.meta.env.BASE_URL

export default function Footer() {
  const year = new Date().getFullYear()

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer style={{ background: '#030303', borderTop: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
      {/* Top green line */}
      <div style={{ height: '2px', background: 'linear-gradient(to right, transparent, var(--primary), transparent)', boxShadow: '0 0 16px rgba(57,255,20,0.4)' }} />

      {/* Background glow */}
      <div style={{ position: 'absolute', bottom: '-40%', left: '50%', transform: 'translateX(-50%)', width: '800px', height: '400px', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(57,255,20,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '64px 40px 40px', position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '48px', marginBottom: '56px' }}>

          {/* Brand col */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <img src={`${BASE}logo.png`} alt={SITE.name} style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text)' }}>{SITE.name}</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.65, maxWidth: '260px' }}>
              {SITE.tagline}. Competing hard, racing harder. Season {SITE.year}.
            </p>
            <div style={{ marginTop: '20px' }}>
              <a href={SITE.discord} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '2px', color: 'var(--primary)', textTransform: 'uppercase', border: '1px solid rgba(57,255,20,0.3)', padding: '8px 16px', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(57,255,20,0.08)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(57,255,20,0.2)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none' }}>
                Join Discord →
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '20px', opacity: 0.8 }}>Navigation</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[['Home', 'home'], ['Calendar', 'calendar'], ['Drivers', 'drivers'], ['News', 'news'], ['Staff', 'staff']].map(([label, id]) => (
                <button key={id} onClick={() => scrollTo(id)}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', fontFamily: 'var(--font-body)', fontSize: '14px', textAlign: 'left', cursor: 'pointer', padding: 0, transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* More links */}
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '20px', opacity: 0.8 }}>More</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link to="/sponsors" style={{ color: 'var(--muted)', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}>Become a Sponsor</Link>
              <Link to="/admin" style={{ color: 'var(--muted)', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}>Admin Panel</Link>
              <a href={SITE.discord} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--muted)', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}>Discord Community</a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px' }}>
            © {year} {SITE.name}. All rights reserved.
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(57,255,20,0.35)', letterSpacing: '2px', textTransform: 'uppercase' }}>
            Season {SITE.year}
          </span>
        </div>
      </div>
    </footer>
  )
}
