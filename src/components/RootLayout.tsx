import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import QuantumBackdrop from './QuantumBackdrop'
import SiteFooter from './SiteFooter'
import SiteNav from './SiteNav'
import { articles } from '../data/articles'
import { navItems, utilities } from '../data/site'
import { legalDocs } from '../data/legal'

export default function RootLayout() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    const page = [...navItems, ...utilities].find(item => item.to === pathname)?.label
      ?? articles.find(article => pathname === `/research/${article.slug}`)?.title
      ?? legalDocs.find(doc => pathname === `/${doc.slug}`)?.title
      ?? (pathname.startsWith('/checks/') ? 'Coin check' : undefined)
    document.title = pathname === '/' ? 'Quantum AI Labs · Intelligence for the Quantum Era' : `${page ?? 'Page not found'} · Quantum AI Labs`
  }, [pathname])

  useEffect(() => {
    if (hash) {
      const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }), 60)
      return () => clearTimeout(t)
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, hash])

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded focus:bg-lab-cyan focus:px-3 focus:py-2 focus:text-black"
      >
        Skip to content
      </a>
      <QuantumBackdrop />
      <div className="site-shell">
        <SiteNav />
        <main id="main">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
    </>
  )
}
