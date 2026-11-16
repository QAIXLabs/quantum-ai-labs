import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

const BG = 0x04070a
const CYAN = new THREE.Color('#8ff1f5')
const VIOLET = new THREE.Color('#a99cf0')

/** Tier heights and radii of the cryostat "chandelier", top to bottom. */
const TIERS = [
  { y: 2.35, r: 1.62 },
  { y: 1.2, r: 1.42 },
  { y: 0.1, r: 1.22 },
  { y: -0.95, r: 1.0 },
  { y: -1.9, r: 0.74 },
]

/** A glowing qubit-chip texture: a grid of pads with bright resonator traces. */
function chipTexture() {
  const size = 256
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')!
  g.fillStyle = '#05181d'
  g.fillRect(0, 0, size, size)
  g.strokeStyle = 'rgba(143,241,245,0.9)'
  g.lineWidth = 3
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const x = 40 + i * 58, y = 40 + j * 58
      g.strokeRect(x - 10, y - 10, 20, 20)
      if (i < 3) { g.beginPath(); g.moveTo(x + 10, y); g.bezierCurveTo(x + 22, y - 12, x + 36, y + 12, x + 48, y); g.stroke() }
      if (j < 3) { g.beginPath(); g.moveTo(x, y + 10); g.lineTo(x, y + 48); g.stroke() }
    }
  }
  g.strokeStyle = 'rgba(169,156,240,0.9)'
  g.strokeRect(12, 12, size - 24, size - 24)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function buildComputer(compact: boolean) {
  const root = new THREE.Group()
  const disposables: { dispose: () => void }[] = []
  const track = <T extends { dispose: () => void }>(x: T) => (disposables.push(x), x)

  const plate = track(new THREE.MeshPhysicalMaterial({ color: '#93a6ae', metalness: 1, roughness: 0.34, clearcoat: 0.3, clearcoatRoughness: 0.2 }))
  const darkMetal = track(new THREE.MeshPhysicalMaterial({ color: '#5d7079', metalness: 1, roughness: 0.35 }))
  const cable = track(new THREE.MeshPhysicalMaterial({ color: '#b9c9cf', metalness: 0.9, roughness: 0.3 }))
  const glowCyan = track(new THREE.MeshBasicMaterial({ color: CYAN.clone().multiplyScalar(0.85), toneMapped: false }))
  const glowViolet = track(new THREE.MeshBasicMaterial({ color: VIOLET.clone().multiplyScalar(0.8), toneMapped: false }))

  const radial = compact ? 48 : 96
  TIERS.forEach((t, i) => {
    const disc = new THREE.Mesh(track(new THREE.CylinderGeometry(t.r, t.r, 0.09, radial)), plate)
    disc.position.y = t.y
    root.add(disc)
    // Inner ring of the plate, slightly recessed.
    const inner = new THREE.Mesh(track(new THREE.CylinderGeometry(t.r * 0.72, t.r * 0.72, 0.12, radial)), darkMetal)
    inner.position.y = t.y
    root.add(inner)
    // Glowing rim.
    const rim = new THREE.Mesh(track(new THREE.TorusGeometry(t.r + 0.015, 0.018, 8, radial * 2)), i % 2 ? glowViolet : glowCyan)
    rim.rotation.x = Math.PI / 2
    rim.position.y = t.y
    root.add(rim)

    const next = TIERS[i + 1]
    if (!next) return
    // Support rods.
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + Math.PI / 4
      const rr = Math.min(t.r, next.r) * 0.86
      const rod = new THREE.Mesh(track(new THREE.CylinderGeometry(0.035, 0.035, t.y - next.y, 12)), plate)
      rod.position.set(Math.cos(a) * rr, (t.y + next.y) / 2, Math.sin(a) * rr)
      root.add(rod)
    }
    // Coaxial cables spiralling down between tiers.
    const cables = compact ? 6 : 10
    for (let k = 0; k < cables; k++) {
      const a0 = (k / cables) * Math.PI * 2
      const pts: THREE.Vector3[] = []
      for (let s = 0; s <= 12; s++) {
        const f = s / 12
        const a = a0 + f * 0.9
        const r = THREE.MathUtils.lerp(t.r * 0.55, next.r * 0.55, f) + Math.sin(f * Math.PI) * 0.12
        pts.push(new THREE.Vector3(Math.cos(a) * r, THREE.MathUtils.lerp(t.y, next.y, f), Math.sin(a) * r))
      }
      const tube = new THREE.Mesh(track(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.018, 6)), cable)
      root.add(tube)
    }
  })

  // Central column of stacked cans.
  ;[[1.75, 0.34], [0.65, 0.28], [-0.45, 0.24], [-1.4, 0.2]].forEach(([y, r]) => {
    const can = new THREE.Mesh(track(new THREE.CylinderGeometry(r, r, 0.62, 48)), plate)
    can.position.y = y
    root.add(can)
    const band = new THREE.Mesh(track(new THREE.TorusGeometry(r + 0.005, 0.012, 6, 64)), glowCyan)
    band.rotation.x = Math.PI / 2
    band.position.y = y
    root.add(band)
  })

  // Mount above the top plate.
  const mount = new THREE.Mesh(track(new THREE.CylinderGeometry(0.22, 0.32, 1.4, 32)), darkMetal)
  mount.position.y = 3.1
  root.add(mount)

  // Qubit chip and its glowing core under the lowest tier.
  const chipTex = track(chipTexture())
  const chip = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.62, 0.05, 0.62)),
    [plate, plate, track(new THREE.MeshBasicMaterial({ map: chipTex, toneMapped: false })), plate, plate, plate],
  )
  chip.position.y = -2.25
  root.add(chip)
  const coreMat = track(new THREE.MeshBasicMaterial({ color: CYAN.clone().multiplyScalar(1.3), toneMapped: false }))
  const core = new THREE.Mesh(track(new THREE.SphereGeometry(0.16, 32, 32)), coreMat)
  core.position.y = -2.55
  root.add(core)
  const halo = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.42, 32, 32)),
    track(new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.06, toneMapped: false, depthWrite: false })),
  )
  halo.position.y = -2.55
  root.add(halo)

  // Energy orbits around the whole machine.
  const orbits: THREE.Mesh[] = []
  ;[[2.55, 0.35, glowCyan], [2.9, -0.5, glowViolet], [3.25, 0.9, glowCyan]].forEach(([r, tilt, mat]) => {
    const ring = new THREE.Mesh(track(new THREE.TorusGeometry(r as number, 0.006, 6, 220)), mat as THREE.Material)
    ring.rotation.set(Math.PI / 2 + (tilt as number) * 0.4, tilt as number, 0)
    root.add(ring)
    orbits.push(ring)
  })
  const electrons = orbits.map((ring, i) => {
    const e = new THREE.Mesh(track(new THREE.SphereGeometry(0.05, 16, 16)), i === 1 ? glowViolet : glowCyan)
    ring.add(e)
    return e
  })

  // Floating qubit particles.
  const count = compact ? 260 : 600
  const pos = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const r = 2.2 + Math.random() * 2.6
    const th = Math.random() * Math.PI * 2
    pos[i * 3] = Math.cos(th) * r
    pos[i * 3 + 1] = (Math.random() - 0.5) * 6
    pos[i * 3 + 2] = Math.sin(th) * r
  }
  const pGeo = track(new THREE.BufferGeometry())
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const particles = new THREE.Points(pGeo, track(new THREE.PointsMaterial({ color: CYAN, size: 0.028, transparent: true, opacity: 0.45, toneMapped: false, depthWrite: false })))
  root.add(particles)

  return { root, core, halo, orbits, electrons, particles, dispose: () => disposables.forEach((d) => d.dispose()) }
}

