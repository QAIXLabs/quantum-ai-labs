import { useMutation } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { NumericFormat } from 'react-number-format'
import { useSearchParams } from 'react-router'
import { ArrowDownUp } from 'lucide-react'
import { CoinSelect } from './CoinSelect'
import { api, currencyKey, type Currency } from './api'
import { formatAmount, upper } from './format'
import { useSwapHistory } from './history'
import { Spinner } from './Spinner'
import { useCurrencies, useDebouncedValue, useEstimate, usePairs, useRanges, useSortedCurrencies } from './queries'

type RateType = 'floating' | 'fixed'

type SwapValues = {
  from: string
  to: string
  amount: string
  address: string
  extraId: string
  refundAddress: string
  refundExtraId: string
  rateType: RateType
}

const DEFAULT_FROM = 'btc:btc'
const DEFAULT_TO = 'eth:eth'

/** Coins rarely need more precision than this, and it keeps typos like 0.00000000001 out. */
const MAX_DECIMALS = 8
const MAX_AMOUNT = 1e12

const toNumber = (v: string) => Number.parseFloat(v.replace(',', '.'))
const normalize = (v: string) => v.replace(',', '.').trim()
/** `?amount=` from links; ignored unless it's a plain positive number. */
const amountParam = (v: string | null) => (v && /^\d+(\.\d{1,8})?$/.test(v) && Number(v) > 0 && Number(v) < MAX_AMOUNT ? v : '')
const isExpired = (iso: string | null | undefined) => !!iso && Date.parse(iso) <= Date.now()

function matches(pattern: string | null, value: string) {
  if (!pattern) return true
  try {
    return new RegExp(pattern).test(value)
  } catch {
    return true
  }
}

/** Resolves `?from=` / `?to=` (a `ticker:network` key or a bare ticker) against the currency list. */
function resolveParam(param: string | null, byKey: Map<string, Currency>, list: Currency[]) {
  if (!param) return undefined
  const value = param.toLowerCase()
  if (byKey.has(value)) return value
  const match = list.find((c) => c.ticker === value && c.network === value) ?? list.find((c) => c.ticker === value)
  return match && currencyKey(match)
}

export function SwapCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`panel p-5 sm:p-6 ${className}`}>{children}</div>
}

export function Placeholder({ children }: { children: ReactNode }) {
  return (
    <SwapCard className="flex min-h-[320px] flex-col items-center justify-center gap-4 text-center text-sm text-white/60">
      {children}
    </SwapCard>
  )
}

const FieldError = ({ children }: { children: ReactNode }) => <p className="mt-2 text-xs text-red-300">{children}</p>

/** `onCreated` lets a page other than /swap decide where to go once the exchange exists. */
export function SwapForm({ onCreated }: { onCreated?: (id: string) => void } = {}) {
  const currencies = useCurrencies()

  if (currencies.isPending) {
    return (
      <Placeholder>
        <Spinner size={28} />
        <span>Loading currencies…</span>
      </Placeholder>
    )
  }
  if (currencies.isError)
    return (
      <Placeholder>
        <p>Couldn’t load currencies: {currencies.error.message}</p>
        <button type="button" className="btn-ghost btn-sm" onClick={() => void currencies.refetch()}>
          Try again
        </button>
      </Placeholder>
    )
  return <SwapFormReady list={currencies.data.list} byKey={currencies.data.byKey} onCreated={onCreated} />
}

