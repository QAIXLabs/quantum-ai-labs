import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { ArrowRight, ArrowUpRight, ChevronDown, Menu, X } from 'lucide-react'
import { aboutItems, community, utilities } from '../data/site'
import CommunityIcons from './CommunityIcons'
import Logo from './Logo'
import ToolIcon from './ToolIcon'

type MenuId = 'tools' | 'about'

const navLinkClass = ({ isActive }: { isActive: boolean }) => 'nav-link' + (isActive ? ' active' : '')

const TOOL_PATHS = utilities.map((u) => u.to)
const ABOUT_PATHS = aboutItems.map((a) => a.to)

export default function SiteNav() {
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState<MenuId | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const { pathname, key } = useLocation()
  const [lastPath, setLastPath] = useState(key)
  const navRef = useRef<HTMLElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  // Close menus on navigation.
  if (key !== lastPath) {
    setLastPath(key)
    setOpen(false)
    setMenu(null)
  }

  // The bar collapses into a single orb while scrolling down and returns when scrolling up.
  useEffect(() => {
    let lastY = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      if (Math.abs(y - lastY) < 6) return
      const next = y > 160 && y > lastY
      setCollapsed(next)
      if (next) setMenu(null)
      lastY = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menu && !open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (open) toggleRef.current?.focus()
      else navRef.current?.querySelector<HTMLButtonElement>(`button[aria-controls="menu-${menu}"]`)?.focus()
      setMenu(null)
      setOpen(false)
    }
    const onClick = (e: MouseEvent) => !navRef.current?.contains(e.target as Node) && setMenu(null)
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [menu, open])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <header className="site-nav">
      <div className={`nav-pill glass ${collapsed && !open ? 'is-hidden' : ''}`}>
        <Link to="/" aria-label="Quantum AI Labs home" className="mr-3">
          <Logo size={28} />
        </Link>
        <nav
          ref={navRef}
          className="hidden items-center gap-0.5 lg:flex"
          aria-label="Primary"
          onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setMenu(null) }}
          onPointerLeave={(e) => e.pointerType === 'mouse' && !e.currentTarget.contains(document.activeElement) && setMenu(null)}
        >
          <Dropdown id="tools" label="Tools" menu={menu} setMenu={setMenu} active={TOOL_PATHS.includes(pathname)}>
            <ToolsPanel />
          </Dropdown>
          <NavLink to="/research" className={navLinkClass} onPointerEnter={() => setMenu(null)}>Research</NavLink>
          <NavLink to="/roadmap" className={navLinkClass} onPointerEnter={() => setMenu(null)}>Roadmap</NavLink>
          <Dropdown id="about" label="About" menu={menu} setMenu={setMenu} active={ABOUT_PATHS.includes(pathname)}>
            <AboutPanel />
          </Dropdown>
        </nav>
        <CommunityIcons className="mx-3 hidden xl:flex" />
        <Link to="/assistant" className="btn-light btn-sm ml-2 hidden lg:inline-flex">
          Launch Agent <ArrowUpRight size={14} />
        </Link>
        <button
          ref={toggleRef}
          type="button"
          className="ml-2 flex h-11 w-11 items-center justify-center rounded-full text-white lg:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      <button
        type="button"
        className={`nav-orb glass ${collapsed && !open ? 'is-visible' : ''}`}
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="site-menu"
        tabIndex={collapsed && !open ? 0 : -1}
        onClick={() => setOpen(true)}
      >
        <Menu size={20} />
      </button>
      {open && <MenuOverlay onClose={() => setOpen(false)} />}
    </header>
  )
}

type DropdownProps = {
  id: MenuId
  label: string
  menu: MenuId | null
  setMenu: (menu: MenuId | null) => void
  active: boolean
  children: ReactNode
}

