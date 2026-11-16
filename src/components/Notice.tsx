import type { ReactNode } from 'react'

const TONES = {
  info: 'border-white/10 bg-white/[0.03] text-white/65',
  warn: 'border-amber-400/30 bg-amber-400/[0.06] text-amber-200',
  error: 'border-red-400/30 bg-red-400/[0.07] text-red-200',
  ok: 'border-lab-ok/30 bg-lab-ok/[0.06] text-lab-ok',
}

/** Bordered note for info, warnings, errors and confirmations. */
export default function Notice({ tone = 'info', children }: { tone?: keyof typeof TONES; children: ReactNode }) {
  return (
    <div
      role={tone === 'error' || tone === 'warn' ? 'alert' : undefined}
      className={`notice notice-${tone} rounded-control border px-3 py-2.5 text-xs leading-relaxed ${TONES[tone]}`}
    >
      {children}
    </div>
  )
}
