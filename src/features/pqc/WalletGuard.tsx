import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import {
  ArrowUpRight,
  ChevronDown,
  CircleCheck,
  CircleDashed,
  CircleMinus,
  CircleX,
  Layers,
  Link2,
  RefreshCw,
  ScanSearch,
  TriangleAlert,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import { api } from '../../lib/api'
import { CHECK_IDS, CHECK_KINDS, scoreWallet, type Band, type CheckId, type CheckState, type CheckStatus, type Level } from './score'

type Verdict = 'compromised' | 'at_risk' | 'review' | 'no_signs'

type Finding = {
  level: Level
  kind: string
  title: string
  detail: string
  network?: string
  items?: { address: string; note?: string; link: string }[]
}

type GuardResult = {
  address: string
  chain: 'evm' | 'solana'
  verdict: Verdict
  findings: Finding[]
  checks: Record<CheckId, CheckStatus>
  /** Label / value facts behind each check. */
  evidence?: Record<CheckId, [string, string][]>
  coverage: { history: string[]; live: string[]; addresses_checked?: number; token_accounts?: number }
  notes: string[]
  explorer_url: string
  fetched_at: string
}

const STEPS = ['Reading permissions…', 'Reading recent activity…', 'Matching threat lists…', 'Writing the answer…']

/** The plain answer at the top. Steps only appear when there is something to do. */
const ANSWER: Record<Verdict | 'scam_address', { badge: string; tone: 'good' | 'mid' | 'warn' | 'bad'; line: string; steps: string[] }> = {
  scam_address: {
    badge: 'Scam address',
    tone: 'bad',
    line: 'This address is on a scam list. Do not send anything to it.',
    steps: ['If someone asked you to pay this address, stop and do not send.', 'If this is somehow your own wallet, move your assets to a new wallet.'],
  },
  compromised: {
    badge: 'Move now',
    tone: 'bad',
    line: 'Move to a new wallet now. Someone else may be able to take your assets.',
    steps: ['Create a new wallet with a new seed phrase, on a device you trust.', 'Send your assets to it right away, most valuable first.', 'Stop using this wallet.'],
  },
  at_risk: {
    badge: 'Be careful',
    tone: 'warn',
    line: 'This wallet has dealt with scam addresses.',
    steps: [
      'If you ever typed your seed phrase on a website, or did not make the transactions found, move to a new wallet.',
      'Otherwise, remove old permissions and never interact with those addresses again.',
    ],
  },
  review: {
    badge: 'Clean up',
    tone: 'mid',
    line: 'No scams found. A few open permissions are worth removing.',
    steps: ['Open your wallet’s “connected apps” or “token approvals” page and remove the ones you no longer use.'],
  },
  no_signs: { badge: 'No warnings detected', tone: 'good', line: 'No warning signs found in the checks completed.', steps: [] },
}

/** Card and checklist copy for each check, by state. */
const CHECKS: Record<
  CheckId,
  { title: string; item: string; Icon: LucideIcon; line: (s: CheckState, f: Finding[], status: CheckStatus) => string }
> = {
  control: {
    title: 'Permissions & control',
    item: 'Permissions and control',
    Icon: Layers,
    line: (s) =>
      s === 'pass'
        ? 'No risky permissions detected.'
        : s === 'fail'
          ? 'A flagged address or program can move assets.'
          : s === 'review'
            ? 'Open permissions worth removing.'
            : s === 'partial'
              ? 'Partly checked. Some data was unavailable.'
              : 'Could not be checked right now.',
  },
  interactions: {
    title: 'Flagged interactions',
    item: 'Flagged‑address interactions',
    Icon: Link2,
    line: (s, f, status) =>
      s === 'pass'
        ? 'None found in checked activity.'
        : s === 'fail'
          ? f.some((x) => x.kind === 'self_flagged')
            ? 'This address is on a scam list.'
            : 'Funds or permissions went to flagged addresses.'
          : s === 'review'
            ? 'Scam addresses sent tokens in. Ignore them.'
            : s === 'partial'
              ? 'Partly checked. Some data was unavailable.'
              : status === 'unsupported'
                ? 'Not available for Solana yet.'
                : 'Could not be checked right now.',
  },
  lookalike: {
    title: 'Lookalike addresses',
    item: 'Lookalike‑address activity',
    Icon: Users,
    line: (s, _f, status) =>
      s === 'pass'
        ? 'None found in recent transfers.'
        : s === 'fail'
          ? 'You may have paid a lookalike address.'
          : s === 'review'
            ? 'Lookalike addresses seen in your history.'
            : s === 'partial'
              ? 'Partly checked. Some data was unavailable.'
              : status === 'unsupported'
                ? 'Not available for Solana yet.'
                : 'Could not be checked right now.',
  },
}

/** On Solana, check 3 is a behaviour scan instead of a scam-list match (no reliable Solana list exists). */
const SOL_ACTIVITY: (typeof CHECKS)[CheckId] = {
  title: 'Suspicious activity',
  item: 'Suspicious‑activity scan',
  Icon: Link2,
  line: (s, f) =>
    s === 'pass'
      ? 'No drain sweeps or risky tokens found.'
      : s === 'fail'
        ? 'Many tokens left in one transaction.'
        : s === 'review'
          ? f.some((x) => x.kind === 'risky_token')
            ? 'You hold tokens their issuer can take back.'
            : 'Something here is worth reviewing.'
          : s === 'partial'
            ? 'Partly checked. Some data was unavailable.'
            : 'Could not be checked right now.',
}
const labelsFor = (id: CheckId, chain: GuardResult['chain']) => (chain === 'solana' && id === 'interactions' ? SOL_ACTIVITY : CHECKS[id])

const STATE_ICON: Record<CheckState, { Icon: LucideIcon; cls: string; label: string }> = {
  pass: { Icon: CircleCheck, cls: 'text-emerald-300', label: 'Passed' },
  review: { Icon: TriangleAlert, cls: 'text-amber-300', label: 'Review' },
  fail: { Icon: CircleX, cls: 'text-red-300', label: 'Warning' },
  partial: { Icon: CircleDashed, cls: 'text-amber-200/80', label: 'Partly checked' },
  not_run: { Icon: CircleMinus, cls: 'text-white/40', label: 'Not checked' },
}

const BAND: Record<Band | 'none', { color: string; border: string; glow: string; head: string }> = {
  low: { color: '#6ee7b7', border: 'border-emerald-300/50', glow: 'shadow-[0_0_60px_-24px_rgba(110,231,183,0.6)]', head: 'Low observed risk' },
  review: { color: '#fcd34d', border: 'border-amber-300/45', glow: 'shadow-[0_0_60px_-24px_rgba(252,211,77,0.5)]', head: 'Review recommended' },
  action: { color: '#fca5a5', border: 'border-red-300/50', glow: 'shadow-[0_0_60px_-24px_rgba(252,165,165,0.55)]', head: 'Action needed' },
  none: { color: '#ffffff40', border: 'border-white/15', glow: '', head: 'Not enough data to score' },
}

/** Coverage only (no findings): how completely each check ran, in plain words. */
const COVERAGE_STATE: Record<CheckStatus, CheckState> = { ok: 'pass', partial: 'partial', unavailable: 'not_run', unsupported: 'not_run' }
const COVERAGE_TEXT: Record<CheckStatus, string> = {
  ok: 'Fully checked.',
  partial: 'Partly checked. Some of the data it needs could not be read, so it does not count toward the score.',
  unavailable: 'Could not run right now. Try again in a minute.',
  unsupported: 'Not available for this chain yet.',
}

const short = (a: string) => `${a.slice(0, 10)}…${a.slice(-6)}`

function ScoreDial({ score, color }: { score: number | null; color: string }) {
  const r = 86
  const c = 2 * Math.PI * r
  return (
    <div className="relative h-[176px] w-[176px] sm:h-[200px] sm:w-[200px]" role="img" aria-label={score === null ? 'Not scored' : `Wallet check score ${score} out of 100`}>
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="100" cy="100" r={r} fill="none" stroke="#ffffff12" strokeWidth="12" />
        {score !== null && (
          <circle
            cx="100"
            cy="100"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - score / 100)}
            style={{ filter: `drop-shadow(0 0 8px ${color}99)`, transition: 'stroke-dashoffset 1.2s var(--qai-ease)' }}
          />
        )}
      </svg>
      <span className="absolute inset-0 grid place-content-center text-center">
        <b className="font-display text-[56px] font-normal leading-none text-white sm:text-[64px]">{score ?? '—'}</b>
        <span className="mt-1 font-mono text-sm text-white/60">/ 100</span>
      </span>
    </div>
  )
}

