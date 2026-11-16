import { useEffect, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router'
import { ArrowRight, RefreshCw, ScanSearch } from 'lucide-react'
import ToolHero, { ToolWorkspace } from '../components/ToolHero'
import { MINT_RE, compactUsd, fetchFeed, runCheck, sinceCheck, timeAgo, type FeedSort } from '../features/checks/api'
import { CoinAvatar, VerdictBadge } from '../features/checks/parts'

const STEPS = ['Reading the holders…', 'Reading the project…', 'Weighing the story…', 'Writing the verdict…']
const SORTS: [FeedSort, string][] = [
  ['latest', 'Latest'],
  ['real', 'Most real'],
  ['risky', 'Riskiest'],
]

function CheckForm() {
  const navigate = useNavigate()
  const [mint, setMint] = useState('')
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!busy) return
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 1600)
    return () => clearInterval(timer)
  }, [busy])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const value = mint.trim()
    if (!MINT_RE.test(value)) {
      setError('That doesn’t look like a Solana coin address.')
      return
    }
    setError(null)
    setStep(0)
    setBusy(true)
    try {
      const result = await runCheck(value)
      navigate(`/checks/${result.check.id}`, { state: result })
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="panel p-5 sm:p-7">
      <p className="kicker">New check</p>
      <h2 className="mt-4 font-display text-3xl font-light tracking-tight sm:text-[40px] sm:leading-tight">Check a Solana coin</h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">
        Paste the coin’s contract address. In a few seconds you get a read on the story behind it and on how fairly the coin is held. The
        check is added to the public feed below.
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="check-mint" className="sr-only">
          Solana coin address
        </label>
        <input
          id="check-mint"
          className="field flex-1 font-mono"
          placeholder="Contract address, e.g. …pump"
          value={mint}
          onChange={(e) => setMint(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          disabled={busy}
        />
        <button type="submit" className="btn-primary sm:w-48" disabled={busy || !mint.trim()}>
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
  )
}

function Feed() {
  const [sort, setSort] = useState<FeedSort>('latest')
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['checks-feed', sort],
    queryFn: () => fetchFeed(sort),
    refetchInterval: 60_000,
  })
  const checks = data?.checks ?? []

  return (
    <div className="panel p-5 sm:p-7">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <p className="kicker">Public feed</p>
          <h2 className="mt-3 font-display text-2xl font-light tracking-tight sm:text-3xl">Latest checks</h2>
        </div>
        <div className="segmented" role="tablist" aria-label="Sort checks">
          {SORTS.map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={sort === id} className="segmented-item" onClick={() => setSort(id)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="mt-8 text-sm text-white/55">Loading checks…</p>}
      {isError && (
        <p className="mt-8 flex items-center gap-3 text-sm text-white/60">
          The feed couldn’t be loaded.
          <button type="button" className="link-arrow text-xs" onClick={() => void refetch()} disabled={isFetching}>
            <RefreshCw size={12} /> Retry
          </button>
        </p>
      )}
      {!isLoading && !isError && checks.length === 0 && (
        <p className="mt-8 text-sm text-white/55">No checks yet. Be the first: paste a coin address above.</p>
      )}

      <ul className="check-feed mt-6">
        {checks.map((c) => {
          const since = sinceCheck(c, c.live)
          return (
            <li key={c.id}>
              <Link to={`/checks/${c.id}`} className="check-row">
                <CoinAvatar image={c.image} symbol={c.symbol} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="truncate font-display text-lg text-white">{c.symbol}</span>
                    <span className="shrink-0 font-display text-lg text-white">{compactUsd(c.live?.market_cap ?? c.market_cap_at_check)}</span>
                  </span>
                  <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <VerdictBadge verdict={c.narrative.verdict} />
                    <VerdictBadge verdict={c.holders.verdict} />
                    {c.warning && <span className="verdict verdict-bad">Not official QAI</span>}
                    {since != null && (
                      <span className={`ml-auto font-mono text-xs ${since >= 0 ? 'text-lab-ok' : 'text-red-300'}`}>
                        {since >= 0 ? '▲' : '▼'} {Math.abs(since).toFixed(0)}% since
                      </span>
                    )}
                  </span>
                  <span className="mt-2 block text-sm leading-relaxed text-white/65">
                    {c.summary} <span className="text-white/35">{timeAgo(c.checked_at)}</span>
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function ChecksPage() {
  return (
    <div>
      <ToolHero
        toolId="checks"
        title="Is the story real? Is the coin fair?"
        intro="Paste a Solana coin and get two straight answers: whether the project behind it is real, and whether the coin is fairly held. Every check goes into a public feed, so anyone can see how each call played out."
      />
      <ToolWorkspace toolId="checks" narrow>
        <div className="space-y-6">
          <CheckForm />
          <Feed />
          <p className="text-center text-xs leading-relaxed text-white/50">
            Checks are automated reads of public data and can be wrong. They aren’t financial advice.{' '}
            <Link to="/disclaimer" className="link-arrow text-xs">
              Disclaimer <ArrowRight size={11} />
            </Link>
          </p>
        </div>
      </ToolWorkspace>
    </div>
  )
}
