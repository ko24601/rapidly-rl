import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { SITE } from '../config.js'

const NAV_LINKS = [
  { label: 'Home', section: 'home' },
  { label: 'Calendar', section: 'calendar' },
  { label: 'Drivers', section: 'drivers' },
  { label: 'News', section: 'news' },
  { label: 'Staff', section: 'staff' },
]

function scrollTo(sectionId) {
  const el = document.getElementById(sectionId)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // Close drawer on route change
  useEffect(() => { setOpen(false) }, [location])

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  function handleNavClick(section) {
    setOpen(false)
    if (location.pathname !== '/') {
      navigate('/')
      setTimeout(() => scrollTo(section), 150)
    } else {
      scrollTo(section)
    }
  }

  return (
    <>
      <nav style={{
        position: 'sticky',
        top: '36px',
        zIndex: 900,
        background: 'rgba(5,5,5,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 32px',
        gap: '32px',
      }}>
        {/* Logo + Name */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <img src="/logo.png" alt={SITE.name} style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '20px',
            fontWeight: 700,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: 'var(--text)',
          }}>{SITE.name}</span>
        </Link>

        {/* Desktop Nav Links */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flex: 1 }} className="desktop-nav">
          {NAV_LINKS.map((link) => (
            <button
              key={link.section}
              onClick={() => handleNavClick(link.section)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                fontWeight: 500,
                letterSpacing: '0.5px',
                padding: '8px 12px',
                cursor: 'pointer',
                transition: 'color 0.2s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Desktop Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto' }} className="desktop-actions">
          <a
            href={SITE.discord}
            target="_blank"
            rel="noopener noreferrer"
            style={btnStyle('ghost')}
          >Join Discord</a>
          <Link to="/sponsors" style={btnStyle('ghost')}>Become a Sponsor</Link>
          <Link to="/admin" style={btnStyle('primary')}>Admin</Link>
        </div>

        {/* Hamburger (mobile only) */}
        <button
          className="hamburger"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            color: 'var(--text)',
            cursor: 'pointer',
            padding: '4px',
            marginLeft: 'auto',
            flexDirection: 'column',
            gap: '5px',
          }}
        >
          <span style={{ display: 'block', width: '24px', height: '2px', background: 'var(--text)' }} />
          <span style={{ display: 'block', width: '24px', height: '2px', background: 'var(--text)' }} />
          <span style={{ display: 'block', width: '18px', height: '2px', background: 'var(--text)' }} />
        </button>
      </nav>

      {/* Mobile Drawer Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              zIndex: 1999,
            }}
          />
        )}
      </AnimatePresence>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.28 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '280px',
              background: 'var(--surface)',
              borderLeft: '1px solid var(--border)',
              zIndex: 2000,
              display: 'flex',
              flexDirection: 'column',
              padding: '24px 20px',
            }}
          >
            {/* Close button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}
              >✕</button>
            </div>

            {/* Nav links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
              {NAV_LINKS.map((link) => (
                <button
                  key={link.section}
                  onClick={() => handleNavClick(link.section)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text)',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '22px',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    textAlign: 'left',
                    padding: '10px 0',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* CTA buttons pinned to bottom */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '24px' }}>
              <a href={SITE.discord} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle('primary'), justifyContent: 'center', display: 'flex' }}>Join Discord</a>
              <Link to="/sponsors" onClick={() => setOpen(false)} style={{ ...btnStyle('ghost'), justifyContent: 'center', display: 'flex' }}>Become a Sponsor</Link>
              <Link to="/admin" onClick={() => setOpen(false)} style={{ ...btnStyle('ghost'), justifyContent: 'center', display: 'flex' }}>Admin</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Responsive styles injected via style tag */}
      <style>{`
        @media (max-width: 1024px) {
          .desktop-nav { display: none !important; }
          .desktop-actions { display: none !important; }
          .hamburger { display: flex !important; }
        }
      `}</style>
    </>
  )
}

function btnStyle(variant) {
  const base = {
    fontFamily: 'var(--font-body)',
    fontSize: '13px',
    fontWeight: 600,
    letterSpacing: '0.5px',
    padding: '8px 16px',
    borderRadius: '2px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
  }
  if (variant === 'primary') return {
    ...base,
    background: 'var(--primary)',
    color: '#fff',
    border: '1px solid var(--primary)',
  }
  return {
    ...base,
    background: 'transparent',
    color: 'var(--text)',
    border: '1px solid var(--border)',
  }
}
