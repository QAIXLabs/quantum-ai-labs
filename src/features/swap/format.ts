import type { ExchangeStatus } from './api'

/** Formats a coin amount with precision that scales with its size. */
export function formatAmount(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? Number.parseFloat(value) : value
  if (n == null || !Number.isFinite(n) || n === 0) return '0'
  const abs = Math.abs(n)
  const digits = abs >= 1000 ? 2 : abs >= 1 ? 4 : abs >= 0.01 ? 6 : 8
  return n.toLocaleString('en-US', { maximumFractionDigits: digits })
}

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 })

/** Short form for big stat numbers: 1,000,000 → "1M", 1,250 → "1.25K", 94.5485 → "94.55". */
export function formatCompact(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? Number.parseFloat(value) : value
  if (n == null || !Number.isFinite(n)) return '—'
  return Math.abs(n) > 0 && Math.abs(n) < 0.01 ? formatAmount(n) : compact.format(n)
}

export const upper = (s: string | undefined) => (s ?? '').toUpperCase()

export const shortAddress = (address: string, size = 6) =>
  address.length > size * 2 + 3 ? `${address.slice(0, size)}…${address.slice(-size)}` : address

/** Fills a SimpleSwap explorer template like `https://etherscan.io/tx/{}`. */
export const explorerLink = (template: string | null | undefined, value: string | null | undefined) =>
  template && value ? template.replace('{}', encodeURIComponent(value)) : undefined

export function timeAgo(iso: string, now = Date.now()) {
  const seconds = Math.max(0, Math.round((now - Date.parse(iso)) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function countdown(untilIso: string | null | undefined, now = Date.now()) {
  if (!untilIso) return null
  const ms = Date.parse(untilIso) - now
  if (ms <= 0) return '0:00'
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export const STATUS_LABEL: Record<ExchangeStatus, string> = {
  waiting: 'Awaiting deposit',
  confirming: 'Confirming deposit',
  exchanging: 'Exchanging',
  sending: 'Sending to you',
  finished: 'Finished',
  failed: 'Failed',
  refunded: 'Refunded',
  expired: 'Expired',
  verifying: 'Under verification',
}

export const STATUS_TONE: Record<ExchangeStatus, 'idle' | 'active' | 'success' | 'error' | 'info'> = {
  waiting: 'idle',
  confirming: 'active',
  exchanging: 'active',
  sending: 'active',
  verifying: 'active',
  finished: 'success',
  failed: 'error',
  expired: 'error',
  refunded: 'info',
}
