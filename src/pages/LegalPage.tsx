import { Fragment } from 'react'
import { NavLink } from 'react-router'
import Notice from '../components/Notice'
import { LEGAL_DRAFT, LEGAL_UPDATED, legalBySlug, legalDocs, type LegalDoc } from '../data/legal'
import NotFoundPage from './NotFoundPage'

/** Highlights [PLACEHOLDER] tokens so unfinished copy is impossible to miss. */
function Text({ children }: { children: string }) {
  return (
    <>
      {children.split(/(\[[A-Z_]+\])/).map((part, i) =>
        /^\[[A-Z_]+\]$/.test(part) ? (
          <mark key={i} className="rounded-sm bg-amber-400/15 px-1 font-mono text-[0.85em] text-amber-200">
            {part}
          </mark>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  )
}

const tabClass = ({ isActive }: { isActive: boolean }) =>
  'block whitespace-nowrap rounded-full border px-4 py-2 font-display text-sm transition-colors ' + (isActive ? 'border-lab-cyan/40 bg-lab-cyan/[0.08] text-lab-cyan' : 'border-transparent text-white/65 hover:text-white')

export default function LegalPage({ slug }: { slug: LegalDoc['slug'] }) {
  const doc = legalBySlug(slug)
  if (!doc) return <NotFoundPage />

  return (
    <div className="legal-page lab-container grid gap-10 pb-28 pt-36 sm:pt-44 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <p className="kicker">Legal</p>
        <nav className="mt-5 flex gap-1 overflow-x-auto lg:flex-col" aria-label="Legal documents">
          {legalDocs.map((d) => (
            <NavLink key={d.slug} to={`/${d.slug}`} className={tabClass}>
              {d.title}
            </NavLink>
          ))}
        </nav>
      </aside>

      <article className="max-w-3xl">
        <h1 className="text-5xl sm:text-7xl">{doc.title}</h1>
        <p className="mt-6 text-lg leading-relaxed text-white/70">{doc.summary}</p>
        <p className="mt-3 font-mono text-xs text-white/55">Last updated: {LEGAL_UPDATED}</p>
        {LEGAL_DRAFT && (
          <div className="mt-6">
            <Notice tone="warn">
              Draft under review. Highlighted placeholders will be completed before this document takes effect.
            </Notice>
          </div>
        )}

        <div className="mt-10 space-y-10">
          {doc.sections.map((s, i) => (
            <section key={s.heading}>
              <h2 className="text-2xl">
                <span className="mr-3 font-mono text-xs text-lab-cyan">{String(i + 1).padStart(2, '0')}</span>
                {s.heading}
              </h2>
              {s.body?.map((p) => (
                <p key={p} className="mt-3 text-[15px] leading-[1.8] text-white/75">
                  <Text>{p}</Text>
                </p>
              ))}
              {s.list && (
                <ul className="mt-3 space-y-2.5">
                  {s.list.map((item) => (
                    <li key={item} className="flex gap-3 text-[15px] leading-[1.7] text-white/75">
                      <span className="mt-[11px] h-1 w-1 shrink-0 rounded-full bg-lab-cyan" />
                      <span>
                        <Text>{item}</Text>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </article>
    </div>
  )
}
