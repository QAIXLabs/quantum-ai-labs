/**
 * DEMO DATA. Fictional fixtures for `npm run dev:demo`, so the Quantum Agent chart can be
 * tried without the hosted API. The "DEMO" coin and every price below are synthetic: they come
 * from a fixed formula, not from any market. Nothing here is served in a production build.
 */

export const DEMO_PAIR = 'DEMOUSDT'

const HOUR = 3600
// Fixed start time keeps the demo identical on every run.
const START = 1_767_225_600 // 2026-01-01T00:00:00Z

function demoCandles(count = 240) {
  const candles = []
  let close = 100
  for (let i = 0; i < count; i++) {
    const open = close
    // Deterministic wave plus a slow drift: looks like a chart, means nothing.
    close = +(open + Math.sin(i / 9) * 1.6 + Math.cos(i / 4) * 0.7 + 0.05).toFixed(2)
    const high = +(Math.max(open, close) + 0.8 + Math.abs(Math.sin(i)) * 0.6).toFixed(2)
    const low = +(Math.min(open, close) - 0.8 - Math.abs(Math.cos(i)) * 0.6).toFixed(2)
    candles.push({ time: START + i * HOUR, open, high, low, close, volume: Math.round(1_000 + Math.abs(Math.sin(i / 3)) * 4_000) })
  }
  return candles
}

function ema(candles: { time: number; close: number }[], period: number) {
  const k = 2 / (period + 1)
  let value = candles[0].close
  return candles.map((c) => {
    value = c.close * k + value * (1 - k)
    return { time: c.time, value: +value.toFixed(2) }
  })
}

export function demoKlines(interval: string) {
  const candles = demoCandles()
  return { pair: DEMO_PAIR, interval, candles, ema: { ema20: ema(candles, 20), ema50: ema(candles, 50), ema200: ema(candles, 200) } }
}

/** NDJSON lines for one demo agent reply: some text, a chart, then done. */
export function demoChatLines(): string[] {
  const chart = { pair: DEMO_PAIR, symbol: 'DEMO', timeframe: '1h', support: [108, 101], resistance: [124] }
  return [
    { type: 'tool', name: 'analyze_coin' },
    { type: 'text', text: 'Demo mode: this reply and the DEMO chart below are fictional sample data, not market analysis. ' },
    { type: 'chart', chart },
    { type: 'text', text: 'Connect the hosted API to get real answers.' },
    { type: 'done' },
  ].map((event) => JSON.stringify(event) + '\n')
}
