import { NavLink } from 'react-router'
import { utilities } from '../data/site'

/** Segmented bar linking the lab utilities; sits at the bottom of a tool hero. */
export default function LabTabs() {
  return (
    <nav className="tool-tabs scrollbar-thin" aria-label="Lab utilities">
      {utilities.map((u, i) => (
        <NavLink key={u.id} to={u.to}>
          <span className="font-mono text-[10px] opacity-60">0{i + 1}</span>
          {u.label}
        </NavLink>
      ))}
    </nav>
  )
}
