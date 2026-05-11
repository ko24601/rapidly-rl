import { useLocation, useNavigate } from 'react-router-dom'

const TABS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'calendar', label: 'Calendar', icon: '📅' },
  { id: 'drivers', label: 'Drivers', icon: '👤' },
  { id: 'news', label: 'News', icon: '📰' },
  { id: 'standings', label: 'Standings', icon: '🏆' },
]

export default function MobileNav() {
  const location = useLocation()
  const navigate = useNavigate()

  function handleTab(id) {
    if (location.pathname !== '/') {
      navigate('/')
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      }, 150)
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Don't show on admin page
  if (location.pathname === '/admin') return null

  return (
    <nav style={{
      display: 'none',
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '60px',
      background: 'rgba(6,6,6,0.96)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderTop: '1px solid rgba(57,255,20,0.25)',
      boxShadow: '0 -4px 20px rgba(57,255,20,0.08)',
      zIndex: 800,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}
      className="mobile-nav"
    >
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => handleTab(tab.id)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            height: '100%',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '0 4px',
            color: 'var(--muted)',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
        >
          <span style={{ fontSize: '20px', lineHeight: 1 }}>{tab.icon}</span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}>
            {tab.label}
          </span>
        </button>
      ))}

      <style>{`
        @media (max-width: 768px) {
          .mobile-nav {
            display: flex !important;
          }
        }
      `}</style>
    </nav>
  )
}
