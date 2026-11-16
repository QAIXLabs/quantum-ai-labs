import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Search } from 'lucide-react'
import PageHero from '../components/PageHero'
import StatusBadge from '../components/StatusBadge'
import { articles, categories, type Article } from '../data/articles'
import { researchTracks } from '../data/site'

const matches = (a: Article, q: string) =>
  !q ||
  [a.title, a.summary, a.category, ...a.sections.flatMap((s) => [s.heading, ...s.body])]
    .join(' ')
    .toLowerCase()
    .includes(q)

export default function ResearchPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return articles.filter((a) => (!category || a.category === category) && matches(a, q))
  }, [query, category])

  return (
    <div className="research-page">
      <PageHero
        eyebrow="Research"
        title="Notes from the lab."
        intro="Short guides to the ideas behind our tools: how AI agents work, why quantum computers are a long-term risk for wallets, and how blockchains are read and verified. Each section is tagged, so you can tell settled facts from open questions."
      />
      <section className="lab-container py-16">
        <p className="kicker">What’s live and what’s next</p>
        <div className="qcard-grid mt-8 md:grid-cols-2 xl:grid-cols-3">
          {researchTracks.map((t) => (
            <Link key={t.title} to={t.to} className="qcard flex flex-col gap-3 !p-5">
              <StatusBadge status={t.status} />
              <p className="mt-3 font-display text-lg font-light leading-snug">{t.title}</p>
              <p className="text-xs leading-relaxed text-white/60">{t.note}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="research-library lab-container pb-28">
        <div className="glass flex flex-col gap-4 rounded-[22px] p-3 md:flex-row md:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search articles</span>
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/55" />
            <input
              className="field pl-9"
              placeholder="Search articles, e.g. Kyber, EIP-1559, agents"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Categories">
            <button type="button" className="chip" aria-pressed={!category} onClick={() => setCategory(null)}>
              All
            </button>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                className="chip"
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-white/50">
          {results.length} article{results.length === 1 ? '' : 's'}
        </p>
        <div className="qcard-grid mt-4 md:grid-cols-2 lg:grid-cols-3">
          {results.map((a) => (
            <Link
              key={a.slug}
              to={`/research/${a.slug}`}
              className="qcard group flex flex-col"
            >
              <p className="eyebrow">
                {a.category} · {a.minutes} min
              </p>
              <h3 className="mt-5 text-2xl leading-tight">{a.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-white/65">{a.summary}</p>
              <span className="link-arrow mt-5 text-xs">
                Read article <ArrowRight size={12} />
              </span>
            </Link>
          ))}
        </div>
        {results.length === 0 && (
          <p className="panel mt-4 p-8 text-center text-sm text-white/60">No articles match your search.</p>
        )}
      </section>
    </div>
  )
}
