export type NavItem = { label: string; to: string }
export type Status = 'live' | 'experimental' | 'soon' | 'research'
export type Utility = {
  id: string
  label: string
  to: string
  /** One line for menus and tabs. */
  desc: string
  /** Short tagline for the tools grid and the nav menu. */
  tagline: string
  highlights: string[]
  status: Status
  /** Short guarantees shown in the tool page header. */
  traits: string[]
}
export type CommunityId = 'x' | 'telegram' | 'discord' | 'github'
export type Community = { id: CommunityId; label: string; url: string }

export const navItems: NavItem[] = [
  { label: 'Vision', to: '/vision' },
  { label: 'Technology', to: '/technology' },
  { label: 'Research', to: '/research' },
  { label: 'Roadmap', to: '/roadmap' },
  { label: 'Ecosystem', to: '/ecosystem' },
]

/** Company pages grouped under "About" in the header. */
export const aboutItems: (NavItem & { desc: string })[] = [
  { label: 'Vision', to: '/vision', desc: 'Our purpose, principles, and approach to research.' },
  { label: 'Technology', to: '/technology', desc: 'The tools, data sources, and platform architecture.' },
  { label: 'Ecosystem', to: '/ecosystem', desc: 'Connected research and the lab community.' },
]

export const utilities: Utility[] = [
  {
    id: 'assistant',
    label: 'Quantum Agent',
    to: '/assistant',
    desc: 'Crypto research agent: BTC & altcoin analysis with charts, pump.fun screening and swap quotes.',
    tagline: 'Investigate BTC and altcoins with live charts, technical indicators, and AI-assisted token screening.',
    highlights: ['Technical snapshots', 'pump.fun screening', 'Swap quotes'],
    traits: ['Read-only', 'Not financial advice'],
    status: 'live',
  },
  {
    id: 'swap',
    label: 'Privacy Swap',
    to: '/swap',
    desc: 'No-sign-up crypto exchange with live floating or fixed rates.',
    tagline: 'Swap supported crypto pairs at floating or fixed rates, with no account and no wallet connection.',
    highlights: ['No sign-up', 'Fixed or floating'],
    traits: ['No account', 'No wallet connection'],
    status: 'live',
  },
  {
    id: 'pqc',
    label: 'PQC Lab',
    to: '/pqc',
    desc: 'Paste your wallet and find out if it is still safe to use or time to move to a new one.',
    tagline: 'Check a wallet for permissions held by scam addresses, contact with known drainers and lookalike-address tricks, with a plain answer on what to do.',
    highlights: ['EVM · Solana', 'Drainer check', 'Plain answer'],
    traits: ['Read-only', 'No wallet connection'],
    status: 'live',
  },
  {
    id: 'web3',
    label: 'Web3 Solutions',
    to: '/web3',
    desc: 'EVM & Solana monitors, explorer, prices and alerts.',
    tagline: 'Follow six EVM networks and Solana. Inspect addresses and transactions, track tokens, and set local alerts.',
    highlights: ['7 networks', 'Explorer', 'Alerts'],
    traits: ['Read-only', 'No signing'],
    status: 'live',
  },
  {
    id: 'checks',
    label: 'Quantum Lab CHECKS',
    to: '/checks',
    desc: 'Paste a Solana coin and see if its story is real and its holders are fair.',
    tagline: 'Paste a Solana coin and get two straight answers: is the story real, and is the coin fairly held. Every check lands in a public feed.',
    highlights: ['Story check', 'Holder check', 'Public feed'],
    traits: ['Read-only', 'Not financial advice'],
    status: 'live',
  },
]

// Leave url empty to hide a channel.
const allCommunity: Community[] = [
  { id: 'x', label: 'X (Twitter)', url: 'https://x.com/QAIXLabs' },
  { id: 'telegram', label: 'Telegram', url: 'https://t.me/quantumailabs' },
  { id: 'discord', label: 'Discord', url: '' },
  { id: 'github', label: 'GitHub', url: '' },
]

export const community = allCommunity.filter((c) => c.url)

export const primaryCommunity: Community | null = community[0] ?? null

export type Pillar = { n: string; id: 'ai' | 'quantum' | 'infra'; title: string; desc: string }

