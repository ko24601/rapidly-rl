import { useEffect, useRef, useState } from 'react'

export default function CustomCursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)
  const mouse = useRef({ x: 0, y: 0 })
  const ring = useRef({ x: 0, y: 0 })
  const rafRef = useRef(null)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const onMove = (e) => {
      mouse.current.x = e.clientX
      mouse.current.y = e.clientY
      if (dotRef.current) {
        dotRef.current.style.left = e.clientX - 4 + 'px'
        dotRef.current.style.top = e.clientY - 4 + 'px'
      }
    }

    const onEnter = (e) => {
      if (e.target.closest('a, button, [role="button"], input, select, textarea')) {
        setHovered(true)
      }
    }
    const onLeave = (e) => {
      if (e.target.closest('a, button, [role="button"], input, select, textarea')) {
        setHovered(false)
      }
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseover', onEnter)
    document.addEventListener('mouseout', onLeave)

    function loop() {
      const SPEED = 0.12
      ring.current.x += (mouse.current.x - ring.current.x) * SPEED
      ring.current.y += (mouse.current.y - ring.current.y) * SPEED
      if (ringRef.current) {
        const size = hovered ? 52 : 36
        ringRef.current.style.left = ring.current.x - size / 2 + 'px'
        ringRef.current.style.top = ring.current.y - size / 2 + 'px'
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onEnter)
      document.removeEventListener('mouseout', onLeave)
      cancelAnimationFrame(rafRef.current)
    }
  }, [hovered])

  const ringSize = hovered ? 52 : 36

  return (
    <>
      <style>{`
        html { cursor: none !important; }
        * { cursor: none !important; }
        @media (pointer: coarse) {
          #custom-cursor-dot,
          #custom-cursor-ring { display: none !important; }
          html { cursor: auto !important; }
          * { cursor: auto !important; }
        }
      `}</style>

      {/* Dot */}
      <div
        id="custom-cursor-dot"
        ref={dotRef}
        style={{
          position: 'fixed',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#39FF14',
          boxShadow: '0 0 8px #39FF14, 0 0 16px rgba(57,255,20,0.5)',
          pointerEvents: 'none',
          zIndex: 99999,
          transform: 'none',
        }}
      />

      {/* Ring */}
      <div
        id="custom-cursor-ring"
        ref={ringRef}
        style={{
          position: 'fixed',
          width: ringSize + 'px',
          height: ringSize + 'px',
          borderRadius: '50%',
          border: hovered ? '1.5px solid rgba(57,255,20,1)' : '1.5px solid rgba(57,255,20,0.7)',
          background: hovered ? 'rgba(57,255,20,0.04)' : 'transparent',
          pointerEvents: 'none',
          zIndex: 99998,
          transition: 'width 0.2s ease, height 0.2s ease, opacity 0.2s ease, background 0.2s ease, border-color 0.2s ease',
        }}
      />
    </>
  )
}
