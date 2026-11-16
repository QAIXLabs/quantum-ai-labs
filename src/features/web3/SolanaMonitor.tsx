import { useQuery } from '@tanstack/react-query'
import { RefreshCw, ShieldCheck } from 'lucide-react'
import Notice from '../../components/Notice'
import StatCard from '../../components/StatCard'
import { ago, api, clock, num, shortAddr, usd, useStoredState, useTick, type SolanaStatus } from './api'

const fee = (value: number | null | undefined) => (value == null ? '—' : num(value, { maximumFractionDigits: 0 }))

/** Rough time to the end of the epoch from the remaining slots and the average slot time. */
function epochEta(s: SolanaStatus | null) {
  if (!s?.slots_in_epoch || !s.tps?.avg_slot_ms) return ''
  const secs = ((s.slots_in_epoch - s.slot_index) * s.tps.avg_slot_ms) / 1000
  const hours = Math.floor(secs / 3600)
  return ` · ≈${hours ? `${hours}h ` : ''}${Math.round((secs % 3600) / 60)}m left`
}

/** Solana mainnet health, slot, epoch, throughput and priority fees over public RPC. */
export function SolanaMonitor() {
  const [autoRefresh, setAutoRefresh] = useStoredState('qal-sol-auto-refresh', true)
  useTick()

  // A failed refresh keeps the last successful reading on screen.
  const query = useQuery({
    queryKey: ['web3-solana-status'],
    queryFn: () => api<SolanaStatus>('/web3/solana-status', { timeout: 20_000 }),
    staleTime: 0,
    retry: false,
    refetchInterval: autoRefresh ? 30_000 : false,
  })
  const status = query.data ?? null
  const error = query.error?.message ?? null
  const loading = query.isFetching
  const refresh = () => void query.refetch()

  const stale = Boolean(error && status)
  const hot = status?.hot_account_fees
  const global = status?.priority_fees

  return (
    <div className="panel p-5 sm:p-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <p className="kicker">SOLANA MONITOR - MAINNET</p>
          <h2 className="mt-3 font-display text-2xl font-light tracking-tight sm:text-3xl">Network health, slot &amp; fees</h2>
        </div>
        <label className="flex items-center gap-2 pb-2.5 text-xs text-white/65">
          <input type="checkbox" className="accent-[#8fd9f7]" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} /> Auto-refresh 30 s
        </label>
        <button type="button" className="btn-ghost btn-sm mb-0.5" onClick={refresh} disabled={loading}>
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {error && (
        <div className="mt-4">
          <Notice tone="error">
            {stale ? `Latest refresh failed. Showing the last successful reading from ${clock(status!.fetched_at)}. ` : ''}
            {error}
          </Notice>
        </div>
      )}

      <div className={'mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 ' + (stale ? 'opacity-60' : '')}>
        <StatCard
          label="Cluster"
          value={
            status ? (
              <span className="inline-flex items-center gap-1.5">
                mainnet-beta
                {status.genesis_verified && <ShieldCheck size={14} className="text-lab-ok" aria-label="verified" />}
              </span>
            ) : (
              '—'
            )
          }
          sub={status ? `genesis ${shortAddr(status.genesis_hash)} · verified` : loading ? 'Loading…' : 'Unavailable'}
        />
        <StatCard
          label="Slot"
          value={status ? num(status.slot) : '—'}
          sub={status ? (status.block_time ? `block time ${ago(status.block_time)}` : 'block time not yet available') : ''}
        />
        <StatCard label="Block height" value={status ? num(status.block_height) : '—'} sub="getEpochInfo" />
        <StatCard
          label="Epoch"
          value={status ? `${status.epoch} · ${(status.epoch_progress * 100).toFixed(1)}%` : '—'}
          sub={status ? `${num(status.slots_in_epoch - status.slot_index)} slots remaining${epochEta(status)}` : ''}
        />
        <StatCard
          label="TPS (all)"
          value={status?.tps ? num(status.tps.total, { maximumFractionDigits: 0 }) : '—'}
          sub={
            status?.tps
              ? `non-vote ${num(status.tps.non_vote, { maximumFractionDigits: 0 })} · ${Math.round(status.tps.window_secs / 60)}-min average`
              : ''
          }
        />
        <StatCard label="Avg slot time" value={status?.tps?.avg_slot_ms ? `${status.tps.avg_slot_ms} ms` : '—'} sub="getRecentPerformanceSamples" />
        <StatCard
          label="Priority fee · hot pool"
          value={hot ? fee(hot.median) : '—'}
          sub={hot ? `median µ-lamports/CU · p75 ${fee(hot.p75)} · p90 ${fee(hot.p90)}` : status ? 'Unavailable' : ''}
        />
        <StatCard
          label="Priority fee · global min"
          value={global ? fee(global.median) : '—'}
          sub={global ? `median µ-lamports/CU · ${(global.non_zero_share * 100).toFixed(0)}% of slots non-zero` : ''}
        />
        <StatCard label="Base fee (lamports)" value={status ? num(status.base_fee_lamports) : '—'} sub="per signature · protocol constant" />
        <StatCard
          label="SOL price"
          value={status?.native ? usd(status.native.price_usd) : '—'}
          sub={status ? (status.native ? `${status.native.pair} · ${status.native.dex}` : 'Unavailable') : ''}
        />
        <StatCard
          label="Transactions (all-time)"
          value={
            status?.transaction_count
              ? Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 2 }).format(status.transaction_count)
              : '—'
          }
          sub={status?.transaction_count ? num(status.transaction_count) : 'getEpochInfo'}
        />
        <StatCard
          label="RPC health"
          value={
            status ? (
              <span className={status.health === 'ok' ? 'text-lab-ok' : 'text-amber-200'}>
                {status.health} · {status.latency_ms}ms
              </span>
            ) : (
              '—'
            )
          }
          sub={status ? (status.version ? `Node v${status.version}` : 'Response time') : ''}
        />
      </div>

      {status && (
        <div className="mt-3 space-y-1 font-mono text-[11px] leading-relaxed text-white/55">
          <p>
            Last successful update {clock(status.fetched_at)}
            {status.cached ? ' (served from 10 s cache)' : ''}
          </p>
          <p>
            Priority fees are the per-slot minimum fee paid by landed transactions over the last {global?.slots || 150} slots. “Hot pool” =
            transactions writing the highest-liquidity {hot?.pair || 'SOL/USDC'} pool
            {hot ? ` (${hot.dex}, ${shortAddr(hot.account)})` : ''} found in live market data. That is a better guide to competitive fees than the global
            minimum. Health shown as reported by the RPC node.
          </p>
        </div>
      )}
    </div>
  )
}
