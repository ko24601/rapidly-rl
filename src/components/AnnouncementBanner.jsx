import { SITE } from '../config.js'

export default function AnnouncementBanner() {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: 'var(--primary)',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        fontSize: '13px',
        fontFamily: 'var(--font-mono)',
        fontWeight: 500,
        color: '#fff',
        letterSpacing: '0.5px',
        padding: '0 20px',
        textShadow: '0 1px 2px rgba(0,0,0,0.4)',
      }}
    >
      <span>🏁 {SITE.year} Season is here — Join our Discord to stay updated!</span>
      <a
        href={SITE.discord}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontWeight: 700,
          color: '#fff',
          textDecoration: 'underline',
          whiteSpace: 'nowrap',
          opacity: 0.9,
        }}
      >
        Join Now →
      </a>
    </div>
  )
}
