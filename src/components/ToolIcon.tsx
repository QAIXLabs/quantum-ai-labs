import { ArrowLeftRight, Bot, Network, ScanSearch, ShieldCheck, Wrench, type LucideIcon } from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  assistant: Bot,
  pqc: ShieldCheck,
  web3: Network,
  swap: ArrowLeftRight,
  checks: ScanSearch,
}

/** A utility's icon in a tinted rounded tile. */
export default function ToolIcon({ id, size = 'md' }: { id: string; size?: 'sm' | 'md' }) {
  const Icon = ICONS[id] ?? Wrench
  const box = size === 'sm' ? 'h-9 w-9 rounded-full' : 'h-11 w-11 rounded-full'
  return (
    <span className={`inline-flex shrink-0 items-center justify-center border border-lab-cyan/20 bg-lab-cyan/[0.07] text-lab-cyan ${box}`}>
      <Icon size={size === 'sm' ? 15 : 18} strokeWidth={1.75} />
    </span>
  )
}
