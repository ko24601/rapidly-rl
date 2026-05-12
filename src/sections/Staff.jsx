import { motion } from 'framer-motion'
import { useDatabase } from '../context/DatabaseContext.jsx'

function StaffCard({ member, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="glow-card"
      style={{
        background: 'var(--card)',
        padding: '32px 20px 24px', textAlign: 'center',
        cursor: 'default',
        position: 'relative',
      }}
    >
      {/* Corner accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '32px', height: '32px', borderTop: '2px solid var(--primary)', borderLeft: '2px solid var(--primary)', opacity: 0.6 }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: '32px', height: '32px', borderBottom: '2px solid var(--primary)', borderRight: '2px solid var(--primary)', opacity: 0.6 }} />

      {/* Photo ring */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            width: '110px', height: '110px', borderRadius: '50%',
            overflow: 'hidden', background: '#111', flexShrink: 0,
            border: '2px solid rgba(57,255,20,0.3)',
            boxShadow: '0 0 20px rgba(57,255,20,0.12)',
          }}>
            {member.photo ? (
              <img src={member.photo} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-heading)', fontSize: '38px', fontWeight: 900, color: 'var(--primary)', opacity: 0.35,
              }}>{(member.name || '?')[0]}</div>
            )}
          </div>
          {/* Rotating ring */}
          <div style={{
            position: 'absolute', inset: '-6px', borderRadius: '50%',
            border: '1px dashed rgba(57,255,20,0.2)',
            animation: 'spin 12s linear infinite',
          }} />
        </div>
      </div>

      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
        {member.name}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--primary)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '14px', opacity: 0.9 }}>
        {member.role}
      </div>
      {member.bio && (
        <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.55, marginBottom: '14px' }}>{member.bio}</p>
      )}
      {member.discord && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(57,255,20,0.5)', letterSpacing: '0.5px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
          {member.discord}
        </div>
      )}
      <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
    </motion.div>
  )
}

export default function Staff() {
  const { dbData } = useDatabase()
  const staff = dbData.staff || []
  if (staff.length === 0) return null

  return (
    <div style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
      <div className="section-wrapper">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <div className="section-header">
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px,5vw,52px)', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>
              <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontSize: '0.5em', verticalAlign: 'middle', marginRight: '12px', opacity: 0.7 }}>// 05</span>
              Team Staff
            </h2>
            <div className="section-underline" />
          </div>
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '20px' }}>
          {staff.map((member, i) => <StaffCard key={member.id || i} member={member} index={i} />)}
        </div>
      </div>
    </div>
  )
}
