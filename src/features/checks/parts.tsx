import { verdictTone, type HoldersVerdict, type NarrativeVerdict } from './api'

export function VerdictBadge({ verdict, label }: { verdict: NarrativeVerdict | HoldersVerdict; label?: string }) {
  return (
    <span className={`verdict verdict-${verdictTone(verdict)}`}>
      {label && <span className="verdict-label">{label}</span>}
      {verdict}
    </span>
  )
}

export function CoinAvatar({ image, symbol, size = 48 }: { image: string | null; symbol: string; size?: number }) {
  return (
    <span className="coin-avatar" style={{ width: size, height: size }}>
      {image ? <img src={image} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <span>{symbol.slice(0, 2).toUpperCase()}</span>}
    </span>
  )
}

/** Horizontal 0–100 meter with the verdict scale underneath. */
export function ScoreBar({ score, verdict, scale }: { score: number; verdict: NarrativeVerdict | HoldersVerdict; scale: string[] }) {
  return (
    <div className="score-bar">
      <div className="score-track">
        <span className={`score-fill verdict-${verdictTone(verdict)}`} style={{ width: `${Math.max(3, score)}%` }} />
      </div>
      <div className="score-scale">
        {scale.map((s) => (
          <span key={s}>{s}</span>
        ))}
      </div>
    </div>
  )
}

/** Circular total score. */
export function ScoreRing({ score }: { score: number }) {
  const r = 52
  const c = 2 * Math.PI * r
  return (
    <div className="score-ring" role="img" aria-label={`Total score ${score} out of 100`}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r={r} className="score-ring-track" />
        <circle cx="60" cy="60" r={r} className="score-ring-fill" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} />
      </svg>
      <span>
        <b>{score}</b>/100
      </span>
    </div>
  )
}
