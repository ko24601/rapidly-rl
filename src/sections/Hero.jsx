import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { SITE } from '../config.js'

const BASE = import.meta.env.BASE_URL

function Particles() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let W = canvas.width = canvas.offsetWidth
    let H = canvas.height = canvas.offsetHeight
    let raf
    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: 0.4 + Math.random() * 1.4, vy: (Math.random() - 0.5) * 0.3,
      size: 0.6 + Math.random() * 1.4, alpha: 0.15 + Math.random() * 0.55,
      trail: [],
    }))
    function draw() {
      ctx.clearRect(0, 0, W, H)
      particles.forEach(p => {
        p.trail.push({ x: p.x, y: p.y })
        if (p.trail.length > 20) p.trail.shift()
        p.x += p.vx; p.y += p.vy
        if (p.x > W + 30) { p.x = -30; p.trail = [] }
        p.trail.forEach((pt, i) => {
          ctx.beginPath()
          ctx.arc(pt.x, pt.y, p.size * (i / p.trail.length), 0, Math.PI * 2)
          ctx.fillStyle = `rgba(57,255,20,${(i / p.trail.length) * p.alpha * 0.5})`
          ctx.fill()
        })
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(57,255,20,${p.alpha})`
        ctx.shadowBlur = 6; ctx.shadowColor = 'rgba(57,255,20,0.8)'
        ctx.fill(); ctx.shadowBlur = 0
      })
      raf = requestAnimationFrame(draw)
    }
    draw()
    const onResize = () => { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize) }
  }, [])
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }} />
}

export default function Hero() {
  const heroRef = useRef(null)
  const bgRef = useRef(null)
  const name = SITE.name

  // Parallax on scroll
  useEffect(() => {
    const onScroll = () => {
      if (!bgRef.current || !heroRef.current) return
      const rect = heroRef.current.getBoundingClientRect()
      const progress = -rect.top / rect.height
      if (progress >= -0.1 && progress <= 1.1) {
        bgRef.current.style.transform = `translateY(${progress * 120}px) scale(1.15)`
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function scrollTo(id) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }) }

  return (
    <div ref={heroRef} style={{ position: 'relative', height: '100vh', minHeight: '640px', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>

      {/* Parallax BG */}
      <div ref={bgRef} style={{
        position: 'absolute', inset: '-15%',
        backgroundImage: `url(${BASE}hero-bg.png)`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        willChange: 'transform', transition: 'transform 0.05s linear',
        transform: 'scale(1.15)',
      }} />

      {/* Logo watermark */}
      <div style={{
        position: 'absolute', top: '50%', right: '5%', transform: 'translateY(-50%)',
        width: 'clamp(200px, 30vw, 420px)', aspectRatio: '1',
        backgroundImage: `url(${BASE}logo.png)`,
        backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center',
        opacity: 0.04, pointerEvents: 'none', zIndex: 2,
        filter: 'grayscale(1) brightness(3)',
      }} />

      <Particles />

      {/* Gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, rgba(5,5,5,0.97) 0%, rgba(5,5,5,0.82) 55%, rgba(5,5,5,0.2) 100%)', zIndex: 3 }} />

      {/* Green glow */}
      <div style={{ position: 'absolute', top: '38%', left: '-80px', width: '650px', height: '650px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(57,255,20,0.14) 0%, transparent 68%)', pointerEvents: 'none', zIndex: 3, animation: 'heroPulse 5s ease-in-out infinite' }} />

      {/* Speed stripes */}
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '42%', overflow: 'hidden', zIndex: 3, pointerEvents: 'none' }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} style={{ position: 'absolute', top: '-20%', right: `${i * 80 - 40}px`, width: '2px', height: '140%', background: 'linear-gradient(to bottom, transparent, rgba(57,255,20,0.1), transparent)', transform: 'rotate(-20deg)' }} />
        ))}
      </div>

      {/* Left accent bars */}
      <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 4, pointerEvents: 'none' }}>
        {[80, 52, 30].map((w, i) => (
          <div key={i} style={{ height: '2px', width: `${w}px`, background: `rgba(57,255,20,${0.9 - i * 0.25})`, marginBottom: '7px', boxShadow: '0 0 10px rgba(57,255,20,0.7)' }} />
        ))}
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 4, maxWidth: '1200px', margin: '0 auto', padding: '0 40px', width: '100%' }}>
        <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '5px', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '22px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ display: 'inline-block', width: '32px', height: '1px', background: 'var(--primary)', boxShadow: '0 0 8px var(--primary)' }} />
          {SITE.tagline}
        </motion.div>

        {/* Name + glitch */}
        <div style={{ position: 'relative', marginBottom: '28px' }}>
          <span aria-hidden="true" style={{ position: 'absolute', inset: 0, fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 'clamp(56px, 11vw, 128px)', letterSpacing: '-2px', textTransform: 'uppercase', lineHeight: 0.88, color: 'var(--primary)', opacity: 0.65, animation: 'glitch1 8s infinite', pointerEvents: 'none' }}>{name}</span>
          <span aria-hidden="true" style={{ position: 'absolute', inset: 0, fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 'clamp(56px, 11vw, 128px)', letterSpacing: '-2px', textTransform: 'uppercase', lineHeight: 0.88, color: '#ff3333', opacity: 0.4, animation: 'glitch2 8s infinite 0.4s', pointerEvents: 'none' }}>{name}</span>
          <motion.h1 initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 'clamp(56px, 11vw, 128px)', letterSpacing: '-2px', textTransform: 'uppercase', lineHeight: 0.88, color: 'var(--text)', animation: 'neonFlicker 12s infinite 4s' }}>
            {name}
          </motion.h1>
        </div>

        {[`> SEASON_${SITE.year}_ACTIVE`, '> RACE_HARD . WIN_HARDER'].map((line, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 + i * 0.15, duration: 0.5 }}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '2px', marginBottom: '8px', color: i === 0 ? 'var(--primary)' : 'var(--muted)' }}>
            {line}
          </motion.div>
        ))}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3, duration: 0.5 }}
          style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '36px' }}>
          <a href={SITE.discord} target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase', padding: '15px 36px', background: 'var(--primary)', color: '#050505', border: '2px solid var(--primary)', textDecoration: 'none', display: 'inline-block', boxShadow: '0 0 32px rgba(57,255,20,0.45), 0 0 64px rgba(57,255,20,0.15)' }}>
            Join Discord
          </a>
          <button onClick={() => scrollTo('calendar')}
            style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase', padding: '15px 36px', background: 'transparent', color: 'var(--text)', border: '2px solid rgba(255,255,255,0.18)', cursor: 'pointer' }}>
            View Schedule →
          </button>
        </motion.div>
      </div>

      {/* Status widget */}
      <motion.div className="hero-widget" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.6, duration: 0.6 }}
        style={{ position: 'absolute', bottom: '48px', right: '40px', background: 'rgba(6,6,6,0.92)', backdropFilter: 'blur(16px)', border: '1px solid rgba(57,255,20,0.2)', borderLeft: '3px solid var(--primary)', padding: '22px 26px', fontFamily: 'var(--font-mono)', zIndex: 4, boxShadow: '0 0 40px rgba(57,255,20,0.08)', animation: 'float 4s ease-in-out infinite' }}>
        <div style={{ fontSize: '9px', letterSpacing: '4px', color: 'var(--primary)', marginBottom: '16px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--primary)', display: 'inline-block', boxShadow: '0 0 8px var(--primary)', animation: 'statusPulse 1.5s ease-in-out infinite' }} />
          LIVE STATUS
        </div>
        {[['SEASON', SITE.year], ['CLASS', 'RACING'], ['STATUS', 'ACTIVE'], ['MODE', 'COMPETITIVE']].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', gap: '16px', marginBottom: '9px', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--muted)', letterSpacing: '2px', width: '68px', flexShrink: 0 }}>{k}</span>
            <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 600, letterSpacing: '1px' }}>{v}</span>
          </div>
        ))}
      </motion.div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, var(--primary), rgba(57,255,20,0.3), transparent)', zIndex: 4, boxShadow: '0 0 12px var(--primary)' }} />

      <style>{`@media(max-width:768px){.hero-widget{display:none!important}}`}</style>
    </div>
  )
}
