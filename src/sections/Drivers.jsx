import { motion } from 'framer-motion'
import { useDatabase } from '../context/DatabaseContext.jsx'
import { CardSkeleton } from '../components/Skeleton.jsx'

function DriverCard({ driver, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      style={{ background: 'var(--card)', border: '1px solid var(--border)', overflow: 'hidden', cursor: 'default', transition: 'border-color 0.3s, box-shadow 0.3s' }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--primary)'
        e.currentTarget.style.boxShadow = '0 0 30px rgba(57,255,20,0.18), 0 20px 60px rgba(0,0,0,0.5)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Portrait — 3:4 ratio */}
      <div style={{ position: 'relative', paddingTop: '133%', background: 'linear-gradient(135deg, #0d0d0d, #141414)', overflow: 'hidden' }}>
        {driver.photo ? (
          <img src={driver.photo} alt={driver.name}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-heading)', fontSize: '80px', fontWeight: 900,
            color: 'var(--primary)', opacity: 0.12,
          }}>{(driver.name || '?')[0]}</div>
        )}

        {/* Scan line overlay on hover */}
        <div className="card-scan" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(57,255,20,0.015) 3px, rgba(57,255,20,0.015) 4px)',
          opacity: 0, transition: 'opacity 0.3s',
        }} />

        {/* Bottom gradient */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(to top, rgba(5,5,5,0.95), transparent)', pointerEvents: 'none' }} />

        {/* Number badge */}
        {driver.number && (
          <div style={{
            position: 'absolute', top: '12px', right: '12px',
            background: 'var(--primary)', color: '#050505',
            fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 900,
            padding: '4px 12px', letterSpacing: '1px',
            boxShadow: '0 0 16px rgba(57,255,20,0.6)',
          }}>#{driver.number}</div>
        )}

        {/* Nationality bottom */}
        {(driver.nationality || driver.flag) && (
          <div style={{
            position: 'absolute', bottom: '10px', left: '12px',
            fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.75)',
            letterSpacing: '1.5px', display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            {driver.flag && <span style={{ fontSize: '16px' }}>{driver.flag}</span>}
            {driver.nationality?.toUpperCase()}
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '16px 18px 20px' }}>
        {driver.category && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '3px', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '6px', opacity: 0.8 }}>
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

      <style>{`.card-scan{opacity:0}.driver-card:hover .card-scan{opacity:1}`}</style>
    </motion.div>
  )
}

export default function Drivers() {
  const { drivers, loading } = useDatabase()
  if (!loading && (!drivers || drivers.length === 0)) return null

  return (
    <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(57,255,20,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div className="section-wrapper">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <div className="section-header">
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px,5vw,52px)', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>
              <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontSize: '0.5em', verticalAlign: 'middle', marginRight: '12px', opacity: 0.7 }}>// 03</span>
              Driver Roster
            </h2>
            <div className="section-underline" />
          </div>
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
            : drivers.map((driver, i) => <DriverCard key={driver.id} driver={driver} index={i} />)
          }
        </div>
      </div>
    </div>
  )
}
