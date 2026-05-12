import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../firebase.js'
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore'

// ─── constants ────────────────────────────────────────────────────────────────
const CW = 900, CH = 540
const TRACK_HALF = 48
const MAX_SPD = 8
const ACCEL = 0.18
const BRAKE_F = 0.32
const FRICTION = 0.968
const LAT_GRIP = 0.78      // lower = more drift
const STEER_RATE = 0.055
const TOTAL_LAPS = 3

// ─── track centerline (world coords) ─────────────────────────────────────────
// A flowing ~F1-style circuit, designed to be fun to drive
const RAW_TRACK = [
  [1080, 820], [880, 820], [680, 820], [480, 820],
  [320, 780],  [210, 680], [190, 560], [210, 440],
  [290, 340],  [410, 270], [560, 250], [700, 270],
  [820, 340],  [900, 280], [990, 220], [1110, 210],
  [1230, 250], [1320, 360],[1340, 490],[1300, 610],
  [1210, 700], [1150, 760],[1080, 820],
]

// ─── catmull-rom spline sampler ───────────────────────────────────────────────
function sampleCatmull(pts, totalSamples) {
  const n = pts.length - 1
  const out = []
  for (let i = 0; i < n; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(n, i + 2)]
    const steps = Math.ceil(totalSamples / n)
    for (let s = 0; s < steps; s++) {
      const t = s / steps
      const t2 = t * t, t3 = t2 * t
      const x = 0.5 * ((2*p1[0]) + (-p0[0]+p2[0])*t + (2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2 + (-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3)
      const y = 0.5 * ((2*p1[1]) + (-p0[1]+p2[1])*t + (2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2 + (-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)
      out.push([x, y])
    }
  }
  return out
}

const SMOOTH_TRACK = sampleCatmull([...RAW_TRACK, RAW_TRACK[0], RAW_TRACK[1]], 400)
// Waypoints: every 20th sample point
const WAYPOINTS = SMOOTH_TRACK.filter((_, i) => i % 20 === 0)

// ─── nearest point on polyline ────────────────────────────────────────────────
function nearestOnTrack(px, py) {
  let best = Infinity, bx = px, by = py
  for (let i = 0; i < SMOOTH_TRACK.length; i++) {
    const [ax, ay] = SMOOTH_TRACK[i]
    const [bx2, by2] = SMOOTH_TRACK[(i + 1) % SMOOTH_TRACK.length]
    const dx = bx2 - ax, dy = by2 - ay
    const len2 = dx*dx + dy*dy
    if (len2 === 0) continue
    const t = Math.max(0, Math.min(1, ((px - ax)*dx + (py - ay)*dy) / len2))
    const cx = ax + t*dx, cy = ay + t*dy
    const d = Math.hypot(px - cx, py - cy)
    if (d < best) { best = d; bx = cx; by = cy }
  }
  return { dist: best, nx: bx, ny: by }
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function formatTime(ms) {
  if (ms == null) return '--:--.---'
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  const ms3 = ms % 1000
  return `${m}:${String(s).padStart(2,'0')}.${String(ms3).padStart(3,'0')}`
}

// ─── draw functions ───────────────────────────────────────────────────────────
function drawWorld(ctx, carX, carY) {
  // Background (grass)
  ctx.fillStyle = '#0d1a0a'
  ctx.fillRect(-2000, -2000, 6000, 6000)

  // Grass texture dots
  ctx.fillStyle = 'rgba(30,60,20,0.4)'
  for (let gx = -400; gx < 2000; gx += 80) {
    for (let gy = -400; gy < 1400; gy += 80) {
      ctx.fillRect(gx, gy, 1, 1)
    }
  }

  // ── track shadow ──
  ctx.save()
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(SMOOTH_TRACK[0][0], SMOOTH_TRACK[0][1])
  for (const [x,y] of SMOOTH_TRACK) ctx.lineTo(x, y)
  ctx.closePath()
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'
  ctx.lineWidth = TRACK_HALF * 2 + 10
  ctx.stroke()

  // ── kerb (outer) ──
  ctx.beginPath()
  ctx.moveTo(SMOOTH_TRACK[0][0], SMOOTH_TRACK[0][1])
  for (const [x,y] of SMOOTH_TRACK) ctx.lineTo(x, y)
  ctx.closePath()
  ctx.strokeStyle = '#cc2200'
  ctx.lineWidth = TRACK_HALF * 2 + 6
  ctx.stroke()

  // ── kerb white stripes ──
  ctx.setLineDash([22, 22])
  ctx.beginPath()
  ctx.moveTo(SMOOTH_TRACK[0][0], SMOOTH_TRACK[0][1])
  for (const [x,y] of SMOOTH_TRACK) ctx.lineTo(x, y)
  ctx.closePath()
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = TRACK_HALF * 2 + 6
  ctx.stroke()
  ctx.setLineDash([])

  // ── tarmac ──
  ctx.beginPath()
  ctx.moveTo(SMOOTH_TRACK[0][0], SMOOTH_TRACK[0][1])
  for (const [x,y] of SMOOTH_TRACK) ctx.lineTo(x, y)
  ctx.closePath()
  ctx.strokeStyle = '#1c1c1e'
  ctx.lineWidth = TRACK_HALF * 2
  ctx.stroke()

  // ── track surface detail ──
  ctx.beginPath()
  ctx.moveTo(SMOOTH_TRACK[0][0], SMOOTH_TRACK[0][1])
  for (const [x,y] of SMOOTH_TRACK) ctx.lineTo(x, y)
  ctx.closePath()
  ctx.strokeStyle = '#212124'
  ctx.lineWidth = TRACK_HALF * 2 - 4
  ctx.stroke()

  // ── white edge lines ──
  ctx.beginPath()
  ctx.moveTo(SMOOTH_TRACK[0][0], SMOOTH_TRACK[0][1])
  for (const [x,y] of SMOOTH_TRACK) ctx.lineTo(x, y)
  ctx.closePath()
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'
  ctx.lineWidth = TRACK_HALF * 2 - 2
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(SMOOTH_TRACK[0][0], SMOOTH_TRACK[0][1])
  for (const [x,y] of SMOOTH_TRACK) ctx.lineTo(x, y)
  ctx.closePath()
  ctx.strokeStyle = '#1c1c1e'
  ctx.lineWidth = TRACK_HALF * 2 - 6
  ctx.stroke()

  // ── dashed centre line ──
  ctx.save()
  ctx.setLineDash([28, 22])
  ctx.beginPath()
  ctx.moveTo(SMOOTH_TRACK[0][0], SMOOTH_TRACK[0][1])
  for (const [x,y] of SMOOTH_TRACK) ctx.lineTo(x, y)
  ctx.closePath()
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.restore()

  // ── start/finish line ──
  const [sx, sy] = SMOOTH_TRACK[0]
  const [nx, ny] = SMOOTH_TRACK[1]
  const a = Math.atan2(ny - sy, nx - sx) + Math.PI / 2
  ctx.save()
  ctx.translate(sx, sy)
  ctx.rotate(a)
  for (let i = -4; i < 5; i++) {
    ctx.fillStyle = (i % 2 === 0) ? '#fff' : '#111'
    ctx.fillRect(i * 8 - 4, -TRACK_HALF, 8, TRACK_HALF / 2)
    ctx.fillStyle = (i % 2 === 0) ? '#111' : '#fff'
    ctx.fillRect(i * 8 - 4, -TRACK_HALF / 2, 8, TRACK_HALF / 2)
  }
  ctx.restore()

  ctx.restore()
}

function drawCar(ctx, x, y, angle, speed) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)

  // Speed-based glow
  if (speed > 2) {
    ctx.shadowColor = '#39FF14'
    ctx.shadowBlur = 6 + speed * 4
  }

  // Body
  const g = ctx.createLinearGradient(0, -13, 0, 13)
  g.addColorStop(0, '#39FF14')
  g.addColorStop(0.5, '#28cc0e')
  g.addColorStop(1, '#1a8a08')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.roundRect(-7, -13, 14, 26, 3)
  ctx.fill()
  ctx.shadowBlur = 0

  // Cockpit
  ctx.fillStyle = '#060606'
  ctx.beginPath()
  ctx.roundRect(-4, -5, 8, 11, 2)
  ctx.fill()

  // Nose cone
  ctx.fillStyle = '#39FF14'
  ctx.beginPath()
  ctx.moveTo(-3, -13)
  ctx.lineTo(3, -13)
  ctx.lineTo(2, -20)
  ctx.lineTo(-2, -20)
  ctx.closePath()
  ctx.fill()

  // Front wing
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(-10, -14, 20, 3)

  // Rear wing
  ctx.fillStyle = '#111'
  ctx.fillRect(-11, 11, 22, 3)

  // Wheels (4)
  ctx.fillStyle = '#111'
  ;[[-10,-10],[ 6,-10],[-10, 6],[ 6, 6]].forEach(([wx,wy]) => {
    ctx.fillRect(wx, wy, 4, 6)
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 0.5
    ctx.strokeRect(wx, wy, 4, 6)
  })

  ctx.restore()
}

function drawMinimap(ctx, carX, carY, carAngle, lap) {
  const MX = CW - 130, MY = 10, MW = 120, MH = 80
  const WX = 190, WY = 170, WW = 1200, WH = 700

  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,0.75)'
  ctx.strokeStyle = 'rgba(57,255,20,0.3)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(MX - 4, MY - 4, MW + 8, MH + 8, 4)
  ctx.fill(); ctx.stroke()

  ctx.beginPath()
  SMOOTH_TRACK.forEach(([x,y], i) => {
    const mx = MX + ((x - WX) / WW) * MW
    const my = MY + ((y - WY) / WH) * MH
    i === 0 ? ctx.moveTo(mx, my) : ctx.lineTo(mx, my)
  })
  ctx.closePath()
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'
  ctx.lineWidth = 3
  ctx.stroke()

  const cx = MX + ((carX - WX) / WW) * MW
  const cy = MY + ((carY - WY) / WH) * MH
  ctx.fillStyle = '#39FF14'
  ctx.shadowColor = '#39FF14'; ctx.shadowBlur = 6
  ctx.beginPath()
  ctx.arc(cx, cy, 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  ctx.restore()
}

// ─── main component ───────────────────────────────────────────────────────────
export default function GamePage() {
  const canvasRef = useRef(null)
  const gsRef = useRef({
    x: 1080, y: 790, vx: 0, vy: 0, angle: Math.PI,
    camX: 1080, camY: 790,
    keys: {}, lapCount: 0, lapStart: null, lastLap: null, bestLap: null,
    nextWP: 0, wpCooldown: 0, started: false, finished: false,
  })
  const rafRef = useRef(null)

  const [phase, setPhase] = useState('idle')  // idle | racing | done
  const [hud, setHud] = useState({ lap: 0, lastLap: null, bestLap: null, spd: 0, elapsed: 0 })
  const [leaderboard, setLeaderboard] = useState([])
  const [submitName, setSubmitName] = useState('')
  const [submitTime, setSubmitTime] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved] = useState(false)

  const fetchLB = useCallback(async () => {
    try {
      const snap = await getDocs(query(collection(db, 'game_leaderboard'), orderBy('time', 'asc'), limit(10)))
      setLeaderboard(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch {}
  }, [])

  useEffect(() => { fetchLB() }, [fetchLB])

  function resetState() {
    const s = gsRef.current
    s.x = 1080; s.y = 790; s.vx = 0; s.vy = 0; s.angle = Math.PI
    s.camX = 1080; s.camY = 790
    s.lapCount = 0; s.lapStart = null; s.lastLap = null; s.bestLap = null
    s.nextWP = 0; s.wpCooldown = 0; s.started = false; s.finished = false
  }

  function startRace() {
    resetState()
    setSaved(false)
    setSubmitTime(null)
    setSubmitName('')
    setPhase('racing')
  }

  // Key handlers
  useEffect(() => {
    if (phase !== 'racing') return
    const dn = e => {
      gsRef.current.keys[e.key] = true
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'].includes(e.key)) e.preventDefault()
    }
    const up = e => { gsRef.current.keys[e.key] = false }
    window.addEventListener('keydown', dn)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up) }
  }, [phase])

  // Game loop
  useEffect(() => {
    if (phase !== 'racing') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    function tick() {
      const s = gsRef.current
      const k = s.keys
      const thr = k['ArrowUp'] || k['w'] || k['W']
      const brk = k['ArrowDown'] || k['s'] || k['S']
      const lft = k['ArrowLeft'] || k['a'] || k['A']
      const rgt = k['ArrowRight'] || k['d'] || k['D']

      // ── physics ──
      const spd = Math.hypot(s.vx, s.vy)
      const fwd = [Math.cos(s.angle), Math.sin(s.angle)]
      const lat = [-fwd[1], fwd[0]]

      if (thr) { s.vx += fwd[0] * ACCEL; s.vy += fwd[1] * ACCEL }
      if (brk) { s.vx -= fwd[0] * BRAKE_F * 0.5; s.vy -= fwd[1] * BRAKE_F * 0.5 }

      // Friction
      s.vx *= FRICTION; s.vy *= FRICTION

      // Lateral grip (project velocity, dampen sideways component)
      const fwdDot = s.vx * fwd[0] + s.vy * fwd[1]
      const latDot = s.vx * lat[0] + s.vy * lat[1]
      s.vx = fwd[0] * fwdDot + lat[0] * latDot * LAT_GRIP
      s.vy = fwd[1] * fwdDot + lat[1] * latDot * LAT_GRIP

      // Speed cap
      const newSpd = Math.hypot(s.vx, s.vy)
      if (newSpd > MAX_SPD) { s.vx *= MAX_SPD / newSpd; s.vy *= MAX_SPD / newSpd }

      // Steering (speed-dependent)
      const speedFactor = Math.min(1, newSpd / 2)
      if (lft) s.angle -= STEER_RATE * speedFactor
      if (rgt) s.angle += STEER_RATE * speedFactor

      // Move
      const nx = s.x + s.vx
      const ny = s.y + s.vy

      // Collision — push back toward track center
      const { dist, nx: tnx, ny: tny } = nearestOnTrack(nx, ny)
      if (dist > TRACK_HALF) {
        const push = (dist - TRACK_HALF) / dist
        s.x = nx + (tnx - nx) * push * 1.2
        s.y = ny + (tny - ny) * push * 1.2
        // Kill component of velocity pointing away from track
        const outX = (nx - tnx) / dist, outY = (ny - tny) / dist
        const outDot = s.vx * outX + s.vy * outY
        if (outDot > 0) { s.vx -= outDot * outX * 1.4; s.vy -= outDot * outY * 1.4 }
      } else {
        s.x = nx; s.y = ny
      }

      // ── waypoint / lap system ──
      if (s.wpCooldown > 0) s.wpCooldown--
      const wp = WAYPOINTS[s.nextWP]
      if (Math.hypot(s.x - wp[0], s.y - wp[1]) < 60 && s.wpCooldown === 0) {
        s.nextWP = (s.nextWP + 1) % WAYPOINTS.length
        s.wpCooldown = 30
        if (s.nextWP === 0) {
          const now = Date.now()
          if (!s.started) {
            s.started = true
            s.lapStart = now
            s.lapCount = 1
          } else {
            const lapT = now - s.lapStart
            if (lapT > 5000) {
              s.lastLap = lapT
              if (!s.bestLap || lapT < s.bestLap) s.bestLap = lapT
              s.lapStart = now
              s.lapCount++
              if (s.lapCount > TOTAL_LAPS) {
                s.finished = true
                setSubmitTime(s.bestLap)
                setPhase('done')
                return
              }
            }
          }
        }
      }

      // ── camera lerp ──
      s.camX += (s.x - s.camX) * 0.12
      s.camY += (s.y - s.camY) * 0.12

      // ── render ──
      ctx.clearRect(0, 0, CW, CH)
      ctx.save()
      ctx.translate(CW / 2 - s.camX, CH / 2 - s.camY)
      drawWorld(ctx, s.x, s.y)
      drawCar(ctx, s.x, s.y, s.angle, newSpd)
      ctx.restore()

      // Minimap
      drawMinimap(ctx, s.x, s.y, s.angle, s.lapCount)

      setHud({
        lap: s.lapCount,
        lastLap: s.lastLap,
        bestLap: s.bestLap,
        spd: Math.round(newSpd * 55),
        elapsed: s.lapStart ? Date.now() - s.lapStart : 0,
      })

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [phase])

  async function submitScore() {
    if (!submitName.trim() || !submitTime) return
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'game_leaderboard'), {
        name: submitName.trim().slice(0, 24),
        time: submitTime,
        date: serverTimestamp(),
      })
      setSaved(true)
      fetchLB()
    } catch {}
    setSubmitting(false)
  }

  // Touch controls
  function tb(key, down) { gsRef.current.keys[key] = down }

  return (
    <div style={{ minHeight: '100vh', background: '#050505', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '1060px', margin: '0 auto', padding: '28px 20px 0' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <Link to="/" style={{ color: 'var(--muted)', fontSize: '12px', fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}>← BACK</Link>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text)', margin: 0 }}>
            RACE <span style={{ color: 'var(--primary)' }}>GAME</span>
          </h1>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '1px' }}>W/↑ throttle · S/↓ brake · A/D or ←/→ steer · {TOTAL_LAPS} laps</span>
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>

          {/* Canvas */}
          <div style={{ flex: '1 1 580px', position: 'relative' }}>
            <div style={{ position: 'relative', border: '1px solid rgba(57,255,20,0.2)', borderRadius: '4px', overflow: 'hidden' }}>
              <canvas ref={canvasRef} width={CW} height={CH} style={{ display: 'block', width: '100%', background: '#0d1a0a' }} />

              {/* Racing HUD */}
              {phase === 'racing' && (
                <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={hb}><span style={hl}>LAP</span><span style={hv}>{hud.lap === 0 ? '--' : `${hud.lap} / ${TOTAL_LAPS}`}</span></div>
                  <div style={hb}><span style={hl}>TIME</span><span style={hv}>{formatTime(hud.elapsed)}</span></div>
                  <div style={hb}><span style={hl}>LAST</span><span style={hv}>{formatTime(hud.lastLap)}</span></div>
                  <div style={hb}><span style={hl}>BEST</span><span style={{ ...hv, color: 'var(--primary)' }}>{formatTime(hud.bestLap)}</span></div>
                  <div style={{ ...hb, minWidth: '70px' }}><span style={hl}>KM/H</span><span style={hv}>{hud.spd}</span></div>
                </div>
              )}

              {/* Idle */}
              {phase === 'idle' && (
                <div style={overlayStyle}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '42px', fontWeight: 900, letterSpacing: '4px', color: 'var(--primary)', textShadow: '0 0 40px rgba(57,255,20,0.6)', textTransform: 'uppercase' }}>RAPIDLY RL</div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, letterSpacing: '3px', color: 'var(--text)', textTransform: 'uppercase', marginTop: '4px' }}>Racing Game</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', marginTop: '12px', textAlign: 'center', lineHeight: 1.8 }}>
                    Complete {TOTAL_LAPS} laps · Best lap time goes to the leaderboard<br/>
                    W/↑ Throttle &nbsp;·&nbsp; S/↓ Brake &nbsp;·&nbsp; A/D or ←/→ Steer
                  </div>
                  <button onClick={startRace} style={bigBtn}>START RACE</button>
                </div>
              )}

              {/* Done */}
              {phase === 'done' && (
                <div style={overlayStyle}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '38px', fontWeight: 900, letterSpacing: '3px', color: 'var(--primary)', textTransform: 'uppercase' }}>RACE COMPLETE</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--text)', marginTop: '12px' }}>
                    Best lap: <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{formatTime(submitTime)}</span>
                  </div>
                  {!saved ? (
                    <div style={{ marginTop: '18px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                      <input value={submitName} onChange={e => setSubmitName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && submitScore()}
                        placeholder="Enter your name"
                        maxLength={24}
                        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(57,255,20,0.4)', color: '#fff', padding: '9px 14px', fontFamily: 'var(--font-mono)', fontSize: '13px', borderRadius: '2px', outline: 'none', width: '180px' }}
                      />
                      <button onClick={submitScore} disabled={submitting || !submitName.trim()} style={{ ...bigBtn, marginTop: 0, padding: '9px 20px', fontSize: '13px', opacity: submitName.trim() ? 1 : 0.4 }}>
                        {submitting ? '...' : 'SUBMIT'}
                      </button>
                    </div>
                  ) : (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--primary)', marginTop: '14px' }}>Score saved to leaderboard!</div>
                  )}
                  <button onClick={startRace} style={{ ...bigBtn, marginTop: '14px', background: 'transparent', color: 'var(--muted)', border: '1px solid rgba(255,255,255,0.12)', fontSize: '12px', padding: '8px 20px', boxShadow: 'none' }}>RACE AGAIN</button>
                </div>
              )}
            </div>

            {/* Touch controls */}
            <div className="game-touch" style={{ display: 'none', justifyContent: 'space-between', marginTop: '10px', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onPointerDown={() => tb('a',true)} onPointerUp={() => tb('a',false)} onPointerLeave={() => tb('a',false)} style={tBtn}>◀</button>
                <button onPointerDown={() => tb('d',true)} onPointerUp={() => tb('d',false)} onPointerLeave={() => tb('d',false)} style={tBtn}>▶</button>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onPointerDown={() => tb('s',true)} onPointerUp={() => tb('s',false)} onPointerLeave={() => tb('s',false)} style={{ ...tBtn, color: '#f55' }}>BRAKE</button>
                <button onPointerDown={() => tb('w',true)} onPointerUp={() => tb('w',false)} onPointerLeave={() => tb('w',false)} style={{ ...tBtn, color: 'var(--primary)', borderColor: 'rgba(57,255,20,0.4)' }}>GAS</button>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div style={{ flex: '0 0 200px', minWidth: '180px' }}>
            <div style={{ border: '1px solid rgba(57,255,20,0.15)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ background: 'rgba(57,255,20,0.07)', padding: '10px 14px', borderBottom: '1px solid rgba(57,255,20,0.1)' }}>
                <p style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--primary)', margin: 0 }}>Leaderboard</p>
                <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '10px', marginTop: '2px' }}>Best lap times</p>
              </div>
              <div>
                {leaderboard.length === 0 && (
                  <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '16px', textAlign: 'center' }}>No times yet.<br/>Be first!</p>
                )}
                {leaderboard.map((e, i) => (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: i===0?'#FFD700':i===1?'#C0C0C0':i===2?'#CD7F32':'var(--muted)', width: '18px', flexShrink: 0, textAlign: 'center' }}>
                      {i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}.`}
                    </span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: i===0?'var(--primary)':'var(--muted)', flexShrink: 0 }}>{formatTime(e.time)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`@media(max-width:768px){.game-touch{display:flex!important}}`}</style>
    </div>
  )
}

// ─── style constants ──────────────────────────────────────────────────────────
const hb = { background: 'rgba(0,0,0,0.72)', border: '1px solid rgba(57,255,20,0.18)', borderRadius: '2px', padding: '3px 8px', display: 'flex', flexDirection: 'column', minWidth: '76px' }
const hl = { fontFamily: 'var(--font-mono)', fontSize: '8px', color: 'var(--muted)', letterSpacing: '1.5px' }
const hv = { fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#fff', fontWeight: 700 }
const overlayStyle = { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)' }
const bigBtn = { marginTop: '24px', background: 'var(--primary)', color: '#050505', fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 800, letterSpacing: '2px', padding: '13px 36px', border: 'none', cursor: 'pointer', borderRadius: '2px', textTransform: 'uppercase', boxShadow: '0 0 28px rgba(57,255,20,0.45)' }
const tBtn = { background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: '14px', padding: '12px 22px', borderRadius: '2px', cursor: 'pointer', userSelect: 'none', WebkitUserSelect: 'none' }
