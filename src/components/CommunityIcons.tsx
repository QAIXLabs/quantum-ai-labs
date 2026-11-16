import { community } from '../data/site'
import CommunityIcon from './CommunityIcon'

export default function CommunityIcons({ className = '', size = 15 }: { className?: string; size?: number }) {
  if (!community.length) return null
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {community.map((c) => (
        <a
          key={c.id}
          href={c.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Quantum AI Labs on ${c.label}`}
          title={c.label}
          className="inline-flex items-center text-white/65 transition-colors hover:text-white"
        >
          <CommunityIcon id={c.id} size={size} />
        </a>
      ))}
    </div>
  )
}
