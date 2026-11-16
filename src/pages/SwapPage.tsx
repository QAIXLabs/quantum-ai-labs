import { useSearchParams } from 'react-router'
import ToolHero, { ToolWorkspace } from '../components/ToolHero'
import { ExchangeView } from '../features/swap/ExchangeView'
import { RecentSwaps } from '../features/swap/RecentSwaps'
import { SwapForm } from '../features/swap/SwapForm'

export default function SwapPage() {
  const [params] = useSearchParams()
  const exchangeId = params.get('exchange')

  return (
    <div>
      <ToolHero toolId="swap" title={exchangeId ? 'Your swap' : 'Privacy Swap'} intro="Swap supported crypto pairs at floating or fixed rates. Enter a receiving address and review the quote before you confirm the exchange. No account or wallet connection required." />
      <ToolWorkspace toolId="swap" narrow>
        <div className="mx-auto max-w-xl">
          {exchangeId ? <ExchangeView key={exchangeId} id={exchangeId} /> : <SwapForm />}
          <RecentSwaps />
        </div>
      </ToolWorkspace>
    </div>
  )
}
