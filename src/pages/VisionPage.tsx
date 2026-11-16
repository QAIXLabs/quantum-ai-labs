import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import PageHero from '../components/PageHero'
import Reveal from '../components/Reveal'
import StatusBadge from '../components/StatusBadge'
import ToolIcon from '../components/ToolIcon'
import { pillars, principles, utilities } from '../data/site'

export default function VisionPage() {
  return (
    <div>
      <PageHero
        eyebrow="About · Vision"
        title="Why we built Quantum AI Labs."
        intro="Most of us check prices in one tab, chain data in another and quantum-security news somewhere else. We wanted one place for all of it, so we built the tools we use ourselves: an AI research agent, a swap with no account, a safety check for wallets, live network monitors and a coin checker that tells you whether a project’s story holds up."
      />
      <section className="lab-container py-20">
        <Reveal>
          <ol className="qcard-grid lg:grid-cols-4">
            {principles.map((p, i) => (
              <li key={p.t} className="qcard">
                <span className="outline-num">0{i + 1}</span>
                <h3 className="mt-8 text-[22px]">{p.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/60">{p.d}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>
      <section id="token" className="lab-container scroll-mt-24 pb-24">
        <Reveal className="token-layout">
          <div>
            <p className="kicker">The QAI token</p>
            <h2 className="mt-6 text-4xl leading-[1.05] sm:text-5xl">A utility token with tools that already work.</h2>
            <p className="mt-6 max-w-xl text-[15px] leading-7 text-white/65">
              QAI is the token of Quantum AI Labs, launched on Solana. Its fundamentals are the products on this website. They’re
              live, they work, and anyone can try them today before deciding what they think of the project.
            </p>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-white/65">
              We’d rather show than promise. As the tools grow, the roadmap shows what’s live and what we’re working on next.
            </p>
            <p className="mt-6 flex max-w-xl gap-2 text-xs leading-relaxed text-white/50">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-lab-cyan" />
              Only trust the contract address shared on our official channels. Crypto is volatile and nothing here is financial advice.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/roadmap" className="btn-ghost btn-sm">See the roadmap <ArrowUpRight size={13} /></Link>
              <Link to="/disclaimer" className="link-arrow text-xs">Read the disclaimer <ArrowUpRight size={12} /></Link>
            </div>
          </div>
          <ol className="token-tools">
            {utilities.map((u, i) => (
              <li key={u.id}>
                <Link to={u.to} className="qcard flex items-start gap-4 !p-5">
                  <ToolIcon id={u.id} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 font-display text-lg font-light text-white">
                      {u.label} <span className="font-mono text-[10px] text-lab-cyan/70">0{i + 1}</span>
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-white/60">{u.desc}</span>
                  </span>
                  <StatusBadge status={u.status} />
                </Link>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>
      <section className="lab-container grid gap-4 pb-28 lg:grid-cols-3">
        {pillars.map((p) => (
          <Reveal key={p.id}>
            <Link to={`/technology#${p.id}`} className="image-card group">
              <div className="image-card-body">
                <p className="kicker">{p.n}</p>
                <h3 className="mt-4 text-[28px] leading-tight">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/65">{p.desc}</p>
                <span className="link-arrow mt-5 text-xs">
                  Technology <ArrowUpRight size={13} />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </section>
    </div>
  )
}
