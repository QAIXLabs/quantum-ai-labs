import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { api, currencyKey, type Currency, type Exchange } from './api'
import { isFinal, useSwapHistory } from './history'

/** Exchange status polling: faster once funds are moving, slower while waiting for a deposit. */
const statusInterval = (exchange: Exchange | undefined) => {
  if (!exchange) return 5_000
  if (isFinal(exchange.status)) return false
  return exchange.status === 'waiting' ? 10_000 : 5_000
}

export function useCurrencies() {
  return useQuery({
    queryKey: ['currencies'],
    queryFn: api.currencies,
    staleTime: 10 * 60_000,
    select: (list: Currency[]) => {
      const usable = list.filter((c) => c.enabled && !c.isFiat)
      return { list: usable, byKey: new Map(usable.map((c) => [currencyKey(c), c])) }
    },
  })
}

export function usePairs(from: string | undefined, fixed: boolean) {
  return useQuery({
    queryKey: ['pairs', from, fixed],
    queryFn: () => api.pairs(from!, fixed),
    enabled: !!from,
    staleTime: 60_000,
    select: (result) => new Set(Object.values(result).flat()),
  })
}

export function useRanges(from: string | undefined, to: string | undefined, fixed: boolean) {
  return useQuery({
    queryKey: ['ranges', from, to, fixed],
    queryFn: () => api.ranges(from!, to!, fixed),
    enabled: !!from && !!to,
    staleTime: 30_000,
    refetchInterval: 30_000,
  })
}

/** Live estimate: refreshed every 10s for floating, or when a fixed rate's quote expires. */
export function useEstimate(from: string | undefined, to: string | undefined, amount: string, fixed: boolean, enabled: boolean) {
  return useQuery({
    queryKey: ['estimate', from, to, amount, fixed],
    queryFn: () => api.estimate(from!, to!, amount, fixed),
    enabled: enabled && !!from && !!to && !!amount,
    placeholderData: keepPreviousData,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      if (!fixed) return 10_000
      const until = query.state.data?.validUntil
      return until ? Math.max(5_000, Date.parse(until) - Date.now()) : 10_000
    },
  })
}

/** Polls one exchange until it reaches a final status, mirroring updates into local history. */
export function useExchange(id: string | undefined) {
  const upsert = useSwapHistory((s) => s.upsert)
  return useQuery({
    queryKey: ['exchange', id],
    queryFn: async () => {
      const exchange = await api.exchange(id!)
      upsert(exchange)
      return exchange
    },
    enabled: !!id,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => statusInterval(query.state.data),
  })
}

/** Keeps every unfinished swap in local history up to date in the background. */
export function useTrackOpenSwaps() {
  const swaps = useSwapHistory((s) => s.swaps)
  const upsert = useSwapHistory((s) => s.upsert)
  const open = swaps.filter((s) => !isFinal(s.status))
  useQueries({
    queries: open.map((s) => ({
      queryKey: ['exchange', s.id],
      queryFn: async () => {
        const exchange = await api.exchange(s.id)
        upsert(exchange)
        return exchange
      },
      refetchOnWindowFocus: true,
      refetchInterval: (query: { state: { data?: Exchange } }) => statusInterval(query.state.data) || false,
    })),
  })
}

export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(id)
  }, [value, delay])
  return debounced
}

/** Current time, ticking every second while `active`. */
export function useNow(active = true) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [active])
  return now
}

export function useSortedCurrencies(list: Currency[] | undefined) {
  return useMemo(() => {
    if (!list) return []
    const rank = (values: string[], value: string) => {
      const i = values.indexOf(value)
      return i === -1 ? values.length : i
    }
    // Popular coins first; within a coin, its native chain, then the most used networks.
    const networkRank = (c: Currency) => (c.network === c.ticker ? -1 : rank(NETWORKS, c.network))
    return [...list].sort(
      (a, b) =>
        rank(POPULAR, a.ticker) - rank(POPULAR, b.ticker) ||
        a.ticker.localeCompare(b.ticker) ||
        networkRank(a) - networkRank(b) ||
        a.network.localeCompare(b.network),
    )
  }, [list])
}

const POPULAR = ['btc', 'eth', 'usdt', 'bnb', 'sol', 'usdc', 'xmr', 'xrp', 'ltc', 'trx', 'doge', 'ada', 'ton', 'matic']
const NETWORKS = ['eth', 'bsc', 'trx', 'sol', 'arbitrum', 'base', 'matic', 'optimism', 'ton', 'avaxc']
