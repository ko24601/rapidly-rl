import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDatabase } from '../context/DatabaseContext.jsx'

export default function Results() {
  const { dbData } = useDatabase()
  const results = [...(dbData.results || [])].sort((a, b) => new Date(b.date) - new Date(a.date))
  const [expanded, setExpanded] = useState(null)

  function toggle(id) {
    setExpanded(prev => prev === id ? null : id)
  }

  return (
    <section id="results" style={{ padding: '80px 40px', maxWidth: '1200px', margin: '0 auto' }}>
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
          // 03 RACE RESULTS
        </div>
        <h2 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(32px, 5vw, 56px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '-1px',
          color: 'var(--text)',
        }}>
          Race Results
        </h2>
        <div style={{ width: '60px', height: '3px', background: 'var(--primary)', marginTop: '16px', boxShadow: '0 0 12px rgba(57,255,20,0.5)' }} />
      </motion.div>

      {results.length === 0 ? (
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          letterSpacing: '3px',
          color: 'var(--muted)',
          textAlign: 'center',
          padding: '80px 40px',
          border: '1px dashed var(--border)',
        }}>
          NO RESULTS YET — CHECK BACK AFTER THE FIRST RACE
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {results.map((result, i) => (
            <motion.div
              key={result.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              {/* Card header — click to expand */}
              <button
                onClick={() => toggle(result.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '20px 24px',
                  background: expanded === result.id ? 'rgba(57,255,20,0.04)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  gap: '16px',
                  borderBottom: expanded === result.id ? '1px solid var(--border)' : '1px solid transparent',
                  transition: 'background 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', flex: 1 }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                    color: 'var(--primary)',
                    letterSpacing: '2px',
                    flexShrink: 0,
                  }}>
                    {result.round}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '22px',
                    fontWeight: 800,
                    color: 'var(--text)',
                    letterSpacing: '0.5px',
                  }}>
                    {result.circuit}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--muted)',
                    letterSpacing: '2px',
                  }}>
                    {result.date}
                  </span>
                  {result.category && (
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      letterSpacing: '2px',
                      padding: '3px 10px',
                      border: '1px solid rgba(57,255,20,0.25)',
                      color: 'var(--primary)',
                    }}>
                      {result.category}
                    </span>
                  )}
                </div>
                <motion.span
                  animate={{ rotate: expanded === result.id ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '18px',
                    color: 'var(--primary)',
                    flexShrink: 0,
                    lineHeight: 1,
                  }}
                >
                  ▾
                </motion.span>
              </button>

              {/* Expandable entries table */}
              <AnimatePresence initial={false}>
                {expanded === result.id && (
                  <motion.div
                    key="table"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '480px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            {['Pos', 'Driver', 'Points', 'Fastest Lap'].map(h => (
                              <th key={h} style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '10px',
                                letterSpacing: '3px',
                                textTransform: 'uppercase',
                                color: 'var(--muted)',
                                padding: '10px 20px',
                                textAlign: h === 'Pos' || h === 'Points' || h === 'Fastest Lap' ? 'center' : 'left',
                                fontWeight: 400,
                              }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(result.entries || []).map((entry, idx) => {
                            const posColor = entry.pos === 1 ? '#FFD700' : entry.pos === 2 ? '#C0C0C0' : entry.pos === 3 ? '#CD7F32' : 'var(--text)'
                            return (
                              <tr key={idx} style={{
                                borderBottom: '1px solid rgba(255,255,255,0.04)',
                                background: entry.pos === 1 ? 'rgba(255,215,0,0.03)' : 'transparent',
                              }}>
                                <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                                  <span style={{
                                    fontFamily: 'var(--font-heading)',
                                    fontSize: '20px',
                                    fontWeight: 900,
                                    color: posColor,
                                    lineHeight: 1,
                                  }}>
                                    {entry.pos}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 20px' }}>
                                  <span style={{
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '15px',
                                    fontWeight: 600,
                                    color: 'var(--text)',
                                  }}>
                                    {entry.driver}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                                  <span style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    color: 'var(--primary)',
                                  }}>
                                    {entry.points}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                                  <span style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '16px',
                                    color: entry.fastestLap ? 'var(--primary)' : 'var(--muted)',
                                  }}>
                                    {entry.fastestLap ? '✓' : '–'}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  )
}
