// Typed client for the exchange API (SimpleSwap Public API v3), called through the hosted API, which holds the partner key.
const BASE = '/api/swap/v3'

export type Currency = {
  name: string
  ticker: string
  network: string
  image: string
  hasExtraId: boolean
  /** Label for the extra id (memo / destination tag), when the network needs one. */
  extraId: string | null
  validationAddress: string | null
  validationExtra: string | null
  warningsFrom: string[]
  warningsTo: string[]
  addressExplorer: string | null
  txExplorer: string | null
  isFiat: boolean
  enabled: boolean
  isAvailableFloat: boolean
  isAvailableFixed: boolean
}

export type ExchangeStatus =
  | 'waiting'
  | 'confirming'
  | 'exchanging'
  | 'sending'
  | 'finished'
  | 'failed'
  | 'refunded'
  | 'expired'
  | 'verifying'

export type Exchange = {
  id: string
  type: 'fixed' | 'floating'
  createdAt: string
  updatedAt: string
  validUntil: string | null
  tickerFrom: string
  tickerTo: string
  networkFrom: string
  networkTo: string
  amountFrom: string
  expectedAmount: string
  amountTo: string | null
  /** Deposit address the user sends funds to. */
  addressFrom: string
  addressTo: string
  extraIdFrom: string | null
  extraIdTo: string | null
  /** Where the deposit goes back if the swap can't complete (optional, on the sent coin's network). */
  userRefundAddress?: string | null
  userRefundExtraId?: string | null
  txFrom: string | null
  txTo: string | null
  status: ExchangeStatus
  redirectUrl: string | null
  currencies?: Record<string, Currency>
}

export type Estimate = { estimatedAmount: string; rateId: string | null; validUntil: string | null }
export type Range = { min: string; max: string | null }

export type CreateExchangeInput = {
  tickerFrom: string
  networkFrom: string
  tickerTo: string
  networkTo: string
  amount: string
  addressTo: string
  fixed: boolean
  reverse: false
  extraIdTo?: string
  rateId?: string
  userRefundAddress?: string
  userRefundExtraId?: string
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const userHeaders = (): Record<string, string> => ({
  'x-user-agent': navigator.userAgent,
  'x-user-language': navigator.language,
  'x-user-timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
})

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { accept: 'application/json', ...userHeaders(), ...init?.headers },
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const message = body?.message || body?.error || `Request failed (${res.status})`
    throw new ApiError(res.status, Array.isArray(message) ? message.join(', ') : String(message))
  }
  if (!body) throw new ApiError(503, 'The exchange API is not available.')
  return body.result as T
}

const qs = (params: Record<string, string | boolean>) => new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))

export const currencyKey = (c: { ticker: string; network: string }) => `${c.ticker}:${c.network}`
export const parseKey = (key: string) => {
  const [ticker, network] = key.split(':')
  return { ticker, network }
}

export const api = {
  currencies: () => request<Currency[]>('/currencies'),
  pairs: (from: string, fixed: boolean) => {
    const { ticker, network } = parseKey(from)
    return request<Record<string, string[]>>(`/pairs/${ticker}/${network}?${qs({ fixed })}`)
  },
  ranges: (from: string, to: string, fixed: boolean) => {
    const f = parseKey(from)
    const t = parseKey(to)
    return request<Range>(
      `/ranges?${qs({ tickerFrom: f.ticker, networkFrom: f.network, tickerTo: t.ticker, networkTo: t.network, fixed, reverse: false })}`,
    )
  },
  estimate: (from: string, to: string, amount: string, fixed: boolean) => {
    const f = parseKey(from)
    const t = parseKey(to)
    return request<Estimate>(
      `/estimates?${qs({ tickerFrom: f.ticker, networkFrom: f.network, tickerTo: t.ticker, networkTo: t.network, amount, fixed, reverse: false })}`,
    )
  },
  createExchange: (input: CreateExchangeInput) =>
    request<Exchange>('/exchanges', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    }),
  exchange: (id: string) => request<Exchange>(`/exchanges/${encodeURIComponent(id)}`),
}
