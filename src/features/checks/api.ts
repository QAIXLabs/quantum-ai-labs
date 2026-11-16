import { api } from '../../lib/api'

export type NarrativeVerdict = 'LARP' | 'LIKELY LARP' | 'UNCLEAR' | 'PARTLY REAL' | 'LIKELY REAL'
export type HoldersVerdict = 'RIGGED' | 'SKETCHY' | 'OK'

export type Check = {
  id: string
  mint: string
  name: string
  symbol: string
  image: string | null
  stage: 'graduated' | 'bonding_curve'
  checked_at: string
  coin_age_minutes: number | null
  market_cap_at_check: number | null
  total: number
  summary: string
  narrative: { verdict: NarrativeVerdict; score: number; report: string[]; ai: boolean }
  holders: {
    verdict: HoldersVerdict
    score: number
    facts: string[]
    holder_count: number | null
    top10_pct: number | null
    insiders: number | null
    creator_pct: number | null
  }
  links: { chart: string | null; website: string | null; x: string | null; telegram: string | null; pump_fun: string | null }
  /** Set when a coin borrows the QAI name without being the official token. */
  warning?: string | null
}

export type Live = { market_cap: number | null; change_h1: number | null } | null
export type FeedItem = Check & { live: Live }
export type FeedSort = 'latest' | 'real' | 'risky'

export const MINT_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

export const runCheck = (mint: string) =>
  api<{ check: Check; live: Live; reused: boolean; saved: boolean }>('/checks', { method: 'POST', body: { mint }, timeout: 60_000 })

export const fetchFeed = (sort: FeedSort) => api<{ checks: FeedItem[]; persistent: boolean }>(`/checks?sort=${sort}`)

export const fetchCheck = (id: string) => api<{ check: Check; live: Live }>(`/checks/${id}`)

/** Percent change of the market cap since the check, or null when either side is unknown. */
export function sinceCheck(check: Pick<Check, 'market_cap_at_check'>, live: Live): number | null {
  const before = check.market_cap_at_check
  const now = live?.market_cap
  if (!before || !now) return null
  return ((now - before) / before) * 100
}

export function age(minutes: number | null): string {
  if (minutes == null) return 'unknown age'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 48) return `${hours} h ${minutes % 60} min`
  return `${Math.floor(hours / 24)} days`
}

export function timeAgo(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60_000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function compactUsd(value: number | null | undefined): string {
  if (value == null) return '—'
  return '$' + Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

/** Tone of a verdict for colouring: good, mid, warn or bad. */
export function verdictTone(verdict: NarrativeVerdict | HoldersVerdict): 'good' | 'mid' | 'neutral' | 'warn' | 'bad' {
  switch (verdict) {
    case 'LIKELY REAL':
    case 'OK':
      return 'good'
    case 'PARTLY REAL':
      return 'mid'
    case 'UNCLEAR':
      return 'neutral'
    case 'LIKELY LARP':
    case 'SKETCHY':
      return 'warn'
    default:
      return 'bad'
  }
}