export const pillars: Pillar[] = [
  {
    n: '01',
    id: 'ai',
    title: 'AI research',
    desc: 'Ask the Quantum Agent about BTC or any altcoin and get a chart, the key indicators and a straight answer. It can also screen new pump.fun tokens and pull swap quotes.',
  },
  {
    n: '02',
    id: 'quantum',
    title: 'Wallet security',
    desc: 'Paste an EVM or Solana wallet and see whether a known scam address can still move your tokens, or whether it is time to move to a new wallet.',
  },
  {
    n: '03',
    id: 'infra',
    title: 'On-chain infrastructure',
    desc: 'Watch gas, blocks and token prices on six EVM networks and Solana, look up any address or transaction, and swap coins without opening an account.',
  },
]

export const principles = [
  {
    t: 'We say what a tool can’t do',
    d: 'Every tool tells you where its limits are. Everything runs on ordinary computers. We don’t have a quantum computer and we won’t pretend otherwise.',
  },
  {
    t: 'Free to use',
    d: 'No sign-up and no paywall for the research tools. Your settings, watchlists and chat history stay in your own browser.',
  },
  {
    t: 'Show the working',
    d: 'The agent lists every tool it used, live data shows when it was last updated, and the wallet check shows what it found and what it could not check.',
  },
  {
    t: 'Your keys stay yours',
    d: 'We never ask you to connect a wallet, share a seed phrase or sign anything. The tools only read public data.',
  },
]

export const roadmapPhases: { n: string; t: string; status: Status; items: [string, string][] }[] = [
  {
    n: 'Phase 1',
    t: 'Quantum Agent',
    status: 'live',
    items: [
      ['AI market research with live charts and technical indicators', '/assistant'],
      ['Token screening with market and risk checks', '/assistant'],
      ['Swap quotes right inside the chat', '/assistant'],
    ],
  },
  {
    n: 'Phase 2',
    t: 'Privacy Swap',
    status: 'live',
    items: [
      ['Swap supported coins with no account or wallet connection', '/swap'],
      ['Floating or fixed rates, with a quote before you confirm', '/swap'],
      ['Order tracking and a swap history saved in your browser', '/swap'],
    ],
  },
  {
    n: 'Phase 3',
    t: 'PQC Lab',
    status: 'live',
    items: [
      ['Wallet safety check for EVM and Solana wallets', '/pqc'],
      ['Warnings for drainer permissions, scam contacts and lookalike addresses', '/pqc'],
      ['A short guide to the NIST post-quantum standards', '/research/post-quantum-cryptography'],
    ],
  },
  {
    n: 'Phase 4',
    t: 'Web3 Solutions',
    status: 'live',
    items: [
      ['Network health and gas for six EVM chains and Solana', '/web3'],
      ['Explorer for addresses, transactions and tokens', '/web3'],
      ['Token watchlists and price alerts', '/web3'],
    ],
  },
  {
    n: 'Phase 5',
    t: 'Quantum Lab CHECKS',
    status: 'live',
    items: [
      ['Story check: is the project behind a Solana coin real?', '/checks'],
      ['Holder check: is the coin fairly held?', '/checks'],
      ['A public feed that shows how every call played out', '/checks'],
    ],
  },
  {
    n: 'Phase 6',
    t: 'What we’re exploring',
    status: 'research',
    items: [
      ['Post-quantum upgrade paths for wallets and blockchains', '/research/post-quantum-cryptography'],
      ['Smarter agent workflows across more chains', '/research/ai-systems'],
      ['On-chain records so anyone can verify an analysis', '/research/verifiable-computation'],
    ],
  },
]

export const researchTracks: { title: string; status: Status; note: string; to: string }[] = [
  {
    title: 'Quantum Agent',
    status: 'live',
    note: 'Market research on live data: charts, indicators, token screening and swap quotes.',
    to: '/assistant',
  },
  {
    title: 'Privacy Swap',
    status: 'live',
    note: 'Swap supported coins at fixed or floating rates. No account needed.',
    to: '/swap',
  },
  {
    title: 'PQC Lab',
    status: 'live',
    note: 'Checks a wallet for drainer permissions, scam contacts and lookalike addresses, and tells you when to move to a new wallet.',
    to: '/pqc',
  },
  {
    title: 'Web3 Solutions',
    status: 'live',
    note: 'Read-only health, fees, prices and alerts for six EVM networks and Solana.',
    to: '/web3',
  },
  {
    title: 'Quantum Lab CHECKS',
    status: 'live',
    note: 'Reads a Solana coin’s story and holders, then adds the verdict to a public feed.',
    to: '/checks',
  },
  {
    title: 'Verifiable records',
    status: 'research',
    note: 'Saving a fingerprint of each analysis on-chain so anyone can check it later.',
    to: '/research/verifiable-computation',
  },
]
