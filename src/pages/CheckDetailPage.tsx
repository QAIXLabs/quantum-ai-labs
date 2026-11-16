import { useQuery } from '@tanstack/react-query'
import { Link, useLocation, useParams } from 'react-router'
import { ArrowLeft, ArrowLeftRight, ArrowUpRight, Copy, ScanSearch } from 'lucide-react'
import { HudFrame } from '../components/ToolHero'
import { copyText } from '../lib/clipboard'
import { age, compactUsd, fetchCheck, sinceCheck, type Check, type Live } from '../features/checks/api'
import { CoinAvatar, ScoreBar, ScoreRing, VerdictBadge } from '../features/checks/parts'

const NARRATIVE_SCALE = ['LARP', 'Unclear', 'Partly', 'Real']
const HOLDERS_SCALE = ['Rigged', 'Sketchy', 'OK']

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card panel p-4">
      <p className="eyebrow">{label}</p>
      <p className="stat-value mt-2 truncate">{value}</p>
    </div>
  )
}

function Report({ check, live }: { check: Check; live: Live }) {
  const since = sinceCheck(check, live)
  const links: [string, string | null][] = [
    ['Website', check.links.website],
    ['X', check.links.x],
    ['Telegram', check.links.telegram],
    ['pump.fun', check.links.pump_fun],
    ['Chart', check.links.chart],
  ]
  return (
    <div className="space-y-6">
      {check.warning && (
        <p className="rounded-2xl border border-red-400/40 bg-red-400/[0.08] px-5 py-4 text-sm font-medium leading-relaxed text-red-200" role="alert">
          {check.warning}
        </p>
      )}
      <div className="panel p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-4">
          <CoinAvatar image={check.image} symbol={check.symbol} size={64} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-3xl font-light tracking-tight sm:text-4xl">{check.name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs text-white/55">
              ${check.symbol}
              <button type="button" className="inline-flex items-center gap-1 hover:text-lab-cyan" onClick={() => void copyText(check.mint)} aria-label="Copy contract address">
                {check.mint.slice(0, 4)}…{check.mint.slice(-4)} <Copy size={11} />
              </button>
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl font-light">{compactUsd(live?.market_cap ?? check.market_cap_at_check)}</p>
            {since != null && (
              <p className={`font-mono text-xs ${since >= 0 ? 'text-lab-ok' : 'text-red-300'}`}>
                {since >= 0 ? '▲' : '▼'} {Math.abs(since).toFixed(1)}% since the check
              </p>
            )}
          </div>
        </div>
        <div className="mt-7 flex flex-col gap-6 border-t border-white/[0.07] pt-7 sm:flex-row sm:items-center">
          <ScoreRing score={check.total} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              <VerdictBadge label="Story" verdict={check.narrative.verdict} />
              <VerdictBadge label="Holders" verdict={check.holders.verdict} />
            </div>
            <p className="mt-4 font-display text-xl font-light leading-snug text-white sm:text-2xl">{check.summary}</p>
            <p className="mt-3 text-xs text-white/50">
              Read {new Date(check.checked_at).toLocaleString()}, when the coin was {age(check.coin_age_minutes)} old and worth{' '}
              {compactUsd(check.market_cap_at_check)}.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel p-5 sm:p-7" aria-labelledby="narrative-title">
          <div className="flex items-center justify-between gap-3">
            <p className="kicker" id="narrative-title">
              Is the story real?
            </p>
            <span className="font-mono text-sm text-white/70">{check.narrative.score}/100</span>
          </div>
          <div className="mt-4">
            <VerdictBadge verdict={check.narrative.verdict} />
          </div>
          <ScoreBar score={check.narrative.score} verdict={check.narrative.verdict} scale={NARRATIVE_SCALE} />
          <div className="mt-5 space-y-3">
            {check.narrative.report.map((p) => (
              <p key={p} className="text-sm leading-relaxed text-white/70">
                {p}
              </p>
            ))}
          </div>
        </section>

        <section className="panel p-5 sm:p-7" aria-labelledby="holders-title">
          <div className="flex items-center justify-between gap-3">
            <p className="kicker" id="holders-title">
              Is the coin fair?
            </p>
            <span className="font-mono text-sm text-white/70">{check.holders.score}/100</span>
          </div>
          <div className="mt-4">
            <VerdictBadge verdict={check.holders.verdict} />
          </div>
          <ScoreBar score={check.holders.score} verdict={check.holders.verdict} scale={HOLDERS_SCALE} />
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Stat label="Holders" value={check.holders.holder_count?.toLocaleString('en-US') ?? '—'} />
            <Stat label="Top 10 hold" value={check.holders.top10_pct != null ? `${check.holders.top10_pct}%` : '—'} />
            <Stat label="Insider wallets" value={check.holders.insiders?.toString() ?? '—'} />
            <Stat label="Creator holds" value={check.holders.creator_pct != null ? `${check.holders.creator_pct}%` : '—'} />
          </div>
          <ul className="mt-5 space-y-2">
            {check.holders.facts.map((f) => (
              <li key={f} className="flex gap-2.5 text-sm leading-relaxed text-white/70">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-lab-cyan" />
                {f}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="panel flex flex-wrap items-center gap-3 p-5">
        {links
          .filter(([, href]) => href)
          .map(([label, href]) => (
            <a key={label} href={href!} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm">
              {label} <ArrowUpRight size={13} />
            </a>
          ))}
        <span className="ml-auto flex flex-wrap gap-3">
          <Link to="/swap" className="btn-ghost btn-sm">
            <ArrowLeftRight size={13} /> Privacy Swap
          </Link>
          <Link to="/checks" className="btn-primary btn-sm">
            <ScanSearch size={14} /> Check another coin
          </Link>
        </span>
      </div>
      <p className="text-center text-xs leading-relaxed text-white/50">
        An automated read of public data at the time of the check. It can be wrong and it isn’t financial advice.
      </p>
    </div>
  )
}

export default function CheckDetailPage() {
  const { id = '' } = useParams()
  const state = useLocation().state as { check?: Check; live?: Live } | null
  const fromState = state?.check?.id === id ? state : null
  const { data, isLoading, error } = useQuery({
    queryKey: ['check', id],
    queryFn: () => fetchCheck(id),
    // A fresh check arrives through navigation state; refresh its live numbers in the background.
    initialData: fromState?.check ? { check: fromState.check, live: fromState.live ?? null } : undefined,
    refetchInterval: 60_000,
    retry: (count, err) => count < 1 && !/doesn’t exist/.test((err as Error).message),
  })

  return (
    <section className="lab-container pb-24 pt-32 sm:pt-36">
      <Link to="/checks" className="link-arrow text-xs">
        <ArrowLeft size={12} /> All checks
      </Link>
      <HudFrame toolId="checks" className="mx-auto mt-6 max-w-5xl">
        {data ? (
          <Report check={data.check} live={data.live} />
        ) : isLoading ? (
          <p className="p-8 text-center text-sm text-white/55">Loading the check…</p>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-white/65">{(error as Error | null)?.message ?? 'This check could not be loaded.'}</p>
            <Link to="/checks" className="btn-primary btn-sm mt-5">
              <ScanSearch size={14} /> Run a new check
            </Link>
          </div>
        )}
      </HudFrame>
    </section>
  )
}
