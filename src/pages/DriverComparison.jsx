import { useState } from 'react'
import { motion } from 'framer-motion'
import { useDatabase } from '../context/DatabaseContext.jsx'
import Footer from '../components/Footer.jsx'

function StatRow({ label, a, b, higherIsBetter = true }) {
  const numA = Number(a) || 0
  const numB = Number(b) || 0
  const max = Math.max(numA, numB, 1)
  const aWins = higherIsBetter ? numA > numB : numA < numB
  const bWins = higherIsBetter ? numB > numA : numB < numA

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', color: 'var(--muted)', textTransform: 'uppercase', textAlign: 'center', marginBottom: '8px' }}>{label}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'center' }}>
        {/* Left bar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 900, color: aWins ? 'var(--primary)' : 'var(--text)' }}>{a ?? '—'}</span>
          <div style={{ width: '100%', height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${(numA / max) * 100}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ height: '100%', background: aWins ? 'var(--primary)' : 'rgba(255,255,255,0.3)', borderRadius: '2px', marginLeft: 'auto' }} />
          </div>
        </div>
        {/* VS */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: 'var(--muted)', textAlign: 'center', width: '28px' }}>VS</div>
        {/* Right bar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 900, color: bWins ? 'var(--primary)' : 'var(--text)' }}>{b ?? '—'}</span>
          <div style={{ width: '100%', height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${(numB / max) * 100}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ height: '100%', background: bWins ? 'var(--primary)' : 'rgba(255,255,255,0.3)', borderRadius: '2px' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function DriverSelect({ drivers, value, onChange, label }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</div>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, padding: '12px 16px', outline: 'none', cursor: 'pointer', appearance: 'none' }}>
        <option value="">— Select Driver —</option>
        {drivers.map(d => <option key={d.id} value={d.id}>{d.name} {d.category ? `(${d.category})` : ''}</option>)}
      </select>
    </div>
  )
}

export default function DriverComparison() {
  const { drivers, dbData } = useDatabase()
  const standings = dbData.standings || []
  const [idA, setIdA] = useState('')
  const [idB, setIdB] = useState('')

  const dA = drivers.find(d => d.id === idA)
  const dB = drivers.find(d => d.id === idB)
  const sA = standings.find(s => dA && s.driver?.toLowerCase() === dA.name?.toLowerCase())
  const sB = standings.find(s => dB && s.driver?.toLowerCase() === dB.name?.toLowerCase())

  return (
    <>
      <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '64px 40px 48px' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '4px', color: 'var(--primary)', marginBottom: '12px', opacity: 0.8 }}>// HEAD TO HEAD</div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '3px', lineHeight: 1 }}>
              Driver Comparison
            </motion.h1>
          </div>
        </div>

        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 40px' }}>
          {/* Selectors */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', marginBottom: '48px', flexWrap: 'wrap' }}>
            <DriverSelect drivers={drivers} value={idA} onChange={setIdA} label="Driver A" />
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 900, color: 'var(--muted)', paddingBottom: '12px' }}>VS</div>
            <DriverSelect drivers={drivers} value={idB} onChange={setIdB} label="Driver B" />
          </div>

          {dA && dB ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              {/* Driver headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', marginBottom: '40px', alignItems: 'center' }}>
                <div style={{ textAlign: 'right' }}>
                  {dA.photo && <img src={dA.photo} style={{ width: '80px', height: '107px', objectFit: 'cover', border: `2px solid ${dA.teamColor || 'var(--primary)'}`, marginLeft: 'auto', marginBottom: '8px', display: 'block' }} />}
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(20px,3vw,32px)', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text)' }}>{dA.name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: dA.teamColor || 'var(--primary)', letterSpacing: '2px', marginTop: '4px' }}>{dA.category}</div>
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 900, color: 'var(--muted)', textAlign: 'center' }}>VS</div>
                <div style={{ textAlign: 'left' }}>
                  {dB.photo && <img src={dB.photo} style={{ width: '80px', height: '107px', objectFit: 'cover', border: `2px solid ${dB.teamColor || 'var(--primary)'}`, marginBottom: '8px' }} />}
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(20px,3vw,32px)', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text)' }}>{dB.name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: dB.teamColor || 'var(--primary)', letterSpacing: '2px', marginTop: '4px' }}>{dB.category}</div>
                </div>
              </div>

              {/* Stats */}
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '32px' }}>
                <StatRow label="Points" a={sA?.points ?? '—'} b={sB?.points ?? '—'} />
                <StatRow label="Wins" a={sA?.wins ?? '—'} b={sB?.wins ?? '—'} />
                <StatRow label="Podiums" a={sA?.podiums ?? '—'} b={sB?.podiums ?? '—'} />
                <StatRow label="Fastest Laps" a={sA?.fastestLaps ?? '—'} b={sB?.fastestLaps ?? '—'} />
                <StatRow label="Car Number" a={dA.number || '—'} b={dB.number || '—'} higherIsBetter={false} />
              </div>

              {(!sA && !sB) && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', letterSpacing: '2px', textAlign: 'center', marginTop: '20px' }}>
                  No standings data yet — add results and recalculate standings in admin.
                </div>
              )}
            </motion.div>
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--muted)', letterSpacing: '3px', border: '1px dashed var(--border)' }}>
              SELECT TWO DRIVERS TO COMPARE
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
