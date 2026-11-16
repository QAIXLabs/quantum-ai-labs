import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { BellRing, RefreshCw, ShieldCheck, TriangleAlert } from 'lucide-react'
import Notice from '../../components/Notice'
import StatCard from '../../components/StatCard'
import {
  PERMISSION_TEXT,
  ago,
  api,
  clock,
  notify,
  num,
  usd,
  useNotificationPermission,
  useStoredState,
  useTick,
  type NetworkInfo,
  type NetworkStatus,
} from './api'

type GasAlertConfig = { enabled: boolean; threshold: number; direction: 'above' | 'below'; notify: boolean }

function GasAlert({
  gas,
  network,
  cfg,
  setCfg,
}: {
  gas: number | null | undefined
  network: string | undefined
  cfg: GasAlertConfig
  setCfg: (cfg: GasAlertConfig) => void
}) {
  const [text, setText] = useState(String(cfg.threshold))
  const [shown, setShown] = useState(cfg.threshold)
  if (cfg.threshold !== shown) {
    setShown(cfg.threshold)
    setText(String(cfg.threshold))
  }
  const { perm, request } = useNotificationPermission()
  const active = cfg.enabled && gas != null && (cfg.direction === 'above' ? gas > cfg.threshold : gas < cfg.threshold)
  const message = active
    ? `${network} gas is ${gas!.toLocaleString(undefined, { maximumFractionDigits: 4 })} gwei, ${cfg.direction} your ${cfg.threshold} gwei threshold.`
    : ''
  const [testStatus, setTestStatus] = useState<string | null>(null)

  // Notify once when the alert starts firing, only while the tab is in the background.
  const wasActive = useRef(active)
  useEffect(() => {
    if (active && !wasActive.current && cfg.notify && perm === 'granted' && document.hidden)
      notify('Quantum AI Labs gas alert', message, 'qal-gas-alert')
    wasActive.current = active
  }, [active, message, cfg.notify, perm])

  const toggleNotify = async (on: boolean) => {
    if (!on) return setCfg({ ...cfg, notify: false })
    const p = await request()
    setCfg({ ...cfg, notify: p === 'granted' })
  }

  return (
    <div className="mt-6 border-t border-white/[0.06] pt-5">
      <div className="flex flex-wrap items-end gap-3">
        <p className="mr-auto flex items-center gap-2 text-sm">
          <BellRing size={14} className="text-lab-violet" /> Gas alert
        </p>
        <label className="flex items-center gap-2 pb-2.5 text-xs text-white/65">
          <input type="checkbox" className="accent-[#8fd9f7]" checked={cfg.enabled} onChange={(e) => setCfg({ ...cfg, enabled: e.target.checked })} /> Enabled
        </label>
        <label>
          <span className="sr-only">Alert direction</span>
          <select
            className="field w-36"
            value={cfg.direction}
            onChange={(e) => setCfg({ ...cfg, direction: e.target.value as GasAlertConfig['direction'] })}
          >
            <option value="above">Warn above</option>
            <option value="below">Warn below</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="sr-only">Threshold in gwei</span>
          <input
            type="number"
            min="0"
            step="any"
            className="field w-28 font-mono"
            value={text}
            aria-label="Gas alert threshold in gwei"
            onChange={(e) => {
              setText(e.target.value)
              const n = parseFloat(e.target.value)
              if (Number.isFinite(n) && n >= 0) setCfg({ ...cfg, threshold: n })
            }}
          />
          <span className="font-mono text-[11px] text-white/55">gwei</span>
        </label>
      </div>
      {active && (
        <div
          role="alert"
          className="mt-4 flex items-center gap-2 rounded-control border border-amber-300/40 bg-amber-300/[0.08] px-3 py-2.5 text-sm text-amber-100"
        >
          <TriangleAlert size={15} className="shrink-0" />
          {message}
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-white/70">
          <input
            type="checkbox"
            className="accent-[#8fd9f7]"
            checked={cfg.notify}
            disabled={!cfg.enabled || perm === 'unsupported' || perm === 'denied'}
            onChange={(e) => void toggleNotify(e.target.checked)}
          />
          Browser notification when the alert triggers while this tab is in the background
        </label>
        {cfg.notify && perm === 'granted' && (
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() =>
              setTestStatus(
                notify(
                  'Quantum AI Labs gas alert',
                  'Test notification. Gas alerts will appear like this while this tab is in the background.',
                  'qal-gas-alert',
                )
                  ? 'Test notification sent'
                  : 'This browser blocked the notification',
              )
            }
          >
            Send test notification
          </button>
        )}
        <span className="text-[11px] text-white/55">{testStatus ?? PERMISSION_TEXT[perm]}</span>
      </div>
      <p className="mt-3 text-[11px] text-white/55">
        Compares the latest eth_gasPrice reading with your threshold. Preferences are stored in this browser. With notifications on, the
        monitor keeps refreshing every 30 s even when the tab is hidden; browsers may throttle hidden tabs to about once a minute.
        Nothing runs once the tab or browser is closed, because there is no server-side alerting.
      </p>
    </div>
  )
}

/** Live health of one EVM network over public JSON-RPC, with a gas alert. */
export function ChainMonitor({ network, setNetwork, networks }: { network: string; setNetwork: (id: string) => void; networks: NetworkInfo[] }) {
  const [autoRefresh, setAutoRefresh] = useStoredState('qal-auto-refresh', true)
  const [alertCfg, setAlertCfg] = useStoredState<GasAlertConfig>('qal-gas-alert', { enabled: true, threshold: 20, direction: 'above', notify: false })
  const notifying = alertCfg.enabled && alertCfg.notify
  useTick()

  // Each network has its own cache entry, so switching starts clean; a failed refresh keeps the last reading.
  const query = useQuery({
    queryKey: ['web3-network-status', network],
    queryFn: () => api<NetworkStatus>('/web3/network-status', { method: 'POST', body: { network } }),
    staleTime: 0,
    retry: false,
    refetchInterval: autoRefresh || notifying ? 30_000 : false,
    // With notifications on, keep checking while the tab is hidden.
    refetchIntervalInBackground: notifying,
  })
  const status = query.data ?? null
  const error = query.error?.message ?? null
  const loading = query.isFetching
  const refresh = () => void query.refetch()

  const stale = Boolean(error && status)
  const options = networks.length ? networks : [{ id: network, label: network } as NetworkInfo]

  return (
    <div className="panel p-5 sm:p-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <p className="kicker">Public chain monitor</p>
          <h2 className="mt-3 font-display text-2xl font-light tracking-tight sm:text-3xl">Network health &amp; gas</h2>
        </div>
        <label>
          <span className="sr-only">Network</span>
          <select className="field w-48" value={network} onChange={(e) => setNetwork(e.target.value)}>
            {options.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label}
              </option>
            ))}
          </select>
        </label>
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

      <div className={'mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6 ' + (stale ? 'opacity-60' : '')}>
        <StatCard
          label="Chain ID"
          value={
            status ? (
              <span className="inline-flex items-center gap-1.5">
                {status.chain_id}
                {status.chain_id_verified && <ShieldCheck size={14} className="text-lab-ok" aria-label="verified" />}
              </span>
            ) : (
              '—'
            )
          }
          sub={status ? `expected ${status.expected_chain_id} · verified` : loading ? 'Loading…' : 'Unavailable'}
        />
        <StatCard label="Latest block" value={status ? num(status.block_number) : '—'} sub={status ? `produced ${ago(status.block_timestamp)}` : ''} />
        <StatCard label="Gas price (gwei)" value={status ? num(status.gas_price_gwei, { maximumFractionDigits: 4 }) : '—'} sub="eth_gasPrice" />
        <StatCard
          label="Base fee (gwei)"
          value={status?.base_fee_gwei != null ? num(status.base_fee_gwei, { maximumFractionDigits: 4 }) : '—'}
          sub={status && status.base_fee_gwei == null ? 'Not reported' : 'EIP-1559'}
        />
        <StatCard
          label={`${status?.symbol || 'Native'} price`}
          value={status?.native ? usd(status.native.price_usd) : '—'}
          sub={status ? (status.native ? status.native.pair : 'Unavailable') : ''}
        />
        <StatCard label="RPC health" value={status ? `${status.latency_ms} ms` : '—'} sub={status ? 'Response time' : ''} />
      </div>

      {status && (
        <p className="mt-3 font-mono text-[11px] leading-relaxed text-white/55">
          Last successful update {clock(status.fetched_at)}
          {status.cached ? ' (served from 10 s cache)' : ''}
        </p>
      )}

      <GasAlert gas={stale ? null : status?.gas_price_gwei} network={status?.label} cfg={alertCfg} setCfg={setAlertCfg} />
    </div>
  )
}
