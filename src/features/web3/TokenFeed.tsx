import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ArrowUpRight, RefreshCw, Search } from 'lucide-react'
import Notice from '../../components/Notice'
import { api, changeClass, clock, pct, usd, usdCompact, type PairsResponse } from './api'

const CHAINS: [string, string][] = [
  ['ethereum', 'Ethereum'],
  ['base', 'Base'],
  ['arbitrum', 'Arbitrum'],
  ['optimism', 'Optimism'],
  ['polygon', 'Polygon'],
  ['bsc', 'BNB Chain'],
  ['solana', 'Solana'],
]
const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/
const SOL_MINT = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

type Mode = 'token' | 'search'
type Query = { mode: Mode; chain: string; q: string }

/** Dexscreener pairs for a token address or a free-text search. */
export function TokenFeed() {
  const [mode, setMode] = useState<Mode>('token')
  const [chain, setChain] = useState('ethereum')
  const [input, setInput] = useState('')
  const [query, setQuery] = useState<Query | null>(null)
  const [data, setData] = useState<PairsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const load = useCallback(async (q: Query) => {
    setLoading(true)
    try {
      const path =
        q.mode === 'token'
          ? `/market/token?chain=${q.chain}&address=${encodeURIComponent(q.q)}`
          : `/market/search?q=${encodeURIComponent(q.q)}`
      setData(await api<PairsResponse>(path))
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!autoRefresh || !query) return
    const id = setInterval(() => {
      if (!document.hidden) void load(query)
    }, 60_000)
    return () => clearInterval(id)
  }, [autoRefresh, query, load])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const q = input.trim()
    if (mode === 'token' && !(chain === 'solana' ? SOL_MINT : EVM_ADDRESS).test(q))
      return setError(chain === 'solana' ? 'Invalid Solana token address.' : 'Invalid token address: expected 0x followed by 40 hex characters.')
    if (mode === 'search' && (q.length < 2 || q.length > 64)) return setError('Search must be 2–64 characters.')
    const next = { mode, chain, q }
    setQuery(next)
    setData(null)
    void load(next)
  }

  const pairs = data?.pairs ?? []

  return (
    <div className="panel p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <p className="kicker mr-auto">Token price feed</p>
        {(['token', 'search'] as const).map((m) => (
          <button
            key={m}
            type="button"
            className="chip"
            aria-pressed={mode === m}
            onClick={() => {
              setMode(m)
              setError(null)
            }}
          >
            {m === 'token' ? 'By address' : 'Search'}
          </button>
        ))}
      </div>
      <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={submit}>
        {mode === 'token' && (
          <select className="field sm:w-36" value={chain} onChange={(e) => setChain(e.target.value)} aria-label="Chain">
            {CHAINS.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        )}
        <input
          className="field font-mono text-xs"
          maxLength={64}
          placeholder={mode === 'token' ? 'Token address' : 'Symbol or name, e.g. WETH'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label="Token query"
        />
        <button type="submit" className="btn-primary btn-sm shrink-0" disabled={loading || !input.trim()}>
          <Search size={12} /> Look up
        </button>
      </form>

      {error && (
        <div className="mt-4">
          <Notice tone="error">
            {data ? `Refresh failed. Showing data from ${clock(data.fetched_at)}. ` : ''}
            {error}
          </Notice>
        </div>
      )}
      {loading && !data && <p className="mt-5 animate-pulse text-xs text-white/55">Fetching market data…</p>}
      {data && pairs.length === 0 && <p className="mt-5 text-sm text-white/60">No trading pairs found for this query.</p>}

      {pairs.length > 0 && (
        <>
          <div className="scrollbar-thin mt-5 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-xs">
              <thead className="text-white/55">
                <tr>
                  <th className="pb-2 font-normal">Pair</th>
                  <th className="font-normal">Price</th>
                  <th className="font-normal">24h</th>
                  <th className="font-normal">Liquidity</th>
                  <th className="font-normal">Vol 24h</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pairs.map((p, i) => (
                  <tr key={p.pair_address || i} className="border-t border-white/[0.06]">
                    <td className="py-2.5 pr-2">
                      <span className="text-white">{p.base.symbol}</span>
                      <span className="text-white/55">/{p.quote.symbol}</span>
                      <span className="block text-[11px] text-white/55">
                        {p.dex} · {p.chain}
                      </span>
                    </td>
                    <td className="font-mono">{usd(p.price_usd)}</td>
                    <td className={'font-mono ' + changeClass(p.price_change_24h)}>{pct(p.price_change_24h)}</td>
                    <td className="font-mono">{usdCompact(p.liquidity_usd)}</td>
                    <td className="font-mono">{usdCompact(p.volume_24h)}</td>
                    <td>
                      <a href={p.url} target="_blank" rel="noopener noreferrer" aria-label="View pair details" className="text-white/55 hover:text-lab-cyan">
                        <ArrowUpRight size={13} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-white/55">
            <span className="mr-auto font-mono">
              Updated {clock(data!.fetched_at)}
              {data!.cached ? ' (cached ≤30 s)' : ''} · sorted by liquidity · “—” = not provided
            </span>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" className="accent-[#8fd9f7]" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} /> Auto-refresh 60 s
            </label>
            <button type="button" className="inline-flex items-center gap-1 hover:text-white" onClick={() => query && void load(query)} disabled={loading}>
              <RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </>
      )}
      <p className="mt-4 text-[11px] text-white/55">
        Prices are not guaranteed real-time and may be missing or stale for illiquid tokens. Not financial advice.
      </p>
    </div>
  )
}
