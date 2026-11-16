/** Client for the Quantum Agent API (hosted separately, see README). */

const BASE = '/api/agent'

/** A chart the terminal draws under a reply (from an analyze_coin call). */
export type ChartSpec = {
  pair: string
  symbol: string
  timeframe: '1h' | '4h' | '1d'
  support: (number | null)[]
  resistance: (number | null)[]
}

export type ChatMessage = { role: 'user' | 'assistant'; content: string; charts?: ChartSpec[] }

/** One line of the streamed NDJSON reply. */
export type AgentEvent =
  | { type: 'text'; text: string }
  | { type: 'tool'; name: string }
  | { type: 'chart'; chart: ChartSpec }
  | { type: 'done' }
  | { type: 'error'; message: string }

export async function agentStatus(): Promise<{ available: boolean }> {
  const response = await fetch(`${BASE}/status`)
  if (!response.ok) throw new Error(`Request failed (${response.status})`)
  return response.json()
}

/** Sends the conversation and calls `onEvent` for each streamed event until the reply ends. */
export async function streamChat(messages: ChatMessage[], onEvent: (event: AgentEvent) => void, signal?: AbortSignal) {
  const response = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    // Charts are display-only; the model only needs the text.
    body: JSON.stringify({ messages: messages.map(({ role, content }) => ({ role, content })) }),
    signal,
  })
  if (!response.ok || !response.body) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(body?.message ?? `Request failed (${response.status})`)
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += value
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) if (line.trim()) onEvent(JSON.parse(line) as AgentEvent)
  }
}

export type ChartData = {
  pair: string
  interval: string
  candles: { time: number; open: number; high: number; low: number; close: number; volume: number }[]
  ema: Record<'ema20' | 'ema50' | 'ema200', { time: number; value: number }[]>
}

export async function fetchChartData(pair: string, interval: string): Promise<ChartData> {
  const response = await fetch(`/api/market/klines?${new URLSearchParams({ pair, interval })}`)
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(body?.message ?? `Request failed (${response.status})`)
  return body as ChartData
}

/** What the terminal prints while a tool runs. */
export const TOOL_LABEL: Record<string, string> = {
  get_lab_info: 'reading Quantum AI Labs info',
  search_coins: 'searching coins',
  get_quote: 'fetching live quote',
  check_swap: 'checking swap status',
  market_overview: 'reading the whole market (BTC, dominance, sentiment, breadth)',
  analyze_coin: 'computing technical indicators',
  scan_altcoins: 'scanning top 100 altcoins',
  scan_pumpfun: 'screening pump.fun tokens (market data + rug checks)',
  check_pumpfun_token: 'screening token (market data + rug checks)',
}
