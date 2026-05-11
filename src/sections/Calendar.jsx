import { motion } from 'framer-motion'
import { useDatabase } from '../context/DatabaseContext.jsx'
import { RowSkeleton } from '../components/Skeleton.jsx'

function StatusBadge({ status }) {
  const cfg = {
    Next: { color: 'var(--primary)', border: 'var(--primary)', bg: 'rgba(57,255,20,0.08)', pulse: true },
    Done: { color: '#444', border: 'rgba(255,255,255,0.1)', bg: 'transparent', pulse: false },
    TBD:  { color: '#666', border: 'rgba(255,255,255,0.12)', bg: 'rgba(255,255,255,0.02)', pulse: false },
  }
  const c = cfg[status] || cfg.TBD
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '7px',
      fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '2px',
      padding: '4px 12px', textTransform: 'uppercase', whiteSpace: 'nowrap',
      color: c.color, border: `1px solid ${c.border}`, background: c.bg,
      boxShadow: c.pulse ? '0 0 12px rgba(57,255,20,0.25)' : 'none',
    }}>
      {c.pulse && (
        <span style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: 'var(--primary)', display: 'inline-block',
          boxShadow: '0 0 6px var(--primary)',
          animation: 'statusPulse 1.5s ease-in-out infinite',
        }} />
      )}
      {status}
    </span>
  )
}

export default function Calendar() {
  const { dbData, loading } = useDatabase()
  const rounds = dbData.calendar || []

  return (
    <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>

      {/* Background grid lines */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.025 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: `${i * 14.28}%`, width: '1px', background: 'var(--primary)' }} />
        ))}
      </div>

      <div className="section-wrapper">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <div className="section-header">
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px,5vw,52px)', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>
              <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontSize: '0.5em', verticalAlign: 'middle', marginRight: '12px', opacity: 0.7 }}>// 02</span>
              Season Schedule
            </h2>
            <div className="section-underline" />
          </div>

          {loading ? (
            <div>{Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)}</div>
          ) : rounds.length === 0 ? (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--muted)', letterSpacing: '2px', textAlign: 'center', padding: '60px 20px', border: '1px dashed rgba(57,255,20,0.15)' }}>
              &gt; NO_ROUNDS_SCHEDULED_YET
            </div>
          ) : (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '580px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(57,255,20,0.15)' }}>
                    {['RND', 'Circuit', 'Category', 'Date', 'Status'].map(h => (
                      <th key={h} className={h === 'Category' ? 'hide-mobile' : ''} style={{
                        fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px',
                        textTransform: 'uppercase', color: 'rgba(57,255,20,0.5)',
                        padding: '12px 16px', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 400,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rounds.map((round, i) => (
                    <motion.tr key={round.id || i}
                      initial={{ opacity: 0, x: -16 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.06 }}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        background: round.status === 'Next' ? 'rgba(57,255,20,0.03)' : 'transparent',
                        transition: 'background 0.2s',
                        cursor: 'default',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(57,255,20,0.04)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = round.status === 'Next' ? 'rgba(57,255,20,0.03)' : 'transparent' }}
                    >
                      <td style={{ padding: '18px 16px', fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--primary)', fontWeight: 700, letterSpacing: '1px' }}>
                        R{String(round.round || i + 1).padStart(2, '0')}
                      </td>
                      <td style={{ padding: '18px 16px' }}>
                        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>{round.circuit}</div>
                        {round.country && <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '3px', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>{round.country}</div>}
                      </td>
                      <td className="hide-mobile" style={{ padding: '18px 16px', fontSize: '13px', color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>{round.category}</td>
                      <td style={{ padding: '18px 16px', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text)', whiteSpace: 'nowrap' }}>{round.date}</td>
                      <td style={{ padding: '18px 16px' }}><StatusBadge status={round.status || 'TBD'} /></td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
      <style>{`@media(max-width:768px){.hide-mobile{display:none!important}}`}</style>
    </div>
  )
}
