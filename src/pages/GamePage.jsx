import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../firebase.js'
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore'

// ─── canvas size ──────────────────────────────────────────────────────────────
const CW = 900, CH = 540

// ─── physics ──────────────────────────────────────────────────────────────────
const TRACK_HALF = 46
const MAX_SPD = 9
const ACCEL = 0.20
const BRAKE_F = 0.30
const FRICTION = 0.970
const LAT_GRIP = 0.80
const STEER_RATE = 0.052
const TOTAL_LAPS = 3

// ─── tracks ───────────────────────────────────────────────────────────────────
const TRACKS = {
  monaco: {
    name: 'Monaco',
    flag: '🇲🇨',
    subtitle: 'Circuit de Monaco',
    accentColor: '#e91e63',
    points: [
      [900,760],[780,760],[650,760],[530,760],
      [420,745],[330,690],[280,610],
      [270,530],[285,455],[330,395],
      [400,350],[490,325],[590,320],[680,325],
      [750,360],[785,430],[780,510],
      [755,580],[700,615],[645,600],
      [615,545],[610,480],[635,415],[680,375],
      [740,330],[810,305],[890,300],[970,310],
      [1040,340],[1100,395],[1130,460],
      [1110,520],[1065,545],[1030,530],[1050,580],[1090,595],
      [1130,640],[1110,700],[1050,740],
      [990,760],[940,760],[900,760],
    ],
  },
  silverstone: {
    name: 'Silverstone',
    flag: '🇬🇧',
    subtitle: 'British Grand Prix',
    accentColor: '#2196f3',
    points: [
      [950,730],[800,730],[650,730],[500,730],
      [370,710],[270,645],[240,550],
      [255,455],[310,375],[390,325],
      [480,310],[560,330],[610,295],[660,250],
      [750,230],[860,225],[980,235],[1080,255],
      [1170,310],[1220,400],[1210,490],
      [1175,570],[1130,635],[1085,690],
      [1030,730],[990,740],[950,730],
    ],
  },
  suzuka: {
    name: 'Suzuka',
    flag: '🇯🇵',
    subtitle: 'Japanese Grand Prix',
    accentColor: '#ff9800',
    points: [
      [980,760],[840,760],[700,760],[560,760],
      [430,740],[330,670],[280,570],[280,460],
      [300,370],[360,300],[440,270],
      [510,265],[560,220],[510,180],[440,175],
      [360,195],[290,250],[260,340],
      [270,430],[310,500],[380,530],
      [450,545],[490,500],[480,435],
      [450,370],[460,305],[520,270],
      [600,275],[680,310],[750,370],
      [820,420],[880,500],[910,590],
      [900,670],[865,730],[900,760],[980,760],
    ],
  },
}

// ─── catmull-rom sampler ──────────────────────────────────────────────────────
function buildSmooth(rawPts, samples = 500) {
  const pts = [...rawPts, rawPts[0], rawPts[1], rawPts[2]]
  const n = rawPts.length
  const out = []
  for (let i = 0; i < n; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const steps = Math.ceil(samples / n)
    for (let s = 0; s < steps; s++) {
      const t = s / steps, t2 = t*t, t3 = t2*t
      out.push([
        0.5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),
        0.5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3),
      ])
    }
  }
  return out
}

// ─── nearest point on polyline ────────────────────────────────────────────────
function nearestOnPoly(pts, px, py) {
  let best = Infinity, bx = px, by = py
  const n = pts.length
  for (let i = 0; i < n; i++) {
    const [ax,ay] = pts[i]
    const [bx2,by2] = pts[(i+1)%n]
    const dx = bx2-ax, dy = by2-ay
    const len2 = dx*dx+dy*dy
    if (len2 === 0) continue
    const t = Math.max(0, Math.min(1, ((px-ax)*dx+(py-ay)*dy)/len2))
    const cx = ax+t*dx, cy = ay+t*dy
    const d = Math.hypot(px-cx, py-cy)
    if (d < best) { best = d; bx = cx; by = cy }
  }
  return { dist: best, cx: bx, cy: by }
}

