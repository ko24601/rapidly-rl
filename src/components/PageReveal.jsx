import { useState, useEffect } from 'react'

export default function PageReveal() {
  const [phase, setPhase] = useState('visible') // 'visible' | 'sliding' | 'gone'
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Animate progress bar 0 -> 100% over 600ms
    const start = performance.now()
    const duration = 600
    let rafId

    function animateBar(now) {
      const elapsed = now - start
      const pct = Math.min((elapsed / duration) * 100, 100)
      setProgress(pct)
      if (pct < 100) {
        rafId = requestAnimationFrame(animateBar)
      }
    }
    rafId = requestAnimationFrame(animateBar)

    // After 900ms start slide out
    const slideTimer = setTimeout(() => {
      setPhase('sliding')
    }, 900)

    // After slide completes (900 + 400ms), remove
    const goneTimer = setTimeout(() => {
      setPhase('gone')
    }, 1300)

    return () => {
      cancelAnimationFrame(rafId)
      clearTimeout(slideTimer)
      clearTimeout(goneTimer)
    }
  }, [])

  if (phase === 'gone') return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#050505',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transform: phase === 'sliding' ? 'translateY(-100%)' : 'translateY(0)',
        transition: phase === 'sliding' ? 'transform 0.4s cubic-bezier(0.76,0,0.24,1)' : 'none',
        pointerEvents: 'none',
      }}
    >
      {/* Logo text */}
      <div style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 'clamp(40px, 8vw, 80px)',
        fontWeight: 900,
        letterSpacing: '6px',
        textTransform: 'uppercase',
        color: '#39FF14',
        textShadow: '0 0 20px rgba(57,255,20,0.7), 0 0 60px rgba(57,255,20,0.3)',
        marginBottom: '32px',
        userSelect: 'none',
      }}>
        RAPIDLY RL
      </div>

      {/* Progress bar track */}
      <div style={{
        width: 'min(300px, 60vw)',
        height: '2px',
        background: 'rgba(57,255,20,0.1)',
        borderRadius: '2px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: progress + '%',
          background: '#39FF14',
          boxShadow: '0 0 8px rgba(57,255,20,0.8), 0 0 16px rgba(57,255,20,0.4)',
          borderRadius: '2px',
          transition: 'none',
        }} />
      </div>
    </div>
  )
}
