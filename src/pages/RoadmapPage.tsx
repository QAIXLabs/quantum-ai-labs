import { Link } from 'react-router'
import PageHero from '../components/PageHero'
import Reveal from '../components/Reveal'
import StatusBadge from '../components/StatusBadge'
import { roadmapPhases } from '../data/site'

export default function RoadmapPage() {
  return (
    <div className="roadmap-page">
      <PageHero
        eyebrow="Roadmap"
        title="Where we are and what’s next."
        intro="What you can use today and what we’re working on. Live means it’s ready to use. Research means we’re still exploring it, so we’re not putting dates on it yet."
      />
      <section className="lab-container py-16 pb-28">
        <ol className="timeline">
          {roadmapPhases.map((p) => (
            <li key={p.n} className={p.status === 'live' ? 'is-live' : ''}><Reveal className="panel relative">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-lab-cyan">{p.n}</span>
                <h2 className="w-full sm:w-auto">{p.t}</h2>
                <StatusBadge status={p.status} />
              </div>
              <ul className="mt-6 grid sm:grid-cols-2">
                {p.items.map(([label, to]) => (
                  <li key={label}>
                    <Link to={to} className="roadmap-item">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal></li>
          ))}
        </ol>
      </section>
    </div>
  )
}
