import { motion } from 'framer-motion'
import { SITE } from '../config.js'

export default function Hero() {
  function scrollToLiveries() {
    const el = document.getElementById('liveries')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div style={{
      position: 'relative',
      height: '100vh',
      minHeight: '600px',
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
    }}>
      {/* Background image */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'url(/hero-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }} />

      {/* Dark gradient overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to right, rgba(5,5,5,0.95) 0%, rgba(5,5,5,0.75) 50%, rgba(5,5,5,0.3) 100%)',
      }} />

      {/* Cinematic radial glow — left side */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '-200px',
        transform: 'translateY(-50%)',
        width: '700px',
        height: '700px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${SITE.primaryGlow} 0%, transparent 70%)`,
        opacity: 0.35,
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 40px',
        width: '100%',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {/* Mono label */}
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            color: 'var(--primary)',
            marginBottom: '16px',
          }}>
            // 01 — {SITE.tagline}
          </div>

          {/* Team name */}
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(52px, 10vw, 110px)',
            fontWeight: 900,
            letterSpacing: '-1px',
            textTransform: 'uppercase',
            lineHeight: 0.9,
            color: 'var(--text)',
            marginBottom: '24px',
          }}>
            {SITE.name}
          </h1>

          {/* Taglines */}
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            color: 'var(--muted)',
            letterSpacing: '2px',
            marginBottom: '8px',
          }}>
            &gt; SEASON_{SITE.year}_ACTIVE
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            color: 'var(--muted)',
            letterSpacing: '2px',
            marginBottom: '40px',
          }}>
            &gt; RACE_HARD . WIN_HARDER
          </div>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <a
              href={SITE.discord}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '14px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                padding: '14px 32px',
                background: 'var(--primary)',
                color: '#fff',
                border: '2px solid var(--primary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Join Discord
            </a>
            <button
              onClick={scrollToLiveries}
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '14px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                padding: '14px 32px',
                background: 'transparent',
                color: 'var(--text)',
                border: '2px solid var(--border)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              View Liveries
            </button>
          </div>
        </motion.div>
      </div>

      {/* Floating data widget — bottom right, hidden on mobile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        style={{
          position: 'absolute',
          bottom: '48px',
          right: '40px',
          background: 'rgba(10,10,10,0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border)',
          borderLeft: '3px solid var(--primary)',
          padding: '20px 24px',
          fontFamily: 'var(--font-mono)',
          zIndex: 2,
        }}
        className="hero-widget"
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div style={{ fontSize: '10px', letterSpacing: '3px', color: 'var(--primary)', marginBottom: '12px', textTransform: 'uppercase' }}>
            Team Status
          </div>
          {[
            ['SEASON', SITE.year],
            ['DRIVERS', 'ACTIVE'],
            ['STATUS', 'RACING'],
            ['MODE', 'COMPETITIVE'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: '16px', marginBottom: '6px', alignItems: 'baseline' }}>
              <span style={{ fontSize: '10px', color: 'var(--muted)', letterSpacing: '2px', width: '70px' }}>{k}</span>
              <span style={{ fontSize: '13px', color: 'var(--text)', letterSpacing: '1px' }}>{v}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Hide widget on mobile */}
      <style>{`
        @media (max-width: 768px) {
          .hero-widget { display: none !important; }
        }
      `}</style>
    </div>
  )
}
