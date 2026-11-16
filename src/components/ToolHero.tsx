import type { ReactNode } from 'react'
import { CircleCheck } from 'lucide-react'
import { utilities } from '../data/site'
import LabTabs from './LabTabs'
import StatusBadge from './StatusBadge'
import ToolDiagram from './ToolDiagram'
import ToolIcon from './ToolIcon'

type ToolHeroProps = { toolId: string; title: ReactNode; intro: ReactNode }

const TOOL_KIND: Record<string, string> = {
  assistant: 'Intelligence',
  pqc: 'Wallet safety',
  web3: 'On-chain data',
  swap: 'Exchange',
  checks: 'Coin checks',
}

/** Shared header for every tool page: identity, promise, guarantees, data sources and the tool tabs. */
export default function ToolHero({ toolId, title, intro }: ToolHeroProps) {
  const index = utilities.findIndex((u) => u.id === toolId)
  const tool = utilities[index]
  return (
    <section className="tool-hero relative overflow-hidden pt-32 sm:pt-40">
      <div className="lab-container relative">
        <div className="tool-hero-grid">
          <div>
            {tool && (
              <div className="reveal flex flex-wrap items-center gap-3">
                <span className="kicker">0{index + 1} / {TOOL_KIND[tool.id] ?? 'Tool'}</span>
                <StatusBadge status={tool.status} />
              </div>
            )}
            <h1 className="reveal mt-7 max-w-4xl text-5xl sm:text-6xl lg:text-[76px]" style={{ animationDelay: '.06s' }}>
              {title}
            </h1>
            <p className="reveal mt-6 max-w-2xl text-[15px] leading-relaxed text-white/65 sm:text-base sm:leading-7" style={{ animationDelay: '.12s' }}>
              {intro}
            </p>
            {tool && (
              <div className="reveal mt-8 flex flex-wrap items-center gap-2" style={{ animationDelay: '.18s' }}>
                {tool.traits.map((t) => (
                  <span key={t} className="trait-pill">
                    <CircleCheck size={13} className="text-lab-cyan" /> {t}
                  </span>
                ))}
              </div>
            )}
          </div>
          {tool && (
            <div className="tool-orbit reveal" style={{ animationDelay: '.2s' }} aria-hidden="true">
              <span className="orbit-ring" />
              <span className="orbit-ring" />
              <span className="orbit-ring" />
              <div className="tool-orbit-core">
                <ToolIcon id={tool.id} />
                <ToolDiagram id={tool.id} live />
                <span className="font-display text-[15px] text-white">{tool.label}</span>
              </div>
            </div>
          )}
        </div>
        <LabTabs />
      </div>
    </section>
  )
}

/** HUD-style frame around a tool's interactive content. */
export function ToolWorkspace({ toolId, children, narrow = false }: { toolId: string; children: ReactNode; narrow?: boolean }) {
  return (
    <section className="lab-container py-12 pb-24">
      <HudFrame toolId={toolId} className={narrow ? 'mx-auto max-w-5xl' : ''}>{children}</HudFrame>
    </section>
  )
}

/** The HUD frame itself: rotating glow border, corner brackets, scan line and status bar. */
export function HudFrame({ toolId, children, className = '', compact = false }: { toolId: string; children: ReactNode; className?: string; compact?: boolean }) {
  const index = utilities.findIndex((u) => u.id === toolId)
  const tool = utilities[index]
  return (
      <div className={`workspace ${compact ? 'workspace-compact' : ''} ${className}`}>
        <span className="hud-corner tl" aria-hidden="true" />
        <span className="hud-corner tr" aria-hidden="true" />
        <span className="hud-corner bl" aria-hidden="true" />
        <span className="hud-corner br" aria-hidden="true" />
        <span className="hud-scan" aria-hidden="true" />
        <div className="workspace-bar">
          <span className="flex min-w-0 items-center gap-3">
            <span className="workspace-badge">0{index + 1}</span>
            <span className="truncate">QAI <span className="text-white/30">/</span> <b>{tool?.label ?? 'Tool'}</b></span>
          </span>
          <span className="workspace-wave" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ animationDelay: `${i * -0.13}s` }} />)}</span>
          <span className="flex items-center gap-4">
            <span className="hidden md:inline">{tool?.traits[0]}</span>
            <span className="workspace-live"><span className="signal-dot" /> Live</span>
          </span>
        </div>
        <div className="workspace-body">{children}</div>
      </div>
  )
}
