import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../firebase.js'
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore'

const W = 900
const H = 560
const TRACK_W = 68
const MAX_SPEED = 5.2
const ACCEL = 0.12
const BRAKE = 0.18
const FRICTION = 0.97
const STEER = 0.038
const CAR_W = 14
const CAR_H = 24

// Centerline points (closed loop — last point connects back to first)
const CL = [
  [450, 510], [620, 510], [720, 510], [800, 480],
  [830, 420], [830, 300], [830, 200], [800, 130],
  [730, 95],  [630, 85],  [500, 85],  [360, 85],
  [230, 85],  [150, 110], [100, 175], [95, 260],
  [110, 350], [90, 420],  [120, 490], [200, 520],
  [320, 520], [450, 510],
]

// Catmull-Rom → cubic Bézier segments
function buildSpline(pts) {
  const segs = []
  const n = pts.length
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(n - 1, i + 2)]
    segs.push({
      x1: p1[0], y1: p1[1],
      cx1: p1[0] + (p2[0] - p0[0]) / 6,
      cy1: p1[1] + (p2[1] - p0[1]) / 6,
      cx2: p2[0] - (p3[0] - p1[0]) / 6,
      cy2: p2[1] - (p3[1] - p1[1]) / 6,
      x2: p2[0], y2: p2[1],
    })
  }
  return segs
}

const SPLINE = buildSpline(CL)

function drawTrack(ctx, forCollision = false) {
  // Tarmac
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  ctx.beginPath()
  ctx.moveTo(SPLINE[0].x1, SPLINE[0].y1)
  for (const s of SPLINE) ctx.bezierCurveTo(s.cx1, s.cy1, s.cx2, s.cy2, s.x2, s.y2)
  ctx.strokeStyle = forCollision ? '#fff' : '#222'
  ctx.lineWidth = TRACK_W
  ctx.stroke()

  if (!forCollision) {
    // White edge lines
    ctx.beginPath()
    ctx.moveTo(SPLINE[0].x1, SPLINE[0].y1)
    for (const s of SPLINE) ctx.bezierCurveTo(s.cx1, s.cy1, s.cx2, s.cy2, s.x2, s.y2)
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'
    ctx.lineWidth = TRACK_W
    ctx.stroke()

    // Inner kerb line
    ctx.beginPath()
    ctx.moveTo(SPLINE[0].x1, SPLINE[0].y1)
    for (const s of SPLINE) ctx.bezierCurveTo(s.cx1, s.cy1, s.cx2, s.cy2, s.x2, s.y2)
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
    ctx.lineWidth = TRACK_W - 8
    ctx.stroke()

    // Track surface
    ctx.beginPath()
    ctx.moveTo(SPLINE[0].x1, SPLINE[0].y1)
    for (const s of SPLINE) ctx.bezierCurveTo(s.cx1, s.cy1, s.cx2, s.cy2, s.x2, s.y2)
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = TRACK_W - 10
    ctx.stroke()

    // Dashed centre line
    ctx.setLineDash([18, 14])
    ctx.beginPath()
    ctx.moveTo(SPLINE[0].x1, SPLINE[0].y1)
    for (const s of SPLINE) ctx.bezierCurveTo(s.cx1, s.cy1, s.cx2, s.cy2, s.x2, s.y2)
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.setLineDash([])

    // Start/finish line
    ctx.fillStyle = '#fff'
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(430 + i * 8, 500, 4, 20)
    }
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#fff' : '#000'
      ctx.fillRect(430 + i * 8, 500, 4, 10)
      ctx.fillStyle = i % 2 === 0 ? '#000' : '#fff'
      ctx.fillRect(430 + i * 8, 510, 4, 10)
    }
  }
  ctx.restore()
}

