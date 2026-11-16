import ToolHero, { ToolWorkspace } from '../components/ToolHero'
import { Terminal } from '../features/agent/Terminal'

export default function AssistantPage() {
  return (
    <div>
      <ToolHero toolId="assistant" title="A question. A closer look." intro="Research BTC and altcoins with live charts and technical indicators. Screen pump.fun tokens, compare swap quotes, or ask about the lab in plain language." />
      <ToolWorkspace toolId="assistant" narrow>
        <div>
          <Terminal />
          <p className="mt-4 text-center text-xs leading-relaxed text-white/55">
            Read-only assistant: it reads public market data but can’t create swaps, trade or access wallets. Answers can be wrong and aren’t
            financial advice. Messages are processed by an AI provider; never share private keys or seed phrases.
          </p>
        </div>
      </ToolWorkspace>
    </div>
  )
}
