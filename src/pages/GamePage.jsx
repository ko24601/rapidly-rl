import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../firebase.js'
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp, doc, setDoc, where } from 'firebase/firestore'

// ─── canvas size ──────────────────────────────────────────────────────────────
const CW = 1000, CH = 620

// ─── physics ──────────────────────────────────────────────────────────────────
const TRACK_HALF = 46
const MAX_SPD = 10
const ACCEL = 0.22
const BRAKE_F = 0.30
const FRICTION = 0.970
const LAT_GRIP = 0.82
const STEER_RATE = 0.052
const TOTAL_LAPS = 3

// ─── tracks ───────────────────────────────────────────────────────────────────
// Monaco: tight street circuit, L-shaped, famous for Loews hairpin, tunnel, swimming pool chicane
// Based on actual Circuit de Monaco layout proportions from SVG path data
const TRACKS = {
  monaco: {
    name: 'Monaco',
    flag: '🇲🇨',
    subtitle: 'Circuit de Monaco',
    accentColor: '#e91e63',
    points: [
      // Start/finish straight (horizontal, bottom-left area)
      [700,700],[610,700],[510,700],[420,698],
      // Sainte Devote - tight right-hander
      [345,685],[300,650],[292,615],
      // Uphill to Beau Rivage - climbing left
      [298,570],[310,520],[330,475],[360,430],[395,395],
      // Massenet - sweeping right at Casino Square
      [440,365],[490,345],[545,335],[600,332],
      // Casino Square / Mirabeau area
      [660,340],[710,355],[745,380],
      // Loews hairpin - the tightest corner in F1, sharp U-turn
      [768,415],[775,450],[768,488],[745,515],[710,530],[675,530],[645,515],
      // Portier - heading toward the tunnel
      [620,495],[600,468],[590,435],[592,400],
      // Tunnel - long straight going right (under the hill)
      [600,370],[640,340],[700,315],[775,295],[860,285],[950,283],[1040,285],[1110,292],
      // Nouvelle Chicane (exit tunnel) - right then left
      [1160,305],[1190,330],[1185,365],[1160,390],[1125,400],
      // Tabac - right-hander
      [1085,408],[1050,420],[1030,445],
      // Swimming pool chicane - quick S-curves
      [1020,475],[1030,505],[1060,520],[1090,520],[1115,505],[1120,478],[1105,455],
      // Rascasse - tight right-hander
      [1080,438],[1050,430],[1015,440],[990,465],[980,500],[985,535],[1000,560],
      // Anthony Noghes - final corner back to pit straight
      [1010,590],[1000,625],[975,655],[940,672],[890,685],[820,695],[760,700],[700,700],
    ],
  },
  silverstone: {
    name: 'Silverstone',
    flag: '🇬🇧',
    subtitle: 'British Grand Prix',
    accentColor: '#2196f3',
    // Silverstone GP: flowing high-speed circuit, roughly rectangular with rounded corners
    // Famous Maggots/Becketts/Chapel S-curves, long Hangar straight, fast Copse, Stowe
    points: [
      // Start/finish straight (Wellington straight) - top of circuit running right
      [400,220],[500,215],[600,212],[700,212],[800,215],[900,220],[980,228],
      // Copse - fast right-hander (no braking required in modern F1)
      [1040,245],[1085,275],[1100,315],[1095,355],
      // Maggots - sweeping left
      [1075,390],[1040,415],[995,428],
      // Becketts - sharp right
      [955,425],[920,408],[898,382],[898,350],
      // Chapel - left
      [900,318],[920,292],[950,276],[985,268],
      // Hangar straight - long straight running down-right
      [1025,268],[1080,272],[1140,282],[1200,298],[1255,322],
      // Stowe - right-hander
      [1290,360],[1305,405],[1300,450],[1278,490],[1243,520],
      // Vale - left
      [1195,545],[1145,555],[1095,550],
      // Club corner - right-hander
      [1050,545],[1015,530],[990,505],[975,475],[972,442],
      // Abbey - right
      [978,408],[998,382],[1025,365],
      // Farm curve - left
      [1050,352],[1070,340],
      // Village / The Loop (Arena complex)
      [1075,325],
      // Loop right
      [1060,300],
      // Aintree - left
      [1030,285],[998,278],
      // Woodcote - sweeping right returning to pit straight
      [800,240],[700,225],[600,218],[500,216],[400,220],
      // Close the loop - but we need the proper path from Club back
      // Re-approach from Club through National Pits hairpin back to Wellington straight
    ],
  },
  suzuka: {
    name: 'Suzuka',
    flag: '🇯🇵',
    subtitle: 'Japanese Grand Prix',
    accentColor: '#ff9800',
    // Suzuka: unique figure-8, S-curves, Degner, hairpin, Spoon, 130R, chicane
    points: [],
  },
}

