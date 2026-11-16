import { lazy, Suspense, useState, type CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowDown, ArrowRight, ArrowUpRight, Fingerprint, Network, ShieldCheck } from 'lucide-react'
import CommunityIcon from '../components/CommunityIcon'
import Reveal from '../components/Reveal'
import StatusBadge from '../components/StatusBadge'
import ToolDiagram from '../components/ToolDiagram'
import { HudFrame } from '../components/ToolHero'
import ToolIcon from '../components/ToolIcon'
import LiveMarkets from '../features/home/LiveMarkets'
import { community, primaryCommunity, roadmapPhases, utilities, type Utility } from '../data/site'

const QuantumCore = lazy(() => import('../features/home/QuantumCore'))
const QuantumComputer3D = lazy(() => import('../features/home/QuantumComputer3D'))
const QuantumBrain = lazy(() => import('../features/home/QuantumBrain'))
const SwapForm = lazy(() => import('../features/swap/SwapForm').then((m) => ({ default: m.SwapForm })))

/** Public data sources and networks the tools read from, shown as plain names (no third-party logos). */
const SOURCES = ['Binance', 'CoinGecko', 'DEX Screener', 'pump.fun', 'RugCheck', 'Ethereum', 'Solana', 'Bitcoin', 'mempool.space', 'NIST']
/** Copies of the name set in the track; the track moves by exactly one copy, so the loop has no seam. */
const MARQUEE_COPIES = 4

function Hero() {
  const [webgl, setWebgl] = useState(true)
  return (
    <section className="home-hero">
      <div className="hero-visual">
        <Suspense fallback={<div className="quantum-core core-loading" />}>
          {webgl ? <QuantumComputer3D onUnsupported={() => setWebgl(false)} /> : <QuantumCore />}
        </Suspense>
      </div>
      <div className="hero-copy lab-container">
        <p className="kicker reveal">Independent research. Connected intelligence.</p>
        <h1 className="hero-title display">
          <span className="line"><span>Intelligence for</span></span>
          <span className="line"><span>the <span className="accent">Quantum Era.</span></span></span>
        </h1>
        <div className="hero-bottom">
          <p className="hero-intro reveal" style={{ animationDelay: '.3s' }}>
            Understand the markets. Examine on-chain risk. Prepare for what comes next.
            <span>AI-assisted crypto research, public-chain intelligence, and practical tools for post-quantum readiness.</span>
          </p>
          <Link to="/#tools" className="btn-primary reveal" style={{ animationDelay: '.4s' }}>
            Explore Tools <span className="btn-orb"><ArrowDown size={15} /></span>
          </Link>
          <Link to="/assistant" className="btn-ghost reveal" style={{ animationDelay: '.48s' }}>
            Launch Quantum Agent <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="hero-trust reveal" style={{ animationDelay: '.55s' }}>
          <span><ShieldCheck size={13} className="text-lab-cyan" /> No wallet connection</span>
          <span>Research on public data</span>
          <span className="hidden md:inline-flex">AI research · Post-quantum security · Web3 infrastructure</span>
          <a href="#markets" aria-label="Scroll to market overview">Explore the lab <ArrowDown size={13} /></a>
        </div>
      </div>
    </section>
  )
}

