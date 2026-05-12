import { useNavigate, useLocation } from 'react-router-dom'
import { SITE } from '../config.js'

const BASE = import.meta.env.BASE_URL

const QUICK_LINKS = [
  { label: 'Home', type: 'section', target: 'home' },
  { label: 'Drivers', type: 'route', target: '/drivers' },
  { label: 'Game', type: 'route', target: '/game' },
  { label: 'Standings', type: 'section', target: 'standings' },
  { label: 'Sponsors', type: 'route', target: '/sponsors' },
]

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function Footer() {
  const navigate = useNavigate()
  const location = useLocation()

  function handleLink(link) {
    if (link.type === 'route') {
      navigate(link.target)
    } else {
      if (location.pathname !== '/') {
        navigate('/')
        setTimeout(() => scrollTo(link.target), 150)
      } else {
        scrollTo(link.target)
      }
    }
  }

  return (
    <footer style={{
      borderTop: '1px solid rgba(57,255,20,0.12)',
      background: '#030303',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Radial glow from bottom */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 100%, rgba(57,255,20,0.04) 0%, transparent 60%)',
      }} />

      {/* Grid overlay */}
      <div className="grid-bg" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5 }} />

      {/* Top grid row */}
      <div style={{
        maxWidth: '1200px', margin: '0 auto',
        padding: '60px 40px 40px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '40px',
        position: 'relative',
      }}>

        {/* Col 1: Branding */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={`${BASE}logo.png`} alt={SITE.name} style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
            <span style={{
              fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700,
              letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text)',
            }}>{SITE.name}</span>
          </div>
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)',
            lineHeight: 1.6, maxWidth: '240px',
          }}>
            Competitive Rocket League esports. Precision. Speed. Victory.
          </p>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(57,255,20,0.45)',
            letterSpacing: '2px', textTransform: 'uppercase',
          }}>
            Powered by passion. Driven by data.
          </span>
        </div>

        {/* Col 2: Quick Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h4 style={{
            fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px',
            textTransform: 'uppercase', color: 'rgba(57,255,20,0.5)', marginBottom: '4px',
          }}>Quick Links</h4>
          {QUICK_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() => handleLink(link)}
              style={{
                background: 'none', border: 'none', textAlign: 'left', padding: 0,
                fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)',
                cursor: 'pointer', transition: 'color 0.2s', letterSpacing: '0.5px',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
            >{link.label}</button>
          ))}
        </div>

        {/* Col 3: Sister company + Discord */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4 style={{
            fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px',
            textTransform: 'uppercase', color: 'rgba(57,255,20,0.5)', marginBottom: '4px',
          }}>Community</h4>

          <a
            href={SITE.discord}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'var(--primary)', color: '#050505',
              border: '1px solid var(--primary)',
              boxShadow: '0 0 20px rgba(57,255,20,0.35)',
              borderRadius: '2px', padding: '10px 18px',
              fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700,
              letterSpacing: '1px', textTransform: 'uppercase', textDecoration: 'none',
              transition: 'box-shadow 0.25s, transform 0.2s',
              alignSelf: 'flex-start',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 32px rgba(57,255,20,0.6)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 20px rgba(57,255,20,0.35)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            Join Discord ↗
          </a>

          <a
            href="https://nussymotorsport.de/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: '3px',
              padding: '8px 14px', textDecoration: 'none',
              transition: 'border-color 0.2s, background 0.2s',
              background: 'rgba(255,255,255,0.02)', alignSelf: 'flex-start',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(57,255,20,0.35)'; e.currentTarget.style.background = 'rgba(57,255,20,0.04)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--muted)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Sister company</span>
            <span style={{ width: '1px', height: '14px', background: 'var(--border)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text)' }}>
              Nussy Motorsport
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)' }}>↗</span>
          </a>
        </div>
      </div>

      {/* Glow divider */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 40px' }}>
        <div className="glow-hr" />
      </div>

      {/* Bottom row */}
      <div style={{
        maxWidth: '1200px', margin: '0 auto',
        padding: '20px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '12px',
        position: 'relative',
      }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px' }}>
          © {SITE.year} {SITE.name}. All rights reserved.
        </p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(57,255,20,0.3)', letterSpacing: '1px' }}>
          Built with ❤️ by RAPIDLY RL
        </p>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  )
}