function SwapFormReady({ list, byKey, onCreated }: { list: Currency[]; byKey: Map<string, Currency>; onCreated?: (id: string) => void }) {
  const [params, setParams] = useSearchParams()
  const upsert = useSwapHistory((s) => s.upsert)
  const sorted = useSortedCurrencies(list)

  const initialFrom = resolveParam(params.get('from'), byKey, list) ?? DEFAULT_FROM
  let initialTo = resolveParam(params.get('to'), byKey, list) ?? DEFAULT_TO
  if (initialTo === initialFrom) initialTo = initialFrom === DEFAULT_TO ? DEFAULT_FROM : DEFAULT_TO

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<SwapValues>({
    mode: 'onChange',
    defaultValues: {
      from: initialFrom,
      to: initialTo,
      amount: amountParam(params.get('amount')),
      address: '',
      extraId: '',
      refundAddress: '',
      refundExtraId: '',
      rateType: params.get('type') === 'fixed' ? 'fixed' : 'floating',
    },
  })

  const [from, to, amountText, rateType] = useWatch({ control, name: ['from', 'to', 'amount', 'rateType'] })
  const fixed = rateType === 'fixed'
  const fromCoin = byKey.get(from)
  const toCoin = byKey.get(to)

  const pairs = usePairs(from, fixed)
  const pairAvailable = !pairs.data || pairs.data.has(to)
  const ranges = useRanges(from, pairAvailable ? to : undefined, fixed)
  const min = ranges.data ? Number.parseFloat(ranges.data.min) : undefined
  const max = ranges.data?.max ? Number.parseFloat(ranges.data.max) : undefined

  const amount = toNumber(amountText)
  const debouncedAmount = useDebouncedValue(normalize(amountText))
  const inRange = amount > 0 && (min === undefined || amount >= min) && (max === undefined || amount <= max)
  const estimate = useEstimate(from, to, debouncedAmount, fixed, pairAvailable && inRange && !!ranges.data)
  const estimateMatchesInput = !!estimate.data && !estimate.isPlaceholderData && debouncedAmount === normalize(amountText)
  const receive = inRange && estimate.data ? Number.parseFloat(estimate.data.estimatedAmount) : undefined
  const rate = receive && amount > 0 ? receive / amount : undefined

  const create = useMutation({
    mutationFn: api.createExchange,
    onSuccess: (exchange) => {
      upsert(exchange, { from: fromCoin, to: toCoin })
      if (onCreated) onCreated(exchange.id)
      else setParams({ exchange: exchange.id })
    },
  })

  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showRefund, setShowRefund] = useState(false)

  /** Re-checks addresses after a coin change, since each network has its own address format. */
  const revalidateAddresses = () => {
    if (getValues('address')) void trigger('address')
    if (getValues('refundAddress')) void trigger(['refundAddress', 'refundExtraId'])
  }

  const hideRefund = () => {
    setShowRefund(false)
    setValue('refundAddress', '')
    setValue('refundExtraId', '')
  }

  const pickCoin = (side: 'from' | 'to', key: string) => {
    const other = side === 'from' ? 'to' : 'from'
    if (key === getValues(other)) setValue(other, getValues(side))
    setValue(side, key, { shouldValidate: true })
    revalidateAddresses()
  }

  const flip = () => {
    setValue('from', to)
    setValue('to', from)
    revalidateAddresses()
  }

  const onSubmit = async (values: SwapValues) => {
    setSubmitError(null)
    if (!fromCoin || !toCoin) return
    let rateId = estimate.data?.rateId ?? undefined
    if (fixed) {
      // Fixed swaps must use a live rateId; fetch a fresh quote if this one expired.
      if (!rateId || !estimateMatchesInput || isExpired(estimate.data?.validUntil)) {
        const fresh = await estimate.refetch()
        rateId = fresh.data?.rateId ?? undefined
      }
      if (!rateId) {
        setSubmitError('Could not lock a fixed rate. Please try again.')
        return
      }
    }
    create.mutate({
      tickerFrom: fromCoin.ticker,
      networkFrom: fromCoin.network,
      tickerTo: toCoin.ticker,
      networkTo: toCoin.network,
      amount: normalize(values.amount),
      addressTo: values.address.trim(),
      fixed,
      reverse: false,
      ...(values.extraId.trim() ? { extraIdTo: values.extraId.trim() } : {}),
      ...(values.refundAddress.trim() ? { userRefundAddress: values.refundAddress.trim() } : {}),
      ...(values.refundAddress.trim() && values.refundExtraId.trim() ? { userRefundExtraId: values.refundExtraId.trim() } : {}),
      ...(fixed ? { rateId } : {}),
    })
  }

  const fixedUnavailable = fixed && (fromCoin?.isAvailableFixed === false || toCoin?.isAvailableFixed === false)
  const canSubmit = !!receive && pairAvailable && !fixedUnavailable && !ranges.isError && !create.isPending
  const errorMessage = submitError ?? (create.error ? create.error.message : null)

  const amountBox = (hasError: boolean) =>
    'amount-box ' +
    (hasError ? 'has-error' : '')

  return (
    <form className="panel p-5 sm:p-6" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="segmented" role="radiogroup" aria-label="Rate type">
        {(['floating', 'fixed'] as const).map((type) => (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={rateType === type}
            className="segmented-item"
            onClick={() => setValue('rateType', type)}
          >
            {type === 'floating' ? 'Floating rate' : 'Fixed rate'}
          </button>
        ))}
      </div>

      <div className="relative mt-5">
        <div className={amountBox(!!errors.amount)}>
          <label htmlFor="swap-amount" className="field-label">
            You send
          </label>
          <div className="flex items-center gap-3">
            <Controller
              name="amount"
              control={control}
              rules={{
                required: 'Enter an amount',
                validate: (v) => {
                  const n = toNumber(v)
                  if (!(n > 0)) return 'Enter an amount'
                  if (min !== undefined && n < min) return `Minimum is ${formatAmount(min)} ${upper(fromCoin?.ticker)}`
                  if (max !== undefined && n > max) return `Maximum is ${formatAmount(max)} ${upper(fromCoin?.ticker)}`
                  return true
                },
              }}
              render={({ field: { ref, value, onChange, onBlur, name } }) => (
                <NumericFormat
                  id="swap-amount"
                  className="amount-value min-w-0 flex-1 bg-transparent outline-none placeholder:text-white/35"
                  name={name}
                  getInputRef={ref}
                  value={value}
                  onBlur={onBlur}
                  // Store the plain number ("1234.5"), not the formatted text ("1,234.5").
                  onValueChange={(values) => onChange(values.value)}
                  valueIsNumericString
                  thousandSeparator=","
                  decimalSeparator="."
                  decimalScale={MAX_DECIMALS}
                  allowNegative={false}
                  allowLeadingZeros={false}
                  isAllowed={({ floatValue }) => floatValue === undefined || floatValue < MAX_AMOUNT}
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder={min ? formatAmount(min) : '0.0'}
                />
              )}
            />
            <CoinSelect currencies={sorted} value={from} onChange={(k) => pickCoin('from', k)} label="Coin to send" />
          </div>
        </div>

        <div className="relative z-10 -my-3 flex justify-center">
          <button
            type="button"
            className="swap-flip"
            onClick={flip}
            aria-label="Swap direction"
          >
            <ArrowDownUp size={16} />
          </button>
        </div>

        <div className={amountBox(false)}>
          <span className="field-label" id="swap-receive-label">
            {fixed ? 'You get' : 'You get (estimated)'}
          </span>
          <div className="flex items-center gap-3">
            <output
              className="amount-value min-w-0 flex-1 truncate"
              aria-labelledby="swap-receive-label"
              aria-live="polite"
            >
              {estimate.isFetching && !receive ? '…' : receive ? `≈ ${formatAmount(receive)}` : '—'}
            </output>
            <CoinSelect
              currencies={sorted}
              value={to}
              onChange={(k) => pickCoin('to', k)}
              label="Coin to receive"
              allowed={pairs.data}
            />
          </div>
        </div>
      </div>
      {errors.amount && <FieldError>{errors.amount.message}</FieldError>}
      {!pairAvailable && (
        <FieldError>
          {upper(fromCoin?.ticker)} → {upper(toCoin?.ticker)} isn’t available{fixed ? ' at a fixed rate' : ''}. Pick another
          coin.
        </FieldError>
      )}
      {fixedUnavailable && <FieldError>Fixed rate isn’t available for this pair. Use floating rate instead.</FieldError>}
      {pairAvailable && !fixedUnavailable && ranges.isError && (
        <FieldError>
          {fixed ? 'Fixed' : 'Floating'} rate isn’t available for {upper(fromCoin?.ticker)} → {upper(toCoin?.ticker)} right now.{' '}
          <button
            type="button"
            className="font-medium text-lab-cyan underline-offset-2 hover:underline"
            onClick={() => setValue('rateType', fixed ? 'floating' : 'fixed')}
          >
            Use {fixed ? 'floating' : 'fixed'} rate
          </button>
        </FieldError>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-white/60">
        <span>
          {rate ? (
            <>
              1 {upper(fromCoin?.ticker)} ≈ {formatAmount(rate)} {upper(toCoin?.ticker)}
            </>
          ) : ranges.data ? (
            <>
              Min {formatAmount(ranges.data.min)}
              {ranges.data.max ? ` · Max ${formatAmount(ranges.data.max)}` : ''} {upper(fromCoin?.ticker)}
            </>
          ) : ranges.isError ? (
            'Rate unavailable'
          ) : (
            'Enter an amount to see the rate'
          )}
        </span>
        <LiveDot fetching={estimate.isFetching}>{fixed ? 'Rate locked when you exchange' : 'Live rate'}</LiveDot>
      </div>
      {estimate.isError && <FieldError>{estimate.error.message}</FieldError>}

      <div className="mt-6">
        <label htmlFor="swap-address" className="field-label">
          Recipient {upper(toCoin?.ticker)} address{' '}
          {toCoin && toCoin.network !== toCoin.ticker && <span className="text-white/55">({upper(toCoin.network)})</span>}
        </label>
        <input
          id="swap-address"
          className={'field font-mono ' + (errors.address ? 'border-red-400/40' : '')}
          autoComplete="off"
          spellCheck={false}
          placeholder={`Your ${toCoin?.name ?? ''} wallet address`}
          {...register('address', {
            required: 'Enter the address that will receive your coins',
            validate: (v) =>
              matches(byKey.get(getValues('to'))?.validationAddress ?? null, v.trim()) ||
              `That doesn’t look like a valid ${byKey.get(getValues('to'))?.name ?? ''} address`,
          })}
        />
        {errors.address && <FieldError>{errors.address.message}</FieldError>}
      </div>

      {toCoin?.hasExtraId && (
        <div className="mt-4">
          <label htmlFor="swap-extra" className="field-label">
            {toCoin.extraId || 'Memo / Tag'} <span className="text-white/55">(if your wallet requires it)</span>
          </label>
          <input
            id="swap-extra"
            className={'field font-mono ' + (errors.extraId ? 'border-red-400/40' : '')}
            autoComplete="off"
            spellCheck={false}
            {...register('extraId', {
              validate: (v) =>
                !v.trim() || matches(byKey.get(getValues('to'))?.validationExtra ?? null, v.trim()) || 'Invalid value',
            })}
          />
          {errors.extraId && <FieldError>{errors.extraId.message}</FieldError>}
        </div>
      )}

      {showRefund ? (
        <div className="mt-4">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="swap-refund" className="field-label">
              Refund {upper(fromCoin?.ticker)} address{' '}
              {fromCoin && fromCoin.network !== fromCoin.ticker && <span className="text-white/55">({upper(fromCoin.network)})</span>}{' '}
              <span className="text-white/55">· optional</span>
            </label>
            <button type="button" className="text-xs text-lab-cyan hover:text-white" onClick={hideRefund}>
              Remove
            </button>
          </div>
          <input
            id="swap-refund"
            className={'field font-mono ' + (errors.refundAddress ? 'border-red-400/40' : '')}
            autoComplete="off"
            spellCheck={false}
            placeholder={`Your ${fromCoin?.name ?? ''} wallet address`}
            {...register('refundAddress', {
              validate: (v) =>
                !v.trim() ||
                matches(byKey.get(getValues('from'))?.validationAddress ?? null, v.trim()) ||
                `That doesn’t look like a valid ${byKey.get(getValues('from'))?.name ?? ''} address`,
            })}
          />
          {errors.refundAddress && <FieldError>{errors.refundAddress.message}</FieldError>}

          {fromCoin?.hasExtraId && (
            <div className="mt-4">
              <label htmlFor="swap-refund-extra" className="field-label">
                Refund {fromCoin.extraId || 'Memo / Tag'}{' '}
                <span className="text-white/55">(needed if your refund wallet uses one)</span>
              </label>
              <input
                id="swap-refund-extra"
                className={'field font-mono ' + (errors.refundExtraId ? 'border-red-400/40' : '')}
                autoComplete="off"
                spellCheck={false}
                {...register('refundExtraId', {
                  validate: (v) =>
                    !v.trim() || matches(byKey.get(getValues('from'))?.validationExtra ?? null, v.trim()) || 'Invalid value',
                })}
              />
              {errors.refundExtraId && <FieldError>{errors.refundExtraId.message}</FieldError>}
            </div>
          )}
          <p className="mt-2 text-xs text-white/55">If the swap can’t be completed, your deposit is sent back to this address.</p>
        </div>
      ) : (
        <button type="button" className="mt-4 text-xs text-lab-cyan hover:text-white" onClick={() => setShowRefund(true)}>
          + Add a refund address (optional)
        </button>
      )}

      {toCoin && toCoin.warningsTo.length > 0 && (
        <ul className="mt-5 space-y-1.5 rounded-control border border-amber-400/30 bg-amber-400/[0.06] px-3 py-2.5 text-xs leading-relaxed text-amber-200">
          {toCoin.warningsTo.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}

      {errorMessage && (
        <p
          role="alert"
          className="mt-5 rounded-control border border-red-400/30 bg-red-400/[0.07] px-3 py-2.5 text-xs leading-relaxed text-red-200"
        >
          {errorMessage}
        </p>
      )}

      <button type="submit" className="btn-primary mt-6 w-full" disabled={!canSubmit}>
        {create.isPending ? (
          <>
            <Spinner />
            Creating exchange…
          </>
        ) : (
          'Exchange'
        )}
      </button>
      <p className="mt-3 text-center text-xs text-white/55">No sign-up needed. Your coins go straight to your wallet.</p>
    </form>
  )
}

export function LiveDot({ fetching, children }: { fetching: boolean; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={'h-1.5 w-1.5 rounded-full ' + (fetching ? 'animate-pulse bg-lab-cyan' : 'bg-lab-ok')}
        aria-hidden="true"
      />
      {children}
    </span>
  )
}
