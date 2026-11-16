type LogoProps = { size?: number; withText?: boolean }

/**
 * Text monogram in place of the brand emblem. The emblem artwork is not part of this public
 * release because its origin could not be verified.
 */
export function Emblem({ size = 30 }: { size?: number }) {
  return (
    <span className="qai-emblem qai-monogram" style={{ width: size, height: size, fontSize: size * 0.5 }} aria-hidden="true">
      Q
    </span>
  )
}

export default function Logo({ size = 30, withText = true }: LogoProps) {
  return (
    <span className="qai-logo flex items-center gap-2.5">
      <Emblem size={size} />
      {withText && (
        <span className="qai-wordmark">
          Quantum <span>AI Labs</span>
        </span>
      )}
    </span>
  )
}
