import type { ReactNode } from 'react'

/** Small labelled metric tile: eyebrow label, mono value and an optional caption. */
export default function StatCard({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="panel stat-card p-4">
      <p className="eyebrow">{label}</p>
      <p className="stat-value mt-2 truncate">{value}</p>
      {sub && <p className="mt-1 truncate text-[11px] text-white/55">{sub}</p>}
    </div>
  )
}
