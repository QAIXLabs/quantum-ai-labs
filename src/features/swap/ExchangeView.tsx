import { useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { primaryCommunity } from '../../data/site'
import { copyText } from '../../lib/clipboard'
import { CoinIcon } from './CoinSelect'
import type { ExchangeStatus } from './api'
import { STATUS_LABEL, STATUS_TONE, countdown, explorerLink, formatAmount, shortAddress, timeAgo, upper } from './format'
import { isFinal, useSwapHistory } from './history'
import { useExchange, useNow } from './queries'
import { Spinner } from './Spinner'
import { LiveDot, Placeholder } from './SwapForm'

const STEPS: Array<{ status: ExchangeStatus; label: string }> = [
  { status: 'waiting', label: 'Deposit' },
  { status: 'confirming', label: 'Confirming' },
  { status: 'exchanging', label: 'Exchanging' },
  { status: 'sending', label: 'Sending' },
  { status: 'finished', label: 'Done' },
]

const stepIndex = (status: ExchangeStatus) => {
  if (status === 'verifying') return 2
  const i = STEPS.findIndex((s) => s.status === status)
  return i === -1 ? 0 : i
}

/** What is happening behind the scenes at each in-progress step, so a long wait doesn't look stuck. */
const STEP_INFO: Partial<Record<ExchangeStatus, { title: string; body: string }>> = {
  confirming: {
    title: 'Deposit received, waiting for network confirmations',
    body: 'Usually 5–30 minutes depending on the network. Bitcoin can take longer when the network is busy.',
  },
  exchanging: {
    title: 'Exchanging your coins',
    body: 'Your deposit is confirmed and is being swapped at the best available rate. Usually a few minutes.',
  },
  sending: {
    title: 'Sending coins to your wallet',
    body: 'The payout transaction is being broadcast. It should appear in your wallet shortly.',
  },
  verifying: {
    title: 'Under routine verification',
    body: 'This exchange is under a routine verification. The status will update here automatically.',
  },
}

const TONE_CLASS: Record<(typeof STATUS_TONE)[ExchangeStatus], string> = {
  idle: 'border-white/15 text-white/60 bg-white/[0.03]',
  active: 'border-lab-cyan/40 text-lab-cyan bg-lab-cyan/[0.06]',
  success: 'border-lab-ok/30 text-lab-ok bg-lab-ok/[0.06]',
  error: 'border-red-400/30 text-red-200 bg-red-400/[0.07]',
  info: 'border-lab-violet/50 text-[#b9adff] bg-lab-violet/10',
}

export function ExchangeStatusBadge({ status }: { status: ExchangeStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.12em] ${TONE_CLASS[STATUS_TONE[status]]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}

function CopyField({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    // If copying is blocked entirely, the value is still selectable.
    if (!(await copyText(value))) return
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="mt-4">
      <span className="field-label">{label}</span>
      <div className="flex items-center gap-2 rounded-control border border-white/10 bg-black/40 py-1.5 pl-3 pr-1.5">
        <span className={'min-w-0 flex-1 break-all text-sm text-white ' + (mono ? 'font-mono' : '')}>{value}</span>
        <button type="button" className="btn-ghost btn-sm shrink-0" onClick={() => void copy()}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

/** Explorer link when the network has one, otherwise the shortened hash. */
function TxLink({ label, hash, href }: { label: string; hash: string; href: string | undefined }) {
  if (!href) {
    return (
      <span className="font-mono" title={hash}>
        {label}: {shortAddress(hash)}
      </span>
    )
  }
  return (
    <a href={href} target="_blank" rel="noopener" className="text-lab-cyan hover:text-white">
      {label}
    </a>
  )
}

function Alert({ tone = 'info', children }: { tone?: 'info' | 'error'; children: ReactNode }) {
  const cls =
    tone === 'error' ? 'border-red-400/30 bg-red-400/[0.07] text-red-200' : 'border-white/10 bg-white/[0.03] text-white/65'
  return <p className={`mt-5 rounded-control border px-3 py-2.5 text-xs leading-relaxed ${cls}`}>{children}</p>
}

/** Live view of one exchange: deposit instructions, progress and payout details. */
export function ExchangeView({ id }: { id: string }) {
  const [, setParams] = useSearchParams()
  const query = useExchange(id)
  const record = useSwapHistory((s) => s.swaps.find((x) => x.id === id))
  const exchange = query.data ?? record
  const done = exchange ? isFinal(exchange.status) : false
  const now = useNow(!done)

  const back = () => setParams({})

  if (!exchange) {
    return (
      <Placeholder>
        {query.isError ? (
          <>
            <p>
              Couldn’t load exchange {id}: {query.error.message}
            </p>
            <button type="button" className="btn-ghost btn-sm" onClick={back}>
              New swap
            </button>
          </>
        ) : (
          <>
            <Spinner size={28} />
            <span>Loading exchange…</span>
          </>
        )}
      </Placeholder>
    )
  }

  const from = record?.from ?? query.data?.currencies?.[exchange.tickerFrom]
  const to = record?.to ?? query.data?.currencies?.[exchange.tickerTo]
  const current = stepIndex(exchange.status)
  const waiting = exchange.status === 'waiting'
  const info = STEP_INFO[exchange.status]
  const timeLeft = waiting ? countdown(exchange.validUntil, now) : null
  const received = exchange.amountTo && Number.parseFloat(exchange.amountTo) > 0 ? exchange.amountTo : null
  const txFromLink = explorerLink(from?.txExplorer, exchange.txFrom)
  const txToLink = explorerLink(to?.txExplorer, exchange.txTo)
  const updatedSeconds = query.dataUpdatedAt ? Math.max(0, Math.round((now - query.dataUpdatedAt) / 1000)) : null

  return (
    <div className="panel p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-display text-2xl font-light tracking-tight">
            {upper(exchange.tickerFrom)} → {upper(exchange.tickerTo)}
          </p>
          <p className="mt-1 break-all text-xs text-white/60">
            Exchange <span className="font-mono">{exchange.id}</span> · {exchange.type === 'fixed' ? 'Fixed' : 'Floating'} rate
          </p>
        </div>
        <ExchangeStatusBadge status={exchange.status} />
      </div>

      {!['failed', 'refunded', 'expired'].includes(exchange.status) && (
        <ol className="mt-6 grid grid-cols-5 gap-1" aria-label="Exchange progress">
          {STEPS.map((step, i) => {
            const isDone = i < current || exchange.status === 'finished'
            const isCurrent = i === current && !isDone
            return (
              <li
                key={step.status}
                aria-current={i === current ? 'step' : undefined}
                className={
                  'border-t-2 pt-2 font-mono text-[11px] uppercase tracking-[0.1em] ' +
                  (isDone ? 'border-lab-ok text-lab-ok' : isCurrent ? 'border-lab-cyan text-lab-cyan' : 'border-white/10 text-white/55')
                }
              >
                {step.label}
              </li>
            )
          })}
        </ol>
      )}

      {info && (
        <div className="mt-5 flex gap-3 rounded-control border border-lab-cyan/20 bg-lab-cyan/[0.04] p-4" role="status">
          <Spinner size={20} />
          <div className="text-xs leading-relaxed">
            <p className="text-sm font-medium text-white">{info.title}</p>
            <p className="mt-1 text-white/65">{info.body}</p>
            <p className="mt-1 text-white/65">
              You can close this page. The swap keeps running, and this link shows its status anytime.
            </p>
          </div>
        </div>
      )}
      {exchange.status === 'expired' && (
        <Alert tone="error">
          No deposit arrived before the deadline, so this exchange expired. Don’t send funds to its deposit address.
        </Alert>
      )}
      {exchange.status === 'failed' && (
        <Alert tone="error">
          This exchange failed.{' '}
          {primaryCommunity ? (
            <a href={primaryCommunity.url} target="_blank" rel="noopener" className="underline underline-offset-2">
              Contact support
            </a>
          ) : (
            'Contact support'
          )}{' '}
          with the exchange ID above.
        </Alert>
      )}
      {exchange.status === 'refunded' && (
        <Alert>
          {exchange.userRefundAddress ? (
            <>
              Your deposit was refunded to <span className="font-mono">{shortAddress(exchange.userRefundAddress)}</span>, the refund
              address you gave.
            </>
          ) : (
            'Your deposit was refunded. Check your sending wallet for the returned funds.'
          )}
        </Alert>
      )}

      {waiting && (
        <div className="mt-6 rounded-control border border-white/10 bg-white/[0.02] p-4">
          <p className="text-sm text-white/80">
            Send exactly{' '}
            <strong className="text-white">
              {exchange.amountFrom} {upper(exchange.tickerFrom)}
            </strong>{' '}
            {from && from.network !== from.ticker && <>on the {upper(from.network)} network </>}
            to this address
          </p>
          <CopyField label="Deposit address" value={exchange.addressFrom} />
          {exchange.extraIdFrom && <CopyField label={from?.extraId || 'Memo / Tag (required)'} value={exchange.extraIdFrom} />}
          <CopyField label="Amount" value={exchange.amountFrom} mono={false} />
          <p className="mt-4 flex items-center gap-2 text-xs text-white/65" role="status">
            <Spinner size={14} />
            Watching for your deposit…
          </p>
          {timeLeft && <p className="mt-2 font-mono text-xs text-lab-cyan">Send within {timeLeft}</p>}
          {from?.warningsFrom?.map((w) => (
            <p key={w} className="mt-2 text-xs leading-relaxed text-amber-200">
              {w}
            </p>
          ))}
        </div>
      )}

      <dl className="mt-6 divide-y divide-white/[0.06] border-y border-white/[0.06] text-sm">
        <SummaryRow label="You send">
          <CoinIcon coin={from} size={20} /> {exchange.amountFrom} {upper(exchange.tickerFrom)}
        </SummaryRow>
        <SummaryRow label={received ? 'You received' : exchange.type === 'fixed' ? 'You get' : 'You get (estimated)'}>
          <CoinIcon coin={to} size={20} /> {formatAmount(received ?? exchange.expectedAmount)} {upper(exchange.tickerTo)}
        </SummaryRow>
        <SummaryRow label="Recipient address">
          <span className="break-all font-mono text-xs">{exchange.addressTo}</span>
        </SummaryRow>
        {exchange.userRefundAddress && (
          <SummaryRow label="Refund address">
            <span className="break-all font-mono text-xs">
              {exchange.userRefundAddress}
              {exchange.userRefundExtraId && (
                <>
                  {' '}
                  · {from?.extraId || 'Memo'}: {exchange.userRefundExtraId}
                </>
              )}
            </span>
          </SummaryRow>
        )}
        {(exchange.txFrom || exchange.txTo) && (
          <SummaryRow label="Transactions">
            <span className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {exchange.txFrom && <TxLink label="Deposit tx" hash={exchange.txFrom} href={txFromLink} />}
              {exchange.txTo && <TxLink label="Payout tx" hash={exchange.txTo} href={txToLink} />}
            </span>
          </SummaryRow>
        )}
      </dl>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-white/60">
        <span>Created {timeAgo(exchange.createdAt, now)}</span>
        {!done && (
          <LiveDot fetching={query.isFetching}>
            Live{updatedSeconds !== null ? ` · updated ${updatedSeconds}s ago` : ''}
          </LiveDot>
        )}
      </div>
      {query.isError && <p className="mt-2 text-xs text-red-300">Couldn’t refresh status: {query.error.message}</p>}

      <button type="button" className="btn-ghost mt-6 w-full" onClick={back}>
        New swap
      </button>
      <p className="mt-3 text-center text-xs text-white/55">Saved on this device. Find it again under Recent swaps.</p>
    </div>
  )
}

function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <dt className="shrink-0 text-xs text-white/60">{label}</dt>
      <dd className="flex min-w-0 items-center gap-2 text-white/85 sm:justify-end sm:text-right">{children}</dd>
    </div>
  )
}