// ─── segment intersection ────────────────────────────────────────────────────
function segIntersect(ax,ay,bx,by,cx,cy,dx,dy) {
  const d1x=bx-ax,d1y=by-ay,d2x=dx-cx,d2y=dy-cy
  const denom=d1x*d2y-d1y*d2x
  if (Math.abs(denom)<0.001) return false
  const t=((cx-ax)*d2y-(cy-ay)*d2x)/denom
  const u=((cx-ax)*d1y-(cy-ay)*d1x)/denom
  return t>0&&t<=1&&u>=0&&u<=1
}

// ─── build finish line segment ────────────────────────────────────────────────
function buildFinishLine(smooth) {
  const [x0,y0] = smooth[0]
  const [x1,y1] = smooth[2]
  const dx=x1-x0, dy=y1-y0, len=Math.hypot(dx,dy)
  const nx=-dy/len, ny=dx/len
  const w = TRACK_HALF*1.1
  return { lx1:x0+nx*w, ly1:y0+ny*w, lx2:x0-nx*w, ly2:y0-ny*w, dirX:dx/len, dirY:dy/len }
}

// ─── format time ─────────────────────────────────────────────────────────────
function fmt(ms) {
  if (ms==null) return '--:--.---'
  return `${Math.floor(ms/60000)}:${String(Math.floor((ms%60000)/1000)).padStart(2,'0')}.${String(ms%1000).padStart(3,'0')}`
}

// ─── track renderer ───────────────────────────────────────────────────────────
function renderTrack(ctx, smooth, accentColor, fl) {
  ctx.save()
  ctx.lineCap='round'; ctx.lineJoin='round'

  // Shadow
  ctx.beginPath(); smooth.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.closePath()
  ctx.strokeStyle='rgba(0,0,0,0.6)'; ctx.lineWidth=TRACK_HALF*2+14; ctx.stroke()

  // Red kerb
  ctx.beginPath(); smooth.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.closePath()
  ctx.strokeStyle='#cc1100'; ctx.lineWidth=TRACK_HALF*2+8; ctx.stroke()

  // White kerb stripes
  ctx.setLineDash([18,18])
  ctx.beginPath(); smooth.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.closePath()
  ctx.strokeStyle='#ffffff'; ctx.lineWidth=TRACK_HALF*2+8; ctx.stroke()
  ctx.setLineDash([])

  // Tarmac base
  ctx.beginPath(); smooth.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.closePath()
  ctx.strokeStyle='#1a1a1d'; ctx.lineWidth=TRACK_HALF*2; ctx.stroke()

  // Tarmac highlight
  ctx.beginPath(); smooth.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.closePath()
  ctx.strokeStyle='#202025'; ctx.lineWidth=TRACK_HALF*2-6; ctx.stroke()

  // White edge lines
  ctx.beginPath(); smooth.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.closePath()
  ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=TRACK_HALF*2-2; ctx.stroke()
  ctx.beginPath(); smooth.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.closePath()
  ctx.strokeStyle='#1a1a1d'; ctx.lineWidth=TRACK_HALF*2-8; ctx.stroke()

  // Dashed centre
  ctx.save(); ctx.setLineDash([24,20])
  ctx.beginPath(); smooth.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.closePath()
  ctx.strokeStyle='rgba(255,255,255,0.09)'; ctx.lineWidth=1.5; ctx.stroke()
  ctx.restore()

  // Start/finish line
  const [sx,sy]=smooth[0], [nx2,ny2]=smooth[2]
  const da=Math.atan2(ny2-sy,nx2-sx)+Math.PI/2
  ctx.save(); ctx.translate(sx,sy); ctx.rotate(da)
  for(let i=-5;i<6;i++){
    ctx.fillStyle=(i%2===0)?'#fff':'#111'
    ctx.fillRect(i*8-4,-TRACK_HALF,8,TRACK_HALF/2)
    ctx.fillStyle=(i%2===0)?'#111':'#fff'
    ctx.fillRect(i*8-4,-TRACK_HALF/2,8,TRACK_HALF/2)
  }
  ctx.restore()
  ctx.restore()
}

