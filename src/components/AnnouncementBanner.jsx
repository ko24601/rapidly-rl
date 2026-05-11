import { SITE } from '../config.js'

const MSG = `🏁 ${SITE.year} SEASON IS LIVE — JOIN OUR DISCORD TO STAY UPDATED — RAPIDLY RL — OFFICIAL RACING LEAGUE — `
const REPEATED = MSG.repeat(6)

export default function AnnouncementBanner() {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 1000,
      background: 'var(--primary)',
      height: '34px', overflow: 'hidden',
      display: 'flex', alignItems: 'center',
      boxShadow: '0 2px 20px rgba(57,255,20,0.4)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        animation: 'marquee 28s linear infinite',
        whiteSpace: 'nowrap',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '11px',
          fontWeight: 600, letterSpacing: '2px', color: '#050505',
        }}>{REPEATED}</span>
        <a href={SITE.discord} target="_blank" rel="noopener noreferrer"
          style={{
            fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700,
            letterSpacing: '2px', color: '#050505', textDecoration: 'underline',
            flexShrink: 0, marginRight: '40px',
          }}>
          JOIN NOW →
        </a>
      </div>
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
