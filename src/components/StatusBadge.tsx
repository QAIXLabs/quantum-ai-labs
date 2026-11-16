import type { Status } from '../data/site'

const styles: Record<Status, { label: string; cls: string }> = {
  live: { label: 'Live', cls: 'border-lab-cyan/40 text-lab-cyan bg-lab-cyan/[0.06]' },
  experimental: { label: 'Experimental', cls: 'border-lab-violet/50 text-[#b9adff] bg-lab-violet/10' },
  soon: { label: 'Soon', cls: 'border-lab-violet/50 text-[#b9adff] bg-lab-violet/10' },
  research: { label: 'Future research', cls: 'border-white/15 text-white/65 bg-white/[0.03]' },
}

export default function StatusBadge({ status, className = '' }: { status: Status; className?: string }) {
  const s = styles[status] ?? styles.research
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${s.cls} ${className}`}
    >
      {s.label}
    </span>
  )
}
