import type { ReactNode } from 'react'

type PageHeroProps = {
  eyebrow?: string
  title: ReactNode
  intro?: ReactNode
  children?: ReactNode
}

/** Orbiting qubit motif used beside page titles. */
export function QubitOrbit({ className = '' }: { className?: string }) {
  return (
    <div className={`qubit-orbit ${className}`} aria-hidden="true">
      <span className="qubit-ring"><i /></span>
      <span className="qubit-ring"><i /></span>
      <span className="qubit-ring"><i /></span>
      <span className="qubit-core" />
    </div>
  )
}

export default function PageHero({ eyebrow, title, intro, children }: PageHeroProps) {
  return (
    <section className="page-hero relative overflow-hidden pt-36 sm:pt-44">
      <div className="lab-container relative pb-16 sm:pb-24">
        <div className="page-hero-grid">
          <div>
            {eyebrow && <p className="kicker reveal">{eyebrow}</p>}
            <h1 className="reveal mt-6 max-w-4xl text-5xl sm:text-6xl lg:text-[88px]" style={{ animationDelay: '.06s' }}>
              {title}
            </h1>
            {intro && (
              <p className="reveal mt-7 max-w-2xl text-[15px] leading-relaxed text-white/65 sm:text-base sm:leading-7" style={{ animationDelay: '.12s' }}>
                {intro}
              </p>
            )}
            {children}
          </div>
          <QubitOrbit className="reveal hidden lg:block" />
        </div>
      </div>
    </section>
  )
}
