import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Currency, Exchange, ExchangeStatus } from './api'

/** Currency details kept with a swap so history renders without refetching the list. */
export type CoinInfo = Pick<Currency, 'ticker' | 'network' | 'name' | 'image' | 'txExplorer' | 'addressExplorer' | 'extraId' | 'warningsFrom'>

export type SwapRecord = Omit<Exchange, 'currencies'> & { from?: CoinInfo; to?: CoinInfo }

export const FINAL_STATUSES: ExchangeStatus[] = ['finished', 'failed', 'refunded', 'expired']
export const isFinal = (status: ExchangeStatus) => FINAL_STATUSES.includes(status)

const MAX_RECORDS = 50

const pickCoin = (c: Currency | undefined): CoinInfo | undefined =>
  c && {
    ticker: c.ticker,
    network: c.network,
    name: c.name,
    image: c.image,
    txExplorer: c.txExplorer,
    addressExplorer: c.addressExplorer,
    extraId: c.extraId,
    warningsFrom: c.warningsFrom,
  }

type SwapHistoryState = {
  swaps: SwapRecord[]
  /** Insert or update a swap from an API response; keeps earlier currency info. */
  upsert: (exchange: Exchange, coins?: { from?: Currency; to?: Currency }) => void
  remove: (id: string) => void
  clear: () => void
}

/**
 * Swaps made in this browser. There are no accounts, so this local history (persisted to
 * localStorage) is how users get back to an exchange after a reload or closing the tab.
 */
export const useSwapHistory = create<SwapHistoryState>()(
  persist(
    (set) => ({
      swaps: [],
      upsert: (exchange, coins) =>
        set((state) => {
          const { currencies, ...rest } = exchange
          const existing = state.swaps.find((s) => s.id === exchange.id)
          const from = pickCoin(coins?.from ?? currencies?.[exchange.tickerFrom]) ?? existing?.from
          const to = pickCoin(coins?.to ?? currencies?.[exchange.tickerTo]) ?? existing?.to
          const record: SwapRecord = { ...existing, ...rest, from, to }
          const others = state.swaps.filter((s) => s.id !== exchange.id)
          const swaps = [record, ...others]
            .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
            .slice(0, MAX_RECORDS)
          return { swaps }
        }),
      remove: (id) => set((state) => ({ swaps: state.swaps.filter((s) => s.id !== id) })),
      clear: () => set({ swaps: [] }),
    }),
    { name: 'quantumlabs:swaps', version: 1 },
  ),
)
