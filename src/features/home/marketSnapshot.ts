type Candle = { time: number; close: number }

/** Chart endpoints use seconds. Never label a partial or discontinuous series as a 24h change. */
export function marketSnapshot(candles: Candle[] | undefined) {
  const points = candles?.slice(-25)
  if (!points?.length || points.some(c => !Number.isFinite(c.close) || c.close <= 0 || !Number.isFinite(c.time))) {
    throw new Error('No valid market data returned.')
  }
  const last = points[points.length - 1].close
  const fullDay = points.length === 25 && points.every((c, i) => i === 0 || c.time - points[i - 1].time === 3600)
  return { last, change: fullDay ? ((last - points[0].close) / points[0].close) * 100 : null, closes: points.map(c => c.close) }
}
