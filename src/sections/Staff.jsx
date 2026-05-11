import { motion } from 'framer-motion'
import { useDatabase } from '../context/DatabaseContext.jsx'

function StaffCard({ member, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07 }}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        padding: '28px 20px',
        borderRadius: '2px',
        textAlign: 'center',
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,0,0,0.3)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {/* Circular photo */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
        <div style={{
          width: '120px', height: '120px', borderRadius: '50%',
          overflow: 'hidden', border: '3px solid var(--primary)',
          background: '#111',
          flexShrink: 0,
        }}>
          {member.photo ? (
            <img src={member.photo} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-heading)', fontSize: '40px', fontWeight: 900,
              color: 'var(--primary)', opacity: 0.4,
            }}>
              {(member.name || '?')[0]}
            </div>
          )}
        </div>
      </div>

      <div style={{
        fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 800,
        letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px',
      }}>
        {member.name}
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--primary)',
        letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px',
      }}>
        {member.role}
      </div>
      {member.bio && (
        <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '12px' }}>
          {member.bio}
        </p>
      )}
      {member.discord && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)' }}>
          💬 {member.discord}
        </div>
      )}
    </motion.div>
  )
}

export default function Staff() {
  const { dbData } = useDatabase()
  const staff = dbData.staff || []
  if (staff.length === 0) return null

  return (
    <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
      <div className="section-wrapper">
        <div className="section-header">
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px,5vw,48px)', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>
            <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontSize: '0.55em', verticalAlign: 'middle', marginRight: '12px' }}>// 06</span>
            Team Staff
          </h2>
          <div className="section-underline" />
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '20px',
        }}>
          {staff.map((member, i) => (
            <StaffCard key={member.id || i} member={member} index={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
