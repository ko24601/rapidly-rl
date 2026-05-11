import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import * as THREE from 'three'
import { SITE } from '../config.js'

const DEFAULT_CARS = [
  { id: 1, name: 'Car #1', file: '/car1.glb' },
  { id: 2, name: 'Car #2', file: '/car2.glb' },
  { id: 3, name: 'Car #3', file: '/car3.glb' },
]

function LiveryCanvas({ carFile, primaryColor }) {
  const mountRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const modelRef = useRef(null)
  const frameRef = useRef(null)
  const orbitRef = useRef({ isDragging: false, prevX: 0, prevY: 0, rotY: 0, rotX: 0, zoom: 5 })
  const [status, setStatus] = useState('loading') // loading | ready | error

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0a)
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 1000)
    camera.position.set(0, 2, 5)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    mount.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambient)

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2)
    dirLight.position.set(5, 10, 5)
    scene.add(dirLight)

    // Orbiting primary color point light
    const primaryHex = parseInt(primaryColor.replace('#', ''), 16)
    const pointLight = new THREE.PointLight(primaryHex, 2, 15)
    scene.add(pointLight)

    // Grid helper floor
    const grid = new THREE.GridHelper(10, 20, primaryHex, primaryHex)
    grid.material.opacity = 0.2
    grid.material.transparent = true
    grid.position.y = -1.2
    scene.add(grid)

    // Load GLB
    let cancelled = false
    async function loadModel() {
      try {
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
        const loader = new GLTFLoader()
        loader.load(
          carFile,
          (gltf) => {
            if (cancelled) return
            const model = gltf.scene
            // Auto-center
            const box = new THREE.Box3().setFromObject(model)
            const center = box.getCenter(new THREE.Vector3())
            model.position.sub(center)
            // Paint materials
            model.traverse((child) => {
              if (child.isMesh && child.material) {
                const name = (child.material.name || '').toLowerCase()
                if (name.includes('primary')) {
                  child.material.color = new THREE.Color(primaryColor)
                } else if (name.includes('accent')) {
                  child.material.color = new THREE.Color(0xffffff)
                }
              }
            })
            scene.add(model)
            modelRef.current = model
            setStatus('ready')
          },
          undefined,
          () => { if (!cancelled) setStatus('error') }
        )
      } catch {
        if (!cancelled) setStatus('error')
      }
    }
    loadModel()

    // Animation loop
    let lightAngle = 0
    function animate() {
      frameRef.current = requestAnimationFrame(animate)
      // Auto rotate model
      if (modelRef.current && !orbitRef.current.isDragging) {
        modelRef.current.rotation.y += 0.005
      }
      // Orbit point light
      lightAngle += 0.01
      pointLight.position.set(Math.sin(lightAngle) * 4, 2, Math.cos(lightAngle) * 4)
      renderer.render(scene, camera)
    }
    animate()

    // Mouse orbit
    function onMouseDown(e) {
      orbitRef.current.isDragging = true
      orbitRef.current.prevX = e.clientX
      orbitRef.current.prevY = e.clientY
    }
    function onMouseMove(e) {
      if (!orbitRef.current.isDragging || !modelRef.current) return
      const dx = e.clientX - orbitRef.current.prevX
      const dy = e.clientY - orbitRef.current.prevY
      modelRef.current.rotation.y += dx * 0.01
      modelRef.current.rotation.x += dy * 0.005
      orbitRef.current.prevX = e.clientX
      orbitRef.current.prevY = e.clientY
    }
    function onMouseUp() { orbitRef.current.isDragging = false }
    function onWheel(e) {
      e.preventDefault()
      camera.position.z = Math.max(2, Math.min(12, camera.position.z + e.deltaY * 0.01))
    }

    // Touch orbit
    function onTouchStart(e) {
      if (e.touches.length === 1) {
        orbitRef.current.isDragging = true
        orbitRef.current.prevX = e.touches[0].clientX
        orbitRef.current.prevY = e.touches[0].clientY
      }
    }
    function onTouchMove(e) {
      if (!orbitRef.current.isDragging || !modelRef.current || e.touches.length !== 1) return
      const dx = e.touches[0].clientX - orbitRef.current.prevX
      const dy = e.touches[0].clientY - orbitRef.current.prevY
      modelRef.current.rotation.y += dx * 0.01
      modelRef.current.rotation.x += dy * 0.005
      orbitRef.current.prevX = e.touches[0].clientX
      orbitRef.current.prevY = e.touches[0].clientY
    }
    function onTouchEnd() { orbitRef.current.isDragging = false }

    mount.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    mount.addEventListener('wheel', onWheel, { passive: false })
    mount.addEventListener('touchstart', onTouchStart)
    mount.addEventListener('touchmove', onTouchMove)
    mount.addEventListener('touchend', onTouchEnd)

    // Resize observer
    const observer = new ResizeObserver(() => {
      if (!mount) return
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    })
    observer.observe(mount)

    return () => {
      cancelled = true
      cancelAnimationFrame(frameRef.current)
      observer.disconnect()
      mount.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      mount.removeEventListener('wheel', onWheel)
      mount.removeEventListener('touchstart', onTouchStart)
      mount.removeEventListener('touchmove', onTouchMove)
      mount.removeEventListener('touchend', onTouchEnd)
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [carFile, primaryColor])

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        ref={mountRef}
        style={{
          width: '100%',
          height: 'clamp(250px, 40vw, 600px)',
          cursor: 'grab',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      />
      {status === 'loading' && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(10,10,10,0.8)',
          fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--muted)', letterSpacing: '2px',
        }}>
          <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
            LOADING MODEL...
          </motion.div>
        </div>
      )}
      {status === 'error' && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
          background: 'rgba(10,10,10,0.9)',
          fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--muted)', letterSpacing: '1px',
          textAlign: 'center', padding: '20px',
        }}>
          <span style={{ fontSize: '32px' }}>🚗</span>
          <span>Model file not found</span>
          <span style={{ fontSize: '11px', opacity: 0.6 }}>Add GLB files to /public/</span>
        </div>
      )}
    </div>
  )
}

