import { useEffect, useRef } from 'react'

const TAU = Math.PI * 2

type P = { x: number; y: number; z: number; tone: number; nx: number; ny: number; nz: number; ridge: number }
type N = { x: number; y: number; z: number; tone: number }
type Edge = { a: number; b: number; cross: boolean }
type Pulse = { e: number; t: number; speed: number; back: boolean }

/** Small deterministic PRNG so the brain looks the same on every load. */
function rng(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
}

// Hemisphere shape: long front to back (z), fuller toward the back, with a
// temporal lobe bulging low at the sides and a flat inner wall at the fissure.
const HEMI = { w: 0.4, h: 0.56, l: 0.92, gap: 0.045 }
function hemiRadius(ux: number, uy: number, uz: number, side: number) {
  let sx = HEMI.w, sy = HEMI.h
  const sz = HEMI.l * (uz > 0 ? 1 : 0.94)
  if (ux * side < 0) sx *= 0.28
  sy *= 1 - 0.12 * uz
  if (uy < 0) sy *= 0.72 + 0.28 * Math.abs(uz)
  // Temporal lobe: low, slightly forward, on the outer side.
  const temporal = Math.max(0, ux * side) * Math.max(0, -uy) * Math.max(0, 1 - Math.abs(uz - 0.1) * 1.4)
  sx *= 1 + temporal * 0.5
  return { sx, sy, sz }
}
/** Gyri pattern: zero along the sulci (grooves). */
function folds(ux: number, uy: number, uz: number) {
  const lat = Math.asin(Math.max(-1, Math.min(1, uy))), lon = Math.atan2(uz, ux)
  return Math.sin(lat * 9 + Math.sin(lon * 2.6) * 2.2 + uz * 3) * Math.cos(lon * 7 + lat * 2.5)
}

/**
 * Builds the brain as a point cloud: two folded hemispheres with a fissure
 * between them (points gather along the sulci so the folds read as lines), a
 * ridged cerebellum and a brain stem, plus interior neurons wired into a network.
 */
