/** Small rotating ring used wherever the swap flow is waiting on something. */
export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <span
      className="inline-block shrink-0 animate-spin rounded-full border-2 border-white/15 border-t-lab-cyan"
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  )
}