function drawCar(ctx, x, y, angle, speed) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)

  // Body
  const grad = ctx.createLinearGradient(0, -CAR_H / 2, 0, CAR_H / 2)
  grad.addColorStop(0, '#39FF14')
  grad.addColorStop(0.5, '#2adb0f')
  grad.addColorStop(1, '#1a9a08')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.roundRect(-CAR_W / 2, -CAR_H / 2, CAR_W, CAR_H, 3)
  ctx.fill()

  // Cockpit
  ctx.fillStyle = '#050505'
  ctx.beginPath()
  ctx.roundRect(-4, -8, 8, 12, 2)
  ctx.fill()

  // Nose
  ctx.fillStyle = '#39FF14'
  ctx.beginPath()
  ctx.moveTo(-3, -CAR_H / 2 - 6)
  ctx.lineTo(3, -CAR_H / 2 - 6)
  ctx.lineTo(CAR_W / 2, -CAR_H / 2)
  ctx.lineTo(-CAR_W / 2, -CAR_H / 2)
  ctx.closePath()
  ctx.fill()

  // Rear wing
  ctx.fillStyle = '#222'
  ctx.fillRect(-CAR_W / 2 - 3, CAR_H / 2 - 4, CAR_W + 6, 3)

  // Front wing
  ctx.fillStyle = '#222'
  ctx.fillRect(-CAR_W / 2 - 2, -CAR_H / 2 - 1, CAR_W + 4, 2)

  // Wheels
  ctx.fillStyle = '#111'
  const wheels = [[-CAR_W / 2 - 3, -CAR_H / 2 + 3], [CAR_W / 2 - 1, -CAR_H / 2 + 3],
                  [-CAR_W / 2 - 3, CAR_H / 2 - 8], [CAR_W / 2 - 1, CAR_H / 2 - 8]]
  wheels.forEach(([wx, wy]) => {
    ctx.fillRect(wx, wy, 4, 5)
  })

  // Speed glow
  if (speed > 2) {
    ctx.shadowColor = '#39FF14'
    ctx.shadowBlur = 8 + speed * 3
    ctx.fillStyle = 'rgba(57,255,20,0.15)'
    ctx.beginPath()
    ctx.roundRect(-CAR_W / 2 - 1, -CAR_H / 2 - 1, CAR_W + 2, CAR_H + 2, 3)
    ctx.fill()
    ctx.shadowBlur = 0
  }

  ctx.restore()
}

function formatTime(ms) {
  if (!ms && ms !== 0) return '--:--.---'
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  const ms3 = ms % 1000
  return `${m}:${String(s).padStart(2, '0')}.${String(ms3).padStart(3, '0')}`
}

