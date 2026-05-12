import { SITE } from '../config.js'

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      padding: '28px 40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '16px',
      background: '#050505',
    }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px' }}>
        © {SITE.year} {SITE.name}. All rights reserved.
      </p>

      <a
        href="https://nussymotorsport.de/"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '3px',
          padding: '6px 14px',
          textDecoration: 'none',
          transition: 'border-color 0.2s, background 0.2s',
          background: 'rgba(255,255,255,0.02)',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(57,255,20,0.35)'; e.currentTarget.style.background = 'rgba(57,255,20,0.04)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
      >
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--muted)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Sister company</span>
        <span style={{ width: '1px', height: '14px', background: 'var(--border)' }} />
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text)' }}>
          Nussy Motorsport
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)' }}>↗</span>
      </a>
    </footer>
  )
}
