import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { articles, kindStyles } from '../data/articles'
import NotFoundPage from './NotFoundPage'

export default function ArticlePage() {
  const { slug } = useParams()
  const article = articles.find((a) => a.slug === slug)
  const barRef = useRef<HTMLDivElement>(null)

  // Reading progress, written straight to the bar to avoid re-rendering the article.
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      barRef.current?.style.setProperty('transform', `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [slug])

  if (!article) return <NotFoundPage />

  return (
    <article className="article-page lab-container max-w-3xl pb-28 pt-36 sm:pt-44">
      <div ref={barRef} className="reading-progress" aria-hidden="true" />
      <Link to="/research" className="link-arrow text-xs">
        <ArrowLeft size={12} /> All research
      </Link>
      <p className="kicker mt-10">
        {article.category} · {article.minutes} min read
      </p>
      <h1 className="mt-6 text-5xl leading-[1.02] sm:text-6xl">
        {article.title}
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-white/65">{article.summary}</p>
      <div className="mt-16 space-y-14">
        {article.sections.map((s) => (
          <section key={s.heading}>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl sm:text-3xl">{s.heading}</h2>
              <span
                className={`rounded-full border px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.12em] ${kindStyles[s.kind].cls}`}
              >
                {kindStyles[s.kind].label}
              </span>
            </div>
            {s.body.map((p, i) => (
              <p key={i} className="mt-5 text-base leading-[1.85] text-white/72">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
      {article.slug === 'post-quantum-cryptography' && (
        <Link to="/pqc" className="qcard mt-16 block">
          <p className="kicker">Try it · PQC Lab</p>
          <p className="mt-5 font-display text-2xl font-light">Check whether your wallet is still safe to use</p>
          <p className="mt-1 text-sm text-white/65">
            Paste an EVM or Solana wallet and get a plain answer: keep using it, clean it up, or move to a new wallet. It only reads public data.
          </p>
          <span className="link-arrow mt-3 text-xs">
            Open the PQC Lab <ArrowRight size={12} />
          </span>
        </Link>
      )}
    </article>
  )
}