/** Real-time 3D quantum computer for the home hero; turns toward the cursor. Calls `onUnsupported` when WebGL is unavailable. */
export default function QuantumComputer3D({ onUnsupported }: { onUnsupported?: () => void }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(paused)
  useEffect(() => { pausedRef.current = paused }, [paused])
  const unsupportedRef = useRef(onUnsupported)
  useEffect(() => { unsupportedRef.current = onUnsupported }, [onUnsupported])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    } catch {
      unsupportedRef.current?.()
      return
    }
    const compact = window.matchMedia('(max-width: 767px)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.25 : 1.75))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.75
    renderer.setClearColor(BG, 1)
    renderer.domElement.setAttribute('role', 'img')
    renderer.domElement.setAttribute('aria-label', 'An original 3D illustration of a quantum computer: stacked metal plates with glowing rims, coiled cables and a glowing qubit chip, turning toward the cursor.')
    wrap.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = envTex
    scene.environmentIntensity = 0.32

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
    camera.position.set(0, 0.4, compact ? 17 : 14)

    const key = new THREE.PointLight(CYAN, 16, 20, 1.6)
    key.position.set(3, 2, 4)
    const rim = new THREE.PointLight(VIOLET, 14, 20, 1.6)
    rim.position.set(-4, -1, -2)
    const under = new THREE.PointLight(CYAN, 18, 8, 2)
    under.position.set(0, -2.6, 0.6)
    scene.add(key, rim, under, new THREE.AmbientLight(0x6b8a94, 0.35))

    const machine = buildComputer(compact)
    const tilt = new THREE.Group()
    tilt.add(machine.root)
    tilt.position.y = compact ? 2.9 : 1.35
    tilt.scale.setScalar(compact ? 0.72 : 0.88)
    scene.add(tilt)

    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), compact ? 0.22 : 0.28, 0.35, 0.9)
    composer.addPass(bloom)
    composer.addPass(new OutputPass())

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
    let visible = true, frame = 0, last = performance.now(), time = 0, spin = 0, alive = true

    const resize = () => {
      const { width, height } = wrap.getBoundingClientRect()
      if (!width || !height) return
      renderer.setSize(width, height, false)
      composer.setSize(width, height)
      bloom.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      render()
    }
    const render = () => {
      const tx = pointer.x, ty = pointer.y
      tilt.rotation.y = tx * 0.55
      tilt.rotation.x = ty * 0.22
      machine.root.rotation.y = spin
      key.position.set(3 + tx * 4, 2 - ty * 3, 4)
      camera.position.x = tx * 0.6
      camera.position.y = 0.4 - ty * 0.35
      camera.lookAt(0, 0.6, 0)
      const pulse = 0.5 + 0.5 * Math.sin(time * 2.2)
      machine.core.scale.setScalar(1 + pulse * 0.25)
      ;(machine.halo.material as THREE.MeshBasicMaterial).opacity = 0.03 + pulse * 0.05
      under.intensity = 6 + pulse * 4
      machine.orbits.forEach((o, i) => { o.rotation.z = time * (0.25 + i * 0.12) * (i % 2 ? -1 : 1) })
      machine.electrons.forEach((e, i) => {
        const r = (machine.orbits[i].geometry as THREE.TorusGeometry).parameters.radius
        const a = time * (0.9 + i * 0.35)
        e.position.set(Math.cos(a) * r, Math.sin(a) * r, 0)
      })
      machine.particles.rotation.y = -time * 0.05
      composer.render()
    }
    const running = () => alive && visible && !document.hidden && !reduced.matches && !pausedRef.current
    const tick = (now: number) => {
      frame = 0
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      // Pointer easing keeps running even when paused so the machine still faces the cursor.
      pointer.x += (pointer.tx - pointer.x) * 0.06
      pointer.y += (pointer.ty - pointer.y) * 0.06
      if (running()) { time += dt; spin += dt * 0.12 }
      render()
      if (alive && visible && !document.hidden) frame = requestAnimationFrame(tick)
    }
    const start = () => {
      cancelAnimationFrame(frame)
      last = performance.now()
      if (alive && visible && !document.hidden) frame = requestAnimationFrame(tick)
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      pointer.tx = e.clientX / window.innerWidth * 2 - 1
      pointer.ty = e.clientY / window.innerHeight * 2 - 1
    }
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return
      pointer.tx = THREE.MathUtils.clamp(e.gamma / 30, -1, 1)
      pointer.ty = THREE.MathUtils.clamp((e.beta - 45) / 30, -1, 1)
    }
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; start() })
    const ro = new ResizeObserver(resize)
    io.observe(wrap); ro.observe(wrap)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('deviceorientation', onOrient, { passive: true })
    document.addEventListener('visibilitychange', start)
    resize()
    start()

    return () => {
      alive = false
      cancelAnimationFrame(frame)
      io.disconnect(); ro.disconnect()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('deviceorientation', onOrient)
      document.removeEventListener('visibilitychange', start)
      machine.dispose()
      envTex.dispose(); pmrem.dispose()
      composer.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return (
    <div className="quantum-core">
      <div ref={wrapRef} className="q3d-stage" />
      <div className="core-caption"><span className="signal-dot" /> QUANTUM CORE <span className="text-white/35">/ LIVING INTELLIGENCE</span></div>
      <button className="core-toggle" type="button" aria-label={paused ? 'Play animation' : 'Pause animation'} aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? <Play size={13} /> : <Pause size={13} />}</button>
    </div>
  )
}