/** A header item that opens its panel on hover (pointer) or click (keyboard and touch). */
function Dropdown({ id, label, menu, setMenu, active, children }: DropdownProps) {
  const isOpen = menu === id
  return (
    <div className="relative" onPointerEnter={(e) => e.pointerType === 'mouse' && setMenu(id)}>
      <button
        type="button"
        className={'nav-link flex items-center gap-1' + (active ? ' active' : '')}
        aria-expanded={isOpen}
        aria-controls={`menu-${id}`}
        onClick={() => setMenu(isOpen ? null : id)}
      >
        {label}
        <ChevronDown size={13} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div id={`menu-${id}`} className="nav-dropdown">
          <div className="glass">{children}</div>
        </div>
      )}
    </div>
  )
}

function ToolsPanel() {
  return (
    <div className="w-[640px]">
      <div className="grid grid-cols-2 gap-1 p-2">
        {utilities.map((u, i) => (
          <Link key={u.id} to={u.to} className="flex gap-3 rounded-2xl p-3.5 transition-colors hover:bg-white/[0.05]">
            <ToolIcon id={u.id} size="sm" />
            <span className="min-w-0">
              <span className="flex items-center gap-2 font-display text-[15px] text-white">
                {u.label} <span className="font-mono text-[10px] text-lab-cyan/70">0{i + 1}</span>
              </span>
              <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-white/60">{u.tagline}</span>
            </span>
          </Link>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3 text-xs">
        <span className="text-white/55">Research, monitoring and exchange. No wallet connection.</span>
        <Link to={{ pathname: '/', hash: '#tools' }} className="link-arrow text-xs">
          All tools <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  )
}

function AboutPanel() {
  return (
    <div className="w-[300px] p-2">
      {aboutItems.map((a) => (
        <Link key={a.to} to={a.to} className="block rounded-2xl p-3.5 transition-colors hover:bg-white/[0.05]">
          <span className="block font-display text-[15px] text-white">{a.label}</span>
          <span className="mt-0.5 block text-xs leading-snug text-white/60">{a.desc}</span>
        </Link>
      ))}
    </div>
  )
}

function MenuOverlay({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => closeRef.current?.focus(), [])
  return (
    <div id="site-menu" className="menu-overlay" role="dialog" aria-modal="true" aria-label="Site menu">
      <div className="lab-container flex min-h-full flex-col pb-10">
        <div className="flex h-[90px] items-center justify-between">
          <Link to="/" aria-label="Quantum AI Labs home"><Logo size={30} /></Link>
          <button ref={closeRef} type="button" onClick={onClose} className="grid h-12 w-12 place-items-center rounded-full border border-white/15 text-white" aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <div className="grid flex-1 gap-12 pt-6 lg:grid-cols-[1.4fr_1fr] lg:pt-12">
          <div>
            <p className="kicker">Tools</p>
            <nav className="mt-4" aria-label="Tools">
              {utilities.map((u, i) => (
                <Link key={u.id} to={u.to} className="menu-overlay-link">
                  <span className="font-mono text-xs text-lab-cyan">0{i + 1}</span>
                  {u.label}
                  <small className="hidden sm:inline">{u.highlights[0]}</small>
                </Link>
              ))}
            </nav>
          </div>
          <div>
            <p className="kicker">Company</p>
            <nav className="mt-4" aria-label="Company">
              {[{ label: 'Research', to: '/research' }, { label: 'Roadmap', to: '/roadmap' }, ...aboutItems].map((item) => (
                <NavLink key={item.to} to={item.to} className="menu-overlay-link !text-[clamp(22px,3vw,32px)]">
                  {item.label}
                </NavLink>
              ))}
            </nav>
            {community.length > 0 && <CommunityIcons size={18} className="mt-8 gap-6" />}
          </div>
        </div>
        <div className="mt-12 flex flex-wrap gap-3">
          <Link to="/assistant" className="btn-light">Launch Agent <ArrowUpRight size={15} /></Link>
          <Link to="/pqc" className="btn-ghost">Check your wallet <ArrowRight size={15} /></Link>
        </div>
      </div>
    </div>
  )
}