// ─── car renderer ─────────────────────────────────────────────────────────────
function renderCar(ctx, x, y, angle, spd) {
  ctx.save()
  ctx.translate(x, y)
  // +PI/2 offset so nose faces direction of travel
  ctx.rotate(angle + Math.PI/2)

  if(spd>1.5){ctx.shadowColor='#39FF14';ctx.shadowBlur=5+spd*3}

  // Body
  const g=ctx.createLinearGradient(0,-14,0,14)
  g.addColorStop(0,'#39FF14'); g.addColorStop(0.5,'#28cc0e'); g.addColorStop(1,'#1a8a08')
  ctx.fillStyle=g
  ctx.beginPath(); ctx.roundRect(-7,-14,14,28,3); ctx.fill()
  ctx.shadowBlur=0

  // Cockpit
  ctx.fillStyle='#050505'; ctx.beginPath(); ctx.roundRect(-4,-5,8,12,2); ctx.fill()

  // Nose
  ctx.fillStyle='#39FF14'
  ctx.beginPath(); ctx.moveTo(-3,-14); ctx.lineTo(3,-14); ctx.lineTo(2,-22); ctx.lineTo(-2,-22); ctx.closePath(); ctx.fill()

  // Wings
  ctx.fillStyle='#111'; ctx.fillRect(-11,10,22,3)  // rear
  ctx.fillStyle='#111'; ctx.fillRect(-10,-15,20,2.5) // front

  // Wheels
  ctx.fillStyle='#0a0a0a'
  ;[[-11,-10],[7,-10],[-11,7],[7,7]].forEach(([wx,wy])=>{
    ctx.fillRect(wx,wy,4,7)
    ctx.strokeStyle='#2a2a2a'; ctx.lineWidth=0.8; ctx.strokeRect(wx,wy,4,7)
  })

  ctx.restore()
}

// ─── minimap ─────────────────────────────────────────────────────────────────
function renderMinimap(ctx, smooth, carX, carY, accentColor) {
  // Compute bounding box of track
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity
  smooth.forEach(([x,y])=>{if(x<minX)minX=x;if(y<minY)minY=y;if(x>maxX)maxX=x;if(y>maxY)maxY=y})
  const tw=maxX-minX, th=maxY-minY
  const MW=110, MH=Math.round(MW*th/tw)||70
  const MX=CW-MW-10, MY=10
  const scX=(p)=>MX+(p-minX)/tw*MW
  const scY=(p)=>MY+(p-minY)/th*MH

  ctx.save()
  ctx.fillStyle='rgba(0,0,0,0.72)'; ctx.strokeStyle='rgba(255,255,255,0.1)'
  ctx.lineWidth=1; ctx.beginPath(); ctx.roundRect(MX-4,MY-4,MW+8,MH+8,3); ctx.fill(); ctx.stroke()

  ctx.beginPath()
  smooth.forEach(([x,y],i)=>i?ctx.lineTo(scX(x),scY(y)):ctx.moveTo(scX(x),scY(y)))
  ctx.closePath()
  ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=3; ctx.stroke()

  const cx=scX(carX), cy=scY(carY)
  ctx.fillStyle=accentColor; ctx.shadowColor=accentColor; ctx.shadowBlur=5
  ctx.beginPath(); ctx.arc(cx,cy,3,0,Math.PI*2); ctx.fill()
  ctx.shadowBlur=0
  ctx.restore()
}

