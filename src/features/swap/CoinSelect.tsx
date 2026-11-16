import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { currencyKey, type Currency } from './api'
import { upper } from './format'

const MAX_RESULTS = 80

/** The provider moved its logos from static.* to edge.*; older currency data and saved history still use the old host. */
const logoUrl = (image: string) => image.replace('://static.simpleswap.io/', '://edge.simpleswap.io/')

export function CoinIcon({ coin, size = 28 }: { coin: Pick<Currency, 'image' | 'ticker'> | undefined; size?: number }) {
  const [failed, setFailed] = useState<string | null>(null)
  const src = coin?.image ? logoUrl(coin.image) : null
  if (!src || failed === src)
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-white/10 font-semibold uppercase text-white/75"
        style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
        aria-hidden="true"
      >
        {coin?.ticker?.[0] ?? ''}
      </span>
    )
  return <img className="shrink-0 rounded-full" src={src} width={size} height={size} alt="" loading="lazy" onError={() => setFailed(src)} />
}

export function NetworkTag({ coin }: { coin: Pick<Currency, 'ticker' | 'network'> }) {
  if (coin.network === coin.ticker) return null
  return (
    <span className="rounded-full border border-white/15 px-1.5 py-px font-mono text-[11px] uppercase tracking-[0.08em] text-white/65">
      {upper(coin.network)}
    </span>
  )
}

type Props = {
  currencies: Currency[]
  value: string
  onChange: (key: string) => void
  label: string
  /** When set, only these currency keys can be picked. */
  allowed?: Set<string>
}

/** Coin picker: a button that opens a searchable list of SimpleSwap currencies. */
export function CoinSelect({ currencies, value, onChange, label, allowed }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const coin = currencies.find((c) => currencyKey(c) === value)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const q = query.trim().toLowerCase()
  const results = currencies
    .filter((c) => !allowed || allowed.has(currencyKey(c)))
    .filter(
      (c) =>
        !q || c.ticker.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.network.toLowerCase().includes(q),
    )
    .slice(0, MAX_RESULTS)

  const pick = (key: string) => {
    onChange(key)
    setOpen(false)
    setQuery('')
  }

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        type="button"
        className="flex items-center gap-2 rounded-control border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium transition-colors hover:border-white/25"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${label}: ${coin ? `${coin.name} (${upper(coin.network)})` : 'none'}`}
        onClick={() => setOpen((o) => !o)}
      >
        <CoinIcon coin={coin} size={22} />
        <span>{coin ? upper(coin.ticker) : 'Select'}</span>
        {coin && <NetworkTag coin={coin} />}
        <ChevronDown size={14} className="text-white/60" />
      </button>
      {open && (
        <div className="panel absolute right-0 top-full z-30 mt-2 w-72 max-w-[calc(100vw-2.5rem)] bg-lab-panel p-2 shadow-2xl shadow-black/60">
          <input
            className="field"
            placeholder="Search coin or network"
            aria-label="Search coin or network"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <ul className="scrollbar-thin mt-2 max-h-72 overflow-y-auto" id={listId} role="listbox" aria-label={label}>
            {results.map((c) => {
              const key = currencyKey(c)
              return (
                <li
                  key={key}
                  role="option"
                  aria-selected={key === value}
                  tabIndex={0}
                  className={
                    'flex cursor-pointer items-center gap-3 rounded-control px-2 py-2 hover:bg-white/[0.06] focus:bg-white/[0.06] ' +
                    (key === value ? 'bg-lab-cyan/10' : '')
                  }
                  onClick={() => pick(key)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      pick(key)
                    }
                  }}
                >
                  <CoinIcon coin={c} size={24} />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      {upper(c.ticker)} <NetworkTag coin={c} />
                    </span>
                    <span className="block truncate text-xs text-white/60">{c.name}</span>
                  </span>
                </li>
              )
            })}
            {results.length === 0 && <li className="px-2 py-6 text-center text-xs text-white/60">No coins found</li>}
          </ul>
        </div>
      )}
    </div>
  )
}
