// Generates a dark racing-themed hero background PNG using pure Node.js
// 1920x1080, no external deps

import { createCanvas } from 'canvas'
import { writeFileSync } from 'fs'

const W = 1920, H = 1080
const canvas = createCanvas(W, H)
const ctx = canvas.getContext('2d')

// Deep dark base
ctx.fillStyle = '#040404'
ctx.fillRect(0, 0, W, H)

// Green radial glow — left side hero accent
const glow = ctx.createRadialGradient(W * 0.08, H * 0.45, 0, W * 0.08, H * 0.45, W * 0.55)
glow.addColorStop(0, 'rgba(57,255,20,0.18)')
glow.addColorStop(0.5, 'rgba(57,255,20,0.05)')
glow.addColorStop(1, 'rgba(0,0,0,0)')
ctx.fillStyle = glow
ctx.fillRect(0, 0, W, H)

// Secondary subtle glow top-right
const glow2 = ctx.createRadialGradient(W * 0.85, H * 0.1, 0, W * 0.85, H * 0.1, W * 0.4)
glow2.addColorStop(0, 'rgba(57,255,20,0.06)')
glow2.addColorStop(1, 'rgba(0,0,0,0)')
ctx.fillStyle = glow2
ctx.fillRect(0, 0, W, H)

// Speed lines — diagonal light streaks across the bg
ctx.save()
ctx.globalAlpha = 0.04
for (let i = 0; i < 30; i++) {
  const x = Math.random() * W * 1.5 - W * 0.25
  const y = Math.random() * H
  const len = 200 + Math.random() * 600
  const thick = 0.5 + Math.random() * 1.5
  ctx.strokeStyle = '#39FF14'
  ctx.lineWidth = thick
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + len * 1.8, y - len * 0.3)
  ctx.stroke()
}
ctx.restore()

// Grid floor perspective — bottom third
ctx.save()
ctx.globalAlpha = 0.07
ctx.strokeStyle = '#39FF14'
ctx.lineWidth = 0.8
const gridY = H * 0.68
const vp = { x: W * 0.5, y: gridY }
// Horizontal lines
for (let i = 0; i <= 12; i++) {
  const t = i / 12
  const y = gridY + (H - gridY) * t
  ctx.beginPath()
  ctx.moveTo(0, y)
  ctx.lineTo(W, y)
  ctx.stroke()
}
// Vanishing lines
for (let i = -14; i <= 14; i++) {
  const xBase = W * 0.5 + i * (W / 14)
  ctx.beginPath()
  ctx.moveTo(vp.x, vp.y)
  ctx.lineTo(xBase, H)
  ctx.stroke()
}
ctx.restore()

// Dark vignette overlay
const vig = ctx.createRadialGradient(W/2, H/2, H*0.1, W/2, H/2, W*0.8)
vig.addColorStop(0, 'rgba(0,0,0,0)')
vig.addColorStop(1, 'rgba(0,0,0,0.75)')
ctx.fillStyle = vig
ctx.fillRect(0, 0, W, H)

// Bottom gradient fade to near-black
const fade = ctx.createLinearGradient(0, H * 0.75, 0, H)
fade.addColorStop(0, 'rgba(0,0,0,0)')
fade.addColorStop(1, 'rgba(4,4,4,0.9)')
ctx.fillStyle = fade
ctx.fillRect(0, 0, W, H)

writeFileSync('public/hero-bg.png', canvas.toBuffer('image/png'))
console.log('hero-bg.png written to public/')
