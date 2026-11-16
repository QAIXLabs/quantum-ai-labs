import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowUp, ArrowUpRight } from 'lucide-react'
import { legalDocs } from '../data/legal'
import { aboutItems, community, utilities } from '../data/site'
import CommunityIcon from './CommunityIcon'
import Logo from './Logo'

const YEAR = new Date().getFullYear()

const COMPANY = [{ label: 'Research', to: '/research' }, { label: 'Roadmap', to: '/roadmap' }, ...aboutItems]

const linkClass = 'text-white/60 transition-colors hover:text-white'

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="eyebrow">{title}</p>
      <ul className="mt-5 space-y-3 font-display text-[15px]">{children}</ul>
    </div>
  )
}

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="lab-container pt-20 sm:pt-28">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="kicker">Quantum AI Labs / {YEAR}</p>
            <p className="footer-statement mt-6">
              <strong>Crypto research tools for the quantum era:</strong> an AI market agent, coin checks for Solana, wallet safety checks and read-only
              multi-chain monitoring.
            </p>
          </div>
          <Link to="/assistant" className="btn-light shrink-0 self-start lg:self-end">
            Launch Agent <span className="btn-orb"><ArrowUpRight size={15} /></span>
          </Link>
        </div>

        <div className="mt-20 grid grid-cols-2 gap-x-6 gap-y-12 border-t border-white/[0.07] pt-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <Logo size={34} />
            {community.length > 0 && (
              <div className="mt-6 flex gap-2">
                {community.map((c) => (
                  <a
                    key={c.id}
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Quantum AI Labs on ${c.label}`}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/70 transition-colors hover:border-lab-cyan/50 hover:text-lab-cyan"
                  >
                    <CommunityIcon id={c.id} size={15} />
                  </a>
                ))}
              </div>
            )}
          </div>
          <FooterColumn title="Tools">
            {utilities.map((u) => (
              <li key={u.id}><Link to={u.to} className={linkClass}>{u.label}</Link></li>
            ))}
          </FooterColumn>
          <FooterColumn title="Company">
            {COMPANY.map((item) => (
              <li key={item.to}><Link to={item.to} className={linkClass}>{item.label}</Link></li>
            ))}
          </FooterColumn>
          <FooterColumn title="Legal">
            {legalDocs.map((d) => (
              <li key={d.slug}><Link to={`/${d.slug}`} className={linkClass}>{d.title}</Link></li>
            ))}
          </FooterColumn>
        </div>
      </div>

      <div className="lab-container mt-10 pb-6" aria-hidden="true">
        {/* SVG text stretches to the exact container width, so the wordmark never clips. */}
        <svg className="footer-signoff" viewBox="0 -44 1000 214" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="signoff-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" stopOpacity="1" />
              <stop offset=".5" stopColor="#d9f8fa" stopOpacity=".9" />
              <stop offset="1" stopColor="#8ff1f5" stopOpacity=".6" />
            </linearGradient>
            <linearGradient id="signoff-sheen" gradientUnits="userSpaceOnUse" x1="-300" y1="0" x2="0" y2="0">
              <stop offset="0" stopColor="#8ff1f5" stopOpacity="0" />
              <stop offset=".5" stopColor="#ffffff" stopOpacity=".35" />
              <stop offset="1" stopColor="#8ff1f5" stopOpacity="0" />
              <animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="1600 0" dur="6s" repeatCount="indefinite" />
            </linearGradient>
          </defs>
          <text x="0" y="118" textLength="1000" lengthAdjust="spacingAndGlyphs" fill="url(#signoff-fill)" stroke="#c8fcff" strokeOpacity=".55" strokeWidth=".6">Quantum AI Labs</text>
          <text className="signoff-sheen" x="0" y="118" textLength="1000" lengthAdjust="spacingAndGlyphs" fill="url(#signoff-sheen)">Quantum AI Labs</text>
        </svg>
      </div>

      <div className="border-t border-white/[0.06]">
        <div className="lab-container flex flex-col gap-3 py-6 text-xs leading-relaxed text-white/50 md:flex-row md:items-center md:justify-between">
          <span>© {YEAR} Quantum AI Labs. All rights reserved.</span>
          <span className="max-w-2xl md:text-right">
            Not financial advice. Crypto assets are volatile and high risk.{' '}
            <Link to="/disclaimer" className="text-white/75 underline-offset-2 hover:underline">Read the disclaimer</Link>.
          </span>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="link-arrow self-start text-xs md:self-auto">
            Back to top <ArrowUp size={12} />
          </button>
        </div>
      </div>
    </footer>
  )
}
