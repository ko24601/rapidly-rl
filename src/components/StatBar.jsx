import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useDatabase } from '../context/DatabaseContext.jsx'
import { SITE } from '../config.js'

function useCountUp(target, duration = 1600, start = false) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!start || target === 0) return
    const startTime = performance.now()
    function step(now) {
      const progress = Math.min((now - startTime) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(ease * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, start, duration])
  return value
}

function Stat({ label, value, suffix = '', delay }) {
  const ref = useRef(null)
  const [started, setStarted] = useState(false)
  const count = useCountUp(value, 1400, started)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStarted(true); obs.disconnect() } }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      style={{ textAlign: 'center', padding: '0 24px', flex: 1, minWidth: '120px' }}
    >
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 900, color: 'var(--primary)', lineHeight: 1, letterSpacing: '-1px', textShadow: '0 0 32px rgba(57,255,20,0.4)' }}>
        {count}{suffix}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', color: 'var(--muted)', textTransform: 'uppercase', marginTop: '8px' }}>
        {label}
      </div>
    </motion.div>
  )
}

export default function StatBar() {
  const { dbData, drivers } = useDatabase()

  const stats = [
    { label: 'Drivers', value: drivers.length, suffix: '' },
    { label: 'Rounds', value: (dbData.calendar || []).length, suffix: '' },
    { label: 'Season', value: parseInt(SITE.year) || 2026, suffix: '' },
    { label: 'Staff', value: (dbData.staff || []).length, suffix: '' },
  ]

  return (
    <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
      {/* Green glow sweep */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent, rgba(57,255,20,0.03), transparent)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '32px', position: 'relative' }}>
        {stats.map((s, i) => (
          <Stat key={s.label} label={s.label} value={s.value} suffix={s.suffix} delay={i * 0.1} />
        ))}
        {/* Vertical dividers */}
        {[1, 2, 3].map(i => (
          <div key={i} className="stat-divider" style={{ width: '1px', height: '60px', background: 'var(--border)', flexShrink: 0 }} />
        ))}
      </div>

      <style>{`@media(max-width:640px){.stat-divider{display:none!important}}`}</style>
    </div>
  )
}