function buildBrain(count: number) {
  const rand = rng(11)
  const golden = Math.PI * (3 - Math.sqrt(5))
  const surface: P[] = []
  const perHemi = Math.round(count * 0.4)
  const pool = Math.round(perHemi * 2.1)
  for (const side of [-1, 1]) {
        for (let i = 0; i < pool; i++) {
      const v = 1 - (i / (pool - 1)) * 2
      const r = Math.sqrt(1 - v * v)
      const th = golden * i
      const ux = Math.cos(th) * r, uy = v, uz = Math.sin(th) * r
      const f = folds(ux, uy, uz)
      const groove = 1 - Math.min(1, Math.abs(f) / 0.22)
      // Keep every point on a groove, a third of the rest.
      if (groove <= 0 && rand() > 0.33) continue
      if (ux * side < -0.2 && rand() > 0.35) continue
      const { sx, sy, sz } = hemiRadius(ux, uy, uz, side)
      const dent = 1 - groove * 0.06
      surface.push({
        x: side * (HEMI.gap + HEMI.w * 0.92) + ux * sx * dent,
        y: 0.12 + uy * sy * dent,
        z: 0.04 + uz * sz * dent,
        nx: ux / sx, ny: uy / sy, nz: uz / sz,
        tone: rand(),
        ridge: groove,
      })
    }
  }
  // Normalise the normals once.
  for (const p of surface) {
    const n = Math.hypot(p.nx, p.ny, p.nz) || 1
    p.nx /= n; p.ny /= n; p.nz /= n
  }
  // Cerebellum (back, below) with horizontal ridges, then the brain stem.
  const rest = count - surface.length
  const cereb = Math.round(rest * 0.78)
  for (let i = 0; i < cereb; i++) {
    const v = 1 - (i / (cereb - 1)) * 2
    const r = Math.sqrt(1 - v * v)
    const th = golden * i
    const ux = Math.cos(th) * r, uy = v, uz = Math.sin(th) * r
    const ridge = Math.max(0, 1 - Math.abs(Math.sin(uy * 11)) / 0.35)
    const k = 1 - ridge * 0.05
    surface.push({ x: ux * 0.5 * k, y: -0.36 + uy * 0.2 * k, z: -0.66 + uz * 0.3 * k, nx: ux, ny: uy, nz: uz, tone: rand(), ridge })
  }
  const stem = rest - cereb
  for (let i = 0; i < stem; i++) {
    const t = i / stem, a = golden * i * 3
    surface.push({ x: Math.cos(a) * 0.11, y: -0.28 - t * 0.62, z: -0.32 - t * 0.12 + Math.sin(a) * 0.11, nx: Math.cos(a), ny: 0, nz: Math.sin(a), tone: rand(), ridge: 0 })
  }
  // Interior neurons: random points inside each hemisphere.
  const neurons: N[] = []
  while (neurons.length < 64) {
    const x = rand() * 2 - 1, y = rand() * 2 - 1, z = rand() * 2 - 1
    if (x * x + y * y + z * z > 0.6) continue
    const side = neurons.length % 2 ? 1 : -1
    neurons.push({ x: side * (HEMI.gap + HEMI.w * 0.92) + x * HEMI.w * 0.85, y: 0.12 + y * HEMI.h * 0.8, z: 0.04 + z * HEMI.l * 0.85, tone: rand() })
  }
  // Wire each neuron to its nearest neighbours.
  const edges: Edge[] = []
  const seen = new Set<string>()
  neurons.forEach((n, i) => {
    const near = neurons
      .map((m, j) => [j, (m.x - n.x) ** 2 + (m.y - n.y) ** 2 + (m.z - n.z) ** 2] as const)
      .filter(([j]) => j !== i)
      .sort((p, q) => p[1] - q[1])
      .slice(0, 3)
    for (const [j] of near) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`
      if (seen.has(key)) continue
      seen.add(key)
      edges.push({ a: i, b: j, cross: Math.sign(n.x) !== Math.sign(neurons[j].x) })
    }
  })
  // "Entanglement" links arcing across the fissure (even index = left, odd = right).
  for (let k = 0; k < 6; k++) edges.push({ a: k * 4, b: (k * 4 + 13) % neurons.length | 1, cross: true })
  return { surface, neurons, edges }
}

/**
 * A quantum brain: a folded point-cloud brain with a firing neural network,
 * signals crossing the hemispheres and a qubit orbit around it. It turns slowly
 * on its own and leans toward the mouse; neurons near the cursor light up.
 * Canvas 2D, throttled, and idle while off-screen.
 */
export default function QuantumBrain({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const compact = window.matchMedia('(max-width: 767px)')
    const { surface, neurons, edges } = buildBrain(compact.matches ? 1100 : 2000)
    const rand = rng(29)
    const pulses: Pulse[] = Array.from({ length: compact.matches ? 10 : 18 }, () => ({ e: Math.floor(rand() * edges.length), t: rand(), speed: 0.35 + rand() * 0.6, back: rand() < 0.5 }))

    let width = 0, height = 0, frame = 0, last = 0, time = 0
    let visible = false, alive = true
    // Mouse lean (smoothed) and cursor position in canvas pixels for the glow.
    const lean = { x: 0, y: 0, tx: 0, ty: 0 }
    const cursor = { x: -9999, y: -9999, on: 0, target: 0 }
    let spin = 0, targetSpin = 0

    const project = (p: { x: number; y: number; z: number }, cy1: number, sy1: number, cx1: number, sx1: number, R: number, cx: number, cyy: number) => {
      const rx = p.x * cy1 + p.z * sy1, rz = p.z * cy1 - p.x * sy1
      const ry = p.y * cx1 - rz * sx1, d = p.y * sx1 + rz * cx1
      const pr = 3.4 / (3.4 + d)
      return { x: cx + rx * R * pr, y: cyy - ry * R * pr, d, pr }
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      const R = Math.min(width, height) * 0.4
      const cx = width / 2, cy = height / 2
      // Three-quarter view that drifts, leans toward the mouse and turns with scroll.
      const ay = -1.38 + Math.sin(time * 0.16) * 0.3 + lean.x * 0.5 + spin * 0.6
      const ax = 0.22 + Math.sin(time * 0.11) * 0.07 - lean.y * 0.3
      const cy1 = Math.cos(ay), sy1 = Math.sin(ay), cx1 = Math.cos(ax), sx1 = Math.sin(ax)
      const P = (p: { x: number; y: number; z: number }) => project(p, cy1, sy1, cx1, sx1, R, cx, cy)
      const near = (x: number, y: number) => cursor.on * Math.exp(-((x - cursor.x) ** 2 + (y - cursor.y) ** 2) / (R * R * 0.08))

      // Qubit orbit behind and in front of the brain.
      ctx.lineWidth = 0.7
      for (const [tilt, phase, col] of [
        [0.5, 0, '143,241,245'],
        [-0.9, 2.1, '169,156,240'],
      ] as const) {
        ctx.beginPath()
        for (let i = 0; i <= 140; i++) {
          const a = (i / 140) * TAU
          const o = P({ x: Math.cos(a) * 1.35, y: Math.sin(a) * Math.sin(tilt) * 1.35 * 0.45, z: Math.sin(a) * Math.cos(tilt) * 1.35 })
          if (i) ctx.lineTo(o.x, o.y)
          else ctx.moveTo(o.x, o.y)
        }
        ctx.strokeStyle = `rgba(${col},0.13)`
        ctx.stroke()
        const a = time * 0.55 + phase
        const q = P({ x: Math.cos(a) * 1.35, y: Math.sin(a) * Math.sin(tilt) * 1.35 * 0.45, z: Math.sin(a) * Math.cos(tilt) * 1.35 })
        ctx.fillStyle = `rgba(${col === '143,241,245' ? '200,252,255' : '206,198,255'},${0.55 + (1 - q.d) * 0.25})`
        ctx.shadowColor = col === '143,241,245' ? '#4fe6ee' : '#8a7cff'
        ctx.shadowBlur = 12
        ctx.beginPath(); ctx.arc(q.x, q.y, 2.4 * q.pr, 0, TAU); ctx.fill()
        ctx.shadowBlur = 0
      }

      // Surface point cloud with a breathing wave running front to back.
      const small = compact.matches ? 0.9 : 1
      for (const p of surface) {
        const wave = 0.5 + 0.5 * Math.sin(p.z * 6 - time * 1.6 + p.y * 2)
        const s = P(p)
        const front = Math.max(0, Math.min(1, (1 - s.d) / 2))
        // Rim light from the rotated normal so the silhouette reads clearly.
        const rnz = p.nz * cy1 - p.nx * sy1
        const nd = p.ny * sx1 + rnz * cx1
        const rim = 1 - Math.abs(nd)
        const facing = nd < 0 ? 1 : 0.3
        const glow = near(s.x, s.y)
        const a = Math.min(1, (0.08 + front * 0.3 + rim * rim * 0.5 + p.ridge * 0.38 + wave * 0.14) * facing + glow * 0.6)
        const size = (0.6 + front * 0.9 + p.ridge * 0.4 + glow * 1.2) * small
        ctx.fillStyle = glow > 0.35 ? `rgba(210,253,255,${a})` : p.tone < 0.16 ? `rgba(169,156,240,${a * 0.9})` : `rgba(143,241,245,${a})`
        ctx.fillRect(s.x - size / 2, s.y - size / 2, size, size)
      }

      // Neural network.
      const proj = neurons.map(P)
      for (const e of edges) {
        const a = proj[e.a], b = proj[e.b]
        const depth = (2 - a.d - b.d) / 4
        const glow = Math.max(near(a.x, a.y), near(b.x, b.y))
        ctx.strokeStyle = e.cross ? `rgba(169,156,240,${0.07 + depth * 0.16 + glow * 0.3})` : `rgba(143,241,245,${0.06 + depth * 0.14 + glow * 0.35})`
        ctx.lineWidth = 0.6 + glow * 0.6
        ctx.beginPath()
        if (e.cross) {
          // Entanglement links arc up over the fissure.
          const mid = P({ x: (neurons[e.a].x + neurons[e.b].x) / 2, y: Math.max(neurons[e.a].y, neurons[e.b].y) + 0.35, z: (neurons[e.a].z + neurons[e.b].z) / 2 })
          ctx.moveTo(a.x, a.y)
          ctx.quadraticCurveTo(mid.x, mid.y, b.x, b.y)
        } else {
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
        }
        ctx.stroke()
      }
      for (const [i, s] of proj.entries()) {
        const glow = near(s.x, s.y)
        const fire = Math.max(0, Math.sin(time * 1.3 + neurons[i].tone * 40)) ** 12
        const r = (1.3 + fire * 1.8 + glow * 1.6) * s.pr
        ctx.fillStyle = `rgba(200,252,255,${0.35 + fire * 0.55 + glow * 0.4})`
        if (fire > 0.3 || glow > 0.3) { ctx.shadowColor = '#4fe6ee'; ctx.shadowBlur = 10 }
        ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, TAU); ctx.fill()
        ctx.shadowBlur = 0
      }

      // Signals travelling along the connections.
      for (const p of pulses) {
        const e = edges[p.e]
        const k = p.back ? 1 - p.t : p.t
        const a = neurons[e.a], b = neurons[e.b]
        let pt = { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k }
        if (e.cross) pt = { ...pt, y: pt.y + Math.sin(k * Math.PI) * 0.35 * 0.5 }
        const s = P(pt)
        ctx.fillStyle = e.cross ? 'rgba(214,206,255,0.95)' : 'rgba(210,253,255,0.95)'
        ctx.shadowColor = e.cross ? '#8a7cff' : '#4fe6ee'
        ctx.shadowBlur = 12
        ctx.beginPath(); ctx.arc(s.x, s.y, 1.9 * s.pr, 0, TAU); ctx.fill()
        ctx.shadowBlur = 0
      }
    }

    const step = (dt: number) => {
      for (const p of pulses) {
        p.t += dt * p.speed
        if (p.t >= 1) {
          // Hop onto a connected edge so signals look like they propagate.
          const at = edges[p.e][p.back ? 'a' : 'b']
          const next = edges.map((e, i) => [e, i] as const).filter(([e]) => e.a === at || e.b === at)
          const [e, i] = next.length ? next[Math.floor(rand() * next.length)] : [edges[0], 0]
          p.e = i
          p.back = e.b === at
          p.t = 0
          p.speed = 0.35 + rand() * 0.6
        }
      }
      lean.x += (lean.tx - lean.x) * 0.05
      lean.y += (lean.ty - lean.y) * 0.05
      cursor.on += (cursor.target - cursor.on) * 0.08
      spin += (targetSpin - spin) * 0.06
    }

    const running = () => alive && visible && !document.hidden && !reduced.matches
    const tick = (now: number) => {
      frame = 0
      if (!running()) return
      if (now - last >= 1000 / (compact.matches ? 30 : 45)) {
        const dt = Math.min((now - last) / 1000, 0.05)
        time += dt
        last = now
        step(dt)
        draw()
      }
      frame = requestAnimationFrame(tick)
    }
    const sync = () => {
      cancelAnimationFrame(frame); frame = 0; last = performance.now()
      draw()
      if (running()) frame = requestAnimationFrame(tick)
    }
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width; height = rect.height
      const dpr = Math.min(window.devicePixelRatio || 1, compact.matches ? 1.5 : 2)
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      sync()
    }
    // The canvas has pointer-events: none (it sits behind the copy), so track the mouse on the window.
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const rect = canvas.getBoundingClientRect()
      lean.tx = Math.max(-1, Math.min(1, (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)))
      lean.ty = Math.max(-1, Math.min(1, (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)))
      cursor.x = e.clientX - rect.left
      cursor.y = e.clientY - rect.top
      const inside = cursor.x > 0 && cursor.y > 0 && cursor.x < rect.width && cursor.y < rect.height
      cursor.target = inside ? 1 : 0
    }
    const onLeave = () => { lean.tx = 0; lean.ty = 0; cursor.target = 0 }
    const onScroll = () => {
      const rect = canvas.getBoundingClientRect()
      targetSpin = ((rect.top + rect.height / 2) / window.innerHeight - 0.5) * -0.9
    }
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync() }, { threshold: 0 })
    const ro = new ResizeObserver(resize)
    io.observe(canvas); ro.observe(canvas)
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('visibilitychange', sync)
    reduced.addEventListener('change', sync)
    onScroll(); spin = targetSpin
    return () => {
      alive = false; cancelAnimationFrame(frame); io.disconnect(); ro.disconnect()
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', sync)
      reduced.removeEventListener('change', sync)
    }
  }, [])

  return <canvas ref={canvasRef} className={className} style={{ display: 'block', width: '100%', height: '100%' }} aria-hidden="true" />
}
