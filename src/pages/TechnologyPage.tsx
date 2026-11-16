import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import PageHero from '../components/PageHero'
import Reveal from '../components/Reveal'
import { pillars, type Pillar } from '../data/site'

const pillarDetails: Record<Pillar['id'], { body: string; uses: { l: string; to: string }[]; not: string }> = {
  ai: {
    body: 'The Quantum Agent is a language model with a small set of read-only tools: live market data, charts, token screening and swap quotes. Every answer shows which tools it used, so you can check the numbers yourself. Quantum Lab CHECKS uses the same model to judge whether a Solana coin’s story holds up, next to a rule-based score of how fairly the coin is held.',
    uses: [
      { l: 'Quantum Agent', to: '/assistant' },
      { l: 'Quantum Lab CHECKS', to: '/checks' },
      { l: 'How AI agents work', to: '/research/ai-systems' },
    ],
    not: 'It reads data and that’s all. It can’t trade, sign transactions or touch a wallet, and its answers aren’t financial advice.',
  },
  quantum: {
    body: 'The PQC Lab checks a wallet for permissions still held by scam addresses, contact with known drainers and lookalike-address tricks, then tells you in plain words whether to keep using it or move to a new one. The post-quantum guide explains what quantum computers could mean for wallet keys.',
    uses: [
      { l: 'PQC Lab', to: '/pqc' },
      { l: 'Post-quantum guide', to: '/research/post-quantum-cryptography' },
    ],
    not: 'It only sees what is on-chain, so a leaked seed phrase stays invisible until funds move. We don’t run quantum hardware either.',
  },
  infra: {
    body: 'Web3 Solutions reads public EVM and Solana networks. Each request checks it’s talking to the right chain, switches to another endpoint if one is slow, and is cached so pages stay quick. Privacy Swap runs through the same server layer for quotes and order tracking.',
    uses: [
      { l: 'Web3 Solutions', to: '/web3' },
      { l: 'Privacy Swap', to: '/swap' },
    ],
    not: 'The site never connects to your wallet, never holds private keys and never signs a transaction.',
  },
}

const architecture: [string, string][] = [
  ['In your browser', 'Settings, watchlists, alerts and chat history are kept on your device, not on our server.'],
  ['Server layer', 'The agent, the swap, the wallet check and coin checks go through our server with rate limits. API keys never reach your browser. Coin checks are saved so the public feed can show them.'],
  ['Network access', 'Several endpoints per chain, with an automatic switch if one goes down.'],
  ['Market data', 'Prices, charts and token data are cached on the server for a short time to keep things fast.'],
  ['Saved locally', 'Swap history, agent chats, watchlists and alert settings live in your browser, not on our servers.'],
]

export default function TechnologyPage() {
  return (
    <div>
      <PageHero
        eyebrow="About · Technology"
        title="How the tools work."
        intro="A plain look at what runs where: what happens in your browser, what goes through our servers, and what each tool will and won’t do."
      />
      <section className="lab-container py-10">
        {pillars.map((p) => {
          const d = pillarDetails[p.id]
          return (
            <Reveal key={p.id}>
              <article id={p.id} className="tech-row scroll-mt-24">
                <span className="outline-num">{p.n}</span>
                <div>
                  <h2 className="text-4xl sm:text-5xl">{p.title}</h2>
                  <p className="mt-5 max-w-xl text-[15px] leading-7 text-white/65">{d.body}</p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    {d.uses.map((u) => (
                      <Link key={u.to} to={u.to} className="btn-ghost btn-sm">
                        {u.l} <ArrowRight size={12} />
                      </Link>
                    ))}
                  </div>
                  <p className="mt-6 flex gap-2 text-xs leading-relaxed text-white/50"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-lab-cyan" />{d.not}</p>
                </div>
              </article>
            </Reveal>
          )
        })}
      </section>
      <section className="lab-container pb-28">
        <Reveal>
          <p className="kicker">Under the hood</p>
          <ol className="arch-grid mt-8">
            {architecture.map(([title, desc], i) => (
              <li key={title}>
                <span className="arch-node" aria-hidden="true" />
                <span className="font-mono text-[10px] tracking-[0.16em] text-lab-cyan">0{i + 1}</span>
                <h3 className="mt-3 text-lg">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-white/60">{desc}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>
    </div>
  )
}