// Silverstone - cleaner redesign with proper GP layout
TRACKS.silverstone.points = [
  // Start/finish straight (pit straight) - left to right
  [280,380],[380,375],[480,372],[580,370],[680,370],[760,372],
  // Copse corner - fast sweeping right
  [840,380],[895,405],[918,445],[910,488],
  // Maggots - left sweep
  [885,520],[848,543],[805,548],[765,538],
  // Becketts - sharp right, then left (S-curves, most dramatic in F1)
  [730,520],[710,493],[712,462],[730,438],[758,422],
  // Chapel - tightening right
  [790,412],[820,408],[848,415],
  // Hangar straight - long, heading right and slightly down
  [882,428],[940,445],[1010,465],[1085,488],[1140,510],[1185,535],
  // Stowe - sweeping right-hander
  [1220,572],[1238,618],[1230,662],[1200,695],[1155,715],[1105,720],
  // Vale - left
  [1048,715],[1000,700],[965,675],[950,642],
  // Club - right-hander
  [948,605],[965,575],[995,555],[1030,548],[1062,555],
  // Return loop (Abbey, Farm, Village, Loop complex)
  [1088,572],[1100,600],[1090,638],[1062,668],[1022,685],
  [970,692],[915,688],[870,672],[840,645],[830,610],
  // Woodcote sweep - long right-hander back toward pit straight
  [830,575],[835,538],[848,505],[866,478],[888,455],
  // Bridge / back section heading left
  [890,428],[870,405],[840,390],[800,382],[750,378],[680,375],
  [580,374],[480,375],[380,377],[280,380],
]

// Suzuka - figure-8 circuit
TRACKS.suzuka.points = [
  // Start/finish straight - heading right
  [220,480],[320,475],[420,472],[520,470],[620,470],[700,472],
  // First corner - sweeping right
  [775,480],[828,505],[858,548],[855,595],
  // S-curves (most iconic section) - tight left-right-left chicane
  [840,638],[808,665],[768,672],[730,660],[705,630],[703,595],
  [715,562],[740,540],[770,530],[800,528],
  // Degner 1 - right
  [832,535],[858,555],[868,585],[858,618],
  // Degner 2 - right
  [838,645],[808,665],[775,670],[745,658],
  // Hairpin - very tight U-turn (sharpest on the lap)
  [718,638],[695,608],[690,572],[700,540],[720,512],[748,494],[778,488],
  // Spoon curve - long sweeping right, heading left
  [810,488],[848,495],[878,515],[900,548],[908,588],[902,628],[882,660],
  [852,682],[815,692],[775,692],[738,682],
  // Back straight (main straight before 130R) - long heading right/up
  [705,660],[685,628],[672,592],[668,552],[672,515],[685,482],[705,455],
  [730,432],[762,415],[800,408],[840,408],[878,415],
  // 130R - very fast sweeping left-hander
  [912,428],[945,452],[962,488],[960,528],[942,562],
  // Chicane (Casio Triangle) - tight left-right braking zone
  [915,585],[878,605],[842,608],[810,598],[792,572],[795,542],
  [818,518],[848,508],
  // Final corner back to start/finish
  [878,512],[905,518],[928,535],[942,562],[948,595],[940,628],
  [920,655],[888,672],[852,680],[815,678],[780,668],
  [750,650],[728,625],[718,595],[720,562],[730,535],
  // Cross-over section (the bridge/underpass that makes the figure-8)
  [748,512],[768,492],[792,478],[818,472],[848,472],
  [878,478],[905,492],[928,515],
  // Complete loop back to start
  [942,548],[935,582],[918,608],[892,625],[860,632],
  [825,628],[800,608],[790,580],[795,552],
  [808,528],[832,512],[858,505],[888,505],
  [918,512],[942,528],[958,555],[958,590],[942,622],
  [918,648],[885,665],[848,672],[812,668],[780,655],
  [755,632],[740,605],[738,572],[750,542],[768,518],
  [792,500],[820,490],[848,488],[875,492],[900,505],
  [918,528],[928,558],[920,590],[905,618],[878,638],
  // Simplified final stretch back
  [848,648],[815,648],[782,638],[762,618],[752,592],[755,562],
  [768,538],[790,520],[818,510],[848,508],[875,512],
  [900,525],[918,548],[922,578],[912,608],[892,628],
  [862,640],[830,642],[800,630],[782,608],[778,578],
  [782,548],[800,525],[825,512],[852,508],
  // Approach to start straight
  [878,512],[900,520],[918,540],[925,565],[918,592],[902,615],
  [875,628],[842,630],[812,618],[792,598],[785,570],
  // FINAL - return to start/finish
  [620,470],[520,470],[420,472],[320,475],[220,480],
]

