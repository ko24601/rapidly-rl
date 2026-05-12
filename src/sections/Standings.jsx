import { motion } from 'framer-motion'
import { useDatabase } from '../context/DatabaseContext.jsx'

function PodiumBlock({ entry, pos, height }) {
  const colors = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' }
  const color = colors[pos]
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: pos * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}
    >
      {/* Driver info above block */}
      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        <div style={{ fontSize: '24px', marginBottom: '4px' }}>{entry.flag || '🏁'}</div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(14px,2vw,18px)', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text)', letterSpacing: '1px' }}>{entry.driver}</div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(20px,3vw,32px)', fontWeight: 900, color, lineHeight: 1, marginTop: '4px' }}>{entry.points} <span style={{ fontSize: '0.5em', opacity: 0.7 }}>PTS</span></div>
      </div>
      {/* Block */}
      <div style={{
        width: '100%', height: `${height}px`,
        background: `linear-gradient(180deg, ${color}22, ${color}0a)`,
        border: `1px solid ${color}55`,
        borderBottom: 'none',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '16px',
        position: 'relative', overflow: 'hidden',
        boxShadow: `0 -4px 24px ${color}33`,
      }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(40px,6vw,80px)', fontWeight: 900, color, opacity: 0.15, lineHeight: 1 }}>{pos}</span>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: color, boxShadow: `0 0 12px ${color}` }} />
      </div>
    </motion.div>
  )
}

export default function Standings() {
  const { dbData } = useDatabase()
  const raw = dbData.standings || []
  const standings = [...raw].sort((a, b) => Number(b.points) - Number(a.points))
  const leader = standings[0]?.points || 1
  const top3 = [standings[1], standings[0], standings[2]].filter(Boolean)
  const podiumHeights = { 0: 120, 1: 160, 2: 100 }
  const podiumPositions = { 0: 2, 1: 1, 2: 3 }

  function posColor(pos) {
    if (pos === 1) return '#FFD700'
    if (pos === 2) return '#C0C0C0'
    if (pos === 3) return '#CD7F32'
    return 'var(--muted)'
  }

  return (
    <section id="standings" style={{ padding: '80px 40px', maxWidth: '1200px', margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ marginBottom: '48px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '4px', color: 'var(--primary)', marginBottom: '12px' }}>
          // 04 CHAMPIONSHIP STANDINGS
        </div>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-1px', color: 'var(--text)' }}>
          Championship Standings
        </h2>
        <div style={{ width: '60px', height: '3px', background: 'var(--primary)', marginTop: '16px', boxShadow: '0 0 12px rgba(57,255,20,0.5)' }} />
      </motion.div>

      {standings.length === 0 ? (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '3px', color: 'var(--muted)', textAlign: 'center', padding: '80px 40px', border: '1px dashed var(--border)' }}>
          NO STANDINGS DATA YET
        </div>
      ) : (
        <>
          {/* Podium */}
          {standings.length >= 2 && (
            <div style={{ marginBottom: '56px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', color: 'var(--muted)', textAlign: 'center', marginBottom: '32px', textTransform: 'uppercase' }}>Top 3</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', maxWidth: '600px', margin: '0 auto' }}>
                {top3.map((entry, i) => (
                  <PodiumBlock key={entry.driver} entry={entry} pos={podiumPositions[i]} height={podiumHeights[i]} />
                ))}
              </div>
            </div>
          )}

          {/* Full table */}
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(57,255,20,0.03)' }}>
                    {['Pos', 'Driver', 'Nat', 'Points', 'Wins', 'Podiums', 'FL'].map(h => (
                      <th key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muted)', padding: '14px 20px', textAlign: h === 'Driver' || h === 'Nat' ? 'left' : 'center', fontWeight: 400 }}>{h}</th>
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
                      <motion.tr key={entry.driver + i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: isLeader ? 'rgba(57,255,20,0.04)' : 'transparent' }}>
                        <td style={{ padding: '16px 20px', textAlign: 'center', width: '60px' }}>
                          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 900, color: posColor(pos), lineHeight: 1 }}>{pos}</span>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 800, color: 'var(--text)', letterSpacing: '0.5px' }}>{entry.driver}</div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}>
                            {entry.flag && <span style={{ marginRight: '6px', fontSize: '18px' }}>{entry.flag}</span>}
                            {entry.nationality}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center', minWidth: '120px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 900, color: 'var(--primary)' }}>{pts}</span>
                            <div style={{ width: '80px', height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                              <motion.div initial={{ width: 0 }} whileInView={{ width: `${barWidth}%` }} viewport={{ once: true }} transition={{ duration: 0.8, delay: i * 0.04, ease: 'easeOut' }}
                                style={{ height: '100%', background: isLeader ? 'var(--primary)' : 'rgba(57,255,20,0.5)', boxShadow: isLeader ? '0 0 6px rgba(57,255,20,0.6)' : 'none', borderRadius: '2px' }} />
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: entry.wins > 0 ? '#FFD700' : 'var(--muted)' }}>{entry.wins || 0}</span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: entry.podiums > 0 ? '#CD7F32' : 'var(--muted)' }}>{entry.podiums || 0}</span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: entry.fastestLaps > 0 ? 'var(--primary)' : 'var(--muted)' }}>{entry.fastestLaps || 0}</span>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </section>
  )
}
