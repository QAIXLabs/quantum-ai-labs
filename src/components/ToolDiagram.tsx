import type { CSSProperties } from 'react'

type FlowProps = { d: string; live: boolean; delay?: number; dashed?: boolean }

/** A diagram line; when live, a packet of light travels along it. */
function Flow({ d, live, delay = 0, dashed = false }: FlowProps) {
  return (
    <>
      <path d={d} strokeDasharray={dashed ? '3 5' : undefined} />
      {live && <path className="spark" d={d} pathLength={100} style={{ animationDelay: `${delay}s` } as CSSProperties} />}
    </>
  )
}

/** Line diagram that identifies each tool. `live` adds travelling light, pulsing nodes and per-tool motion. */
export default function ToolDiagram({ id, live = false, className = '' }: { id: string; live?: boolean; className?: string }) {
  return (
    <svg className={`tool-diagram diagram-${id} ${live ? 'is-live' : ''} ${className}`} viewBox="0 0 320 130" fill="none" aria-hidden="true">
      {id === 'assistant' ? (
        <>
          <g className="wave-sway">
            {[0, 1, 2, 3, 4].map((i) => (
              <Flow key={i} live={live} delay={i * -0.55} d={`M20 ${80 + i * 6} C70 ${10 + i * 7},90 ${130 - i * 7},145 ${60 + i * 5} S230 ${20 + i * 8},300 ${55 + i * 9}`} />
            ))}
          </g>
          {[50, 110, 170, 230, 290].map((x, i) => (
            <g key={x}>
              <path className="scan-line" style={{ animationDelay: `${i * 0.4}s` }} d={`M${x} 20V110`} opacity=".15" />
              <circle className="pulse" style={{ animationDelay: `${i * 0.35}s` }} cx={x} cy={65 + Math.sin(i * 2) * 14} r="3" />
            </g>
          ))}
        </>
      ) : id === 'pqc' ? (
        <>
          <g className="shield-spin">
            {[0, 1, 2, 3, 4].map((i) => (
              <path key={i} className="layer" style={{ animationDelay: `${i * 0.28}s` }} d={`M160 ${15 + i * 9} L${222 - i * 12} ${38 + i * 5} L${211 - i * 11} ${83 - i * 2} L160 ${117 - i * 9} L${109 + i * 11} ${83 - i * 2} L${98 + i * 12} ${38 + i * 5}Z`} />
            ))}
          </g>
          <Flow live={live} dashed d="M30 65H98" />
          <Flow live={live} dashed delay={-1.2} d="M290 65H222" />
          <circle className="pulse" cx="160" cy="65" r="5" />
        </>
      ) : id === 'web3' ? (
        <>
          {['M35 65H105', 'M105 65L155 30H225L285 65', 'M105 65L155 100H225L285 65', 'M155 30L225 100', 'M155 100L225 30', 'M155 30V100', 'M225 30V100'].map((d, i) => (
            <Flow key={d} live={live} delay={i * -0.45} d={d} />
          ))}
          {[[35, 65], [105, 65], [155, 30], [155, 100], [225, 30], [225, 100], [285, 65]].map(([x, y], i) => (
            <g key={`${x}-${y}`}>
              <circle cx={x} cy={y} r="9" fill="var(--color-lab-bg)" />
              <circle className="pulse" style={{ animationDelay: `${i * 0.3}s` }} cx={x} cy={y} r="2" />
            </g>
          ))}
        </>
      ) : id === 'checks' ? (
        <>
          {/* A scanner: rings around a target, a sweeping beam and flagged points. */}
          {[16, 30, 44].map((r, i) => (
            <circle key={r} className="layer" style={{ animationDelay: `${i * 0.35}s` }} cx="160" cy="65" r={r} />
          ))}
          <path d="M100 65H220M160 10V120" strokeDasharray="2 6" opacity=".25" />
          <g className="scan-sweep">
            <path d="M160 65L198 43" />
            <path d="M160 65L198 43A44 44 0 0 1 204 65Z" fill="currentColor" fillOpacity=".08" stroke="none" />
          </g>
          <Flow live={live} d="M30 40H96" />
          <Flow live={live} delay={-1.2} d="M224 90H290" />
          {[[183, 50], [140, 82], [172, 95]].map(([x, y], i) => (
            <circle key={`${x}-${y}`} className="pulse" style={{ animationDelay: `${i * 0.5}s` }} cx={x} cy={y} r="3" />
          ))}
        </>
      ) : (
        <>
          <path d="M70 20V110M160 20V110M250 20V110" strokeDasharray="2 6" opacity=".2" />
          <g className="swap-out">
            <Flow live={live} d="M45 46H220L240 65L220 84H80" />
            <Flow live={live} delay={-1.1} d="M240 65H285" />
            <path d="M45 46L60 32M45 46L60 60" />
          </g>
          <g className="swap-back">
            <path d="M80 84L95 70M80 84L95 98" />
          </g>
          <circle className="pulse" cx="160" cy="46" r="5" />
          <circle className="pulse" style={{ animationDelay: '.8s' }} cx="160" cy="84" r="5" />
        </>
      )}
    </svg>
  )
}