// Suzuka simplified - cleaner figure-8 that actually makes sense as a closed loop
TRACKS.suzuka.points = [
  // Start/finish straight going right
  [160,500],[260,495],[360,492],[460,490],[560,490],[650,492],
  // Turn 1 (first corner) - right-hander
  [720,500],[772,522],[800,562],[795,608],
  // S-curves - left/right/left tight chicane section
  [775,648],[740,670],[700,672],[668,652],[650,618],[655,582],
  [672,552],[698,535],[728,528],[758,532],
  // Degner curves - right then right
  [785,542],[808,565],[812,598],[795,628],
  // Hairpin - sharp U-turn at bottom of circuit
  [768,652],[738,662],[708,655],[688,630],[682,598],[690,565],
  [708,540],[732,522],[760,514],[790,514],
  // Spoon - long sweeping right going back up-left
  [820,520],[848,535],[865,562],[862,598],[848,628],
  [822,648],[790,655],[758,648],[735,628],
  // Back straight (long section heading right then up toward 130R)
  [718,598],[708,565],[712,532],[725,505],[748,485],[778,472],
  [810,465],[845,465],[878,472],[908,488],
  // 130R - very fast sweeping left
  [935,512],[948,548],[942,585],[922,615],[892,632],
  // Chicane at end of back straight (braking zone)
  [858,642],[825,642],[800,625],[790,598],[800,570],
  [825,555],[852,552],
  // Final corner returning to pit straight
  [878,560],[900,578],[908,608],[898,638],[872,655],
  [840,660],[808,655],[785,638],[772,612],
  // Cross-over / overpass area back to start
  [762,582],[758,550],[765,520],[782,495],[808,478],
  [838,470],[868,470],[895,480],[918,500],[932,528],
  [935,560],[925,592],[908,618],[882,635],
  [850,642],[818,638],[795,622],[782,598],[782,568],
  [790,540],[808,520],[832,510],[858,508],[882,515],
  // THE KEY: the overpass (back straight goes OVER the S-curves section visually)
  // We model the circuit as a continuous path - the crossover is just points passing close
  [908,528],[928,550],[935,578],[928,608],[910,632],
  [882,648],[850,652],[818,645],[795,625],[782,598],
  // Return to start
  [560,490],[460,490],[360,492],[260,495],[160,500],
]

// Actually let's do a clean, well-designed Suzuka that captures the figure-8 shape properly
// The key insight: the track crosses itself. Model it as a normal closed loop where the
// crossing section just happens to pass near the same coordinates from opposite directions.
TRACKS.suzuka.points = [
  // Pit straight / start-finish (going rightward)
  [180,510],[280,505],[390,502],[500,500],[610,500],[700,502],
  // Turn 1-2: sweeping right entry
  [768,512],[815,535],[840,572],[835,615],
  // S-curves (turns 3-7): famous alternating chicane
  [815,650],[782,672],[748,672],[720,655],[705,622],
  [710,590],[728,565],[755,552],[784,555],
  // Degner 1 (turn 8): right
  [810,568],[832,595],[828,628],
  // Degner 2 (turn 9): right again
  [808,652],[780,665],[752,658],[732,635],[726,605],
  // Hairpin (turn 10): the tightest U-turn
  [730,572],[742,542],[762,520],[790,510],[820,510],
  [848,520],[868,545],[868,578],[852,608],
  // Spoon curve (turns 13-14): long right-hander
  [828,632],[798,648],[765,648],[738,630],[722,605],[722,572],
  [738,545],[762,530],[792,525],[820,528],
  // Back straight (long): heading right
  [850,535],[888,545],[932,558],[978,575],[1020,595],[1058,618],
  // 130R (turn 15): very fast sweeping left - car barely turns
  [1085,648],[1098,682],[1095,718],[1075,748],[1045,765],[1010,770],
  [972,762],[942,742],[925,712],[922,680],
  // Chicane (turns 16-17): tight left-right, heavy braking
  [928,648],[945,622],[968,608],[995,612],[1010,635],[1005,665],
  [982,682],[955,685],[930,672],[918,648],
  // Return corner and pit straight entrance
  [912,618],[908,585],[915,555],[930,530],[952,512],[978,500],
  [1010,495],[700,500],[500,500],[280,502],[180,510],
]

