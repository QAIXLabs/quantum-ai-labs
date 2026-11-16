import { useEffect, useState } from 'react'

export { api } from '../../lib/api'

/** useState persisted to localStorage; falls back to memory when storage is unavailable. */
export function useStoredState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw === null ? initial : (JSON.parse(raw) as T)
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Private mode or blocked storage: keep the in-memory value.
    }
  }, [key, value])
  return [value, setValue] as const
}

/** Re-renders every `ms` so "12s ago" labels stay fresh. */
export function useTick(ms = 5000) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), ms)
    return () => clearInterval(id)
  }, [ms])
}

// ---------------------------------------------------------------------------
// Formatting

export const num = (value: number | null | undefined, options: Intl.NumberFormatOptions = {}) =>
  value == null || Number.isNaN(value) ? '—' : Number(value).toLocaleString(undefined, options)

export function usd(value: number | null | undefined) {
  if (value == null) return '—'
  return Math.abs(value) >= 1
    ? `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `$${Number(value).toPrecision(4)}`
}

export const usdCompact = (value: number | null | undefined) =>
  value == null ? '—' : `$${Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 2 }).format(value)}`

export const pct = (value: number | null | undefined) => (value == null ? '—' : `${value > 0 ? '+' : ''}${Number(value).toFixed(2)}%`)

export const clock = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleTimeString() : '—')

export function ago(unixSeconds: number | null | undefined) {
  if (!unixSeconds) return '—'
  const s = Math.max(0, Math.round(Date.now() / 1000 - unixSeconds))
  return s < 60 ? `${s}s ago` : `${Math.round(s / 60)}m ago`
}

export const shortAddr = (value: string | null | undefined) => (value ? `${value.slice(0, 6)}…${value.slice(-4)}` : '—')

export const changeClass = (value: number | null | undefined) => (value == null ? '' : value > 0 ? 'text-lab-ok' : value < 0 ? 'text-red-300' : '')

// ---------------------------------------------------------------------------
// Browser notifications

export type Permission = NotificationPermission | 'unsupported'

export const notificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window

export const PERMISSION_TEXT: Record<Permission, string> = {
  granted: 'Browser notifications allowed.',
  denied: "Notifications are blocked for this site. Allow them in your browser's site settings to use this.",
  default: "You'll be asked for permission when you enable this.",
  unsupported: 'This browser does not support the Notification API.',
}

export function notify(title: string, body: string, tag: string) {
  try {
    new Notification(title, { body, tag })
    return true
  } catch {
    return false
  }
}

/** Current notification permission plus a function that asks for it when needed. */
export function useNotificationPermission() {
  const [perm, setPerm] = useState<Permission>(() => (notificationsSupported() ? Notification.permission : 'unsupported'))
  const request = async (): Promise<Permission> => {
    if (!notificationsSupported()) return 'unsupported'
    let p = Notification.permission
    if (p === 'default') p = await Notification.requestPermission()
    setPerm(p)
    return p
  }
  return { perm, request }
}

// ---------------------------------------------------------------------------
// Response types

export type NetworkInfo = { id: string; label: string; chain_id: number; symbol: string; explorer: string }

export type NetworkStatus = {
  label: string
  symbol: string
  rpc: string
  chain_id: number
  expected_chain_id: number
  chain_id_verified: boolean
  latency_ms: number
  block_number: number
  block_timestamp: number
  gas_price_gwei: number
  base_fee_gwei: number | null
  source: string
  fetched_at: string
  cached: boolean
  native: { price_usd: number; pair: string; dex: string } | null
}

export type Pair = {
  chain: string
  dex: string
  url: string
  pair_address: string
  base: { address: string; name: string; symbol: string }
  quote: { address: string; symbol: string }
  price_usd: number | null
  price_change_24h: number | null
  liquidity_usd: number | null
  volume_24h: number | null
}

export type PairsResponse = { pairs: Pair[]; source: string; fetched_at: string; cached: boolean }

type FeeSummary = { slots: number; median: number; p75: number; p90: number; non_zero_share: number }

export type SolanaStatus = {
  rpc: string
  latency_ms: number
  genesis_hash: string
  genesis_verified: boolean
  health: string
  version: string | null
  slot: number
  block_height: number
  block_time: number | null
  epoch: number
  slot_index: number
  slots_in_epoch: number
  epoch_progress: number
  transaction_count: number | null
  tps: { total: number; non_vote: number; avg_slot_ms: number | null; window_secs: number } | null
  priority_fees: FeeSummary
  hot_account_fees: (FeeSummary & { pair: string; dex: string; account: string }) | null
  base_fee_lamports: number
  source: string
  fetched_at: string
  cached: boolean
  native: { price_usd: number; pair: string; dex: string } | null
}

export type WatchToken = {
  symbol: string
  name: string
  price_usd: number
  price_change_24h: number | null
  liquidity_usd: number | null
  pair: string
  dex: string
  url: string
}
