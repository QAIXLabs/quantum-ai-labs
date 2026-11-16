import { useSearchParams } from 'react-router'
import ToolHero, { ToolWorkspace } from '../components/ToolHero'
import { WalletGuard } from '../features/pqc/WalletGuard'

export default function PqcPage() {
  const [params] = useSearchParams()

  return (
    <div>
      <ToolHero
        toolId="pqc"
        title="Is your wallet still safe to use?"
        intro="Paste a wallet address and find out whether a scam address can still move your tokens, whether the wallet has dealt with known drainers, and whether it is time to move to a new one. Read-only, no wallet connection."
      />
      <ToolWorkspace toolId="pqc" narrow>
        <WalletGuard initialAddress={params.get('address') ?? undefined} />
      </ToolWorkspace>
    </div>
  )
}
