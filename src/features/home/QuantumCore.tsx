import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'

const TAU = Math.PI * 2
type V3 = { x: number; y: number; z: number }

/**
 * The Quantum AI Labs hero core. Layers, back to front:
 * a rotating instrument dial, interference ripples on the equatorial plane,
 * a breathing particle shell, three tilted electron orbits with light trails,
 * entanglement beams between shell particles, and a pulsing energy core.
 * Canvas 2D with additive blending; throttled, paused off-screen and for reduced motion.
 */
export default function QuantumCore() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timeRef = useRef(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const compact = window.matchMedia('(max-width: 767px)')

    const count = compact.matches ? 700 : 1400
    const golden = Math.PI * (3 - Math.sqrt(5))
    const shell = Array.from({ length: count }, (_, i) => {
      const y = 1 - (i / (count - 1)) * 2
      const r = Math.sqrt(1 - y * y)
      const th = golden * i
      return { x: Math.cos(th) * r, y, z: Math.sin(th) * r, seed: (i * 9301 + 49297) % 233280 / 233280 }
    })
    const orbits = [
      { r: 1.38, tiltX: 1.15, tiltZ: 0.35, speed: 0.9, color: '143,241,245' },
      { r: 1.58, tiltX: 1.25, tiltZ: -0.9, speed: -0.65, color: '169,156,240' },
      { r: 1.78, tiltX: 0.55, tiltZ: 1.6, speed: 0.5, color: '143,241,245' },
    ]
    const trails: { x: number; y: number }[][] = orbits.map(() => [])
    let beams: { a: number; b: number; born: number }[] = []

    let width = 0, height = 0, frame = 0, last = 0
    let time = timeRef.current, visible = false, alive = true
    const ptr = { x: 0, y: 0, tx: 0, ty: 0 }

    const draw = () => {
      ctx.globalCompositeOperation = 'source-over'
      ctx.clearRect(0, 0, width, height)
      const cx = width / 2
      const cy = height * (compact.matches ? 0.25 : 0.38)
      const R = Math.min(width, height) * (compact.matches ? 0.2 : 0.235)
      const ay = time * 0.18 + ptr.x * 0.5
      const ax = 0.42 + ptr.y * 0.3
      const cY = Math.cos(ay), sY = Math.sin(ay), cX = Math.cos(ax), sX = Math.sin(ax)
      const project = (p: V3, scale = 1) => {
        const x1 = p.x * cY + p.z * sY
        const z1 = p.z * cY - p.x * sY
        const y2 = p.y * cX - z1 * sX
        const z2 = p.y * sX + z1 * cX
        const persp = 3.4 / (3.4 + z2)
        return { x: cx + x1 * R * scale * persp, y: cy + y2 * R * scale * persp, z: z2, s: persp }
      }

      // Ambient bloom.
      const pulse = 0.5 + 0.5 * Math.sin(time * 1.3)
      const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 2.6)
      bloom.addColorStop(0, `rgba(79,230,238,${0.16 + pulse * 0.06})`)
      bloom.addColorStop(0.35, 'rgba(40,120,150,0.06)')
      bloom.addColorStop(1, 'rgba(4,7,10,0)')
      ctx.fillStyle = bloom
      ctx.fillRect(0, 0, width, height)

      ctx.globalCompositeOperation = 'lighter'

      // Instrument dial.
      const dialR = R * 2.15
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(time * 0.05)
      for (let i = 0; i < 180; i++) {
        const a = (i / 180) * TAU
        const long = i % 15 === 0
        const inner = dialR - (long ? 12 : 5)
        ctx.strokeStyle = `rgba(143,241,245,${long ? 0.45 : 0.14})`
        ctx.lineWidth = long ? 1.2 : 0.8
        ctx.beginPath()
        ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner)
        ctx.lineTo(Math.cos(a) * dialR, Math.sin(a) * dialR)
        ctx.stroke()
      }
      ctx.lineWidth = 2
      ctx.strokeStyle = 'rgba(143,241,245,0.55)'
      ctx.beginPath(); ctx.arc(0, 0, dialR + 8, -0.4, 0.5); ctx.stroke()
      ctx.strokeStyle = 'rgba(169,156,240,0.45)'
      ctx.beginPath(); ctx.arc(0, 0, dialR + 8, Math.PI - 0.2, Math.PI + 0.35); ctx.stroke()
      ctx.restore()
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(-time * 0.09)
      ctx.setLineDash([2, 10])
      ctx.strokeStyle = 'rgba(143,241,245,0.18)'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.arc(0, 0, dialR * 0.9, 0, TAU); ctx.stroke()
      ctx.setLineDash([])
      ctx.restore()

      // Interference ripples on the equatorial plane.
      for (let k = 0; k < 4; k++) {
        const phase = (time * 0.22 + k / 4) % 1
        const rr = 0.35 + phase * 1.9
        const alpha = Math.sin(phase * Math.PI) * 0.35
        ctx.strokeStyle = `rgba(143,241,245,${alpha})`
        ctx.lineWidth = 1
        ctx.beginPath()
        for (let i = 0; i <= 96; i++) {
          const t = (i / 96) * TAU
          const p = project({ x: Math.cos(t) * rr, y: 0, z: Math.sin(t) * rr })
          if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y)
        }
        ctx.stroke()
      }

      // Particle shell.
      const projected: { x: number; y: number; z: number }[] = []
      for (const p of shell) {
        const wave = 1 + 0.06 * Math.sin(p.y * 7 + time * 1.6) * Math.cos(Math.atan2(p.z, p.x) * 4 - time * 0.9)
        const q = project({ x: p.x * wave, y: p.y * wave, z: p.z * wave })
        projected.push(q)
        const front = (1 - q.z) / 2
        const twinkle = 0.65 + 0.35 * Math.sin(time * 3 + p.seed * 40)
        const a = (0.06 + front * 0.55) * twinkle
        const size = (0.7 + front * 1.5) * q.s
        ctx.fillStyle = p.seed < 0.12 ? `rgba(169,156,240,${a})` : `rgba(143,241,245,${a})`
        ctx.fillRect(q.x - size / 2, q.y - size / 2, size, size)
      }

      // Entanglement beams between pairs of shell particles.
      if (!beams.length || time - beams[beams.length - 1].born > 0.55) {
        beams.push({ a: Math.floor(Math.random() * count), b: Math.floor(Math.random() * count), born: time })
      }
      beams = beams.filter((b) => time - b.born < 2.2)
      for (const b of beams) {
        const life = (time - b.born) / 2.2
        const alpha = Math.sin(life * Math.PI) * 0.55
        const pa = projected[b.a], pb = projected[b.b]
        const grad = ctx.createLinearGradient(pa.x, pa.y, pb.x, pb.y)
        grad.addColorStop(0, `rgba(200,252,255,${alpha})`)
        grad.addColorStop(0.5, `rgba(143,241,245,${alpha * 0.25})`)
        grad.addColorStop(1, `rgba(169,156,240,${alpha})`)
        ctx.strokeStyle = grad
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(pa.x, pa.y)
        ctx.quadraticCurveTo(cx + (pa.x + pb.x - 2 * cx) * 0.15, cy + (pa.y + pb.y - 2 * cy) * 0.15, pb.x, pb.y)
        ctx.stroke()
        for (const p of [pa, pb]) {
          ctx.fillStyle = `rgba(220,255,255,${alpha})`
          ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, TAU); ctx.fill()
        }
      }

      // Electron orbits with trails.
      orbits.forEach((o, idx) => {
        const cz = Math.cos(o.tiltZ), sz = Math.sin(o.tiltZ), ctx2 = Math.cos(o.tiltX), stx = Math.sin(o.tiltX)
        const onOrbit = (t: number): V3 => {
          const x0 = Math.cos(t) * o.r, z0 = Math.sin(t) * o.r
          const y1 = -z0 * stx, z1 = z0 * ctx2
          return { x: x0 * cz - y1 * sz, y: x0 * sz + y1 * cz, z: z1 }
        }
        for (let i = 0; i < 120; i++) {
          const a = project(onOrbit((i / 120) * TAU))
          const b = project(onOrbit(((i + 1) / 120) * TAU))
          ctx.strokeStyle = `rgba(${o.color},${0.05 + ((1 - a.z) / 2) * 0.3})`
          ctx.lineWidth = 0.9
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
        }
        const e = project(onOrbit(time * o.speed + idx * 2.1))
        const trail = trails[idx]
        trail.push({ x: e.x, y: e.y })
        if (trail.length > 26) trail.shift()
        for (let i = 1; i < trail.length; i++) {
          ctx.strokeStyle = `rgba(${o.color},${(i / trail.length) * 0.8})`
          ctx.lineWidth = (i / trail.length) * 3
          ctx.beginPath(); ctx.moveTo(trail[i - 1].x, trail[i - 1].y); ctx.lineTo(trail[i].x, trail[i].y); ctx.stroke()
        }
        const glow = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, 14)
        glow.addColorStop(0, `rgba(255,255,255,0.95)`)
        glow.addColorStop(0.3, `rgba(${o.color},0.7)`)
        glow.addColorStop(1, `rgba(${o.color},0)`)
        ctx.fillStyle = glow
        ctx.beginPath(); ctx.arc(e.x, e.y, 14, 0, TAU); ctx.fill()
      })

      // Energy core.
      const coreR = R * (0.34 + pulse * 0.05)
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR)
      core.addColorStop(0, 'rgba(255,255,255,0.95)')
      core.addColorStop(0.18, 'rgba(200,252,255,0.75)')
      core.addColorStop(0.45, 'rgba(79,230,238,0.35)')
      core.addColorStop(1, 'rgba(79,230,238,0)')
      ctx.fillStyle = core
      ctx.beginPath(); ctx.arc(cx, cy, coreR, 0, TAU); ctx.fill()
      // Lens streak.
      const streak = ctx.createLinearGradient(cx - R * 1.6, cy, cx + R * 1.6, cy)
      streak.addColorStop(0, 'rgba(143,241,245,0)')
      streak.addColorStop(0.5, `rgba(200,252,255,${0.35 + pulse * 0.2})`)
      streak.addColorStop(1, 'rgba(143,241,245,0)')
      ctx.fillStyle = streak
      ctx.fillRect(cx - R * 1.6, cy - 0.75, R * 3.2, 1.5)
      // Inner spinning qubit rings.
      for (let k = 0; k < 3; k++) {
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(time * (0.8 + k * 0.3) + (k * TAU) / 3)
        ctx.strokeStyle = `rgba(200,252,255,${0.35 - k * 0.07})`
        ctx.lineWidth = 1
        ctx.beginPath(); ctx.ellipse(0, 0, coreR * 0.75, coreR * 0.26, 0, 0, TAU); ctx.stroke()
        ctx.restore()
      }
      ctx.globalCompositeOperation = 'source-over'
    }

    const running = () => alive && visible && !document.hidden && !reduced.matches && !paused
    const tick = (now: number) => {
      frame = 0
      if (!running()) return
      if (now - last >= 1000 / (compact.matches ? 30 : 50)) {
        time += Math.min((now - last) / 1000, 0.05)
        timeRef.current = time
        last = now
        ptr.x += (ptr.tx - ptr.x) * 0.05
        ptr.y += (ptr.ty - ptr.y) * 0.05
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
      trails.forEach((t) => (t.length = 0))
      sync()
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      ptr.tx = e.clientX / window.innerWidth - 0.5
      ptr.ty = e.clientY / window.innerHeight - 0.5
    }
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync() }, { threshold: 0 })
    const ro = new ResizeObserver(resize)
    io.observe(canvas); ro.observe(canvas)
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('visibilitychange', sync)
    reduced.addEventListener('change', sync)
    compact.addEventListener('change', resize)
    return () => {
      alive = false; cancelAnimationFrame(frame); io.disconnect(); ro.disconnect()
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('visibilitychange', sync)
      reduced.removeEventListener('change', sync)
      compact.removeEventListener('change', resize)
    }
  }, [paused])

  return (
    <div className="quantum-core">
      <div className="core-caption"><span className="signal-dot" /> QUANTUM CORE <span className="text-white/35">/ LIVING INTELLIGENCE</span></div>
      <canvas ref={canvasRef} role="img" aria-label="An original visualization of a glowing quantum core: a particle shell, orbiting electrons with light trails and entanglement beams. An artistic illustration, not a quantum simulation." />
      <button className="core-toggle" type="button" aria-label={paused ? 'Play core animation' : 'Pause core animation'} aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? <Play size={13} /> : <Pause size={13} />}</button>
    </div>
  )
}
