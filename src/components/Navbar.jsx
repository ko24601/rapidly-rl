import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext.jsx'
import { motion, AnimatePresence } from 'framer-motion'
import { SITE } from '../config.js'

const BASE = import.meta.env.BASE_URL

const NAV_LINKS = [
  { label: 'Home', section: 'home' },
  { label: 'Calendar', section: 'calendar' },
  { label: 'News', section: 'news' },
  { label: 'Staff', section: 'staff' },
]

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function Navbar() {
  const { theme, toggle } = useTheme()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => { setOpen(false) }, [location])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
        top: '34px',
        zIndex: 900,
        background: scrolled ? 'rgba(4,4,4,0.98)' : 'rgba(5,5,5,0.88)',
        backdropFilter: 'blur(16px)',
        borderBottom: scrolled ? '1px solid rgba(57,255,20,0.2)' : '1px solid var(--border)',
        boxShadow: scrolled ? '0 4px 32px rgba(57,255,20,0.06)' : 'none',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 32px',
        gap: '32px',
        transition: 'background 0.3s, border-color 0.3s, box-shadow 0.3s',
      }}>

        {/* Bottom glow line on scroll */}
        {scrolled && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px',
            background: 'linear-gradient(to right, transparent, var(--primary), transparent)',
            boxShadow: '0 0 12px var(--primary)',
            opacity: 0.6,
          }} />
        )}

        {/* Logo + Name */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <img src={`${BASE}logo.png`} alt={SITE.name} style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
          <span style={{
            fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700,
            letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text)',
          }}>{SITE.name}</span>
        </Link>

        {/* Desktop Nav Links */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flex: 1 }} className="desktop-nav">
          {NAV_LINKS.map((link) => (
            <button key={link.section} onClick={() => handleNavClick(link.section)}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 500, letterSpacing: '0.5px', padding: '8px 12px', cursor: 'pointer', transition: 'color 0.2s', whiteSpace: 'nowrap' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
            >{link.label}</button>
          ))}
          <Link to="/drivers"
            style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 500, letterSpacing: '0.5px', padding: '8px 12px', transition: 'color 0.2s', whiteSpace: 'nowrap', textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
          >Drivers</Link>
        </div>

        {/* Desktop Actions */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto' }} className="desktop-actions">
          <button onClick={toggle} title="Toggle theme"
            style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', padding: '7px 10px', cursor: 'pointer', fontSize: '15px', transition: 'all 0.2s', borderRadius: '2px' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}>
            {theme === 'dark' ? '☀' : '🌙'}
          </button>
          <a href={SITE.discord} target="_blank" rel="noopener noreferrer" style={btnStyle('ghost')}>Join Discord</a>
          <Link to="/sponsors" style={btnStyle('ghost')}>Become a Sponsor</Link>
          <Link to="/admin" style={btnStyle('primary')}>Admin</Link>
        </div>

        {/* Hamburger */}
        <button className="hamburger" onClick={() => setOpen(true)} aria-label="Open menu"
          style={{ display: 'none', background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '4px', marginLeft: 'auto', flexDirection: 'column', gap: '5px' }}>
          <span style={{ display: 'block', width: '24px', height: '2px', background: 'var(--text)' }} />
          <span style={{ display: 'block', width: '24px', height: '2px', background: 'var(--text)' }} />
          <span style={{ display: 'block', width: '18px', height: '2px', background: 'var(--text)' }} />
        </button>
      </nav>

      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1999 }} />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div key="drawer" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.28 }}
            style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '280px', background: 'var(--surface)', borderLeft: '1px solid rgba(57,255,20,0.15)', zIndex: 2000, display: 'flex', flexDirection: 'column', padding: '24px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '22px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
              {NAV_LINKS.map((link) => (
                <button key={link.section} onClick={() => handleNavClick(link.section)}
                  style={{ background: 'none', border: 'none', color: 'var(--text)', fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'left', padding: '10px 0', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}>
                  {link.label}
                </button>
              ))}
              <Link to="/drivers" onClick={() => setOpen(false)}
                style={{ color: 'var(--text)', fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'left', padding: '10px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none', display: 'block' }}>
                Drivers
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '24px' }}>
              <a href={SITE.discord} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle('primary'), justifyContent: 'center', display: 'flex' }}>Join Discord</a>
              <Link to="/sponsors" onClick={() => setOpen(false)} style={{ ...btnStyle('ghost'), justifyContent: 'center', display: 'flex' }}>Become a Sponsor</Link>
              <Link to="/admin" onClick={() => setOpen(false)} style={{ ...btnStyle('ghost'), justifyContent: 'center', display: 'flex' }}>Admin</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

function btnStyle(v) {
  const base = { fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, letterSpacing: '0.5px', padding: '8px 16px', borderRadius: '2px', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap', textDecoration: 'none' }
  if (v === 'primary') return { ...base, background: 'var(--primary)', color: '#050505', border: '1px solid var(--primary)' }
  return { ...base, background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)' }
}