export default function GamePage() {
  const canvasRef = useRef(null)
  const offscreenRef = useRef(null)
  const stateRef = useRef({
    x: 450, y: 490, angle: Math.PI, speed: 0,
    keys: {}, lap: 0, lapStart: null, lastLap: null, bestLap: null,
    crossedLine: false, gameStarted: false, finished: false,
  })
  const animRef = useRef(null)

  const [display, setDisplay] = useState({ lap: 0, lastLap: null, bestLap: null, speed: 0 })
  const [gameState, setGameState] = useState('idle') // idle | racing | finished
  const [leaderboard, setLeaderboard] = useState([])
  const [showSubmit, setShowSubmit] = useState(false)
  const [submitName, setSubmitName] = useState('')
  const [submitTime, setSubmitTime] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const fetchLeaderboard = useCallback(async () => {
    try {
      const q = query(collection(db, 'game_leaderboard'), orderBy('time', 'asc'), limit(10))
      const snap = await getDocs(q)
      setLeaderboard(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => { fetchLeaderboard() }, [fetchLeaderboard])

  // Build offscreen collision canvas
  useEffect(() => {
    const oc = document.createElement('canvas')
    oc.width = W; oc.height = H
    const octx = oc.getContext('2d')
    octx.fillStyle = '#000'
    octx.fillRect(0, 0, W, H)
    drawTrack(octx, true)
    offscreenRef.current = oc
  }, [])

  function isOnTrack(x, y) {
    const oc = offscreenRef.current
    if (!oc) return true
    const octx = oc.getContext('2d')
    const px = octx.getImageData(Math.round(x), Math.round(y), 1, 1).data
    return px[0] > 128
  }

  function checkFinishLine(x, y, prevX, prevY, speed) {
    // Finish line roughly at y=505, x between 425 and 620, moving left (angle ~= Math.PI)
    const FL_Y = 505
    const FL_X1 = 425
    const FL_X2 = 620
    if (x >= FL_X1 && x <= FL_X2 && ((prevY > FL_Y && y <= FL_Y) || (prevY < FL_Y && y >= FL_Y))) {
      return speed < 0 // moving in the correct direction (angle ~PI means moving left, y changes from above track)
        ? false
        : true
    }
    return false
  }

  const startGame = useCallback(() => {
    const s = stateRef.current
    s.x = 450; s.y = 490; s.angle = Math.PI; s.speed = 0
    s.lap = 0; s.lapStart = null; s.lastLap = null; s.bestLap = null
    s.crossedLine = false; s.gameStarted = false; s.finished = false
    setGameState('racing')
    setShowSubmit(false)
    setSubmitted(false)
  }, [])

  // Game loop
  useEffect(() => {
    if (gameState !== 'racing') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const onKey = (e, down) => {
      stateRef.current.keys[e.key] = down
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key)) {
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', e => onKey(e, true))
    window.addEventListener('keyup', e => onKey(e, false))

    function loop() {
      const s = stateRef.current
      const { keys } = s

      const throttle = keys['ArrowUp'] || keys['w'] || keys['W']
      const brake = keys['ArrowDown'] || keys['s'] || keys['S']
      const left = keys['ArrowLeft'] || keys['a'] || keys['A']
      const right = keys['ArrowRight'] || keys['d'] || keys['D']

      if (throttle) s.speed += ACCEL
      else if (brake) s.speed -= BRAKE
      s.speed *= FRICTION
      s.speed = Math.max(-1.5, Math.min(MAX_SPEED, s.speed))

      const prevX = s.x
      const prevY = s.y

      if (Math.abs(s.speed) > 0.05) {
        const turnRate = STEER * (Math.abs(s.speed) / MAX_SPEED + 0.3)
        if (left) s.angle -= turnRate
        if (right) s.angle += turnRate
      }

      const newX = s.x + Math.cos(s.angle) * s.speed
      const newY = s.y + Math.sin(s.angle) * s.speed

      // Collision
      if (isOnTrack(newX, newY)) {
        s.x = newX; s.y = newY
      } else {
        s.speed *= -0.3
      }

      // Lap detection — cross finish line going in correct direction (moving left, angle near PI)
      const onLine = s.y > 495 && s.y < 520 && s.x > 425 && s.x < 620
      const movingRight = Math.cos(s.angle) < -0.3 // angle near PI = moving left in canvas coords... wait

      // Start line: car starts at x=450, angle=PI (facing left in screen = towards x=320 direction)
      // Actually angle=PI means cos(PI)=-1, so car moves in -x direction. That's leftward.
      // Finish line check: car crosses y≈510, x in range, coming from bottom (y was > 510, now < 510... wait
      // car starts at y=490 which is above 510. Let me re-check start position.
      // Start pos: x=450, y=490, angle=PI → car moves left
      // Finish line at y=505-515 range, x=430-620 (the checkered area)

      if (!s.gameStarted) {
        // Wait for car to first leave the start box
        if (!(s.x > 425 && s.x < 620 && s.y > 495 && s.y < 525)) {
          s.gameStarted = true
        }
      } else {
        // Detect crossing finish line: car enters the finish zone from outside
        const prevOnLine = prevY > 495 && prevY < 525 && prevX > 425 && prevX < 620
        if (!prevOnLine && onLine) {
          const now = Date.now()
          if (s.lapStart === null) {
            s.lapStart = now
            s.lap = 1
          } else {
            const lapTime = now - s.lapStart
            if (lapTime > 3000) { // debounce
              s.lastLap = lapTime
              if (s.bestLap === null || lapTime < s.bestLap) s.bestLap = lapTime
              s.lap++
              s.lapStart = now

              if (s.lap > 3) {
                s.finished = true
                setGameState('finished')
                setSubmitTime(s.bestLap)
                setShowSubmit(true)
              }
            }
          }
        }
      }

      setDisplay({ lap: s.lap, lastLap: s.lastLap, bestLap: s.bestLap, speed: Math.abs(s.speed) })

      // Draw
      ctx.fillStyle = '#050505'
      ctx.fillRect(0, 0, W, H)

      // Grass texture
      ctx.fillStyle = '#0a1a08'
      ctx.fillRect(0, 0, W, H)

      drawTrack(ctx, false)

      // Lap timer display on track
      if (s.lapStart !== null && !s.finished) {
        const elapsed = Date.now() - s.lapStart
        ctx.save()
        ctx.font = '700 13px "Roboto Mono", monospace'
        ctx.fillStyle = 'rgba(57,255,20,0.7)'
        ctx.fillText(formatTime(elapsed), 10, H - 10)
        ctx.restore()
      }

      drawCar(ctx, s.x, s.y, s.angle, Math.abs(s.speed))

      animRef.current = requestAnimationFrame(loop)
    }

    animRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('keydown', e => onKey(e, true))
      window.removeEventListener('keyup', e => onKey(e, false))
    }
  }, [gameState])

  async function submitScore() {
    if (!submitName.trim() || !submitTime) return
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'game_leaderboard'), {
        name: submitName.trim().slice(0, 24),
        time: submitTime,
        date: serverTimestamp(),
      })
      setSubmitted(true)
      setShowSubmit(false)
      fetchLeaderboard()
    } catch (e) { console.error(e) }
    setSubmitting(false)
  }

  // Touch controls
  const touchRef = useRef({})
  function touchBtn(key, down) {
    stateRef.current.keys[key] = down
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050505', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px 0' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <Link to="/" style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}>← BACK</Link>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text)', margin: 0 }}>
            RACE <span style={{ color: 'var(--primary)' }}>GAME</span>
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>

          {/* Game area */}
          <div style={{ flex: '1 1 600px' }}>
            <div style={{ position: 'relative', border: '1px solid rgba(57,255,20,0.2)', borderRadius: '4px', overflow: 'hidden', background: '#0a1a08' }}>
              <canvas ref={canvasRef} width={W} height={H} style={{ display: 'block', width: '100%', maxWidth: W + 'px' }} />

              {/* HUD overlay */}
              {gameState === 'racing' && (
                <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                  <div style={hudBox}>
                    <span style={hudLabel}>LAP</span>
                    <span style={hudVal}>{display.lap === 0 ? '--' : `${display.lap} / 3`}</span>
                  </div>
                  <div style={hudBox}>
                    <span style={hudLabel}>LAST</span>
                    <span style={hudVal}>{formatTime(display.lastLap)}</span>
                  </div>
                  <div style={hudBox}>
                    <span style={hudLabel}>BEST</span>
                    <span style={{ ...hudVal, color: 'var(--primary)' }}>{formatTime(display.bestLap)}</span>
                  </div>
                  <div style={hudBox}>
                    <span style={hudLabel}>KM/H</span>
                    <span style={hudVal}>{Math.round(display.speed * 62)}</span>
                  </div>
                </div>
              )}

              {/* Idle overlay */}
              {gameState === 'idle' && (
                <div style={overlay}>
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: '40px', fontWeight: 900, letterSpacing: '4px', color: 'var(--primary)', textShadow: '0 0 30px rgba(57,255,20,0.6)', margin: 0 }}>RAPIDLY RL RACING</p>
                  <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '13px', marginTop: '8px' }}>Complete 3 laps · Best lap goes to leaderboard</p>
                  <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '12px', marginTop: '4px' }}>W / ↑ Throttle · S / ↓ Brake · A/D or ← → Steer</p>
                  <button onClick={startGame} style={startBtn}>START RACE</button>
                </div>
              )}

              {/* Finished overlay */}
              {gameState === 'finished' && (
                <div style={overlay}>
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: '36px', fontWeight: 900, letterSpacing: '3px', color: 'var(--primary)', margin: 0 }}>RACE COMPLETE</p>
                  <p style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: '16px', marginTop: '12px' }}>Best lap: <span style={{ color: 'var(--primary)' }}>{formatTime(submitTime)}</span></p>
                  {showSubmit && !submitted && (
                    <div style={{ marginTop: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        value={submitName}
                        onChange={e => setSubmitName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && submitScore()}
                        placeholder="Your name"
                        maxLength={24}
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(57,255,20,0.4)', color: '#fff', padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: '13px', borderRadius: '2px', outline: 'none', width: '160px' }}
                      />
                      <button onClick={submitScore} disabled={submitting || !submitName.trim()} style={{ ...startBtn, marginTop: 0, padding: '8px 18px', fontSize: '13px' }}>
                        {submitting ? '...' : 'SUBMIT'}
                      </button>
                    </div>
                  )}
                  {submitted && <p style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontSize: '13px', marginTop: '12px' }}>Score saved!</p>}
                  <button onClick={startGame} style={{ ...startBtn, marginTop: '14px', background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)', fontSize: '12px', padding: '7px 16px' }}>
                    RACE AGAIN
                  </button>
                </div>
              )}
            </div>

            {/* Touch controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', gap: '8px' }} className="touch-controls">
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onPointerDown={() => touchBtn('a', true)} onPointerUp={() => touchBtn('a', false)} onPointerLeave={() => touchBtn('a', false)} style={touchBtnStyle}>◀</button>
                <button onPointerDown={() => touchBtn('d', true)} onPointerUp={() => touchBtn('d', false)} onPointerLeave={() => touchBtn('d', false)} style={touchBtnStyle}>▶</button>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onPointerDown={() => touchBtn('s', true)} onPointerUp={() => touchBtn('s', false)} onPointerLeave={() => touchBtn('s', false)} style={{ ...touchBtnStyle, color: '#f44' }}>BRAKE</button>
                <button onPointerDown={() => touchBtn('w', true)} onPointerUp={() => touchBtn('w', false)} onPointerLeave={() => touchBtn('w', false)} style={{ ...touchBtnStyle, color: 'var(--primary)', borderColor: 'rgba(57,255,20,0.4)' }}>GAS</button>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div style={{ flex: '1 1 220px', minWidth: '200px' }}>
            <div style={{ border: '1px solid rgba(57,255,20,0.15)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ background: 'rgba(57,255,20,0.08)', padding: '12px 16px', borderBottom: '1px solid rgba(57,255,20,0.12)' }}>
                <p style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--primary)', margin: 0 }}>Leaderboard</p>
                <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '10px', marginTop: '2px' }}>Best lap times</p>
              </div>
              <div style={{ padding: '8px 0' }}>
                {leaderboard.length === 0 && (
                  <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '12px', padding: '16px', textAlign: 'center' }}>No times yet. Be first!</p>
                )}
                {leaderboard.map((entry, i) => (
                  <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--muted)', width: '16px', flexShrink: 0 }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                    </span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: i === 0 ? 'var(--primary)' : 'var(--muted)', flexShrink: 0 }}>{formatTime(entry.time)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        .touch-controls { display: none; }
        @media (max-width: 768px) { .touch-controls { display: flex !important; } }
      `}</style>
    </div>
  )
}

const hudBox = {
  background: 'rgba(0,0,0,0.7)',
  border: '1px solid rgba(57,255,20,0.2)',
  borderRadius: '2px',
  padding: '4px 10px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  minWidth: '80px',
}
const hudLabel = { fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--muted)', letterSpacing: '1px' }
const hudVal = { fontFamily: 'var(--font-mono)', fontSize: '14px', color: '#fff', fontWeight: 700 }
const overlay = {
  position: 'absolute', inset: 0,
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)',
}
const startBtn = {
  marginTop: '22px',
  background: 'var(--primary)', color: '#050505',
  fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 800, letterSpacing: '2px',
  padding: '12px 32px', border: 'none', cursor: 'pointer', borderRadius: '2px',
  textTransform: 'uppercase',
  boxShadow: '0 0 24px rgba(57,255,20,0.4)',
}
const touchBtnStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  fontFamily: 'var(--font-mono)',
  fontSize: '14px',
  padding: '12px 20px',
  borderRadius: '2px',
  cursor: 'pointer',
  userSelect: 'none',
  WebkitUserSelect: 'none',
}
