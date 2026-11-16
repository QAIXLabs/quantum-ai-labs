import { useEffect, useState } from 'react'
import Notice from '../components/Notice'
import ToolHero, { ToolWorkspace } from '../components/ToolHero'
import { api, useStoredState, type NetworkInfo } from '../features/web3/api'
import { ChainMonitor } from '../features/web3/ChainMonitor'
import { Explorer } from '../features/web3/Explorer'
import { SolanaMonitor } from '../features/web3/SolanaMonitor'
import { SolanaWatchlist } from '../features/web3/SolanaWatchlist'
import { TokenFeed } from '../features/web3/TokenFeed'

const SECTIONS: [string, string][] = [
  ['evm', 'EVM networks'],
  ['solana', 'Solana'],
]

export default function Web3Page() {
  const [networks, setNetworks] = useState<NetworkInfo[]>([])
  const [networksError, setNetworksError] = useState<string | null>(null)
  const [network, setNetwork] = useStoredState('qal-network', 'ethereum')
  const [section, setSection] = useStoredState('qal-web3-section', 'evm')

  useEffect(() => {
    api<{ networks: NetworkInfo[] }>('/web3/networks')
      .then((d) => setNetworks(d.networks))
      .catch((e: Error) => setNetworksError(e.message))
  }, [])

  return (
    <div>
      <ToolHero toolId="web3" title="A clear view of public networks." intro="Monitor EVM networks and Solana, look up addresses, transactions and tokens, track token market data and set gas or price alerts. No wallet connection, no signing." />
      <ToolWorkspace toolId="web3">
      <div className="space-y-6">
        <div className="segmented" role="tablist" aria-label="Chain family">
          {SECTIONS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={section === id}
              aria-pressed={section === id}
              className="segmented-item"
              onClick={() => setSection(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {section === 'solana' ? (
          <div className="space-y-6">
            <SolanaMonitor />
            <SolanaWatchlist />
          </div>
        ) : (
          <div className="space-y-6">
            {networksError && <Notice tone="error">Could not load network list: {networksError}</Notice>}
            <ChainMonitor network={network} setNetwork={setNetwork} networks={networks} />
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <Explorer network={network} networks={networks} />
              <TokenFeed />
            </div>
          </div>
        )}

        <Notice>
          A multi-chain dashboard for monitoring blockchain network health, transaction fees, and token market activity across
          EVM-compatible networks and Solana. Track network metrics, explore token prices and liquidity, and configure price alerts using
          connected blockchain RPC endpoints and market data providers.
        </Notice>
      </div>
      </ToolWorkspace>
    </div>
  )
}
