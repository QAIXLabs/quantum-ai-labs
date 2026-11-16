import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowRight, ArrowUpRight, Search } from 'lucide-react'
import Notice from '../../components/Notice'
import { api, clock, num, type NetworkInfo } from './api'

const ADDRESS = /^0x[0-9a-fA-F]{40}$/
const TX_HASH = /^0x[0-9a-fA-F]{64}$/

type Tab = 'address' | 'tx' | 'token'

const TABS: { id: Tab; label: string; placeholder: string }[] = [
  { id: 'address', label: 'Address', placeholder: '0x… (40 hex characters)' },
  { id: 'tx', label: 'Transaction', placeholder: '0x… (64 hex characters)' },
  { id: 'token', label: 'Token contract', placeholder: 'ERC-20 contract 0x…' },
]

// Lookup responses: only the fields the result rows read.
type Lookup = { tab: Tab; rpc: string; chain_id: number; fetched_at: string; explorer_url: string } & Record<string, unknown>

function rows(tab: Tab, r: Lookup): [string, ReactNode][] {
  const s = (v: unknown) => (v == null ? null : String(v))
  if (tab === 'address')
    return [
      ['Balance', `${s(r.balance)} ${s(r.symbol)}`],
      ['Transactions sent (nonce)', num(r.tx_count as number)],
      [
        'Type',
        r.is_contract ? 'Contract' : r.delegated_to ? `Externally owned account (EIP-7702 delegated to ${s(r.delegated_to)})` : 'Externally owned account',
      ],
    ]
  if (tab === 'tx')
    return [
      ['Status', s(r.status)],
      ['Block', r.block_number ? num(r.block_number as number) : 'Pending'],
      ['From', s(r.from)],
      ['To', s(r.to) || 'Contract creation'],
      ['Value', `${s(r.value)} ${s(r.symbol)}`],
      ['Gas used', num(r.gas_used as number)],
      ['Effective gas price', r.effective_gas_price_gwei != null ? `${s(r.effective_gas_price_gwei)} gwei` : '—'],
    ]
  return [
    ['Name', s(r.name)],
    ['Symbol', s(r.symbol)],
    ['Decimals', s(r.decimals)],
    ['Total supply', s(r.total_supply)],
    ...(r.holder ? ([['Holder balance', s(r.holder_balance)]] as [string, ReactNode][]) : []),
    ['ERC-20 interface', r.erc20_like ? 'Detected' : 'Not detected'],
  ]
}

/** Read-only lookups of addresses, transactions and ERC-20 tokens on the selected network. */
export function Explorer({ network, networks }: { network: string; networks: NetworkInfo[] }) {
  const [tab, setTab] = useState<Tab>('address')
  const [query, setQuery] = useState('')
  const [holder, setHolder] = useState('')
  const [state, setState] = useState<{ loading: boolean; error: string | null; result: Lookup | null }>({
    loading: false,
    error: null,
    result: null,
  })
  const label = networks.find((n) => n.id === network)?.label || network
  const current = TABS.find((t) => t.id === tab)!

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    const h = holder.trim()
    if (!(tab === 'tx' ? TX_HASH : ADDRESS).test(q))
      return setState({
        loading: false,
        result: null,
        error:
          tab === 'tx'
            ? 'Invalid transaction hash: expected 0x followed by 64 hex characters.'
            : 'Invalid address: expected 0x followed by 40 hex characters.',
      })
    if (tab === 'token' && h && !ADDRESS.test(h)) return setState({ loading: false, result: null, error: 'Invalid holder address.' })
    setState({ loading: true, error: null, result: null })
    const body =
      tab === 'address' ? { network, address: q } : tab === 'tx' ? { network, hash: q } : { network, contract: q, holder: h || undefined }
    try {
      const result = await api<Omit<Lookup, 'tab'>>(`/web3/${tab}`, { method: 'POST', body })
      setState({ loading: false, error: null, result: { tab, ...result } as Lookup })
    } catch (err) {
      setState({ loading: false, error: (err as Error).message, result: null })
    }
  }

  const result = state.result?.tab === tab ? state.result : null

  return (
    <div className="panel p-5 sm:p-6">
      <p className="kicker">Read-only explorer · {label}</p>
      <div className="mt-3 flex gap-1" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            aria-pressed={tab === t.id}
            className="chip"
            onClick={() => {
              setTab(t.id)
              setState({ loading: false, error: null, result: null })
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <form className="mt-4 space-y-2" onSubmit={(e) => void submit(e)}>
        <label className="block">
          <span className="sr-only">{current.label}</span>
          <input
            className="field font-mono text-xs"
            maxLength={80}
            placeholder={current.placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        {tab === 'token' && (
          <input
            className="field font-mono text-xs"
            maxLength={64}
            placeholder="Optional holder address 0x…"
            value={holder}
            onChange={(e) => setHolder(e.target.value)}
            aria-label="Optional holder address"
          />
        )}
        <button type="submit" className="btn-primary btn-sm" disabled={state.loading || !query.trim()}>
          <Search size={12} /> {state.loading ? 'Looking up…' : 'Look up'}
        </button>
      </form>

      {state.error && (
        <div className="mt-4">
          <Notice tone="error">{state.error}</Notice>
        </div>
      )}

      {result && (
        <div className="mt-5">
          {rows(tab, result).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-t border-white/[0.06] py-2 text-xs">
              <span className="text-white/60">{k}</span>
              <span className="break-all text-right font-mono text-white/85">{v ?? '—'}</span>
            </div>
          ))}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/55">
            <span className="font-mono">
              chain ID {result.chain_id} verified · {clock(result.fetched_at)}
            </span>
            <span className="flex flex-wrap gap-3">
              {tab === 'address' && typeof result.address === 'string' && (
                <Link to={`/pqc?address=${result.address}`} className="link-arrow text-[11px]">
                  Check wallet safety <ArrowRight size={11} />
                </Link>
              )}
              <a href={result.explorer_url} target="_blank" rel="noopener noreferrer" className="link-arrow text-[11px]">
                Open in block explorer <ArrowUpRight size={11} />
              </a>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
