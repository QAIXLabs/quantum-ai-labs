/** Ticker label in place of a coin logo; third-party brand marks are not part of this release. */
export default function CoinLogo({ symbol, size = 30 }: { symbol: string; size?: number }) {
  return (
    <span className="coin-ticker" style={{ width: size, height: size, fontSize: size * 0.3 }} aria-hidden="true">
      {symbol}
    </span>
  )
}
