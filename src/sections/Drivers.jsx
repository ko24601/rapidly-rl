import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
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
      style={{ background: 'var(--card)', border: '1px solid var(--border)', overflow: 'hidden', transition: 'border-color 0.3s, box-shadow 0.3s' }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--primary)'
        e.currentTarget.style.boxShadow = '0 0 30px rgba(57,255,20,0.18), 0 20px 60px rgba(0,0,0,0.5)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
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
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(to top, rgba(5,5,5,0.95), transparent)', pointerEvents: 'none' }} />
        {driver.number && (
          <div style={{
            position: 'absolute', top: '12px', right: '12px',
            background: 'var(--primary)', color: '#050505',
            fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 900,
            padding: '4px 12px', boxShadow: '0 0 16px rgba(57,255,20,0.6)',
          }}>#{driver.number}</div>
        )}
      </div>
      <div style={{ padding: '16px 18px 20px' }}>
        {driver.category && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '3px', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '6px', opacity: 0.8 }}>
            {driver.category}
          </div>
        )}
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text)', lineHeight: 1 }}>
          {driver.name}
        </div>
      </div>
    </motion.div>
  )
}

export default function Drivers() {
  const { drivers, loading } = useDatabase()
  const sorted = [...drivers].sort((a, b) => (a.category || '').localeCompare(b.category || ''))
  const preview = sorted.slice(0, 4)

  if (!loading && drivers.length === 0) return null

  return (
    <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(57,255,20,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div className="section-wrapper">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <div className="section-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px,5vw,52px)', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>
                <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontSize: '0.5em', verticalAlign: 'middle', marginRight: '12px', opacity: 0.7 }}>// 03</span>
                Driver Roster
              </h2>
              <div className="section-underline" />
            </div>
            <Link to="/drivers"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '2px', color: 'var(--primary)', textTransform: 'uppercase', textDecoration: 'none', border: '1px solid rgba(57,255,20,0.3)', padding: '8px 20px', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(57,255,20,0.08)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(57,255,20,0.2)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none' }}
            >
              View All {!loading && drivers.length > 0 ? `(${drivers.length})` : ''} →
            </Link>
          </div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
            : preview.map((driver, i) => <DriverCard key={driver.id} driver={driver} index={i} />)
          }
        </div>

        {!loading && drivers.length > 4 && (
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ textAlign: 'center', marginTop: '32px' }}>
            <Link to="/drivers"
              style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '15px', letterSpacing: '2px', textTransform: 'uppercase', color: '#050505', background: 'var(--primary)', padding: '12px 36px', textDecoration: 'none', display: 'inline-block', transition: 'opacity 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              See All {drivers.length} Drivers →
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  )
}