// Final clean version - let me do this properly with clean coordinate thinking
// Suzuka spans roughly 5.8km. In our world space ~1400 wide.
// The circuit runs roughly: pit straight (going right/east), turn 1-2 (right),
// S-curves going south, Degner (right), hairpin (U-turn going north), Spoon (right),
// back straight going north-east, 130R (left), chicane, pit entry back to straight.
// The figure-8 means the back straight passes OVER the S-curves section.
TRACKS.suzuka.points = [
  // ── Pit straight (going right / east) ──
  [200,480],[310,475],[430,472],[550,470],[670,470],[760,473],
  // ── Turn 1-2: right-hander complex ──
  [825,485],[870,510],[892,550],[885,595],
  // ── S-curves: iconic left-right sequence going southward ──
  [862,635],[830,658],[795,660],[768,642],[756,610],
  [762,578],[782,558],[808,552],[835,562],
  // ── Dunlop curve: right (links S-curves to Degner) ──
  [858,582],[875,612],[868,645],
  // ── Degner 2: right ──
  [845,668],[815,678],[785,672],[762,648],[754,618],
  // ── Hairpin: tight U-turn, lowest point of circuit ──
  [758,585],[768,555],[788,532],[815,520],[845,520],
  [872,532],[888,558],[885,592],[865,622],
  // ── Spoon curve (turns 13-14): long right-hander ──
  [838,645],[808,658],[778,655],[752,638],[740,610],
  [742,578],[758,552],[782,535],[810,530],[840,535],
  // ── Back straight: long, going right and slightly upward ──
  // (this section passes OVER the S-curves in real life)
  [872,542],[918,550],[968,560],[1020,572],[1072,590],[1118,612],
  // ── 130R: very fast sweeping LEFT ──
  [1148,642],[1162,678],[1155,718],[1132,748],[1098,762],[1062,758],
  [1025,742],[1002,715],[998,680],[1008,648],
  // ── Chicane (Casio Triangle): left then right, heavy braking ──
  [1028,622],[1052,605],[1080,608],[1095,632],[1088,662],
  [1062,678],[1035,675],[1018,655],[1015,625],
  // ── Final corner back to pit straight ──
  [1018,595],[1025,565],[1042,542],[1065,528],[1092,522],
  [670,470],[550,470],[430,472],[310,475],[200,480],
]

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
function renderMinimap(ctx, smooth, carX, carY, accentColor, fl) {
  // Compute bounding box of track
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity
  smooth.forEach(([x,y])=>{if(x<minX)minX=x;if(y<minY)minY=y;if(x>maxX)maxX=x;if(y>maxY)maxY=y})
  const tw=maxX-minX, th=maxY-minY
  const MW=120, MH=Math.round(MW*th/tw)||80
  const MX=CW-MW-12, MY=12
  const scX=(p)=>MX+(p-minX)/tw*MW
  const scY=(p)=>MY+(p-minY)/th*MH

  ctx.save()
  ctx.fillStyle='rgba(0,0,0,0.72)'; ctx.strokeStyle='rgba(255,255,255,0.1)'
  ctx.lineWidth=1; ctx.beginPath(); ctx.roundRect(MX-4,MY-4,MW+8,MH+8,3); ctx.fill(); ctx.stroke()

  ctx.beginPath()
  smooth.forEach(([x,y],i)=>i?ctx.lineTo(scX(x),scY(y)):ctx.moveTo(scX(x),scY(y)))
  ctx.closePath()
  ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=3; ctx.stroke()

  // Start/finish line dash on minimap
  if (fl) {
    const mx1=scX(fl.lx1+(fl.lx2-fl.lx1)*0.2), my1=scY(fl.ly1+(fl.ly2-fl.ly1)*0.2)
    const mx2=scX(fl.lx1+(fl.lx2-fl.lx1)*0.8), my2=scY(fl.ly1+(fl.ly2-fl.ly1)*0.8)
    ctx.beginPath(); ctx.moveTo(mx1,my1); ctx.lineTo(mx2,my2)
    ctx.strokeStyle='rgba(255,255,255,0.7)'; ctx.lineWidth=2; ctx.stroke()
  }

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
  // Countdown: null = not started, 3/2/1 = lights on, 0 = GO!, -1 = racing
  const [countdown, setCountdown] = useState(null)
  const countdownRef = useRef(null)

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
    fetchLB(tid)
    // Start countdown sequence
    setCountdown(3)
    setPhase('countdown')
  }

  function restartRace() {
    initTrack(trackId)
    setSaved(false); setSubmitTime(null); setSubmitName('')
    setCountdown(3)
    setPhase('countdown')
  }

  // Countdown timer effect
  useEffect(()=>{
    if(phase!=='countdown') return
    // Clear any existing countdown timer
    if(countdownRef.current) clearTimeout(countdownRef.current)

    if(countdown === null) return

    if(countdown > 0){
      // Each light stays on for 1000ms (like real F1 lights)
      countdownRef.current = setTimeout(()=>{
        setCountdown(c => c - 1)
      }, 1000)
    } else if(countdown === 0){
      // "GO!" stays for 800ms then starts race
      countdownRef.current = setTimeout(()=>{
        setCountdown(-1)
        setPhase('racing')
      }, 800)
    }
    return () => { if(countdownRef.current) clearTimeout(countdownRef.current) }
  },[phase, countdown])

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
      renderMinimap(ctx, smooth, s.x, s.y, track.accentColor, fl)

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

      // Current lap time - large display at center-bottom
      if(s.started && s.lapStart){
        const elapsed = Date.now() - s.lapStart
        const timeStr = fmt(elapsed)
        ctx.save()
        ctx.font = 'bold 22px monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        // Shadow/background
        ctx.fillStyle = 'rgba(0,0,0,0.55)'
        const tw2 = ctx.measureText(timeStr).width
        ctx.fillRect(CW/2 - tw2/2 - 12, CH - 42, tw2 + 24, 32)
        // Time text
        ctx.fillStyle = '#ffffff'
        ctx.shadowColor = 'rgba(57,255,20,0.5)'
        ctx.shadowBlur = 8
        ctx.fillText(timeStr, CW/2, CH - 12)
        ctx.restore()
      }

      setHud({lap:s.lapCount,lastLap:s.lastLap,bestLap:s.bestLap,
        spd:Math.round(spd*52),elapsed:s.lapStart?Date.now()-s.lapStart:0})

      rafRef.current=requestAnimationFrame(tick)
    }

    rafRef.current=requestAnimationFrame(tick)
    return()=>cancelAnimationFrame(rafRef.current)
  },[phase,trackId])

  // Countdown canvas render (shows car on track while counting down)
  useEffect(()=>{
    if(phase!=='countdown') return
    const canvas=canvasRef.current; if(!canvas) return
    const ctx=canvas.getContext('2d')
    const track=TRACKS[trackId]
    const smooth=stRef.current
    const fl=flRef.current
    const s=gsRef.current

    function renderCountdownFrame(){
      ctx.clearRect(0,0,CW,CH)
      ctx.fillStyle='#0c1a09'; ctx.fillRect(0,0,CW,CH)

      ctx.save()
      ctx.translate(CW/2-s.camX,CH/2-s.camY)
      renderTrack(ctx, smooth, track.accentColor, fl)
      renderCar(ctx, s.x, s.y, s.angle, 0)
      ctx.restore()

      const vig=ctx.createRadialGradient(CW/2,CH/2,CW*0.3,CW/2,CH/2,CW*0.75)
      vig.addColorStop(0,'rgba(0,0,0,0)'); vig.addColorStop(1,'rgba(0,0,0,0.45)')
      ctx.fillStyle=vig; ctx.fillRect(0,0,CW,CH)

      renderMinimap(ctx, smooth, s.x, s.y, track.accentColor, fl)
    }
    renderCountdownFrame()
  },[phase,trackId,countdown])

  async function submitScore(){
    if(!submitName.trim()||!submitTime) return
    setSubmitting(true)
    try {
      const name = submitName.trim().slice(0,24)
      const col = collection(db,`game_lb_${trackId}`)
      const existing = await getDocs(query(col, where('name','==',name), limit(1)))
      if(!existing.empty){
        const existingDoc = existing.docs[0]
        if(submitTime < existingDoc.data().time){
          await setDoc(doc(db,`game_lb_${trackId}`,existingDoc.id),{
            name, time:submitTime, date:serverTimestamp()
          })
        }
      } else {
        await addDoc(col,{name, time:submitTime, date:serverTimestamp()})
      }
      setSaved(true); fetchLB(trackId)
    } catch{}
    setSubmitting(false)
  }

  function tb(key,down){gsRef.current.keys[key]=down}

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div style={{minHeight:'100vh',background:'#050505',paddingBottom:'80px'}}>
      <div style={{maxWidth:'1160px',margin:'0 auto',padding:'24px 20px 0'}}>

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
          <div style={{flex:'1 1 640px'}}>
            <div style={{position:'relative',border:`1px solid rgba(255,255,255,0.1)`,borderRadius:'4px',overflow:'hidden',background:'#0c1a09'}}>
              <canvas ref={canvasRef} width={CW} height={CH} style={{display:'block',width:'100%'}}/>

              {/* HUD */}
              {(phase==='racing') && (
                <div style={{position:'absolute',top:10,left:10,display:'flex',flexDirection:'column',gap:'4px'}}>
                  <HudBox label="LAP" val={gsRef.current.lapCount===0?'--':`${Math.min(gsRef.current.lapCount,TOTAL_LAPS)} / ${TOTAL_LAPS}`} />
                  <HudBox label="TIME" val={fmt(hud.elapsed)} />
                  <HudBox label="LAST" val={fmt(hud.lastLap)} />
                  <HudBox label="BEST" val={fmt(hud.bestLap)} green />
                  <HudBox label="KM/H" val={hud.spd} />
                </div>
              )}

              {/* Countdown overlay */}
              {phase==='countdown' && (
                <div style={{...overlayS, background:'rgba(0,0,0,0.0)', backdropFilter:'none', pointerEvents:'none'}}>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'8px'}}>
                    {/* F1-style lights panel */}
                    <div style={{
                      display:'flex',gap:'12px',padding:'16px 24px',
                      background:'rgba(0,0,0,0.82)',
                      border:'2px solid rgba(255,255,255,0.15)',
                      borderRadius:'8px',
                      boxShadow:'0 0 40px rgba(0,0,0,0.8)',
                    }}>
                      {countdown === 0
                        ? (
                          <div style={{
                            fontFamily:'var(--font-heading)',
                            fontSize:'52px',fontWeight:900,
                            color:'#39FF14',
                            letterSpacing:'6px',
                            textShadow:'0 0 30px rgba(57,255,20,0.9)',
                          }}>GO!</div>
                        )
                        : [3,2,1].map(n=>{
                          const lit = countdown !== null && n >= countdown
                          return (
                            <div key={n} style={{
                              width:44,height:44,borderRadius:'50%',
                              background: lit ? '#cc1100' : '#1a1a1a',
                              border: lit ? '2px solid #ff3333' : '2px solid #333',
                              boxShadow: lit ? '0 0 20px rgba(200,0,0,0.9), inset 0 0 10px rgba(255,100,100,0.4)' : '0 0 4px rgba(0,0,0,0.5)',
                              transition:'all 0.1s ease',
                            }}/>
                          )
                        })
                      }
                    </div>
                    {countdown > 0 && (
                      <div style={{
                        fontFamily:'var(--font-mono)',
                        fontSize:'13px',
                        color:'rgba(255,255,255,0.5)',
                        letterSpacing:'2px',
                      }}>LIGHTS OUT IN {countdown}...</div>
                    )}
                  </div>
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
