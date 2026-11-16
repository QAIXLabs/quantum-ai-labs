import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import {
  CandlestickSeries,
  ColorType,
  HistogramSeries,
  LineSeries,
  LineStyle,
  createChart,
  type IChartApi,
  type UTCTimestamp,
} from 'lightweight-charts'
import { fetchChartData, type ChartData, type ChartSpec } from './api'

const COLORS = {
  up: '#5eead4',
  down: '#f87171',
  ema20: '#8fd9f7',
  ema50: '#8b7cf6',
  ema200: '#f5c46b',
  support: '#5eead4',
  resistance: '#f87171',
  grid: 'rgba(255,255,255,0.04)',
  text: 'rgba(255,255,255,0.55)',
}

const ts = (t: number) => t as UTCTimestamp

function draw(container: HTMLElement, data: ChartData, spec: ChartSpec): IChartApi {
  const chart = createChart(container, {
    autoSize: true,
    layout: {
      background: { type: ColorType.Solid, color: 'transparent' },
      textColor: COLORS.text,
      fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
      fontSize: 10,
      // Required by the library's license: a visible link to TradingView on the chart.
      attributionLogo: true,
    },
    grid: { vertLines: { color: COLORS.grid }, horzLines: { color: COLORS.grid } },
    rightPriceScale: { borderColor: 'rgba(255,255,255,0.08)' },
    timeScale: { borderColor: 'rgba(255,255,255,0.08)', timeVisible: spec.timeframe !== '1d' },
    crosshair: { horzLine: { labelBackgroundColor: '#101018' }, vertLine: { labelBackgroundColor: '#101018' } },
  })

  const candles = chart.addSeries(CandlestickSeries, {
    upColor: COLORS.up,
    downColor: COLORS.down,
    borderVisible: false,
    wickUpColor: COLORS.up,
    wickDownColor: COLORS.down,
  })
  candles.setData(data.candles.map((c) => ({ time: ts(c.time), open: c.open, high: c.high, low: c.low, close: c.close })))

  const volume = chart.addSeries(HistogramSeries, { priceScaleId: 'volume', priceFormat: { type: 'volume' }, lastValueVisible: false, priceLineVisible: false })
  chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } })
  volume.setData(
    data.candles.map((c) => ({
      time: ts(c.time),
      value: c.volume,
      color: c.close >= c.open ? 'rgba(94,234,212,0.25)' : 'rgba(248,113,113,0.25)',
    })),
  )

  for (const key of ['ema20', 'ema50', 'ema200'] as const) {
    const line = chart.addSeries(LineSeries, {
      color: COLORS[key],
      lineWidth: key === 'ema200' ? 2 : 1,
      lastValueVisible: false,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    })
    line.setData(data.ema[key].map((p) => ({ time: ts(p.time), value: p.value })))
  }

  const level = (price: number | null, i: number, kind: 'support' | 'resistance') => {
    if (price == null) return
    candles.createPriceLine({
      price,
      color: COLORS[kind],
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: `${kind === 'support' ? 'S' : 'R'}${i + 1}`,
    })
  }
  spec.support.forEach((p, i) => level(p, i, 'support'))
  spec.resistance.forEach((p, i) => level(p, i, 'resistance'))

  // Show roughly the last 120 candles; older history stays reachable by scrolling.
  const total = data.candles.length
  chart.timeScale().setVisibleLogicalRange({ from: Math.max(0, total - 120), to: total + 3 })
  return chart
}

/** Candlestick chart for one analyze_coin result: candles, volume, EMAs and its levels. */
export function PriceChart({ spec }: { spec: ChartSpec }) {
  const ref = useRef<HTMLDivElement>(null)
  const query = useQuery({
    queryKey: ['chart', spec.pair, spec.timeframe],
    queryFn: () => fetchChartData(spec.pair, spec.timeframe),
    staleTime: 30_000,
  })

  useEffect(() => {
    if (!ref.current || !query.data) return
    const chart = draw(ref.current, query.data, spec)
    return () => chart.remove()
  }, [query.data, spec])

  const legend: [string, string][] = [
    ['EMA20', COLORS.ema20],
    ['EMA50', COLORS.ema50],
    ['EMA200', COLORS.ema200],
    ['Support', COLORS.support],
    ['Resistance', COLORS.resistance],
  ]

  return (
    <figure className="my-1 overflow-hidden rounded-control border border-white/[0.08] bg-black/40 font-mono">
      <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-white/[0.06] px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-white/60">
        <span className="text-white/80">
          {spec.symbol}/USDT · {spec.timeframe}
        </span>
        {legend.map(([label, color]) => (
          <span key={label} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3" style={{ backgroundColor: color }} aria-hidden="true" />
            {label}
          </span>
        ))}
      </figcaption>
      <div className="relative h-[300px] sm:h-[340px]">
        <div ref={ref} className="absolute inset-0" />
        {query.isPending && <p className="absolute inset-0 flex items-center justify-center text-xs text-white/55">Loading chart…</p>}
        {query.isError && (
          <p className="absolute inset-0 flex items-center justify-center px-4 text-center text-xs text-red-300">
            Couldn’t load chart: {query.error.message}
          </p>
        )}
      </div>
      <p className="border-t border-white/[0.06] px-3 py-1.5 text-[11px] text-white/55">
        {spec.pair === 'DEMOUSDT'
          ? 'Fictional demo candles (npm run dev:demo). Not market data.'
          : 'Live market candles. S/R levels as of the analysis. Not a forecast.'}
      </p>
      <p className="border-t border-white/[0.06] px-3 py-1.5 text-[10px] text-white/45">
        Chart by{' '}
        <a href="https://www.tradingview.com/" target="_blank" rel="noopener noreferrer" className="underline decoration-white/30 hover:text-white/75">
          TradingView Lightweight Charts™
        </a>
        . Copyright (c) 2025 TradingView, Inc.
      </p>
    </figure>
  )
}
