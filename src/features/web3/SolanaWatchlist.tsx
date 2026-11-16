import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { ArrowUpRight, BellRing, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import Notice from '../../components/Notice'
import {
  PERMISSION_TEXT,
  api,
  changeClass,
  clock,
  notify,
  pct,
  shortAddr,
  usd,
  usdCompact,
  useNotificationPermission,
  useStoredState,
  type Pair,
  type WatchToken,
} from './api'

const SOL_MINT = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
const MAX_TOKENS = 30

type Alert = { enabled: boolean; direction: 'above' | 'below'; target: number | null }
type Entry = { address: string; symbol: string | null; name: string | null; alert: Alert }

const DEFAULT_LIST: Entry[] = [
  {
    address: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    name: 'Wrapped SOL',
    alert: { enabled: false, direction: 'above', target: null },
  },
]

const isTriggered = (alert: Alert | undefined, price: number | undefined) =>
  Boolean(alert?.enabled && price != null && alert.target != null && (alert.direction === 'above' ? price > alert.target : price < alert.target))

/** Target price input that commits valid numbers as you type and clears on empty. */
function TargetInput({ value, onCommit }: { value: number | null; onCommit: (value: number | null) => void }) {
  const [text, setText] = useState(value == null ? '' : String(value))
  const [shown, setShown] = useState(value)
  if (value !== shown) {
    setShown(value)
    setText(value == null ? '' : String(value))
  }
  return (
    <input
      type="number"
      min="0"
      step="any"
      placeholder="USD"
      className="field w-28 py-1.5 font-mono text-xs"
      value={text}
      aria-label="Target price in USD"
      onChange={(e) => {
        setText(e.target.value)
        const n = parseFloat(e.target.value)
        if (e.target.value === '') onCommit(null)
        else if (Number.isFinite(n) && n > 0) onCommit(n)
      }}
    />
  )
}

type Meta = { fetched_at: string; cached: boolean; source: string }

/** SPL token watchlist with per-token price alerts, stored in this browser. */
export function SolanaWatchlist() {
  const [list, setList] = useStoredState<Entry[]>('qal-sol-watchlist', DEFAULT_LIST)
  const [autoRefresh, setAutoRefresh] = useStoredState('qal-sol-watch-auto', true)
  const [notifyOn, setNotifyOn] = useStoredState('qal-sol-notify', false)
  const { perm, request } = useNotificationPermission()
  const [mode, setMode] = useState<'address' | 'search'>('address')
  const [input, setInput] = useState('')
  const [results, setResults] = useState<Pair[] | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const lastState = useRef<Record<string, boolean>>({})
  const primed = useRef(false)

  const addresses = list.map((e) => e.address).join(',')

  const watching = notifyOn && perm === 'granted' && list.some((e) => e.alert?.enabled && e.alert.target != null)

  // A failed refresh keeps the last prices; with alerts and notifications on, it keeps checking in the background.
  const query = useQuery({
    queryKey: ['web3-sol-watchlist', addresses],
    queryFn: () =>
      api<{ tokens: Record<string, WatchToken> } & Meta>(`/market/tokens?chain=solana&addresses=${encodeURIComponent(addresses)}`),
    enabled: addresses.length > 0,
    staleTime: 0,
    retry: false,
    refetchInterval: autoRefresh || watching ? 60_000 : false,
    refetchIntervalInBackground: watching,
  })
  const data = addresses ? query.data : undefined
  const prices: Record<string, WatchToken> = useMemo(() => data?.tokens ?? {}, [data])
  const meta: Meta | null = data ? { fetched_at: data.fetched_at, cached: data.cached, source: data.source } : null
  const error = query.error?.message ?? null
  const loading = query.isFetching
  const refresh = () => void query.refetch()

  // Fill in names for tokens added by mint address once their price data arrives.
  useEffect(() => {
    if (list.some((e) => !e.symbol && prices[e.address]))
      setList((l) => l.map((e) => (!e.symbol && prices[e.address] ? { ...e, symbol: prices[e.address].symbol, name: prices[e.address].name } : e)))
  }, [prices, list, setList])

  // Fire an alert once per crossing; the first load only records the current state.
  useEffect(() => {
    if (!data) return
    for (const e of list) {
      const price = prices[e.address]?.price_usd
      const key = `${e.address}|${e.alert?.enabled}|${e.alert?.direction}|${e.alert?.target}`
      const fired = isTriggered(e.alert, price)
      if (fired && lastState.current[key] !== true && primed.current && notifyOn && perm === 'granted')
        notify(
          'Quantum AI Labs Solana price alert',
          `${e.symbol || shortAddr(e.address)} is ${usd(price)}, ${e.alert.direction} your ${usd(e.alert.target)} target.`,
          `qal-sol-${e.address}`,
        )
      lastState.current[key] = fired
    }
    primed.current = true
  }, [prices, data, list, notifyOn, perm])

  const updateAlert = (address: string, patch: Partial<Alert>) =>
    setList((l) => l.map((e) => (e.address === address ? { ...e, alert: { ...e.alert, ...patch } } : e)))

  const add = (token: { address: string; symbol?: string | null; name?: string | null }) => {
    if (list.length >= MAX_TOKENS) return setFormError(`The watchlist holds at most ${MAX_TOKENS} tokens.`)
    if (list.some((e) => e.address === token.address)) return setFormError('This token is already on your watchlist.')
    setList((l) => [
      ...l,
      { address: token.address, symbol: token.symbol || null, name: token.name || null, alert: { enabled: false, direction: 'above', target: null } },
    ])
    setFormError(null)
    setStatus(`Added ${token.symbol || shortAddr(token.address)} to the watchlist`)
    window.setTimeout(() => setStatus(null), 2500)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const q = input.trim()
    setFormError(null)
    if (mode === 'address') {
      if (!SOL_MINT.test(q)) return setFormError('Invalid Solana mint address (base58, 32–44 characters).')
      add({ address: q })
      setInput('')
      return
    }
    if (q.length < 2 || q.length > 64) return setFormError('Search must be 2–64 characters.')
    setResults(null)
    try {
      const data = await api<{ pairs: Pair[] }>(`/market/search?q=${encodeURIComponent(q)}`)
      const seen = new Set<string>()
      setResults(
        (data.pairs || [])
          .filter((p) => p.chain === 'solana' && p.base?.address && !seen.has(p.base.address) && seen.add(p.base.address))
          .slice(0, 6),
      )
    } catch (err) {
      setFormError((err as Error).message)
    }
  }

  const triggered = useMemo(() => list.filter((e) => isTriggered(e.alert, prices[e.address]?.price_usd)), [list, prices])

  return (
    <div className="panel p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-auto">
          <p className="kicker">SOLANA TOKEN WATCHLIST</p>
          <h2 className="mt-3 font-display text-2xl font-light tracking-tight sm:text-3xl">Track SPL tokens &amp; set price alerts</h2>
        </div>
        {(['address', 'search'] as const).map((m) => (
          <button
            key={m}
            type="button"
            className="chip"
            aria-pressed={mode === m}
            onClick={() => {
              setMode(m)
              setFormError(null)
              setResults(null)
            }}
          >
            {m === 'address' ? 'By mint address' : 'Search'}
          </button>
        ))}
      </div>

      <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={(e) => void submit(e)}>
        <input
          className="field font-mono text-xs"
          maxLength={64}
          placeholder={mode === 'address' ? 'Solana mint address, e.g. JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN' : 'Symbol or name, e.g. BONK'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label="Solana token query"
        />
        <button type="submit" className="btn-primary btn-sm shrink-0" disabled={!input.trim()}>
          {mode === 'address' ? (
            <>
              <Plus size={12} /> Add
            </>
          ) : (
            <>
              <Search size={12} /> Search
            </>
          )}
        </button>
      </form>

      {formError && (
        <div className="mt-3">
          <Notice tone="error">{formError}</Notice>
        </div>
      )}
      {status && (
        <p className="mt-3 text-xs text-lab-ok" role="status">
          {status}
        </p>
      )}

      {results && (
        <div className="mt-3 space-y-1.5">
          {results.length > 0 && (
            <p className="text-[11px] text-amber-200/80">
              Symbols are not unique, and copycat tokens often reuse names. Check the mint address and liquidity before adding.
            </p>
          )}
          {results.length === 0 && <p className="text-xs text-white/60">No Solana pairs found for this query.</p>}
          {results.map((p) => (
            <div key={p.base.address} className="flex items-center gap-3 rounded border border-white/[0.06] px-3 py-2 text-xs">
              <span className="text-white">{p.base.symbol}</span>
              <span className="truncate text-white/55">
                {p.base.name} · {shortAddr(p.base.address)}
              </span>
              <span className="ml-auto font-mono">{usd(p.price_usd)}</span>
              <span className="hidden font-mono text-white/55 sm:inline">liq {usdCompact(p.liquidity_usd)}</span>
              <button
                type="button"
                className="btn-ghost btn-sm py-1"
                onClick={() => add({ address: p.base.address, symbol: p.base.symbol, name: p.base.name })}
              >
                <Plus size={11} /> Add
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-4">
          <Notice tone="error">
            {meta ? `Refresh failed. Showing data from ${clock(meta.fetched_at)}. ` : ''}
            {error}
          </Notice>
        </div>
      )}

      {triggered.length > 0 && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-control border border-amber-300/40 bg-amber-300/[0.08] px-3 py-2.5 text-sm text-amber-100"
        >
          <BellRing size={15} className="mt-0.5 shrink-0" />
          <span>
            {triggered
              .map((e) => `${e.symbol || shortAddr(e.address)} ${usd(prices[e.address].price_usd)} (${e.alert.direction} ${usd(e.alert.target)})`)
              .join(' · ')}
          </span>
        </div>
      )}

      {list.length === 0 ? (
        <p className="mt-5 text-sm text-white/60">Your watchlist is empty. Add a token by mint address or search.</p>
      ) : (
        <div className="scrollbar-thin mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="text-white/55">
              <tr>
                <th className="pb-2 font-normal">Token</th>
                <th className="font-normal">Price</th>
                <th className="font-normal">24h</th>
                <th className="font-normal">Liquidity</th>
                <th className="font-normal">Alert</th>
                <th className="font-normal">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((e) => {
                const t = prices[e.address]
                const fired = isTriggered(e.alert, t?.price_usd)
                return (
                  <tr key={e.address} className={'border-t border-white/[0.06] ' + (fired ? 'bg-amber-300/[0.04]' : '')}>
                    <td className="py-2.5 pr-2">
                      <span className="text-white">{e.symbol || t?.symbol || 'Unknown'}</span>
                      <a
                        href={`https://solscan.io/token/${e.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block font-mono text-[11px] text-white/55 hover:text-lab-cyan"
                      >
                        {shortAddr(e.address)}
                        {t ? ` · ${t.pair} · ${t.dex}` : ''}
                      </a>
                    </td>
                    <td className="font-mono">{t ? usd(t.price_usd) : loading ? '…' : meta ? 'No pair' : '—'}</td>
                    <td className={'font-mono ' + changeClass(t?.price_change_24h)}>{pct(t?.price_change_24h)}</td>
                    <td className="font-mono">{usdCompact(t?.liquidity_usd)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="accent-[#8fd9f7]"
                          checked={Boolean(e.alert?.enabled)}
                          onChange={(ev) => updateAlert(e.address, { enabled: ev.target.checked })}
                          aria-label="Enable alert"
                        />
                        <select
                          className="field w-24 py-1.5 text-xs"
                          value={e.alert?.direction || 'above'}
                          onChange={(ev) => updateAlert(e.address, { direction: ev.target.value as Alert['direction'] })}
                          aria-label="Alert direction"
                        >
                          <option value="above">Above</option>
                          <option value="below">Below</option>
                        </select>
                        <TargetInput value={e.alert?.target ?? null} onCommit={(target) => updateAlert(e.address, { target })} />
                      </div>
                    </td>
                    <td>
                      {fired ? (
                        <span className="font-mono text-[11px] uppercase tracking-wider text-amber-200">Triggered</span>
                      ) : e.alert?.enabled && e.alert.target != null ? (
                        <span className="font-mono text-[11px] uppercase tracking-wider text-lab-cyan">Watching</span>
                      ) : (
                        <span className="text-white/50">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap text-right">
                      {t?.url && (
                        <a
                          href={t.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="View pair details"
                          className="mr-3 inline-block text-white/55 hover:text-lab-cyan"
                        >
                          <ArrowUpRight size={13} />
                        </a>
                      )}
                      <button
                        type="button"
                        aria-label="Remove token"
                        className="text-white/55 hover:text-red-300"
                        onClick={() => setList((l) => l.filter((x) => x.address !== e.address))}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-white/55">
        <span className="mr-auto font-mono">{meta ? `Updated ${clock(meta.fetched_at)}${meta.cached ? ' (cached ≤30 s)' : ''}` : ''}</span>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" className="accent-[#8fd9f7]" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} /> Auto-refresh 60 s
        </label>
        <button type="button" className="inline-flex items-center gap-1 hover:text-white" onClick={refresh} disabled={loading}>
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/[0.06] pt-4">
        <label className="flex items-center gap-2 text-xs text-white/70">
          <input
            type="checkbox"
            className="accent-[#8fd9f7]"
            checked={Boolean(notifyOn && perm === 'granted')}
            disabled={perm === 'unsupported' || perm === 'denied'}
            onChange={async (e) => {
              if (!e.target.checked) return setNotifyOn(false)
              setNotifyOn((await request()) === 'granted')
            }}
          />
          Browser notification when a price alert triggers
        </label>
        {notifyOn && perm === 'granted' && (
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() =>
              setStatus(
                notify('Quantum AI Labs Solana price alert', 'Test notification. Price alerts will appear like this.', 'qal-sol-test')
                  ? 'Test notification sent'
                  : 'This browser blocked the notification',
              )
            }
          >
            Send test notification
          </button>
        )}
        <span className="text-[11px] text-white/55">{PERMISSION_TEXT[perm]}</span>
      </div>
      <p className="mt-3 text-[11px] text-white/55">
        Prices use each token’s highest-liquidity trading pair where the token is the base asset. An alert fires once (and a
        browser notification if enabled) when the price crosses your target, and again only after it crosses back and re-crosses.
        Watchlist and alerts are stored in this browser only; with notifications on, refreshing continues while the tab is hidden, but
        nothing runs once the tab is closed. Not financial advice.
      </p>
    </div>
  )
}
