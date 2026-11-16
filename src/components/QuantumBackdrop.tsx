import { useEffect, useRef } from 'react'

/*
 * The Quantum AI Labs signature backdrop: a quantum interference field.
 * Three wave sources drift on slow orbits; where their waves cancel, thin cyan
 * nodal lines appear, and a qubit lattice of dots brightens with the amplitude.
 * Scroll bends the field; it does not follow the mouse. Rendered in WebGL at reduced resolution,
 * throttled, and paused when the tab is hidden. Reduced motion shows one frame.
 */

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`

const FRAG = `precision mediump float;
uniform vec2 res;uniform float t;uniform float scroll;
float wave(vec2 uv, vec2 src, float k, float w){float d=length(uv-src);return sin(d*k-t*w)/(1.0+d*1.6);}
void main(){
  vec2 base=(gl_FragCoord.xy-0.5*res)/res.y;
  vec2 uv=base;
  uv.y+=sin(scroll*0.55)*0.4;
  uv.x+=sin(scroll*0.31)*0.15;
  float s=t*0.07;
  vec2 a=vec2(0.55+0.25*cos(s*1.3),0.18+0.22*sin(s*1.7));
  vec2 b=vec2(-0.6+0.2*sin(s*1.1),-0.25+0.2*cos(s*0.9));
  vec2 c=vec2(0.1*cos(s*0.6),0.55+0.18*sin(s*1.2)+0.2*cos(scroll*0.7));
  float f=wave(uv,a,26.0,1.1)+wave(uv,b,22.0,0.9)+0.8*wave(uv,c,30.0,1.3);
  float lines=(1.0-smoothstep(0.0,0.035,abs(f)))*0.55;
  vec2 g=fract(uv*34.0)-0.5;
  float dots=(1.0-smoothstep(0.0,0.09,length(g)))*smoothstep(0.08,0.55,abs(f));
  float vign=(1.0-smoothstep(0.15,1.25,length(base*vec2(0.85,1.0))));
  vec3 cyan=vec3(0.36,0.92,0.96);
  vec3 violet=vec3(0.58,0.52,0.95);
  vec3 col=mix(cyan,violet,smoothstep(-0.4,0.6,uv.x-uv.y*0.5)*0.55);
  float glow=0.06*(1.0-smoothstep(0.0,0.9,length(uv-a)))+0.04*(1.0-smoothstep(0.0,0.8,length(uv-b)));
  float i=(lines*0.55+dots*0.42+glow)*vign;
  gl_FragColor=vec4(col*i,1.0);
}`

export default function QuantumBackdrop() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' })
    if (!gl) return

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const uRes = gl.getUniformLocation(prog, 'res')
    const uT = gl.getUniformLocation(prog, 't')
    const uScroll = gl.getUniformLocation(prog, 'scroll')

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const compact = window.matchMedia('(max-width: 767px)')
    let scroll = 0, targetScroll = 0
    let frame = 0, last = 0, time = 8, alive = true

    const render = () => {
      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.uniform1f(uT, time)
      gl.uniform1f(uScroll, scroll)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    const resize = () => {
      // Half resolution keeps the shader cheap; the field is soft by design.
      const scale = compact.matches ? 0.5 : 0.6
      canvas.width = Math.max(1, Math.round(window.innerWidth * scale))
      canvas.height = Math.max(1, Math.round(window.innerHeight * scale))
      gl.viewport(0, 0, canvas.width, canvas.height)
      render()
    }
    const running = () => alive && !document.hidden && !reduced.matches
    const tick = (now: number) => {
      frame = 0
      if (!running()) return
      if (now - last >= 1000 / 30) {
        time += Math.min((now - last) / 1000, 0.05)
        last = now
        scroll += (targetScroll - scroll) * 0.06
        render()
      }
      frame = requestAnimationFrame(tick)
    }
    const sync = () => {
      cancelAnimationFrame(frame)
      frame = 0
      last = performance.now()
      render()
      if (running()) frame = requestAnimationFrame(tick)
    }
    const onScroll = () => {
      targetScroll = window.scrollY / Math.max(window.innerHeight, 1)
    }

    resize()
    onScroll()
    scroll = targetScroll
    sync()
    requestAnimationFrame(() => wrap.classList.add('is-ready'))
    window.addEventListener('resize', resize)
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('visibilitychange', sync)
    reduced.addEventListener('change', sync)
    return () => {
      alive = false
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', sync)
      reduced.removeEventListener('change', sync)
      gl.deleteBuffer(buf)
      gl.deleteProgram(prog)
    }
  }, [])

  return (
    <div ref={wrapRef} className="qai-backdrop" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  )
}
