/**
 * Wallet check score: 100 = no warning signs in fully completed checks, lower = more risk observed.
 * Built from the server's findings and per-check coverage. A check that did not run, or ran on part of
 * its data, is never counted as passed: missing coverage can only cap the score, never raise it.
 */
export type Level = 'critical' | 'high' | 'review'
export type CheckStatus = 'ok' | 'partial' | 'unavailable' | 'unsupported'
export type CheckId = 'control' | 'interactions' | 'lookalike'
export type CheckState = 'pass' | 'review' | 'fail' | 'partial' | 'not_run'
export type Band = 'low' | 'review' | 'action'

export const CHECK_KINDS: Record<CheckId, string[]> = {
  control: ['flagged_permission', 'delegation', 'account_reassigned', 'token_owner_changed', 'assign', 'unlimited_permission', 'token_delegate', 'close_authority'],
  // EVM: contact with flagged addresses. Solana: behaviour scan (drain sweeps, tokens the creator can take back).
  interactions: ['self_flagged', 'sent_to_flagged', 'past_flagged_permission', 'received_from_flagged', 'sweep_out', 'risky_token'],
  lookalike: ['sent_to_lookalike', 'poisoning_attempt'],
}
export const CHECK_IDS: CheckId[] = ['control', 'interactions', 'lookalike']

type FindingLike = { level: Level; kind: string }

/** Findings decide the state when present; otherwise coverage does. Only full coverage passes. */
export function checkState(id: CheckId, findings: FindingLike[], status: CheckStatus): CheckState {
  const mine = findings.filter((f) => CHECK_KINDS[id].includes(f.kind))
  if (mine.some((f) => f.level === 'critical' || f.level === 'high')) return 'fail'
  if (mine.length) return 'review'
  if (status === 'ok') return 'pass'
  if (status === 'partial') return 'partial'
  return 'not_run'
}

export function scoreWallet(findings: FindingLike[], checks: Record<CheckId, CheckStatus>) {
  const states = Object.fromEntries(CHECK_IDS.map((id) => [id, checkState(id, findings, checks[id])])) as Record<CheckId, CheckState>
  const completed = CHECK_IDS.filter((id) => checks[id] === 'ok').length

  const critical = findings.filter((f) => f.level === 'critical').length
  const high = findings.filter((f) => f.level === 'high').length
  const review = findings.filter((f) => f.level === 'review').length

  let fromFindings: number
  if (critical) fromFindings = Math.max(0, 24 - 8 * (critical - 1) - 2 * (high + review))
  else if (high) fromFindings = Math.max(25, 49 - 8 * (high - 1) - 3 * review)
  else if (review) fromFindings = Math.max(50, 79 - 6 * (review - 1))
  else fromFindings = 100

  let score: number | null
  let limited = false
  if (critical || high) score = fromFindings // gaps in coverage cannot make bad news better
  else if (completed === CHECK_IDS.length) score = fromFindings
  else if (completed === CHECK_IDS.length - 1) {
    score = Math.min(fromFindings, 79)
    limited = fromFindings > 79
  } else score = null // too little ran to put a number on it

  const band: Band | null = score === null ? null : score >= 80 ? 'low' : score >= 50 ? 'review' : 'action'
  return { score, band, limited, completed, total: CHECK_IDS.length, states }
}
