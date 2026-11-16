import { useSearchParams } from 'react-router'
import { X } from 'lucide-react'
import { CoinIcon } from './CoinSelect'
import { ExchangeStatusBadge } from './ExchangeView'
import { formatAmount, timeAgo, upper } from './format'
import { useSwapHistory } from './history'
import { useNow, useTrackOpenSwaps } from './queries'

/** Swaps made in this browser, with live status for the ones still in progress. */
export function RecentSwaps() {
  const swaps = useSwapHistory((s) => s.swaps)
  const remove = useSwapHistory((s) => s.remove)
  const clear = useSwapHistory((s) => s.clear)
  const [params, setParams] = useSearchParams()
  const activeId = params.get('exchange')
  const now = useNow(swaps.length > 0)
  useTrackOpenSwaps()

  if (swaps.length === 0) return null

  return (
    <section className="mt-10" aria-labelledby="recent-swaps-title">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="recent-swaps-title" className="eyebrow">
          Recent swaps
        </h2>
        <button
          type="button"
          className="text-xs text-white/60 hover:text-white"
          onClick={() => {
            if (window.confirm('Remove all swaps from this device? Swaps already in progress will still complete.')) clear()
          }}
        >
          Clear
        </button>
      </div>
      <p className="mt-2 text-xs text-white/55">Stored only in this browser. No account needed.</p>
      <ul className="mt-4 space-y-2">
        {swaps.map((s) => (
          <li
            key={s.id}
            className={
              'panel flex items-center transition-colors hover:border-white/20 ' + (s.id === activeId ? 'border-lab-cyan/40' : '')
            }
          >
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 text-left"
              onClick={() => setParams({ exchange: s.id })}
            >
              <span className="flex shrink-0 -space-x-2" aria-hidden="true">
                <CoinIcon coin={s.from} size={24} />
                <CoinIcon coin={s.to} size={24} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">
                  {s.amountFrom} {upper(s.tickerFrom)} →{' '}
                  {formatAmount(s.amountTo && Number.parseFloat(s.amountTo) > 0 ? s.amountTo : s.expectedAmount)}{' '}
                  {upper(s.tickerTo)}
                </span>
                <span className="block text-xs text-white/55">{timeAgo(s.createdAt, now)}</span>
              </span>
              <ExchangeStatusBadge status={s.status} />
            </button>
            <button
              type="button"
              className="shrink-0 p-3 text-white/55 hover:text-white"
              aria-label={`Remove swap ${s.id} from this device`}
              onClick={() => remove(s.id)}
            >
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