function SourceMarquee() {
  const items = Array.from({ length: MARQUEE_COPIES }, () => SOURCES).flat()
  return (
    <section className="marquee-section" aria-label="Public data sources">
      <Reveal className="lab-container">
        <p className="kicker">Public data sources</p>
        <h2 className="mt-5">Research on public data.</h2>
      </Reveal>
      <div className="marquee">
        <div className="marquee-track logo-track" style={{ '--copies': MARQUEE_COPIES } as CSSProperties}>
          {items.map((name, i) => (
            <span key={i} className="marquee-label" aria-hidden={i >= SOURCES.length || undefined}>
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

const TOOL_KIND: Record<string, string> = { assistant: 'INTELLIGENCE', swap: 'EXCHANGE', pqc: 'QUANTUM READINESS', web3: 'ON-CHAIN DATA', checks: 'COIN CHECKS' }

function ToolCard({ tool, index }: { tool: Utility; index: number }) {
  return <Link to={tool.to} className="tool-card">
    <div className="flex items-center justify-between gap-3"><span className="tool-index">0{index + 1} <span>/ {TOOL_KIND[tool.id]}</span></span><StatusBadge status={tool.status} /></div>
    <ToolDiagram id={tool.id} live />
    <h3><ToolIcon id={tool.id} size="sm" />{tool.label}<ArrowUpRight size={20} className="tool-arrow" /></h3>
    <p>{tool.tagline}</p>
    <div className="tool-card-bottom">{tool.highlights.map((h) => <span key={h}>{h}</span>)}</div>
  </Link>
}

function Tools() {
  return <section id="tools" className="statement-section">
    <div className="statement-visual"><Suspense fallback={null}><QuantumBrain /></Suspense></div>
    <div className="lab-container">
      <Reveal className="statement-copy">
        <p className="kicker">01 / The toolkit</p>
        <h2 className="mt-6">Your research.<br /><span className="text-white/45">A clearer perspective.</span></h2>
        <p className="section-lead mt-7">Five focused tools. One place to investigate markets, check a coin before you buy it, follow public chains and get ready for the quantum era.</p>
      </Reveal>
      <Reveal>
        <div className="tools-grid">{utilities.map((tool, index) => <div key={tool.id}><ToolCard tool={tool} index={index} /></div>)}</div>
      </Reveal>
    </div>
  </section>
}

function SwapSection() {
  const navigate = useNavigate()
  const swap = utilities.find((u) => u.id === 'swap')
  return <section className="home-section"><div className="lab-container"><div className="readiness-layout">
    <Reveal>
      <p className="kicker">02 / Privacy Swap</p>
      <h2 className="mt-6">Swap without an account.<br /><span className="text-white/45">No wallet connection either.</span></h2>
      <p className="section-lead mt-7">Pick two coins, add the address where you want to receive them and check the quote before you confirm. Choose a floating or fixed rate. The swap keeps running even if you close the page, and you can check its status anytime.</p>
      <div className="mt-7 flex flex-wrap gap-2">{swap?.highlights.map((h) => <span key={h} className="trait-pill"><ShieldCheck size={13} className="text-lab-cyan" /> {h}</span>)}</div>
      <Link to="/swap" className="link-arrow mt-7">Open Privacy Swap <ArrowUpRight size={13} /></Link>
    </Reveal>
    <Reveal>
      <HudFrame toolId="swap" compact>
        <Suspense fallback={<div className="panel p-8 text-center text-sm text-white/55">Loading the swap…</div>}>
          {/* Once an exchange exists, its deposit details live on the swap page. */}
          <SwapForm onCreated={(id) => navigate(`/swap?exchange=${id}`)} />
        </Suspense>
      </HudFrame>
    </Reveal>
  </div></div></section>
}

const RESEARCH = [
  { n: '01', title: 'Intelligence you can investigate.', desc: 'The Quantum Agent brings together market data, technical indicators, and token screening. Inspect its tool calls and compare the evidence.', tag: 'AI SYSTEMS', to: '/research/ai-systems', icon: Network },
  { n: '02', title: 'Preparation, grounded in cryptography.', desc: 'What quantum computers could mean for wallet keys, the new NIST post-quantum standards, and how blockchains plan to migrate.', tag: 'CRYPTOGRAPHY', to: '/research/post-quantum-cryptography', icon: Fingerprint },
  { n: '03', title: 'Public networks. Observable signals.', desc: 'Read EVM and Solana activity through public RPC endpoints. Follow network health, fees, and token markets without connecting a wallet.', tag: 'INFRASTRUCTURE', to: '/technology#infra', icon: Network },
]

function Research() {
  return <section className="home-section"><div className="lab-container">
    <Reveal><div className="section-heading"><div><p className="kicker">03 / Research & technology</p><h2 className="mt-6">Evidence before assertion.</h2></div><Link to="/research" className="link-arrow">Read our research <ArrowUpRight size={14} /></Link></div></Reveal>
    <div className="border-b border-white/[0.08]">{RESEARCH.map(({ n, title, desc, tag, to, icon: Icon }) => <Reveal key={n}><Link to={to} className="research-row"><span className="research-number">{n}</span><div><span className="eyebrow">{tag}</span><h3>{title}</h3><p>{desc}</p></div><div className="research-glyph"><Icon size={54} strokeWidth={.7} /></div><ArrowUpRight size={22} /></Link></Reveal>)}</div>
    <p className="section-note">All tools run on classical hardware. On-chain verification of research records remains a research direction.</p>
  </div></section>
}

function HowItWorks() {
  return <section className="home-section"><div className="lab-container">
    <Reveal><div className="section-heading"><div><p className="kicker">04 / How it works</p><h2 className="mt-6">From a question<br /><span className="text-white/45">to a better understanding.</span></h2></div><p className="section-lead">Start with a market, a public address, or a research question. The tools make the underlying information easier to examine.</p></div></Reveal>
    <Reveal><ol className="process-grid">{[
      ['Choose your workspace', 'Open the agent, PQC Lab, or Web3 monitor. Each tool explains its data sources and scope.'],
      ['Explore the evidence', 'Ask a question, check an address, or follow a network. Review source information and update times.'],
      ['Build your understanding', 'Compare results with the research library. Treat AI answers and risk models as inputs to your own research.'],
    ].map(([title, text], i) => <li key={title}><span className="process-number">0{i + 1}</span><h3>{title}</h3><p>{text}</p></li>)}</ol></Reveal>
  </div></section>
}

function Roadmap() {
  return <section className="home-section"><div className="lab-container"><Reveal>
    <div className="section-heading"><div><p className="kicker">05 / Development</p><h2 className="mt-6">Built today.<br /><span className="text-white/45">Investigating tomorrow.</span></h2></div><Link to="/roadmap" className="link-arrow">View the roadmap <ArrowUpRight size={14} /></Link></div>
    <div className="roadmap-preview">{roadmapPhases.map(p => <Link key={p.n} to="/roadmap"><span className={`roadmap-node ${p.status === 'live' ? 'is-live' : ''}`} /><span className="eyebrow">{p.n}</span><h3>{p.t}</h3><StatusBadge status={p.status} /></Link>)}</div>
  </Reveal></div></section>
}

function FollowButton() {
  return primaryCommunity
    ? <a href={primaryCommunity.url} target="_blank" rel="noopener noreferrer" className="btn-primary">Follow Quantum AI Labs <span className="btn-orb"><ArrowUpRight size={14} /></span></a>
    : <Link to="/ecosystem#community" className="btn-primary">Follow Quantum AI Labs <span className="btn-orb"><ArrowRight size={14} /></span></Link>
}

function CommunityCta() {
  return <section className="community-section">
    <div className="community-rings" aria-hidden="true"><span /><span /><span /></div>
    <Reveal className="lab-container relative">
      <p className="kicker">Independent by design</p>
      <h2 className="mt-6">A lab for the curious.<br /><span className="text-white/45">An open conversation.</span></h2>
      <p>Follow the research and development of Quantum AI Labs. Bring your questions. Examine the ideas.</p>
      <div className="community-actions">
        <FollowButton />
        {community.filter(c => c.id !== primaryCommunity?.id).map(c => <a key={c.id} href={c.url} target="_blank" rel="noopener noreferrer" className="btn-ghost"><CommunityIcon id={c.id} size={14} />{c.id === 'telegram' ? 'Join Telegram' : c.label}<ArrowUpRight size={14} /></a>)}
      </div>
      <Link to="/vision" className="link-arrow mt-8">About the lab <ArrowUpRight size={14} /></Link>
    </Reveal>
  </section>
}

export default function HomePage() {
  return <div className="home-page">
    <Hero />
    <SourceMarquee />
    <section id="markets" className="market-section"><div className="lab-container"><LiveMarkets /></div></section>
    <Tools />
    <SwapSection />
    <Research />
    <HowItWorks />
    <Roadmap />
    <CommunityCta />
  </div>
}