export default function LiveryViewer() {
  const [selected, setSelected] = useState(DEFAULT_CARS[0])

  return (
    <div style={{ background: 'var(--bg)' }}>
      <div className="section-wrapper">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-header">
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px,5vw,48px)', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>
              <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontSize: '0.55em', verticalAlign: 'middle', marginRight: '12px' }}>// 03</span>
              Livery Viewer
            </h2>
            <div className="section-underline" />
          </div>

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {/* Canvas */}
            <div style={{ flex: '1 1 400px', minWidth: 0 }}>
              <LiveryCanvas carFile={selected.file} primaryColor={SITE.primaryColor} />
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)',
                marginTop: '8px', letterSpacing: '1px',
              }}>
                DRAG TO ROTATE · SCROLL TO ZOOM
              </div>
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '180px', flexShrink: 0 }} className="livery-sidebar">
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', letterSpacing: '3px', marginBottom: '4px' }}>
                SELECT CAR
              </div>
              {DEFAULT_CARS.map((car) => (
                <button
                  key={car.id}
                  onClick={() => setSelected(car)}
                  style={{
                    background: selected.id === car.id ? 'rgba(255,0,0,0.1)' : 'var(--card)',
                    border: selected.id === car.id ? '1px solid var(--primary)' : '1px solid var(--border)',
                    color: selected.id === car.id ? 'var(--primary)' : 'var(--text)',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '16px',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  {car.name}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .livery-sidebar { width: 100% !important; flex-direction: row !important; flex-wrap: wrap !important; }
          .livery-sidebar button { flex: 1 1 100px; }
        }
      `}</style>
    </div>
  )
}
