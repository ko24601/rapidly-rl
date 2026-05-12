import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useDatabase } from '../context/DatabaseContext.jsx'
import { CardSkeleton } from '../components/Skeleton.jsx'
import Footer from '../components/Footer.jsx'

function HelmetIcon({ color }) {
  const c = color || '#39FF14'
  return (
    <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="52" rx="38" ry="36" fill={c} opacity="0.9"/>
      <ellipse cx="50" cy="52" rx="38" ry="36" fill="url(#hg)" opacity="0.4"/>
      <path d="M18 55 Q15 40 25 28 Q38 12 58 12 Q80 12 86 35 L86 55 Q75 70 50 72 Q28 72 18 55Z" fill={c}/>
      <path d="M25 55 Q35 68 55 68 Q72 68 80 55 L80 48 Q72 62 55 62 Q36 62 25 50Z" fill="rgba(0,0,0,0.25)"/>
      <path d="M28 44 Q35 32 50 30 Q65 28 76 38" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <defs>
        <linearGradient id="hg" x1="20" y1="15" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity="0.5"/>
          <stop offset="1" stopColor="black" stopOpacity="0.2"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

function DriverCard({ driver, index }) {
  const teamColor = driver.teamColor || 'var(--primary)'
  const glowColor = driver.teamColor ? `${driver.teamColor}44` : 'rgba(57,255,20,0.18)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      style={{ background: 'var(--card)', border: `1px solid var(--border)`, overflow: 'hidden', transition: 'border-color 0.3s, box-shadow 0.3s' }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = teamColor
        e.currentTarget.style.boxShadow = `0 0 30px ${glowColor}, 0 20px 60px rgba(0,0,0,0.5)`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={{ position: 'relative', paddingTop: '133%', background: 'linear-gradient(135deg, #0d0d0d, #141414)', overflow: 'hidden' }}>
        {/* Giant number watermark */}
        {driver.number && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-heading)', fontSize: '160px', fontWeight: 900,
            color: teamColor, opacity: 0.07, lineHeight: 1, pointerEvents: 'none', zIndex: 1,
            userSelect: 'none',
          }}>{driver.number}</div>
        )}

        {driver.photo ? (
          <img src={driver.photo} alt={driver.name}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2 }} />
        ) : (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-heading)', fontSize: '80px', fontWeight: 900,
            color: teamColor, opacity: 0.15, zIndex: 2,
          }}>{(driver.name || '?')[0]}</div>
        )}

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(to top, rgba(5,5,5,0.95), transparent)', pointerEvents: 'none', zIndex: 3 }} />

        {/* Number badge */}
        {driver.number && (
          <div style={{
            position: 'absolute', top: '12px', right: '12px', zIndex: 4,
            background: teamColor, color: '#050505',
            fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 900,
            padding: '4px 12px',
            boxShadow: `0 0 16px ${glowColor}`,
          }}>#{driver.number}</div>
        )}

        {/* Helmet icon */}
        {driver.helmetColor && (
          <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 4 }}>
            <HelmetIcon color={driver.helmetColor} />
          </div>
        )}

        {(driver.nationality || driver.flag) && (
          <div style={{ position: 'absolute', bottom: '10px', left: '12px', zIndex: 4, fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.75)', letterSpacing: '1.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {driver.flag && <span style={{ fontSize: '16px' }}>{driver.flag}</span>}
            {driver.nationality?.replace(/^.+?\s/, '').toUpperCase()}
          </div>
        )}

        {/* Team colour bar */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: teamColor, zIndex: 4, opacity: 0.8 }} />
      </div>

      <div style={{ padding: '16px 18px 20px' }}>
        {driver.category && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '3px', color: teamColor, textTransform: 'uppercase', marginBottom: '6px', opacity: 0.9 }}>
            {driver.category}
          </div>
        )}
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text)', marginBottom: '8px', lineHeight: 1 }}>
          {driver.name}
        </div>
        {driver.bio && (
          <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '10px' }}>
            {driver.bio}
          </p>
        )}
        {driver.discord && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(57,255,20,0.5)', letterSpacing: '0.5px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
            {driver.discord}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function DriversPage() {
  const { drivers: rawDrivers, loading } = useDatabase()
  const drivers = [...rawDrivers].sort((a, b) => (a.category || '').localeCompare(b.category || ''))

  return (
    <>
      <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '64px 40px 48px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-30%', right: '-5%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(57,255,20,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '4px', color: 'var(--primary)', marginBottom: '12px', opacity: 0.8 }}>// SEASON 2026</div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '3px', lineHeight: 1, marginBottom: '16px' }}>
              Driver Roster
            </motion.h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--muted)', maxWidth: '480px' }}>
              Meet the drivers competing in the RAPIDLY RL Season 2026 championship.
            </p>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap' }}>
              {!loading && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--primary)', letterSpacing: '2px' }}>
                  {drivers.length} DRIVERS REGISTERED
                </div>
              )}
              <Link to="/compare" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '2px', color: 'var(--muted)', textTransform: 'uppercase', border: '1px solid var(--border)', padding: '6px 16px', transition: 'all 0.2s', textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.borderColor = 'rgba(57,255,20,0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
                Compare Drivers →
              </Link>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 40px' }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
              {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : drivers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--muted)', letterSpacing: '3px' }}>NO DRIVERS REGISTERED YET</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
              {drivers.map((driver, i) => <DriverCard key={driver.id} driver={driver} index={i} />)}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
