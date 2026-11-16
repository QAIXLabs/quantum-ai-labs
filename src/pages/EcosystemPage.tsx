import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import CommunityIcon from '../components/CommunityIcon'
import PageHero from '../components/PageHero'
import Reveal from '../components/Reveal'
import ToolIcon from '../components/ToolIcon'
import { community, utilities } from '../data/site'

const flows = [
  {
    a: 'Quantum Agent',
    b: 'Quantum Lab CHECKS',
    d: 'Spot a coin with the agent, then run a check to see if its story is real and its holders are fair.',
  },
  {
    a: 'Quantum Lab CHECKS',
    b: 'Privacy Swap',
    d: 'Happy with what the check shows? Get a quote and make the swap without opening an account.',
  },
  {
    a: 'Privacy Swap',
    b: 'PQC Lab',
    d: 'Check whether a scam address can still move your tokens, and get a plain answer on whether to move to a new wallet.',
  },
  {
    a: 'Web3 Solutions',
    b: 'Quantum Agent',
    d: 'Spot something on-chain, like a gas spike or a token on the move, and ask the agent what is going on.',
  },
]

export default function EcosystemPage() {
  return (
    <div>
      <PageHero
        eyebrow="About · Ecosystem"
        title="How the tools fit together."
        intro="Each tool covers one part of the same job: understanding what is happening in crypto and keeping your coins safe while you do it. Quantum AI Labs is an independent project."
      />
      <section className="lab-container py-20">
        <Reveal>
          <ol className="qcard-grid md:grid-cols-2 xl:grid-cols-4">
            {flows.map((f, i) => (
              <li key={f.a + f.b} className="qcard">
                <span className="outline-num">0{i + 1}</span>
                <p className="flow-pair mt-8">
                  <span>{f.a}</span>
                  <i aria-hidden="true" />
                  <span>{f.b}</span>
                </p>
                <p className="mt-4 text-sm leading-relaxed text-white/60">{f.d}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>
      <section className="lab-container pb-20">
        <Reveal>
          <p className="kicker">The tools</p>
          <div className="mt-8 border-b border-white/[0.08]">
            {utilities.map((u, i) => (
              <Link key={u.id} to={u.to} className="research-row">
                <span className="research-number">0{i + 1}</span>
                <div>
                  <h3>{u.label}</h3>
                  <p>{u.desc}</p>
                </div>
                <div className="research-glyph"><ToolIcon id={u.id} /></div>
                <ArrowUpRight size={22} />
              </Link>
            ))}
          </div>
        </Reveal>
      </section>
      <section id="community" className="community-section scroll-mt-20">
        <div className="community-rings" aria-hidden="true"><span /><span /><span /></div>
        <Reveal className="lab-container relative">
          <p className="kicker">Community</p>
          <h2 className="mx-auto mt-6 max-w-3xl text-4xl sm:text-6xl">Follow along and tell us what to build next.</h2>
          {community.length > 0 ? (
            <div className="community-actions">
              {community.map((c) => (
                <a key={c.id} href={c.url} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                  <CommunityIcon id={c.id} size={14} /> {c.label} <ArrowUpRight size={13} />
                </a>
              ))}
            </div>
          ) : (
            <p>Official community channels have not been published yet.</p>
          )}
        </Reveal>
      </section>
    </div>
  )
}