function Accordion({ id, title, open, onToggle, children }: { id?: string; title: string; open: boolean; onToggle: (open: boolean) => void; children: ReactNode }) {
  return (
    <details id={id} className="group scroll-mt-28 rounded-[16px] border border-white/10 bg-white/[0.02]" open={open} onToggle={(e) => onToggle((e.currentTarget as HTMLDetailsElement).open)}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm text-white/85 hover:text-white sm:px-5">
        {title}
        <ChevronDown size={16} className="shrink-0 text-white/60 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-white/[0.07] px-4 py-4 sm:px-5">{children}</div>
    </details>
  )
}

function FindingList({ findings }: { findings: Finding[] }) {
  if (!findings.length) return <p className="text-sm text-white/60">Nothing was flagged in the checks that completed.</p>
  const tone: Record<Level, string> = { critical: 'verdict-bad', high: 'verdict-bad', review: 'verdict-warn' }
  return (
    <ul className="space-y-3">
      {findings.map((f, i) => (
        <li key={`${f.kind}-${i}`} className="rounded-control border border-white/[0.08] bg-white/[0.02] p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`verdict ${tone[f.level]}`}>{f.level === 'review' ? 'Review' : f.level === 'high' ? 'High' : 'Critical'}</span>
            {f.network && <span className="text-xs text-white/50">{f.network}</span>}
          </div>
          <p className="mt-2 text-sm text-white/90">{f.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-white/60">{f.detail}</p>
          {f.items?.map((item, j) => (
            <p key={`${item.address}-${j}`} className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-white/[0.06] pt-2 text-xs">
              <span className="min-w-0">
                <span className="font-mono text-white/80" title={item.address}>
                  {short(item.address)}
                </span>
                {item.note && <span className="ml-2 text-white/50">{item.note}</span>}
              </span>
              <a href={item.link} target="_blank" rel="noopener noreferrer" className="link-arrow shrink-0 text-[11px]">
                Explorer <ArrowUpRight size={11} />
              </a>
            </p>
          ))}
        </li>
      ))}
    </ul>
  )
}

function Result({ r, onAnother }: { r: GuardResult; onAnother: () => void }) {
  const [findingsOpen, setFindingsOpen] = useState(false)
  const [checkedOpen, setCheckedOpen] = useState(false)
  const scamAddress = r.findings.some((f) => f.kind === 'self_flagged')
  const answer = ANSWER[scamAddress ? 'scam_address' : r.verdict]
  // Older or partial responses without coverage info count as "not run", never as passed.
  const checks = r.checks ?? { control: 'unavailable', interactions: 'unavailable', lookalike: 'unavailable' }
  const s = scoreWallet(r.findings, checks)
  const band = BAND[s.band ?? 'none']
  const head = s.limited ? 'Limited coverage' : band.head
  const sub =
    s.score === null
      ? `Only ${s.completed} of ${s.total} checks could fully run for this wallet.`
      : s.band === 'low'
        ? 'No warning signs detected.'
        : s.limited
          ? 'No warning signs, but not every check could finish.'
          : s.band === 'review'
            ? `${r.findings.length} ${r.findings.length === 1 ? 'thing' : 'things'} worth reviewing.`
            : 'Warning signs found. Follow the steps above.'

  const hasFindings = r.findings.length > 0
  const fullCoverage = s.completed === s.total
  /** Opens a section and scrolls to it (scroll-margin keeps it clear of the sticky nav). */
  const openSection = (id: 'guard-findings' | 'guard-checked') => {
    if (id === 'guard-findings') setFindingsOpen(true)
    else setCheckedOpen(true)
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  // The main button goes where the user's next question is answered: what was found, or what was not checked.
  const primary = hasFindings
    ? { label: `View findings (${r.findings.length})`, go: () => openSection('guard-findings') }
    : !fullCoverage
      ? { label: 'See what wasn’t checked', go: () => openSection('guard-checked') }
      : null

  return (
    <div className="space-y-4" aria-live="polite">
      {/* Plain answer */}
      <div className="rounded-[18px] border border-white/10 bg-white/[0.02] p-4 sm:p-5">
        <span className={`verdict verdict-${answer.tone}`}>{answer.badge}</span>
        <p className="mt-3 font-display text-xl font-light leading-snug text-white sm:text-2xl">{answer.line}</p>
        {answer.steps.length > 0 && (
          <ol className="mt-3 space-y-1.5">
            {answer.steps.map((step, i) => (
              <li key={step} className="flex gap-2.5 text-sm leading-relaxed text-white/70">
                <span className="w-4 shrink-0 font-mono text-xs leading-6 text-lab-cyan">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* The three checks */}
      <div className="grid gap-3 md:grid-cols-3">
        {CHECK_IDS.map((id) => {
          const c = labelsFor(id, r.chain)
          const state = s.states[id]
          const st = STATE_ICON[state]
          const found = r.findings.filter((f) => CHECK_KINDS[id].includes(f.kind))
          return (
            <div key={id} className="rounded-[16px] border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2.5">
                <c.Icon size={20} className="shrink-0 text-white/75" strokeWidth={1.6} />
                <p className="min-w-0 flex-1 text-[15px] font-medium text-white">{c.title}</p>
                <st.Icon size={20} className={`shrink-0 ${st.cls}`} aria-label={st.label} />
              </div>
              <p className="mt-2.5 text-sm leading-relaxed text-white/65">{c.line(state, found, checks[id])}</p>
            </div>
          )
        })}
      </div>

      {/* Score */}
      <div className={`rounded-[22px] border bg-gradient-to-br from-white/[0.04] to-transparent p-5 sm:p-7 ${band.border} ${band.glow}`}>
        <div className="grid items-center gap-6 md:grid-cols-[auto_1px_minmax(0,1fr)] md:gap-8">
          <div className="flex flex-col items-center">
            <ScoreDial score={s.score} color={band.color} />
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-white/60">Wallet check score</p>
          </div>
          <span className="hidden h-full w-px bg-white/10 md:block" aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-display text-3xl font-normal tracking-tight text-white sm:text-4xl">{head}</p>
            <p className="mt-1 text-sm text-white/65 sm:text-base">{sub}</p>
            <span
              className={`mt-4 inline-flex rounded-full border px-3 py-1 text-sm ${s.completed === s.total ? 'border-emerald-300/50 text-emerald-200' : 'border-amber-300/45 text-amber-200'}`}
            >
              {s.completed} of {s.total} checks completed
            </span>
            <ul className="mt-4 space-y-2.5">
              {CHECK_IDS.map((id) => {
                const st = STATE_ICON[s.states[id]]
                return (
                  <li key={id} className="flex items-center gap-3 text-sm text-white/85 sm:text-[15px]">
                    <st.Icon size={18} className={`shrink-0 ${st.cls}`} aria-hidden="true" />
                    <span className="min-w-0 flex-1">{labelsFor(id, r.chain).item}</span>
                    {s.states[id] !== 'pass' && (
                      <>
                        <span className="hidden shrink-0 text-xs text-white/50 sm:inline">{st.label}</span>
                        <span className="sr-only sm:hidden">{st.label}</span>
                      </>
                    )}
                  </li>
                )
              })}
            </ul>
            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              {primary && (
                <button type="button" className="btn-primary" onClick={primary.go}>
                  {primary.label}
                </button>
              )}
              <button type="button" className={primary ? 'btn-ghost' : 'btn-primary'} onClick={onAnother}>
                Run another check
              </button>
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-white/55 sm:flex-row sm:items-center sm:gap-5">
          <span className="sm:border-r sm:border-white/15 sm:pr-5">Score thresholds (observed risk)</span>
          <span className="flex flex-wrap gap-x-5 gap-y-2 normal-case tracking-normal text-white/75">
            {(
              [
                ['low', '80–100 Low'],
                ['review', '50–79 Review'],
                ['action', '0–49 Action'],
              ] as const
            ).map(([b, label]) => (
              <span key={b} className="inline-flex items-center gap-2 font-sans text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: BAND[b].color }} aria-hidden="true" />
                {label}
              </span>
            ))}
          </span>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-white/50">
        Based on available on-chain checks. Not a guarantee of wallet security. A leaked seed phrase leaves no trace until funds move.
      </p>

      <Accordion id="guard-findings" title={`Findings (${r.findings.length})`} open={findingsOpen} onToggle={setFindingsOpen}>
        <FindingList findings={r.findings} />
      </Accordion>

      <Accordion id="guard-checked" title="What was checked" open={checkedOpen} onToggle={setCheckedOpen}>
        <ul className="space-y-3">
          {CHECK_IDS.map((id) => {
            const st = STATE_ICON[COVERAGE_STATE[checks[id]]]
            const facts = r.evidence?.[id] ?? []
            return (
              <li key={id} className="rounded-control border border-white/[0.08] bg-white/[0.015] p-3 sm:p-4">
                <div className="flex gap-3 text-sm">
                  <st.Icon size={18} className={`mt-0.5 shrink-0 ${st.cls}`} aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="text-white/90">{labelsFor(id, r.chain).item}</span>
                    <span className="block text-xs leading-relaxed text-white/55">{COVERAGE_TEXT[checks[id]]}</span>
                  </span>
                </div>
                {facts.length > 0 && (
                  <dl className="mt-3 grid gap-x-6 gap-y-0 border-t border-white/[0.06] pt-2 sm:grid-cols-2">
                    {facts.map(([label, value]) => (
                      <div key={label} className="flex items-baseline justify-between gap-3 border-b border-white/[0.04] py-1.5 text-xs last:border-b-0 sm:[&:nth-last-child(2):nth-child(odd)]:border-b-0">
                        <dt className="text-white/50">{label}</dt>
                        <dd className="text-right font-mono text-white/85">{value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </li>
            )
          })}
        </ul>
      </Accordion>
    </div>
  )
}

export function WalletGuard({ initialAddress }: { initialAddress?: string }) {
  const [input, setInput] = useState(initialAddress ?? '')
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GuardResult | null>(null)
  const seq = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!busy) return
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 2500)
    return () => clearInterval(timer)
  }, [busy])

  // A link like /pqc?address=… (from the Web3 explorer) checks straight away.
  const started = useRef(false)
  useEffect(() => {
    if (started.current || !initialAddress) return
    started.current = true
    void run(initialAddress)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    void run(input)
  }

  async function run(address: string) {
    const value = address.trim()
    if (!value) return
    const id = ++seq.current
    setError(null)
    setResult(null)
    setStep(0)
    setBusy(true)
    try {
      const r = await api<GuardResult>('/web3/wallet-guard', { method: 'POST', body: { address: value }, timeout: 75_000 })
      if (id === seq.current) setResult(r)
    } catch (err) {
      if (id === seq.current) setError((err as Error).message)
    } finally {
      if (id === seq.current) setBusy(false)
    }
  }

  const reset = () => {
    seq.current++
    setInput('')
    setResult(null)
    setError(null)
    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    inputRef.current?.focus({ preventScroll: true })
  }

  return (
    <div className="panel space-y-5 p-5 sm:p-7">
      <form onSubmit={submit}>
        <p className="kicker">Wallet safety check · EVM · Solana</p>
        <h2 className="mt-4 font-display text-3xl font-light tracking-tight sm:text-[40px] sm:leading-tight">Should I move to a new wallet?</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">
          Check your public address for on-chain warning signs. Read-only. Never paste your seed phrase anywhere.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="guard-address" className="sr-only">
            Wallet address
          </label>
          <div className="relative flex-1">
            <input
              ref={inputRef}
              id="guard-address"
              className="field pr-9 font-mono"
              placeholder="Your wallet address (0x… or Solana)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
              autoComplete="off"
              disabled={busy}
            />
            {input && !busy && (
              <button type="button" aria-label="Clear address" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/55 hover:text-white" onClick={reset}>
                <X size={14} />
              </button>
            )}
          </div>
          <button type="submit" className="btn-primary sm:w-48" disabled={busy || !input.trim()}>
            {busy ? (
              <>
                <RefreshCw size={15} className="animate-spin" /> Checking
              </>
            ) : (
              <>
                <ScanSearch size={15} /> Run check
              </>
            )}
          </button>
        </div>
        {busy && (
          <p className="mt-4 flex items-center gap-2 text-sm text-lab-cyan" role="status">
            <span className="signal-dot" /> {STEPS[step]}
          </p>
        )}
        {error && (
          <p className="notice notice-error mt-4 rounded-2xl border border-red-400/30 bg-red-400/[0.07] px-4 py-3 text-sm text-red-200" role="alert">
            {error}
          </p>
        )}
      </form>

      {result && <Result key={result.fetched_at + result.address} r={result} onAnother={reset} />}
    </div>
  )
}
