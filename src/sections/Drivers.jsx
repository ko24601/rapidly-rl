import { motion } from 'framer-motion'
import { useDatabase } from '../context/DatabaseContext.jsx'

function DriverCard({ driver, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07 }}
      whileHover={{ y: -6 }}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '2px',
        overflow: 'hidden',
        transition: 'border-color 0.3s, box-shadow 0.3s',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--primary)'
        e.currentTarget.style.boxShadow = '0 0 24px var(--primary-glow)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Portrait image */}
      <div style={{ position: 'relative', paddingTop: '133%', background: '#111', overflow: 'hidden' }}>
        {driver.photo ? (
          <img
            src={driver.photo}
            alt={driver.name}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #111, #1a1a1a)',
            fontFamily: 'var(--font-heading)', fontSize: '64px', fontWeight: 900,
            color: 'var(--primary)', opacity: 0.3,
          }}>
            {(driver.name || '?')[0]}
          </div>
        )}
        {/* Car number badge */}
        {driver.number && (
          <div style={{
            position: 'absolute', top: '10px', right: '10px',
            background: 'var(--primary)', color: '#fff',
            fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 900,
            padding: '4px 10px', letterSpacing: '1px',
          }}>
            #{driver.number}
          </div>
        )}
        {/* Nationality overlay */}
        {(driver.nationality || driver.flag) && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
            padding: '20px 12px 10px',
            fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text)',
            letterSpacing: '1px',
          }}>
            {driver.flag && <span style={{ marginRight: '6px' }}>{driver.flag}</span>}
            {driver.nationality}
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '16px' }}>
        {driver.category && (
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px',
            color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '6px',
          }}>
            {driver.category}
          </div>
        )}
        <div style={{
          fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 800,
          letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text)',
          marginBottom: '8px',
        }}>
          {driver.name}
        </div>
        {driver.bio && (
          <p style={{
            fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            marginBottom: '10px',
          }}>
            {driver.bio}
          </p>
        )}
        {driver.discord && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.5px' }}>
            💬 {driver.discord}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function Drivers() {
  const { drivers } = useDatabase()
  if (!drivers || drivers.length === 0) return null

  return (
    <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div className="section-wrapper">
        <div className="section-header">
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px,5vw,48px)', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>
            <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontSize: '0.55em', verticalAlign: 'middle', marginRight: '12px' }}>// 04</span>
            Driver Roster
          </h2>
          <div className="section-underline" />
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '20px',
        }}>
          {drivers.map((driver, i) => (
            <DriverCard key={driver.id} driver={driver} index={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
