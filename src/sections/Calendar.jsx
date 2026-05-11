import { motion } from 'framer-motion'
import { useDatabase } from '../context/DatabaseContext.jsx'
import { SITE } from '../config.js'

function StatusBadge({ status }) {
  const styles = {
    Next: {
      color: 'var(--primary)',
      border: '1px solid var(--primary)',
      background: 'rgba(255,0,0,0.08)',
    },
    Done: {
      color: 'var(--muted)',
      border: '1px solid rgba(255,255,255,0.1)',
      background: 'transparent',
    },
    TBD: {
      color: '#888',
      border: '1px solid rgba(255,255,255,0.15)',
      background: 'rgba(255,255,255,0.03)',
    },
  }
  const s = styles[status] || styles.TBD
  return (
    <span style={{
      ...s,
      fontFamily: 'var(--font-mono)',
      fontSize: '11px',
      letterSpacing: '2px',
      padding: '3px 10px',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  )
}

export default function Calendar() {
  const { dbData } = useDatabase()
  const rounds = dbData.calendar || []

  return (
    <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div className="section-wrapper">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-header">
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px,5vw,48px)', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>
              <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontSize: '0.55em', verticalAlign: 'middle', marginRight: '12px' }}>// 02</span>
              Season Schedule
            </h2>
            <div className="section-underline" />
          </div>

          {rounds.length === 0 ? (
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              color: 'var(--muted)',
              letterSpacing: '2px',
              textAlign: 'center',
              padding: '60px 20px',
              border: '1px dashed var(--border)',
            }}>
              &gt; NO ROUNDS SCHEDULED YET
            </div>
          ) : (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: '600px',
              }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Round', 'Circuit', 'Category', 'Date', 'Status'].map((h) => (
                      <th key={h} className={h === 'Category' ? 'hide-mobile' : ''} style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        letterSpacing: '3px',
                        textTransform: 'uppercase',
                        color: 'var(--muted)',
                        padding: '12px 16px',
                        textAlign: 'left',
                        whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rounds.map((round, i) => (
                    <motion.tr
                      key={round.id || i}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        background: round.status === 'Next' ? 'rgba(255,0,0,0.03)' : 'transparent',
                        transition: 'background 0.2s',
                      }}
                    >
                      <td style={{ padding: '16px', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}>
                        R{round.round || i + 1}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 700, letterSpacing: '1px' }}>{round.circuit}</div>
                        {round.country && <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>{round.country}</div>}
                      </td>
                      <td className="hide-mobile" style={{ padding: '16px', fontSize: '13px', color: 'var(--muted)' }}>{round.category}</td>
                      <td style={{ padding: '16px', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text)', whiteSpace: 'nowrap' }}>{round.date}</td>
                      <td style={{ padding: '16px' }}><StatusBadge status={round.status || 'TBD'} /></td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </div>
  )
}
