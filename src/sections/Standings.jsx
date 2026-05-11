import { motion } from 'framer-motion'
import { useDatabase } from '../context/DatabaseContext.jsx'

export default function Standings() {
  const { dbData } = useDatabase()
  const raw = dbData.standings || []
  const standings = [...raw].sort((a, b) => Number(b.points) - Number(a.points))
  const leader = standings[0]?.points || 1

  function posColor(pos) {
    if (pos === 1) return '#FFD700'
    if (pos === 2) return '#C0C0C0'
    if (pos === 3) return '#CD7F32'
    return 'var(--muted)'
  }

  return (
    <section id="standings" style={{ padding: '80px 40px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{ marginBottom: '48px' }}
      >
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          letterSpacing: '4px',
          color: 'var(--primary)',
          marginBottom: '12px',
        }}>
          // 04 CHAMPIONSHIP STANDINGS
        </div>
        <h2 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(32px, 5vw, 56px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '-1px',
          color: 'var(--text)',
        }}>
          Championship Standings
        </h2>
        <div style={{ width: '60px', height: '3px', background: 'var(--primary)', marginTop: '16px', boxShadow: '0 0 12px rgba(57,255,20,0.5)' }} />
      </motion.div>

      {standings.length === 0 ? (
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          letterSpacing: '3px',
          color: 'var(--muted)',
          textAlign: 'center',
          padding: '80px 40px',
          border: '1px dashed var(--border)',
        }}>
          NO STANDINGS DATA YET
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(57,255,20,0.03)' }}>
                  {['Pos', 'Driver', 'Nat', 'Points', 'Wins', 'Podiums', 'FL'].map(h => (
                    <th key={h} style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      letterSpacing: '3px',
                      textTransform: 'uppercase',
                      color: 'var(--muted)',
                      padding: '14px 20px',
                      textAlign: h === 'Driver' || h === 'Nat' ? 'left' : 'center',
                      fontWeight: 400,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {standings.map((entry, i) => {
                  const pos = i + 1
                  const isLeader = pos === 1
                  const pts = Number(entry.points) || 0
                  const barWidth = leader > 0 ? (pts / Number(leader)) * 100 : 0

                  return (
                    <motion.tr
                      key={entry.driver + i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.04 }}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: isLeader ? 'rgba(57,255,20,0.04)' : 'transparent',
                        boxShadow: isLeader ? 'inset 0 0 40px rgba(57,255,20,0.03)' : 'none',
                      }}
                    >
                      {/* Pos */}
                      <td style={{ padding: '16px 20px', textAlign: 'center', width: '60px' }}>
                        <span style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: '22px',
                          fontWeight: 900,
                          color: posColor(pos),
                          lineHeight: 1,
                        }}>
                          {pos}
                        </span>
                      </td>

                      {/* Driver */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: '18px',
                          fontWeight: 800,
                          color: 'var(--text)',
                          letterSpacing: '0.5px',
                        }}>
                          {entry.driver}
                        </div>
                      </td>

                      {/* Nationality */}
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}>
                          {entry.flag && <span style={{ marginRight: '6px', fontSize: '18px' }}>{entry.flag}</span>}
                          {entry.nationality}
                        </span>
                      </td>

                      {/* Points */}
                      <td style={{ padding: '16px 20px', textAlign: 'center', minWidth: '120px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: '22px',
                            fontWeight: 900,
                            color: 'var(--primary)',
                          }}>
                            {pts}
                          </span>
                          {/* Relative bar */}
                          <div style={{ width: '80px', height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${barWidth}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.8, delay: i * 0.04, ease: 'easeOut' }}
                              style={{
                                height: '100%',
                                background: isLeader ? 'var(--primary)' : 'rgba(57,255,20,0.5)',
                                boxShadow: isLeader ? '0 0 6px rgba(57,255,20,0.6)' : 'none',
                                borderRadius: '2px',
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Wins */}
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: entry.wins > 0 ? '#FFD700' : 'var(--muted)' }}>
                          {entry.wins || 0}
                        </span>
                      </td>

                      {/* Podiums */}
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: entry.podiums > 0 ? '#CD7F32' : 'var(--muted)' }}>
                          {entry.podiums || 0}
                        </span>
                      </td>

                      {/* Fastest Laps */}
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: entry.fastestLaps > 0 ? 'var(--primary)' : 'var(--muted)' }}>
                          {entry.fastestLaps || 0}
                        </span>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </section>
  )
}