// ─── main component ───────────────────────────────────────────────────────────
export default function GamePage() {
  const canvasRef = useRef(null)
  const stRef = useRef(null)          // smooth track cache
  const flRef = useRef(null)          // finish line cache
  const gsRef = useRef({
    x:0,y:0,vx:0,vy:0,angle:0,
    camX:0,camY:0,
    keys:{},
    lapCount:0, lapStart:null, lastLap:null, bestLap:null,
    lastCrossY:null, crossCooldown:0,
    started:false, finished:false,
    prevX:0, prevY:0,
  })
  const rafRef = useRef(null)

  const [phase, setPhase] = useState('select')
  const [trackId, setTrackId] = useState(null)
  const [hud, setHud] = useState({lap:0,lastLap:null,bestLap:null,spd:0,elapsed:0})
  const [leaderboard, setLeaderboard] = useState([])
  const [submitName, setSubmitName] = useState('')
  const [submitTime, setSubmitTime] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved] = useState(false)

  const fetchLB = useCallback(async (tid) => {
    if (!tid) return
    try {
      const snap = await getDocs(query(collection(db,`game_lb_${tid}`),orderBy('time','asc'),limit(10)))
      setLeaderboard(snap.docs.map(d=>({id:d.id,...d.data()})))
    } catch {}
  },[])

  useEffect(()=>{if(trackId) fetchLB(trackId)},[trackId,fetchLB])

  function initTrack(tid) {
    const track = TRACKS[tid]
    const smooth = buildSmooth(track.points)
    stRef.current = smooth
    flRef.current = buildFinishLine(smooth)

    // Starting angle from track direction
    const [x0,y0]=smooth[0], [x1,y1]=smooth[3]
    const startAngle = Math.atan2(y1-y0, x1-x0)

    const s = gsRef.current
    s.x=smooth[0][0]; s.y=smooth[0][1]-8
    s.vx=0; s.vy=0; s.angle=startAngle
    s.camX=s.x; s.camY=s.y
    s.lapCount=0; s.lapStart=null; s.lastLap=null; s.bestLap=null
    s.crossCooldown=120; s.started=false; s.finished=false
    s.prevX=s.x; s.prevY=s.y
  }

  function startRace(tid) {
    setTrackId(tid)
    initTrack(tid)
    setSaved(false); setSubmitTime(null); setSubmitName('')
    setPhase('racing')
    fetchLB(tid)
  }

  function restartRace() {
    initTrack(trackId)
    setSaved(false); setSubmitTime(null); setSubmitName('')
    setPhase('racing')
  }

  // Keys
  useEffect(()=>{
    if(phase!=='racing') return
    const dn=e=>{
      gsRef.current.keys[e.key]=true
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key)) e.preventDefault()
    }
    const up=e=>{ gsRef.current.keys[e.key]=false }
    window.addEventListener('keydown',dn); window.addEventListener('keyup',up)
    return()=>{ window.removeEventListener('keydown',dn); window.removeEventListener('keyup',up) }
  },[phase])

  // Game loop
  useEffect(()=>{
    if(phase!=='racing') return
    const canvas=canvasRef.current; if(!canvas) return
    const ctx=canvas.getContext('2d')
    const track=TRACKS[trackId]
    const smooth=stRef.current
    const fl=flRef.current

    function tick(){
      const s=gsRef.current; const k=s.keys
      const thr=k['ArrowUp']||k['w']||k['W']
      const brk=k['ArrowDown']||k['s']||k['S']
      const lft=k['ArrowLeft']||k['a']||k['A']
      const rgt=k['ArrowRight']||k['d']||k['D']

      // Physics
      const fwd=[Math.cos(s.angle),Math.sin(s.angle)]
      const lat=[-fwd[1],fwd[0]]
      if(thr){s.vx+=fwd[0]*ACCEL; s.vy+=fwd[1]*ACCEL}
      if(brk){s.vx-=fwd[0]*BRAKE_F*0.6; s.vy-=fwd[1]*BRAKE_F*0.6}
      s.vx*=FRICTION; s.vy*=FRICTION

      // Lateral grip
      const fDot=s.vx*fwd[0]+s.vy*fwd[1]
      const lDot=s.vx*lat[0]+s.vy*lat[1]
      s.vx=fwd[0]*fDot+lat[0]*lDot*LAT_GRIP
      s.vy=fwd[1]*fDot+lat[1]*lDot*LAT_GRIP

      const spd=Math.hypot(s.vx,s.vy)
      if(spd>MAX_SPD){s.vx*=MAX_SPD/spd; s.vy*=MAX_SPD/spd}

      // Steering
      if(spd>0.3){
        const sf=Math.min(1,spd/3)
        if(lft) s.angle-=STEER_RATE*sf
        if(rgt) s.angle+=STEER_RATE*sf
      }

      const nx=s.x+s.vx, ny=s.y+s.vy
      const {dist,cx:tcx,cy:tcy}=nearestOnPoly(smooth,nx,ny)
      if(dist>TRACK_HALF){
        const push=(dist-TRACK_HALF)/dist
        s.x=nx+(tcx-nx)*push*1.3; s.y=ny+(tcy-ny)*push*1.3
        const ox=(nx-tcx)/dist, oy=(ny-tcy)/dist
        const od=s.vx*ox+s.vy*oy
        if(od>0){s.vx-=od*ox*1.5; s.vy-=od*oy*1.5}
      } else { s.x=nx; s.y=ny }

      // Finish line crossing
      if(s.crossCooldown>0) s.crossCooldown--
      if(s.crossCooldown===0 && segIntersect(s.prevX,s.prevY,s.x,s.y,fl.lx1,fl.ly1,fl.lx2,fl.ly2)){
        // Check going correct direction
        const mvdot=(s.x-s.prevX)*fl.dirX+(s.y-s.prevY)*fl.dirY
        if(mvdot>0){
          const now=Date.now()
          if(!s.started){
            s.started=true; s.lapStart=now; s.lapCount=1
          } else {
            const lapT=now-s.lapStart
            if(lapT>4000){
              s.lastLap=lapT
              if(!s.bestLap||lapT<s.bestLap) s.bestLap=lapT
              s.lapCount++; s.lapStart=now
              if(s.lapCount>TOTAL_LAPS){
                s.finished=true
                setSubmitTime(s.bestLap)
                setPhase('done')
                return
              }
            }
          }
          s.crossCooldown=90
        }
      }
      s.prevX=s.x; s.prevY=s.y

      // Camera lerp
      s.camX+=(s.x-s.camX)*0.1; s.camY+=(s.y-s.camY)*0.1

      // ── Render ──
      ctx.clearRect(0,0,CW,CH)

      // Background
      ctx.fillStyle='#0c1a09'
      ctx.fillRect(0,0,CW,CH)

      // Grass grid pattern
      ctx.save()
      ctx.translate(CW/2-s.camX,CH/2-s.camY)
      const gSize=80
      const offX=(-s.camX%gSize+gSize)%gSize
      const offY=(-s.camY%gSize+gSize)%gSize
      ctx.strokeStyle='rgba(255,255,255,0.02)'; ctx.lineWidth=0.5
      for(let gx=-gSize+offX-CW;gx<CW*2;gx+=gSize){ctx.beginPath();ctx.moveTo(gx,-CH);ctx.lineTo(gx,CH*2);ctx.stroke()}
      for(let gy=-gSize+offY-CH;gy<CH*2;gy+=gSize){ctx.beginPath();ctx.moveTo(-CW,gy);ctx.lineTo(CW*2,gy);ctx.stroke()}

      renderTrack(ctx, smooth, track.accentColor, fl)
      renderCar(ctx, s.x, s.y, s.angle, spd)
      ctx.restore()

      // Vignette
      const vig=ctx.createRadialGradient(CW/2,CH/2,CW*0.3,CW/2,CH/2,CW*0.75)
      vig.addColorStop(0,'rgba(0,0,0,0)'); vig.addColorStop(1,'rgba(0,0,0,0.45)')
      ctx.fillStyle=vig; ctx.fillRect(0,0,CW,CH)

      // Minimap
      renderMinimap(ctx, smooth, s.x, s.y, track.accentColor)

      // Speed lines when fast
      if(spd>5){
        ctx.save()
        ctx.globalAlpha=(spd-5)/(MAX_SPD-5)*0.15
        for(let i=0;i<6;i++){
          const ly=Math.random()*CH
          ctx.strokeStyle='#fff'; ctx.lineWidth=0.5
          ctx.beginPath(); ctx.moveTo(0,ly); ctx.lineTo(CW*0.4,ly); ctx.stroke()
        }
        ctx.restore()
      }

      setHud({lap:s.lapCount,lastLap:s.lastLap,bestLap:s.bestLap,
        spd:Math.round(spd*52),elapsed:s.lapStart?Date.now()-s.lapStart:0})

      rafRef.current=requestAnimationFrame(tick)
    }

    rafRef.current=requestAnimationFrame(tick)
    return()=>cancelAnimationFrame(rafRef.current)
  },[phase,trackId])

  async function submitScore(){
    if(!submitName.trim()||!submitTime) return
    setSubmitting(true)
    try {
      await addDoc(collection(db,`game_lb_${trackId}`),{
        name:submitName.trim().slice(0,24), time:submitTime, date:serverTimestamp()
      })
      setSaved(true); fetchLB(trackId)
    } catch{}
    setSubmitting(false)
  }

  function tb(key,down){gsRef.current.keys[key]=down}

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div style={{minHeight:'100vh',background:'#050505',paddingBottom:'80px'}}>
      <div style={{maxWidth:'1060px',margin:'0 auto',padding:'24px 20px 0'}}>

        <div style={{display:'flex',alignItems:'center',gap:'16px',marginBottom:'20px'}}>
          <Link to="/" style={{color:'var(--muted)',fontSize:'12px',fontFamily:'var(--font-mono)',letterSpacing:'1px'}}>← BACK</Link>
          <h1 style={{fontFamily:'var(--font-heading)',fontSize:'24px',fontWeight:900,letterSpacing:'2px',textTransform:'uppercase',color:'var(--text)',margin:0}}>
            RAPIDLY RL <span style={{color:'var(--primary)'}}>RACING</span>
          </h1>
          {phase==='racing' && (
            <span style={{fontFamily:'var(--font-mono)',fontSize:'10px',color:'var(--muted)',marginLeft:'auto'}}>
              W/↑ gas · S/↓ brake · A/D steer
            </span>
          )}
        </div>

        <div style={{display:'flex',gap:'16px',flexWrap:'wrap'}}>

          {/* Canvas + overlays */}
          <div style={{flex:'1 1 580px'}}>
            <div style={{position:'relative',border:`1px solid rgba(255,255,255,0.1)`,borderRadius:'4px',overflow:'hidden',background:'#0c1a09'}}>
              <canvas ref={canvasRef} width={CW} height={CH} style={{display:'block',width:'100%'}}/>

              {/* HUD */}
              {phase==='racing' && (
                <div style={{position:'absolute',top:10,left:10,display:'flex',flexDirection:'column',gap:'4px'}}>
                  <HudBox label="LAP" val={gsRef.current.lapCount===0?'--':`${Math.min(gsRef.current.lapCount,TOTAL_LAPS)} / ${TOTAL_LAPS}`} />
                  <HudBox label="TIME" val={fmt(hud.elapsed)} />
                  <HudBox label="LAST" val={fmt(hud.lastLap)} />
                  <HudBox label="BEST" val={fmt(hud.bestLap)} green />
                  <HudBox label="KM/H" val={hud.spd} />
                </div>
              )}

              {/* Track select */}
              {phase==='select' && (
                <div style={overlayS}>
                  <div style={{fontFamily:'var(--font-heading)',fontSize:'40px',fontWeight:900,letterSpacing:'4px',color:'var(--primary)',textShadow:'0 0 40px rgba(57,255,20,0.5)',textTransform:'uppercase'}}>RACE GAME</div>
                  <div style={{fontFamily:'var(--font-mono)',fontSize:'11px',color:'var(--muted)',marginTop:'6px'}}>Select a circuit · {TOTAL_LAPS} laps · Best lap to leaderboard</div>
                  <div style={{display:'flex',gap:'12px',marginTop:'28px',flexWrap:'wrap',justifyContent:'center'}}>
                    {Object.entries(TRACKS).map(([tid,t])=>(
                      <button key={tid} onClick={()=>startRace(tid)} style={{
                        background:'rgba(255,255,255,0.04)', border:`2px solid ${t.accentColor}40`,
                        color:'var(--text)', fontFamily:'var(--font-heading)', fontWeight:700,
                        padding:'18px 24px', cursor:'pointer', borderRadius:'4px',
                        display:'flex',flexDirection:'column',alignItems:'center',gap:'6px',
                        transition:'all 0.2s', minWidth:'140px',
                      }}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor=t.accentColor;e.currentTarget.style.background=`${t.accentColor}15`}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor=`${t.accentColor}40`;e.currentTarget.style.background='rgba(255,255,255,0.04)'}}
                      >
                        <span style={{fontSize:'28px'}}>{t.flag}</span>
                        <span style={{fontSize:'16px',letterSpacing:'2px'}}>{t.name.toUpperCase()}</span>
                        <span style={{fontSize:'10px',color:'var(--muted)',fontFamily:'var(--font-mono)',letterSpacing:'1px',fontWeight:400}}>{t.subtitle}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Done */}
              {phase==='done' && (
                <div style={overlayS}>
                  <div style={{fontFamily:'var(--font-heading)',fontSize:'36px',fontWeight:900,letterSpacing:'3px',color:'var(--primary)',textTransform:'uppercase'}}>RACE COMPLETE</div>
                  <div style={{fontFamily:'var(--font-heading)',fontSize:'16px',color:'var(--muted)',marginTop:'4px',letterSpacing:'2px'}}>
                    {TRACKS[trackId]?.flag} {TRACKS[trackId]?.name}
                  </div>
                  <div style={{fontFamily:'var(--font-mono)',fontSize:'16px',color:'var(--text)',marginTop:'16px'}}>
                    Best lap: <span style={{color:'var(--primary)',fontWeight:700}}>{fmt(submitTime)}</span>
                  </div>
                  {!saved?(
                    <div style={{marginTop:'18px',display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap',justifyContent:'center'}}>
                      <input value={submitName} onChange={e=>setSubmitName(e.target.value)}
                        onKeyDown={e=>e.key==='Enter'&&submitScore()}
                        placeholder="Your name" maxLength={24}
                        style={{background:'rgba(255,255,255,0.07)',border:'1px solid rgba(57,255,20,0.4)',color:'#fff',padding:'9px 14px',fontFamily:'var(--font-mono)',fontSize:'13px',borderRadius:'2px',outline:'none',width:'180px'}}
                      />
                      <button onClick={submitScore} disabled={submitting||!submitName.trim()} style={{...bigBtn,marginTop:0,padding:'9px 20px',fontSize:'13px',opacity:submitName.trim()?1:0.4}}>
                        {submitting?'...':'SUBMIT'}
                      </button>
                    </div>
                  ):(
                    <div style={{fontFamily:'var(--font-mono)',fontSize:'13px',color:'var(--primary)',marginTop:'14px'}}>Saved to leaderboard!</div>
                  )}
                  <div style={{display:'flex',gap:'10px',marginTop:'16px',flexWrap:'wrap',justifyContent:'center'}}>
                    <button onClick={restartRace} style={{...bigBtn,background:'transparent',color:'var(--text)',border:'1px solid rgba(255,255,255,0.15)',fontSize:'12px',padding:'8px 18px',boxShadow:'none',marginTop:0}}>
                      RACE AGAIN
                    </button>
                    <button onClick={()=>setPhase('select')} style={{...bigBtn,background:'transparent',color:'var(--muted)',border:'1px solid rgba(255,255,255,0.08)',fontSize:'12px',padding:'8px 18px',boxShadow:'none',marginTop:0}}>
                      CHANGE TRACK
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Touch */}
            <div className="game-touch" style={{display:'none',justifyContent:'space-between',marginTop:'10px',gap:'8px'}}>
              <div style={{display:'flex',gap:'8px'}}>
                <button onPointerDown={()=>tb('a',true)} onPointerUp={()=>tb('a',false)} onPointerLeave={()=>tb('a',false)} style={tBtn}>◀</button>
                <button onPointerDown={()=>tb('d',true)} onPointerUp={()=>tb('d',false)} onPointerLeave={()=>tb('d',false)} style={tBtn}>▶</button>
              </div>
              <div style={{display:'flex',gap:'8px'}}>
                <button onPointerDown={()=>tb('s',true)} onPointerUp={()=>tb('s',false)} onPointerLeave={()=>tb('s',false)} style={{...tBtn,color:'#f55'}}>BRAKE</button>
                <button onPointerDown={()=>tb('w',true)} onPointerUp={()=>tb('w',false)} onPointerLeave={()=>tb('w',false)} style={{...tBtn,color:'var(--primary)',borderColor:'rgba(57,255,20,0.4)'}}>GAS</button>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div style={{flex:'0 0 196px',minWidth:'180px'}}>
            <div style={{border:'1px solid rgba(57,255,20,0.15)',borderRadius:'4px',overflow:'hidden'}}>
              <div style={{background:'rgba(57,255,20,0.07)',padding:'10px 14px',borderBottom:'1px solid rgba(57,255,20,0.1)'}}>
                <p style={{fontFamily:'var(--font-heading)',fontSize:'14px',fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',color:'var(--primary)',margin:0}}>Leaderboard</p>
                <p style={{color:'var(--muted)',fontFamily:'var(--font-mono)',fontSize:'10px',marginTop:'2px'}}>
                  {trackId ? `${TRACKS[trackId].flag} ${TRACKS[trackId].name} · Best lap` : 'Select a track'}
                </p>
              </div>
              <div>
                {leaderboard.length===0&&(
                  <p style={{color:'var(--muted)',fontFamily:'var(--font-mono)',fontSize:'11px',padding:'16px',textAlign:'center'}}>
                    {trackId?'No times yet.\nBe first!':'—'}
                  </p>
                )}
                {leaderboard.map((e,i)=>(
                  <div key={e.id} style={{display:'flex',alignItems:'center',gap:'8px',padding:'7px 14px',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                    <span style={{fontFamily:'var(--font-mono)',fontSize:'11px',color:i===0?'#FFD700':i===1?'#C0C0C0':i===2?'#CD7F32':'var(--muted)',width:'18px',flexShrink:0,textAlign:'center'}}>
                      {i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}.`}
                    </span>
                    <span style={{fontFamily:'var(--font-body)',fontSize:'12px',color:'var(--text)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.name}</span>
                    <span style={{fontFamily:'var(--font-mono)',fontSize:'11px',color:i===0?'var(--primary)':'var(--muted)',flexShrink:0}}>{fmt(e.time)}</span>
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

function HudBox({label,val,green}){
  return(
    <div style={{background:'rgba(0,0,0,0.75)',border:'1px solid rgba(57,255,20,0.18)',borderRadius:'2px',padding:'3px 8px',minWidth:'80px'}}>
      <div style={{fontFamily:'var(--font-mono)',fontSize:'8px',color:'var(--muted)',letterSpacing:'1.5px'}}>{label}</div>
      <div style={{fontFamily:'var(--font-mono)',fontSize:'13px',color:green?'var(--primary)':'#fff',fontWeight:700}}>{val}</div>
    </div>
  )
}

const overlayS={position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.82)',backdropFilter:'blur(8px)'}
const bigBtn={background:'var(--primary)',color:'#050505',fontFamily:'var(--font-heading)',fontSize:'16px',fontWeight:800,letterSpacing:'2px',padding:'12px 32px',border:'none',cursor:'pointer',borderRadius:'2px',textTransform:'uppercase',boxShadow:'0 0 24px rgba(57,255,20,0.4)',marginTop:'20px'}
const tBtn={background:'rgba(255,255,255,0.05)',border:'1px solid var(--border)',color:'var(--text)',fontFamily:'var(--font-mono)',fontSize:'14px',padding:'12px 22px',borderRadius:'2px',cursor:'pointer',userSelect:'none',WebkitUserSelect:'none'}
