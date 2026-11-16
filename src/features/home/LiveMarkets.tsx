import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { ArrowUpRight, RefreshCw } from 'lucide-react'
import { api, changeClass, clock, num, pct, usd, type NetworkStatus } from '../web3/api'
import CoinLogo from './CoinLogo'
import { marketSnapshot } from './marketSnapshot'

type Klines = { candles: { time: number; close: number }[] }
type SolanaSummary = { tps: { total: number } | null; fetched_at: string }
const ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin', pair: 'BTCUSDT' },
  { symbol: 'ETH', name: 'Ethereum', pair: 'ETHUSDT' },
  { symbol: 'SOL', name: 'Solana', pair: 'SOLUSDT' },
]
const REFRESH_MS = 60_000

function useHourly(pair: string) {
  return useQuery({
    queryKey: ['home-klines', pair],
    queryFn: async () => {
      const { candles } = await api<Klines>(`/market/klines?pair=${pair}&interval=1h`, { timeout: 20_000 })
      return marketSnapshot(candles)
    },
    refetchInterval: REFRESH_MS,
    retry: 1,
  })
}

function Sparkline({ values, up }: { values: number[]; up: boolean }) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const span = Math.max(...values) - min || 1
  const points = values.map((v, i) => `${((i / (values.length - 1)) * 180).toFixed(2)},${(45 - ((v - min) / span) * 38).toFixed(2)}`).join(' ')
  return <svg viewBox="0 0 180 52" preserveAspectRatio="none" className="market-sparkline" aria-hidden="true"><path d="M0 51H180" stroke="white" strokeOpacity=".08" /><polyline points={points} fill="none" stroke={up ? 'var(--color-lab-ok)' : '#fca5a5'} strokeWidth="1.3" vectorEffect="non-scaling-stroke" /></svg>
}

function AssetCard({ symbol, name, pair }: (typeof ASSETS)[number]) {
  const { data, isError, isFetching, dataUpdatedAt, refetch } = useHourly(pair)
  return <article className="market-asset" aria-label={`${name} market data`}>
    <div className="market-asset-heading"><span className="coin-logo"><CoinLogo symbol={symbol} /></span><span className="text-sm font-medium">{name} <span className="ml-2 font-mono text-[11px] text-white/45">{symbol}</span></span><span className="market-pair">/ USDT</span></div>
    <div className="market-asset-values">{data ? <><div><p className="market-price">{usd(data.last)}</p><p className={`mt-1 font-mono text-xs ${data.change === null ? 'text-white/50' : changeClass(data.change)}`}>{data.change === null ? '24h change unavailable' : `${pct(data.change)} `}{data.change !== null && <span className="text-white/40">/ 24h</span>}</p></div><Sparkline values={data.closes} up={(data.change ?? 0) >= 0} /></> : isError ? <div className="market-unavailable"><span>Price unavailable</span><button type="button" className="link-arrow text-xs" disabled={isFetching} onClick={() => void refetch()} aria-label={`Retry ${name} prices`}><RefreshCw size={12} />{isFetching ? 'Retrying…' : 'Retry'}</button></div> : <div className="market-skeleton" role="status" aria-label={`Loading ${name} prices`}><span /><span /></div>}</div>
    <div className="market-update">{data ? <><span className={`signal-dot ${isError ? 'signal-stale' : ''}`} />{isError ? 'Update failed · last received ' : 'Received '}{clock(new Date(dataUpdatedAt).toISOString())}</> : isError ? 'Source temporarily unavailable' : 'Connecting to market data…'}</div>
  </article>
}

export default function LiveMarkets() {
  const eth = useQuery({ queryKey: ['home-eth-status'], queryFn: () => api<NetworkStatus>('/web3/network-status', { method: 'POST', body: { network: 'ethereum' }, timeout: 20_000 }), refetchInterval: REFRESH_MS, retry: 1 })
  const sol = useQuery({ queryKey: ['home-sol-status'], queryFn: () => api<SolanaSummary>('/web3/solana-status', { timeout: 20_000 }), refetchInterval: REFRESH_MS, retry: 1 })
  return <div className="markets-module">
    <div className="markets-heading"><h2 className="eyebrow">MARKET OBSERVATORY</h2><span>Hourly candles / refreshes every 60s</span><Link to="/web3" className="link-arrow">Open monitor <ArrowUpRight size={13} /></Link></div>
    <div className="market-grid">{ASSETS.map(a => <AssetCard key={a.pair} {...a} />)}</div>
    <div className="network-strip"><span className="eyebrow">NETWORK SIGNALS</span><span>ETH gas <strong>{eth.data ? `${num(eth.data.gas_price_gwei, { maximumFractionDigits: 2 })} gwei` : '—'}</strong></span><span>ETH block <strong>{eth.data ? num(eth.data.block_number) : '—'}</strong></span><span>SOL TPS <strong>{sol.data?.tps ? num(sol.data.tps.total, { maximumFractionDigits: 0 }) : '—'}</strong></span></div>
  </div>
}
